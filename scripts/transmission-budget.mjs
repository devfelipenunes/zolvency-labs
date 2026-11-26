import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {expectedAssets} from '../src/graphics/facilityLayout.js';
const mobile=process.env.TRANSMISSION_VIEW==='mobile',viewport=mobile?{width:390,height:844}:{width:1280,height:720};
const base='http://127.0.0.1:4198',out='artifacts/transmission-budget',hardware=process.env.BENCH_HARDWARE==='1';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4198','--strictPort'],{stdio:'inherit'});
const variants=mobile?['half','full']:['full','half'],poses=[.205,.405,.935],reports=[];
const pct=(xs,p)=>{const a=xs.filter(Number.isFinite).sort((a,b)=>a-b);return a.length?a[Math.ceil(p*a.length)-1]:null;};
let browser;
await mkdir(out,{recursive:true});
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({headless:!hardware,args:hardware?[]:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const variant of variants){
  const page=await browser.newPage({viewport,deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base+'/?experience=editorial&profile=economy&direction=staged&diagnostics=1&benchmark=1&transmission='+variant);
   await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});
   await page.waitForFunction(n=>Number(document.querySelector('#stage').dataset.assets)===n,expectedAssets,{timeout:120000});
   await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
   await page.waitForFunction(()=>typeof document.querySelector('#stage').benchmarkFrame==='function');
   assert.equal(Number(await page.locator('#stage').getAttribute('data-transmission-scale')),variant==='half'?.5:1);
   const rows=[];
   for(const p of poses){
    const result=await page.evaluate(async p=>{
     const stage=document.querySelector('#stage'),next=()=>new Promise(r=>requestAnimationFrame(r));
     for(let i=0;i<3;i++){await next();stage.benchmarkFrame(p);}
     const samples=[];let previous=await next();
     for(let i=0;i<12;i++){const now=await next(),row=stage.benchmarkFrame(p);samples.push({...row,rafMs:now-previous});previous=now;}
     const d=stage.dataset;return {samples,pose:JSON.parse(d.pose),pixelRatio:Number(d.pixelRatio),scale:Number(d.transmissionScale),assets:d.facility};
    },p);
    // Screenshots occur only after this pose's timing samples.
    await page.screenshot({path:out+'/'+variant+'-'+p+'.png',timeout:120000,animations:'disabled'});
    const unique=[...new Map(result.samples.filter(x=>x.gpuSerial&&Number.isFinite(x.gpuMs)).map(x=>[x.gpuSerial,x])).values()];
    rows.push({p,...result,summary:{rafP50:pct(result.samples.map(x=>x.rafMs),.5),rafP95:pct(result.samples.map(x=>x.rafMs),.95),gpuP50:pct(unique.map(x=>x.gpuMs),.5),gpuP95:pct(unique.map(x=>x.gpuMs),.95),gpuSamples:unique.length}});
   }
   assert.deepEqual(errors,[]);reports.push({variant,viewport,rows,errors});
   await writeFile(out+'/comparison.json',JSON.stringify({hardwareRequested:hardware,reports,note:'Fixed diagnostic renderer and camera poses; not user scroll or physical FPS. GPU query results are asynchronous and may reflect earlier frames. Half scale reduces transmission target area to 25%, not total rendering cost. Visual review required.'},null,2));
  }finally{await page.close();}
 }
 for(const p of poses){const a=reports[0].rows.find(x=>x.p===p),b=reports[1].rows.find(x=>x.p===p);assert.deepEqual(a.pose,b.pose);assert.equal(a.pixelRatio,b.pixelRatio);assert.equal(a.assets,b.assets);}
}finally{await browser?.close();server.kill();}
