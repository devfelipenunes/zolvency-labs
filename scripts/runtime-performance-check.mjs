import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {getPacing} from '../src/graphics/cameraPacing.js';
import {windows} from '../src/graphics/facilityCamera.js';

const mobile=process.env.DEVICE_VIEW==='mobile';
const software=process.env.DEVICE_SOFTWARE==='1';
const profile=process.env.DEVICE_PROFILE??'economy';
const candidate=process.env.RUNTIME_VARIANT??'bounded';assert.ok(['lean','bounded','combined','motion-scale','motion-hysteresis'].includes(candidate));
const order=mobile?[candidate,'control']:['control',candidate];
const viewport=mobile?{width:390,height:844}:{width:1280,height:720};
const base='http://127.0.0.1:4196',out='artifacts/runtime-performance';
const pacing=getPacing(mobile),holds=[.055,.205,.405,.625,.73,.935,.992];
const pct=(values,q)=>{const v=values.filter(Number.isFinite).sort((a,b)=>a-b);return v.length?v[Math.ceil(v.length*q)-1]:null;};
const summary=values=>({samples:values.filter(Number.isFinite).length,p50:pct(values,.5),p95:pct(values,.95),max:values.filter(Number.isFinite).length?Math.max(...values.filter(Number.isFinite)):null});
await mkdir(out,{recursive:true});
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4196','--strictPort'],{stdio:'inherit'});
let browser;
const reports=[];
try{
 let ready=false;
 for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}
 assert.ok(ready,'Preview server did not start; run npm run build first');
 browser=await chromium.launch({headless:software||process.env.DEVICE_HEADLESS==='1',args:software?['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']:[]});
 for(const runtime of order){
  const context=await browser.newContext({viewport,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   const start=performance.now();
   await page.goto(base+'/?experience=editorial&profile='+profile+'&direction=staged&travel=responsive&lighting=local&transmission=threequarter&framing=portrait&preflight='+(mobile?'full':'compact')+'&runtime='+runtime,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});
   await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
   await page.waitForFunction(()=>!!document.querySelector('.chapter').style.getPropertyValue('--pace-height'));
   const startup=await page.evaluate(()=>{
    const s=document.querySelector('#stage'),c=s.querySelector('canvas#three-scene'),gl=c?.getContext('webgl2'),ext=gl?.getExtension('WEBGL_debug_renderer_info'),name=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'';
    const type=/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name)?'software':name?'reported-non-software':'unknown';
    return {type,preflightMs:Number(s.dataset.preflightMs)||null,warmedTextures:Number(s.dataset.warmedTextures)||null,warmedViews:Number(s.dataset.warmedViews)||null,gpuPreflight:s.dataset.gpuPreflight??null,phases:JSON.parse(s.dataset.preflightPhases??'{}'),warmRows:JSON.parse(s.dataset.preflightWarmRows??'[]'),travelMode:s.dataset.travelMode,runtime:s.dataset.runtime};
   });
   startup.totalMs=Math.round(performance.now()-start);
   assert.equal(startup.travelMode,'responsive');assert.equal(startup.runtime,runtime);assert.equal(startup.warmRows.length,16);assert.equal(startup.warmedViews,mobile?17:8);assert.ok(startup.warmedTextures>0);
   const geometry=await page.evaluate(()=>({starts:[...document.querySelectorAll('main section')].map((s,i)=>i?s.getBoundingClientRect().top+scrollY:0),max:document.documentElement.scrollHeight-innerHeight}));
   const scrollAt=p=>{const i=Math.max(0,windows.findLastIndex((v,j)=>j<7&&p>=v)),a=geometry.starts[i],b=geometry.starts[i+1]??geometry.max;return a+(b-a)*pacing.local(i,p);};
   await page.evaluate(()=>{
    window.__motionTrial={active:false,frames:[],last:'',started:0,first:null};
    function frame(now){const q=window.__motionTrial,d=document.querySelector('#stage').dataset;
     if(q.active&&d.renderCount!==q.last){q.last=d.renderCount;const n=k=>d[k]===''||d[k]==null?null:Number(d[k]);const p=n('progress');if(q.first===null&&p!==null&&p!==q.startProgress)q.first=Math.max(0,now-q.started);
      q.frames.push({now,progress:p,target:n('targetProgress'),interval:n('activeFrameIntervalMs'),cpu:n('cpuFrameMs'),gpu:n('gpuMs'),gpuSerial:d.gpuSampleSerial,draws:n('drawCalls'),triangles:n('triangles'),scale:n('resolutionScale'),motionScale:n('motionScale'),resizeMs:n('bufferResizeMs'),resizeCount:n('bufferResizeCount')});
     }requestAnimationFrame(frame);
    }requestAnimationFrame(frame);
   });
   const trials=[];
   for(const [direction,points] of [['forward',holds],['reverse',[...holds].reverse().slice(1)]]){
    for(const p of points){
     await page.evaluate(y=>{const q=window.__motionTrial,d=document.querySelector('#stage').dataset;q.frames=[];q.first=null;q.startProgress=Number(d.progress);q.last=d.renderCount;q.started=performance.now();q.active=true;window.scrollTo({top:y,behavior:'instant'});},scrollAt(p));
     await page.waitForFunction(p=>{const d=document.querySelector('#stage').dataset;return Math.abs(Number(d.progress)-p)<.003&&d.motionPending==='false';},p,{timeout:120000});
     const settled=await page.evaluate(()=>performance.now());
     await page.waitForFunction(()=>Number(document.querySelector('#stage').dataset.motionScale??1)===1,null,{timeout:120000});
     const result=await page.evaluate(settled=>{const q=window.__motionTrial;q.active=false;return {frames:q.frames,firstMotionMs:q.first,settleMs:settled-q.started,restoreMs:performance.now()-settled};},settled);
     assert.ok(result.frames.length>0,'No observed frames');
     trials.push({direction,p,...result});
    }
   }
   const moving=trials.flatMap(x=>x.frames.filter((f,i,a)=>i===0?Number.isFinite(f.interval):f.progress!==a[i-1].progress));
   const seen=new Set(),gpu=moving.filter(f=>{if(!f.gpuSerial||seen.has(f.gpuSerial))return false;seen.add(f.gpuSerial);return true;});
   const gate=await page.locator('#stage').evaluate(s=>JSON.parse(s.dataset.submissionGate??'null'));
   const allFrames=trials.flatMap(x=>x.frames),resizeFrames=allFrames.filter(f=>f.resizeMs>0);const report={allCpu:summary(allFrames.map(f=>f.cpu)),resizeCost:summary(resizeFrames.map(f=>f.resizeMs)),qualityRestoreMs:summary(trials.map(t=>t.restoreMs)),runtime,profile,viewport,startup,gate,trialCount:trials.length,activeSamples:moving.length,frameInterval:summary(moving.map(f=>f.interval)),cpu:summary(moving.map(f=>f.cpu)),gpu:summary(gpu.map(f=>f.gpu)),draws:summary(moving.map(f=>f.draws)),triangles:summary(moving.map(f=>f.triangles)),resolutionScale:summary(moving.map(f=>f.scale)),motionScale:summary(moving.map(f=>f.motionScale)),firstMotionMs:summary(trials.map(t=>t.firstMotionMs)),settleMs:summary(trials.map(t=>t.settleMs)),gapsOver50ms:moving.filter(f=>f.interval>50).length,gapsOver250ms:moving.filter(f=>f.interval>250).length,errors};
   await writeFile(out+'/'+runtime+'-trials.json',JSON.stringify(trials));
   await writeFile(out+'/'+runtime+'-report.json',JSON.stringify(report,null,2));
   assert.deepEqual(errors,[]);assert.ok(moving.length>0);
   if(gate){assert.ok(gate.maxPending<=2);assert.ok(gate.submitted>0,'no fenced submissions');assert.equal(gate.failure,null,'candidate submission gate failed open');}reports.push(report);console.log(JSON.stringify(report,null,2));
  }finally{await context.close();}
 }
 await writeFile(out+'/comparison.json',JSON.stringify({order,softwareRequested:software,reports,note:'No screenshots/video or intercepted requests during timing. Identical selected camera, transmission, preflight and lighting per viewport. A gate failure is explicitly recorded and invalidates the candidate as a success, even if it safely falls back. Gate stats count submission fences, not display presentations. Cold browser contexts; repeat AB/BA to assess ordering. Mobile viewport is not a physical phone. First observed motion is a RAF proxy, not input-to-photon. GPU timers are asynchronous and optional. Reported non-software is not proof of physical GPU. All observed active intervals including stalls are reported; sampling may miss renders.'},null,2));
}finally{await browser?.close();server.kill();}
