import {chromium} from 'playwright';import {spawn} from 'node:child_process';import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const view=process.env.SURFACE_VIEW??'desktop',mobile=view==='mobile',viewport=mobile?{width:390,height:844}:{width:1280,height:720},out='artifacts/surface-map',base='http://127.0.0.1:4228';
await mkdir(out,{recursive:true});const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4228','--strictPort'],{stdio:'inherit'});let browser;
try{let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});const page=await browser.newPage({viewport,deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?experience=editorial&profile=economy&direction=staged&copy=manifesto&lighting=local&transmission=threequarter&diagnostics=1&benchmark=1&surface-map=1',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
 const rows=[];for(const [act,p] of [['origin',.055],['blockchain',.205],['stellar',.405],['cryptography',.625],['intelligence',.73],['quantum',.935],['convergence',.992]]){
  const data=await page.evaluate(p=>{const s=document.querySelector('#stage');s.benchmarkFrame(p);return {progress:Number(s.dataset.progress),...s.inspectTypeSurfaces()};},p);
  assert.ok(Math.abs(data.progress-p)<.003);assert.equal(data.hits.length,data.rows*data.cols);assert.ok(data.hits.some(Boolean));for(const seed of data.seeds)assert.ok(seed.center.every(Number.isFinite)&&seed.normal.every(Number.isFinite)&&seed.samples>=15);
  rows.push({act,p,...data});await writeFile(out+'/report.json',JSON.stringify({view,viewport,rows,note:'Diagnostic frames; coarse seed samples are not mounted text or native-scroll/physical-device evidence. No positive seed requirement.'},null,2));
  await page.screenshot({path:out+'/'+act+'.png',timeout:120000});console.log(act,'hits',data.hits.filter(Boolean).length,'eligible',data.hits.filter(h=>h?.eligible).length,'seeds',data.seeds.length);
 }assert.deepEqual(errors,[]);
}finally{await browser?.close();server.kill();}
