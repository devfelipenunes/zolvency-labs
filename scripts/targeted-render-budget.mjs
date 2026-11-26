import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const mobile=process.env.BUDGET_VIEW==='mobile',mode=process.env.BUDGET_MODE??'targeted',viewport=mobile?{width:390,height:844}:{width:1280,height:720},base='http://127.0.0.1:4201',out='artifacts/targeted-render-budget';
const variants=mode==='smoke'?[['control','full','off']]:mobile?[['batch','full','static'],['threequarter','threequarter','off'],['control','full','off']]:[['control','full','off'],['threequarter','threequarter','off'],['batch','full','static']];
const holds=mode==='smoke'?[.205]:[.205,.405,.992],samples=mode==='smoke'?1:3;
await mkdir(out,{recursive:true});let browser;const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4201','--strictPort'],{stdio:'inherit'});
const reports=[],median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const [name,transmission,batch] of variants){
  const context=await browser.newContext({viewport,deviceScaleFactor:1}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base+'/?experience=editorial&direction=staged&profile=economy&diagnostics=1&benchmark=1&warmup=targeted&transmission='+transmission+'&batch='+batch);
   await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
   const startup=await page.evaluate(()=>{const d=document.querySelector('#stage').dataset;return {preflightMs:Number(d.preflightMs),warmedViews:Number(d.warmedViews),plan:d.warmupPlan,scale:Number(d.transmissionScale),batchGroups:Number(d.rackBatchGroups??0),batchSources:Number(d.rackBatchSources??0),potential:Number(d.rackBatchPotential??0),assets:d.facility};});
   assert.equal(startup.warmedViews,8);assert.equal(startup.plan,'targeted-diagnostics');assert.equal(startup.scale,transmission==='threequarter'?.75:1);
   const rows=[];
   for(const p of holds){
    const result=await page.evaluate(async({p,samples})=>{const s=document.querySelector('#stage');await s.fencedBenchmarkFrame(p);const rows=[];for(let i=0;i<samples;i++)rows.push(await s.fencedBenchmarkFrame(p));return {rows,pose:JSON.parse(s.dataset.pose),inventory:s.inspectRenderInventory(),mechanical:s.dataset.mechanical};},{p,samples});
    rows.push({p,...result,wallMedianMs:median(result.rows.map(x=>x.wallMs))});await page.screenshot({path:out+'/'+name+'-'+p+'.png',timeout:120000});
   }
   assert.deepEqual(errors,[]);reports.push({name,startup,rows,errors});await writeFile(out+'/comparison.json',JSON.stringify({viewport,mode,reports,note:'Diagnostic short warmup only; not public startup or FPS. Fence-complete wall latency includes software driver, scheduling and submit. Three samples are exploratory. No GPU timer attribution; screenshots after samples.'},null,2));
  }finally{await context.close();}
 }
 const control=reports.find(r=>r.name==='control');for(const candidate of reports.filter(r=>r!==control)){assert.equal(candidate.startup.assets,control.startup.assets);for(let i=0;i<holds.length;i++){assert.deepEqual(candidate.rows[i].pose,control.rows[i].pose);assert.deepEqual(candidate.rows[i].mechanical,control.rows[i].mechanical);}}
}finally{await browser?.close();server.kill();}
