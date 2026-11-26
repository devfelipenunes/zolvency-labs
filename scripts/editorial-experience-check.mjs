import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createPacing} from '../src/graphics/cameraPacing.js';
import {windows} from '../src/graphics/facilityCamera.js';
import {expectedAssets} from '../src/graphics/facilityLayout.js';
const mobile=process.env.EDITORIAL_VIEW==='mobile',profile=process.env.EDITORIAL_PROFILE??'balanced',legacy=profile==='legacy',directed=process.env.EDITORIAL_DIRECTION==='staged';
const viewport=mobile?{width:390,height:844}:{width:1280,height:720},out='artifacts/editorial-experience',base='http://127.0.0.1:4195';
const pacing=createPacing({mobile}),holds=[.055,.205,.405,.625,.73,.935,.992];
await mkdir(out,{recursive:true});
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4195','--strictPort'],{stdio:'inherit'});
let browser;const results=[],errors=[];
const percentile=(values,q)=>{const v=values.filter(Number.isFinite).sort((a,b)=>a-b);return v.length?v[Math.min(v.length-1,Math.ceil(v.length*q)-1)]:null;};
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport,deviceScaleFactor:1,recordVideo:{dir:out+'/video',size:viewport}});
 page.on('pageerror',e=>errors.push(e.message));
 let releaseAsset=()=>{},markHeld=()=>{},waitHeld=Promise.resolve();let held=false;if(directed){waitHeld=new Promise(resolve=>{markHeld=resolve;});const gate=new Promise(resolve=>{releaseAsset=resolve;});await page.route('**/models/facility/*.glb',async route=>{if(!held&&/server-room(?:-low)?\.glb$/.test(route.request().url())){held=true;markHeld();await gate;}await route.continue();});}
 await page.goto(base+(legacy?'':'/?experience=editorial&profile='+profile+(directed?'&direction=staged':'')),{waitUntil:'domcontentloaded'});
 if(directed){try{await page.waitForSelector('.experience-loader[data-phase="assets"]');await page.waitForFunction(()=>document.querySelector('main').inert);await page.waitForFunction(()=>document.querySelector('#stage').dataset.loadingPhase==='assets');let timer;try{await Promise.race([waitHeld,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Required model was not intercepted')),30000);})]);}finally{clearTimeout(timer);}await page.mouse.wheel(0,700);await page.keyboard.press('End');assert.equal(await page.evaluate(()=>scrollY),0);assert.equal(await page.locator('.experience-loader').count(),1);}finally{releaseAsset();}}
 await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});
 await page.waitForFunction(n=>Number(document.querySelector('#stage')?.dataset.assets)===n,expectedAssets,{timeout:120000});
 if(directed){await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});assert.equal(await page.locator('#stage').getAttribute('data-loading-phase'),'ready');assert.equal(await page.evaluate(()=>document.querySelector('main').inert),false);assert.equal(await page.locator('#stage').getAttribute('data-failures'),'');assert.equal(await page.locator('#stage').getAttribute('data-warmed-views'),'17');assert.ok(Number(await page.locator('#stage').getAttribute('data-warmed-textures'))>0);assert.ok(['fenced','submitted'].includes(await page.locator('#stage').getAttribute('data-gpu-preflight')));}
 if(!legacy)await page.waitForFunction(()=>!!document.querySelector('.chapter').style.getPropertyValue('--pace-height'));
 const geometry=await page.evaluate(()=>({starts:[...document.querySelectorAll('main section')].map((s,i)=>i?s.getBoundingClientRect().top+scrollY:0),max:document.documentElement.scrollHeight-innerHeight,height:innerHeight}));
 const scrollAt=p=>{const i=Math.max(0,windows.findLastIndex((v,j)=>j<7&&p>=v)),a=geometry.starts[i],b=geometry.starts[i+1]??geometry.max;return a+(b-a)*(legacy?(p-windows[i])/(windows[i+1]-windows[i]):pacing.local(i,p));};
 await page.evaluate(()=>{window.__measure=[];let last='',prev=null;function read(now){const d=document.querySelector('#stage').dataset;if(d.renderCount!==last){last=d.renderCount;const n=k=>d[k]===''||d[k]==null?null:Number(d[k]);window.__measure.push({now,progress:n('progress'),target:n('targetProgress'),cpu:n('cpuFrameMs'),pose:n('cpuPoseMs'),scene:n('cpuSceneMs'),text:n('cpuTextMs'),submit:n('cpuRenderMs'),gpu:n('gpuMs'),gpuSerial:d.gpuSampleSerial,draws:n('drawCalls'),triangles:n('triangles'),scale:n('resolutionScale'),velocity:n('travelVelocity'),acceleration:n('travelAcceleration'),interval:n('activeFrameIntervalMs'),rafGap:prev===null?null:now-prev});prev=now;}requestAnimationFrame(read);}requestAnimationFrame(read);});
 const contrast=(rgb,bg)=>{const l=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);const a=l(rgb),b=l(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
 async function capture(p,direction){
  await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),scrollAt(p));
  try{await page.waitForFunction(p=>Math.abs(Number(document.querySelector('#stage')?.dataset.progress)-p)<.003,p,{timeout:180000});}catch(error){const diagnostic=await page.evaluate(()=>({data:{...document.querySelector('#stage').dataset},scrollY,frames:window.__measure?.slice(-100)}));await writeFile(out+'/timeout.json',JSON.stringify({p,direction,diagnostic,errors},null,2));throw error;}
  if(!legacy)await page.waitForFunction(()=>{const stage=document.querySelector('#stage'),copy=document.querySelectorAll('.chapter .copy')[Number(stage.dataset.visualChapter)];return copy&&Number(getComputedStyle(copy).opacity)>.95;},null,{timeout:60000});
  const row=await page.evaluate(()=>{const stage=document.querySelector('#stage'),i=Number(stage.dataset.visualChapter),copy=document.querySelectorAll('.chapter .copy')[i],p=copy.querySelector('p'),h=copy.querySelector('h1,h2'),rect=copy.getBoundingClientRect(),s=getComputedStyle(copy);return {data:{...stage.dataset},copy:{text:copy.textContent,opacity:Number(s.opacity),background:stage.dataset.direction==='staged'?s.getPropertyValue('--reading-surface').trim():s.backgroundColor,roles:[copy.querySelector('.eyebrow'),h,p].map(n=>Number(getComputedStyle(n).opacity)),body:getComputedStyle(p).color,headline:getComputedStyle(h).color,bodySize:getComputedStyle(p).fontSize,rect:{x:rect.x,y:rect.y,right:rect.right,bottom:rect.bottom},scrollY}};});
  if(!legacy){
   assert.ok(row.copy.opacity>.95,JSON.stringify(row.copy));if(directed)assert.ok(row.copy.roles.every(v=>v>.95),JSON.stringify(row.copy));assert.ok(row.copy.rect.x>=-1&&row.copy.rect.y>=-1&&row.copy.rect.right<=viewport.width+1&&row.copy.rect.bottom<=viewport.height+1,JSON.stringify(row.copy));
   const rgba=s=>s.match(/[\d.]+/g).map(Number),bg=rgba(row.copy.background),alpha=bg[3]??1,worst=bg.slice(0,3).map(v=>v*alpha+255*(1-alpha));
   row.copy.worstWhiteContrast=contrast(rgba(row.copy.body).slice(0,3),worst);assert.ok(row.copy.worstWhiteContrast>=4.5);
   assert.ok(Number.parseFloat(row.copy.bodySize)>=15);assert.ok(!row.data.narrativeRoles?.includes('body')&&!row.data.narrativeRoles?.includes('headline'));
  }
  results.push({p,direction,...row});await writeFile(out+'/holds.json',JSON.stringify({profile,viewport,geometry,results},null,2));
  await page.screenshot({path:out+'/'+direction+'-'+p+'.png',timeout:120000,animations:'disabled'});
 }
 for(const p of holds)await capture(p,'forward');
 for(const p of [...holds].reverse())await capture(p,'reverse');
 // Genuine native keyboard and wheel; no diagnostic rendering API.
 await page.keyboard.press('Home');await page.waitForFunction(()=>scrollY<=1&&Number(document.querySelector('#stage').dataset.progress)<.002,null,{timeout:120000});
 await page.mouse.wheel(0,Math.round(viewport.height*.85));await page.waitForFunction(()=>scrollY>10&&Number(document.querySelector('#stage').dataset.progress)>0,null,{timeout:120000});
 await page.keyboard.press('End');await page.waitForFunction(()=>Math.abs(Number(document.querySelector('#stage').dataset.progress)-1)<.002,null,{timeout:120000});
 const frames=await page.evaluate(()=>window.__measure);const active=frames.filter((f,i)=>i&&f.progress!==frames[i-1].progress),gpu=active.filter((f,i)=>f.gpuSerial&&f.gpuSerial!==active[i-1]?.gpuSerial);
 const startup=await page.locator('#stage').evaluate(s=>({preflightMs:Number(s.dataset.preflightMs)||null,allAssetsMs:Number(s.dataset.allAssetsMs)||null,warmedViews:Number(s.dataset.warmedViews)||null,warmedTextures:Number(s.dataset.warmedTextures)||null,gpuPreflight:s.dataset.gpuPreflight??null}));
 const report={profile,directed,viewport,geometry,startup,activeSamples:active.length,holdCaptionHeights:results.map(x=>({p:x.p,direction:x.direction,height:x.copy.rect.bottom-x.copy.rect.y,viewportFraction:(x.copy.rect.bottom-x.copy.rect.y)/viewport.height})),frameInterval:{p50:percentile(active.map(x=>x.interval),.5),p95:percentile(active.map(x=>x.interval),.95),gapsOver50ms:active.filter(x=>x.interval>50).length,gapsOver250ms:active.filter(x=>x.interval>250).length},cpu:Object.fromEntries(['cpu','pose','scene','text','submit'].map(k=>[k,{p50:percentile(active.map(x=>x[k]),.5),p95:percentile(active.map(x=>x[k]),.95)}])),gpu:{samples:gpu.length,p95:percentile(gpu.map(x=>x.gpu),.95)},draws:{p50:percentile(active.map(x=>x.draws),.5),p95:percentile(active.map(x=>x.draws),.95)},errors,note:'SwiftShader CPU software rendering; not physical GPU FPS. Contrast is conservative CSS compositing estimate over white at fully visible holds.'};
 await writeFile(out+'/frames.json',JSON.stringify(frames));await writeFile(out+'/report.json',JSON.stringify(report,null,2));assert.deepEqual(errors,[]);assert.ok(active.length>0);
 await page.close();
}finally{await browser?.close();server.kill();}
