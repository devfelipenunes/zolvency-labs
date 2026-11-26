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
   await page.waitForFunction(n=>Number(document.querySelector('#stage')?.dataset.assets)===n,expectedAssets,{timeout:90000});await page.waitForSelector('#stage[data-narrative-ready="true"][data-environment="studio"]',{timeout:90000});
   assert.equal(await page.locator('#stage').getAttribute('data-failures'),'');assert.ok((await page.locator('#stage').getAttribute('data-facility')).split(',').includes('corridor-extension'));
   assert.equal(await page.locator('#stage').getAttribute('data-practical-slots'),'3');assert.equal(await page.locator('#stage').getAttribute('data-look'),'noir');assert.equal(await page.locator('#stage').getAttribute('data-typography-mode'),'narrative3d');assert.ok(Number(await page.locator('#stage').getAttribute('data-pixel-ratio'))>=1);
   if(name==='desktop')assert.equal(await page.locator('#stage').getAttribute('data-effects'),'photographic');
   assert.ok(await page.getByRole('img',{name:'Zolvency',exact:true}).evaluate(e=>e.complete&&e.naturalWidth>0));await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.brand')).opacity)<.01);assert.equal(await page.locator('.chapter[data-name="ORIGIN"] .copy').evaluate(e=>getComputedStyle(e).opacity),'0');
   assert.equal(await page.locator('#stage .veil').evaluate(e=>getComputedStyle(e).backgroundImage),'none');
   assert.ok(!(await page.locator('#stage').getAttribute('data-facility')).includes('cleanroom-airlock'));assert.ok(!(await page.locator('#stage').getAttribute('data-facility')).includes('lab-drawer-bench'));
   const frames=await page.evaluate(()=>{const s=document.querySelector('#stage');return [.055,.205,.615,.68,.695,.715,.72,.935,.992].map(p=>{const metrics=s.benchmarkFrame(p);return {p,metrics,chapter:s.dataset.visualChapter,cut:s.dataset.wallCut,interiorSet:s.dataset.interiorSet,hangarVisible:s.dataset.hangarVisible};});});assert.ok(frames.filter(f=>f.p>=.51&&f.p<.81).every(f=>f.interiorSet==='security-wing'&&f.hangarVisible==='false'));assert.equal(frames.at(-1).hangarVisible,'true');await page.evaluate(()=>document.querySelector('#stage').benchmarkFrame(.055));await page.waitForFunction(()=>document.querySelector('#stage').inspectSpatialBrand().some(s=>s.name==='ORIGIN'),null,{timeout:25000});const opening=await page.evaluate(()=>{const s=document.querySelector('#stage');s.benchmarkFrame(.055);return s.inspectSpatialFrame();});for(const id of ['quantum','portal','corridor','corridor-extension','bridge','cleanroom-airlock','lab-drawer-bench'])assert.equal(opening[id]??0,0);await page.screenshot({path:'artifacts/smoke/'+name+'-hangar.png',timeout:90000,animations:'disabled'});const interior=await page.evaluate(()=>{const s=document.querySelector('#stage');s.benchmarkFrame(.72);return {floor:s.inspectInteriorFloor(),hits:s.inspectSpatialFrame(),route:s.inspectInteriorClearance()};});assert.equal(interior.hits.hangar??0,0);assert.ok(interior.route.every(r=>r.distance>.06),'extended interior clearance '+JSON.stringify(interior.route.filter(r=>r.distance<=.06)));await page.screenshot({path:'artifacts/smoke/'+name+'-interior.png',timeout:90000,animations:'disabled'});
   assert.ok(frames.every(f=>f.metrics.drawCalls>0&&f.metrics.triangles>0&&f.metrics.slots===3));
   assert.notEqual(frames[0].chapter,frames[4].chapter);
   await page.evaluate(()=>document.querySelector('#stage').benchmarkFrame(.81));
   assert.equal(await page.locator('#stage').getAttribute('data-edit-name'),'operations-to-quantum');
   assert.ok(Number(await page.locator('#stage').getAttribute('data-wall-cut-mask'))>.99);
   await page.evaluate(()=>document.querySelector('#stage').benchmarkFrame(.935));const installation=await page.evaluate(()=>{const s=document.querySelector('#stage');return {...s.inspectQuantumInstallation(),hits:s.inspectSpatialFrame(),clearance:s.inspectReactorClearance()};});assert.ok(installation.reactor.removed>=50);assert.equal(installation.cryostat.removed,2);assert.ok(installation.cryostat.bottom>5);assert.ok(Math.abs(installation.cryostat.mountTop-11.5)<.05);assert.equal(installation.hits.hangar??0,0);assert.ok((installation.hits.quantum??0)>0,'cryostat must appear in shot');assert.ok(installation.clearance.every(r=>r.distance>.06));
   await page.screenshot({path:'artifacts/smoke/'+name+'.png',timeout:90000,animations:'disabled'});
   const lettering=[];for(const p of [.005,.055,.205,.405,.625,.73,.935,.992]){const frame=await page.evaluate(p=>{const s=document.querySelector('#stage');s.benchmarkFrame(p);return {p,entries:s.inspectKineticFrame(),look:s.dataset.look,msaa:Number(s.dataset.msaa),pixelRatio:Number(s.dataset.pixelRatio),shot:s.dataset.narrativeShot,focus:s.dataset.narrativeFocus,intent:s.dataset.narrativeIntent,roles:s.dataset.narrativeRoles,htmlOpacity:getComputedStyle(document.querySelector('.chapter[data-name="'+s.dataset.narrativeShot+'"] .copy')).opacity};},p);lettering.push(frame);if(![.055,.935].includes(p))await page.screenshot({path:'artifacts/smoke/'+name+'-shot-'+Math.round(p*1000)+'.png',timeout:90000,animations:'disabled'});}assert.ok(lettering[0].entries.some(e=>e.name==='ORIGIN'&&e.role==='hero'&&e.span>.2));for(const frame of lettering.slice(1)){assert.equal(frame.htmlOpacity,'0');assert.ok(frame.focus&&frame.intent);for(const role of ['hero','headline','body'])assert.ok(frame.entries.some(e=>e.role===role&&e.inside&&e.triangles>0),JSON.stringify(frame));}assert.equal(new Set(lettering.map(f=>f.shot)).size,7);const anchors=await page.evaluate(()=>document.querySelector('#stage').inspectSpatialBrand());await page.goto(base+'/?renderer=canvas');
   await page.waitForSelector('#stage[data-renderer="canvas"][data-pose]');
   assert.equal(await page.locator('main section').count(),7);
   assert.deepEqual(errors,[]);
   results.push({name,frames,opening,interior,installation,lettering,anchors});await writeFile('artifacts/smoke/results.json',JSON.stringify(results,null,2));
  }finally{await page.close();}
 }
}finally{await browser?.close();server.kill();}
