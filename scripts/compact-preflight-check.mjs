import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
// Load completion order is nondeterministic; compare full mechanical tuples as a multiset.
const canonicalMechanics=rows=>rows.map(row=>JSON.stringify(row)).sort();
import {warmupPlan} from '../src/graphics/compactPreflight.js';
const mobile=process.env.PREFLIGHT_VIEW==='mobile',profile=process.env.PREFLIGHT_PROFILE??'economy',viewport=mobile?{width:390,height:844}:{width:1280,height:720},base='http://127.0.0.1:4202',out='artifacts/compact-preflight';
const candidate=mobile?'guarded':'compact',order=mobile?[candidate,'full']:['full',candidate],points=warmupPlan(true).filter(x=>!x.draw).map(x=>x.p);
await mkdir(out,{recursive:true});const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4202','--strictPort'],{stdio:'inherit'});let browser;const reports=[];
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const mode of order){
  const context=await browser.newContext({viewport,deviceScaleFactor:1}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   const begin=performance.now();
   await page.goto(base+'/?experience=editorial&direction=staged&profile='+profile+'&diagnostics=1&benchmark=1&preflight='+mode,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
   const startup=await page.evaluate(()=>{const d=document.querySelector('#stage').dataset;return {mode:d.preflightPlan,ms:Number(d.preflightMs),compiled:Number(d.compiledViews),drawn:Number(d.warmedViews),assets:d.facility,textures:Number(d.warmedTextures),fence:d.gpuPreflight,phases:JSON.parse(d.preflightPhases),warmRows:JSON.parse(d.preflightWarmRows)};});
   startup.totalMs=performance.now()-begin;
   assert.equal(startup.mode,mode);assert.equal(startup.compiled,16);assert.equal(startup.drawn,mode==='guarded'?11:mode==='compact'?8:17);assert.equal(startup.fence,'fenced');assert.ok(startup.textures>0);
   const rows=[];
   // First encounter and immediate repeat after each omitted pose. Each waits
   // for submitted graphics without blocking through gl.finish. No captures in timing.
   for(const p of points){
    const row=await page.evaluate(async p=>{
     const s=document.querySelector('#stage'),gl=s.querySelector('#three-scene').getContext('webgl2');
     const fence=async()=>{const f=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);if(!f)throw Error('Fence unavailable');const t=performance.now();try{gl.flush();for(;;){const state=gl.clientWaitSync(f,0,0);if(state===gl.ALREADY_SIGNALED||state===gl.CONDITION_SATISFIED)return;if(state===gl.WAIT_FAILED||gl.isContextLost()||performance.now()-t>30000)throw Error('Fence failed');await new Promise(r=>setTimeout(r,4));}}finally{gl.deleteSync(f);}};
     const measure=async()=>{await fence();const start=performance.now(),frame=s.benchmarkFrame(p);await fence();return {...frame,wallMs:performance.now()-start};};
     const first=await measure(),repeat=await measure();return {p,first,repeat,pose:JSON.parse(s.dataset.pose),mechanical:JSON.parse(s.dataset.mechanical),mask:Number(s.dataset.wallCutMask)};
    },p);
    rows.push(row);await page.locator('#three-scene').screenshot({path:out+'/'+mode+'-'+p+'.png',timeout:120000});
   }
   assert.deepEqual(errors,[]);reports.push({mode,startup,rows,errors});await writeFile(out+'/comparison.json',JSON.stringify({viewport,profile,order,reports,note:'Cold contexts, diagnostic fixed poses, fenced wall-clock latency includes scheduling/driver. First encounter of omitted pose is not native-scroll input latency. No physical GPU inference. Screen captures after each pair; order effects possible.'},null,2));
  }finally{await context.close();}
 }
 const a=reports.find(x=>x.mode==='full'),b=reports.find(x=>x.mode===candidate);assert.equal(a.startup.assets,b.startup.assets);assert.equal(a.startup.textures,b.startup.textures);
 for(let i=0;i<points.length;i++){assert.deepEqual(a.rows[i].pose,b.rows[i].pose);assert.deepEqual(canonicalMechanics(a.rows[i].mechanical),canonicalMechanics(b.rows[i].mechanical));assert.equal(a.rows[i].mask,b.rows[i].mask);}
}finally{await browser?.close();server.kill();}
