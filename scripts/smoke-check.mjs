import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {expectedAssets} from '../src/graphics/facilityLayout.js';
const base='http://127.0.0.1:4186';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4186','--strictPort'],{stdio:'inherit'});
let browser;const results=[];
try{
 await mkdir('artifacts/smoke',{recursive:true});
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready,'preview server unavailable');
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const [name,viewport] of [['desktop',{width:800,height:450}],['mobile',{width:320,height:640}]]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|THREE.WebGLProgram/i.test(m.text()))errors.push(m.text());});
  try{
   await page.goto(base+'/?diagnostics=1&benchmark=1');
   await page.waitForSelector('#stage[data-renderer="three"][data-lighting="photographic"]',{timeout:90000});
   await page.waitForFunction(n=>Number(document.querySelector('#stage')?.dataset.assets)===n,expectedAssets,{timeout:90000});
   assert.equal(await page.locator('#stage').getAttribute('data-failures'),'');assert.ok((await page.locator('#stage').getAttribute('data-facility')).split(',').includes('corridor-extension'));
   assert.equal(await page.locator('#stage').getAttribute('data-practical-slots'),'3');
   if(name==='desktop')assert.equal(await page.locator('#stage').getAttribute('data-effects'),'photographic');
   assert.ok(await page.getByRole('img',{name:'Zolvency',exact:true}).evaluate(e=>e.complete&&e.naturalWidth>0));
   assert.equal(await page.locator('#stage .veil').evaluate(e=>getComputedStyle(e).backgroundImage),'none');
   const frames=await page.evaluate(()=>{const s=document.querySelector('#stage');return [.055,.205,.615,.68,.695,.715,.72,.935].map(p=>{const metrics=s.benchmarkFrame(p);return {p,metrics,chapter:s.dataset.visualChapter,cut:s.dataset.wallCut,interiorSet:s.dataset.interiorSet,hangarVisible:s.dataset.hangarVisible};});});assert.ok(frames.filter(f=>f.p>=.51&&f.p<.81).every(f=>f.interiorSet==='security-wing'&&f.hangarVisible==='false'));assert.equal(frames.at(-1).hangarVisible,'true');const interior=await page.evaluate(()=>{const s=document.querySelector('#stage');s.benchmarkFrame(.72);return {floor:s.inspectInteriorFloor(),hits:s.inspectSpatialFrame(),route:s.inspectInteriorClearance()};});assert.equal(interior.hits.hangar??0,0);assert.ok(interior.route.every(r=>r.distance>.06),'extended interior clearance '+JSON.stringify(interior.route.filter(r=>r.distance<=.06)));await page.screenshot({path:'artifacts/smoke/'+name+'-interior.png',timeout:90000,animations:'disabled'});
   assert.ok(frames.every(f=>f.metrics.drawCalls>0&&f.metrics.triangles>0&&f.metrics.slots===3));
   assert.notEqual(frames[0].chapter,frames[4].chapter);
   await page.evaluate(()=>document.querySelector('#stage').benchmarkFrame(.81));
   assert.equal(await page.locator('#stage').getAttribute('data-edit-name'),'operations-to-quantum');
   assert.ok(Number(await page.locator('#stage').getAttribute('data-wall-cut-mask'))>.99);
   await page.evaluate(()=>document.querySelector('#stage').benchmarkFrame(.935));
   await page.screenshot({path:'artifacts/smoke/'+name+'.png',timeout:90000,animations:'disabled'});
   await page.goto(base+'/?renderer=canvas');
   await page.waitForSelector('#stage[data-renderer="canvas"][data-pose]');
   assert.equal(await page.locator('main section').count(),7);
   assert.deepEqual(errors,[]);
   results.push({name,frames,interior});await writeFile('artifacts/smoke/results.json',JSON.stringify(results,null,2));
  }finally{await page.close();}
 }
}finally{await browser?.close();server.kill();}
