import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {expectedAssets} from '../src/graphics/facilityLayout.js';
const base='http://127.0.0.1:4185',server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4185','--strictPort'],{stdio:'inherit'});
const percentile=(a,p)=>{const v=a.filter(Number.isFinite).sort((x,y)=>x-y);return v.length?v[Math.max(0,Math.ceil(v.length*p)-1)]:null;};
const summarize=(rows,key)=>({p50:percentile(rows.map(r=>r[key]),.5),p95:percentile(rows.map(r=>r[key]),.95)});
const reports=[];let browser;
try{
 await mkdir('artifacts/performance',{recursive:true});for(let i=0;i<80;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 const hardware=process.env.BENCH_HARDWARE==='1';
 browser=await chromium.launch({args:hardware?[]:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const views=[['desktop',{width:800,height:500}],['mobile',{width:390,height:844}]];
 // AB/BA ordering reduces bias from warm GPU and browser process.
 for(const [label,viewport] of views)for(const mode of label==='desktop'?['legacy','optimized']:['optimized','legacy']){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|THREE.WebGLProgram/i.test(m.text()))errors.push(m.text());});
  try{
   await page.goto(base+'/?diagnostics=1&benchmark=1&perf='+mode);await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});
   await page.waitForFunction(n=>Number(document.querySelector('#stage')?.dataset.assets)===n,expectedAssets,{timeout:120000});
   if(label==='desktop')await page.waitForSelector('#stage[data-environment="hdr"]',{timeout:120000});
   const result=await page.evaluate(async()=>{
    const s=document.querySelector('#stage'),poses=[.055,.205,.405,.615,.72,.935,.992],next=()=>new Promise(r=>requestAnimationFrame(r));
    const gl=document.querySelector('#three-scene').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');const renderer=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable';
    for(const p of poses){await next();s.benchmarkFrame(p);}
    const rows=[];let previous=await next();
    for(let repeat=0;repeat<3;repeat++)for(const p of poses){const start=await next();const row=s.benchmarkFrame(p);rows.push({p,repeat,rafMs:start-previous,...row});previous=start;}
    return {renderer,rows,assets:s.dataset.facility,effects:s.dataset.effects,firstFrameMs:Number(s.dataset.firstFrameMs),allAssetsMs:Number(s.dataset.allAssetsMs),gpuTimerSupported:s.dataset.gpuTimerSupported};
   });
   assert.deepEqual(errors,[]);assert.ok(result.rows.every(x=>x.slots===(mode==='legacy'?8:3)));assert.ok(result.rows.every(x=>x.drawCalls>0&&x.triangles>0));
   const uniqueGpu=[...new Map(result.rows.filter(r=>r.gpuMs!==null&&r.gpuSerial).map(r=>[r.gpuSerial,r])).values()];
   const report={label,mode,viewport,...result,summary:{cpuFrameMs:summarize(result.rows,'cpuFrameMs'),cpuSubmitMs:summarize(result.rows,'cpuSubmitMs'),rafMs:summarize(result.rows,'rafMs'),gpuMs:summarize(uniqueGpu,'gpuMs'),gpuSamples:uniqueGpu.length,drawCalls:summarize(result.rows,'drawCalls'),triangles:summarize(result.rows,'triangles')}};
   reports.push(report);console.log('performance summary',JSON.stringify({...report,rows:undefined}));await writeFile('artifacts/performance/results.json',JSON.stringify({note:'Same build AB/BA; diagnostic mode locks resolution and disables idle/collision metrics. GPU timings optional. SwiftShader is not representative of hardware performance. Baseline toggles light pooling, not exact historical release.',hardware,reports},null,2));
  }finally{await page.close();}
 }
 for(const [label] of views){const a=reports.find(r=>r.label===label&&r.mode==='legacy'),b=reports.find(r=>r.label===label&&r.mode==='optimized');assert.equal(a.assets,b.assets);assert.equal(a.effects,b.effects);assert.equal(a.rows[0].pixelRatio,b.rows[0].pixelRatio);}
}finally{await browser?.close();server.kill();}
