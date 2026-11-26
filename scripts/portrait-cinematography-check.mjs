import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {getPacing} from '../src/graphics/cameraPacing.js';
import {windows} from '../src/graphics/facilityCamera.js';
const viewport=process.env.PORTRAIT_VIEW==='small'?{width:360,height:800}:{width:390,height:844},base='http://127.0.0.1:4200',out='artifacts/portrait-cinematography';
const holds=[.055,.205,.405,.625,.73,.935,.992],pacing=getPacing(true),rows=[];
await mkdir(out,{recursive:true});const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4200','--strictPort'],{stdio:'inherit'});let browser;
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const variant of ['control','portrait']){
  const page=await browser.newPage({viewport,deviceScaleFactor:1,hasTouch:true,isMobile:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base+'/?experience=editorial&direction=staged&profile=economy&framing='+variant,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
   await page.waitForFunction(()=>!!document.querySelector('.chapter').style.getPropertyValue('--pace-height'));
   assert.equal(await page.locator('#stage').getAttribute('data-framing'),variant);
   const geometry=await page.evaluate(()=>({starts:[...document.querySelectorAll('main section')].map((s,i)=>i?s.getBoundingClientRect().top+scrollY:0),max:document.documentElement.scrollHeight-innerHeight}));
   for(const p of holds){const i=Math.max(0,windows.findLastIndex((v,j)=>j<7&&p>=v)),a=geometry.starts[i],b=geometry.starts[i+1]??geometry.max;
    await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),a+(b-a)*pacing.local(i,p));
    await page.waitForFunction(p=>{const s=document.querySelector('#stage').dataset;return Math.abs(Number(s.progress)-p)<.003&&s.motionPending==='false';},p,{timeout:180000});
    const row=await page.evaluate(()=>{const d=document.querySelector('#stage').dataset,i=Number(d.visualChapter),c=document.querySelectorAll('.chapter .copy')[i],r=c.getBoundingClientRect();return {pose:JSON.parse(d.pose),chapter:i,copy:{x:r.x,y:r.y,right:r.right,bottom:r.bottom,opacity:Number(getComputedStyle(c).opacity)},width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1,narrativeReady:d.narrativeReady};});
    assert.ok(!row.overflow&&row.copy.x>=-1&&row.copy.y>=-1&&row.copy.right<=row.width+1&&row.copy.bottom<=row.height+1&&row.copy.opacity>.95,JSON.stringify(row));
    await page.screenshot({path:out+'/'+variant+'-'+p+'.png',timeout:120000,animations:'disabled'});rows.push({variant,p,...row});
   }
   await page.setViewportSize({width:viewport.height,height:viewport.width});
   await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth+1);
   await page.keyboard.press('Home');await page.waitForFunction(()=>Number(document.querySelector('#stage').dataset.progress)<.002,null,{timeout:120000});
   await page.screenshot({path:out+'/'+variant+'-landscape.png',timeout:120000});
   assert.deepEqual(errors,[]);
  }finally{await page.close();}
 }
 // Reduced motion never gates content; no additional visible navigation or motion.
 const reduced=await browser.newPage({viewport,reducedMotion:'reduce',hasTouch:true,isMobile:true});
 await reduced.goto(base+'/?experience=editorial&direction=staged&framing=portrait');await reduced.waitForSelector('main');
 assert.equal(await reduced.locator('.experience-loader').count(),0);assert.equal(await reduced.locator('main').evaluate(m=>m.inert),false);assert.equal(await reduced.locator('#stage').getAttribute('data-renderer'),'canvas');
 await reduced.close();
 await writeFile(out+'/comparison.json',JSON.stringify({viewport,rows,note:'Emulated touch viewport; programmatic scroll holds, keyboard and orientation resize; no physical mobile or swipe test.'},null,2));
}finally{await browser?.close();server.kill();}
