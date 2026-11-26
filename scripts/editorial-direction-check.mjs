import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {getEditorialChapters,editorialEditions} from '../src/editorialStory.js';
import {getPacing} from '../src/graphics/cameraPacing.js';
import {readingDistance} from '../src/graphics/readingPacing.js';
const mobile=process.env.COPY_VIEW==='mobile',edition=process.env.COPY_EDITION??'manifesto',viewport=mobile?{width:390,height:844}:{width:1280,height:720};
assert.ok(editorialEditions.includes(edition));const out='artifacts/editorial-audition',base='http://127.0.0.1:4217',holds=[.055,.205,.405,.625,.73,.935,.992];
await mkdir(out,{recursive:true});const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4217','--strictPort'],{stdio:'inherit'});let browser;
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport,deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Fix the camera at authored holds for comparable screenshots; this is not native-motion timing.
 const query='/?experience=editorial&direction=staged&profile=economy&travel=responsive&lighting=local&transmission=threequarter&framing=portrait&diagnostics=1&benchmark=1&warmup=targeted&copy='+edition;
 await page.goto(base+query,{waitUntil:'domcontentloaded'});await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
 const copy=getEditorialChapters(edition),pacing=getPacing(mobile,edition),rows=[];
 assert.equal(await page.locator('#stage').getAttribute('data-copy-edition'),edition);
 for(let i=0;i<holds.length;i++){
  const p=holds[i];
  const row=await page.evaluate(({p,i})=>{const s=document.querySelector('#stage');s.benchmarkFrame(p);const c=document.querySelectorAll('.chapter .copy')[i],h=c.querySelector('h1,h2'),b=c.querySelector('p'),r=c.getBoundingClientRect(),css=getComputedStyle(c),hs=getComputedStyle(h),bs=getComputedStyle(b);return {title:h.getAttribute('aria-label'),body:b.textContent,rect:{x:r.x,y:r.y,right:r.right,bottom:r.bottom,height:r.height},opacity:Number(css.opacity),roles:[c.querySelector('.eyebrow'),h,b].map(n=>Number(getComputedStyle(n).opacity)),font:hs.fontFamily,titleSize:parseFloat(hs.fontSize),bodySize:parseFloat(bs.fontSize),background:css.getPropertyValue('--reading-surface').trim(),bodyColor:bs.color,chapter:s.dataset.visualChapter,pose:JSON.parse(s.dataset.pose),drawCalls:Number(s.dataset.drawCalls)};},{p,i});
  assert.equal(row.title,copy[i].title);assert.equal(row.body,copy[i].body);assert.equal(Number(row.chapter),i);
  assert.ok(row.rect.x>=-1&&row.rect.y>=-1&&row.rect.right<=viewport.width+1&&row.rect.bottom<=viewport.height+1,JSON.stringify(row));
  assert.ok(row.opacity>.95&&row.roles.every(x=>x>.95),JSON.stringify(row));assert.ok(row.bodySize>=15);
  const rgba=s=>s.match(/[\d.]+/g).map(Number),l=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0),bg=rgba(row.background),alpha=bg[3]??1,worst=bg.slice(0,3).map(v=>v*alpha+255*(1-alpha)),a=l(rgba(row.bodyColor).slice(0,3)),b=l(worst);row.contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(row.contrast>=4.5);
  row.readingVh=readingDistance(pacing.chapters[i],i);row.copyHeightFraction=row.rect.height/viewport.height;
  if(mobile)assert.ok(row.copyHeightFraction<.45,'copy obscures too much of the frame '+i);
  rows.push({p,...row});await page.screenshot({path:out+'/'+String(i+1).padStart(2,'0')+'-'+edition+'.png',animations:'disabled',timeout:120000});
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/comparison.json',JSON.stringify({edition,viewport,rows,errors,note:'Fixed camera diagnostic screenshot comparison, not native scroll, physical FPS or user comprehension. Contrast is a conservative estimate for the fully shaded core; visual review still required.'},null,2));
 // Flat and reduced-motion readability, no dependency on 3D for copy.
 const flat=await browser.newPage({viewport,reducedMotion:'reduce'});await flat.goto(base+'/?experience=editorial&renderer=canvas&copy='+edition);await flat.waitForSelector('#stage[data-renderer="canvas"]');assert.deepEqual(await flat.locator('main section h1,main section h2').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label'))),copy.map(c=>c.title));assert.equal(await flat.locator('.experience-loader').count(),0);await flat.close();await page.close();
}finally{await browser?.close();server.kill();}
