import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {spatialFacility} from '../src/graphics/facilityLayout.js';
const base='http://127.0.0.1:4187',out='artifacts/reactor-study';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4187','--strictPort'],{stdio:'inherit'});
let browser;const reports=[];
try{
 await mkdir(out,{recursive:true});let ready=false;
 for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const [label,viewport] of [['desktop',{width:960,height:600}],['mobile',{width:390,height:844}]]){
 const page=await browser.newPage({viewport,deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|THREE.WebGLProgram/i.test(m.text()))errors.push(m.text());});
 try{
 await page.goto(base+'/?space=reactor&diagnostics=1&benchmark=1');
 await page.waitForSelector('#stage[data-renderer="three"]',{timeout:90000});
 await page.waitForFunction(n=>Number(document.querySelector('#stage').dataset.assets)===n,spatialFacility('reactor').length,{timeout:120000});
 const stage=page.locator('#stage');const components=await stage.evaluate(s=>s.inspectReactor());
 assert.ok(components?.length);assert.equal(components.reduce((n,m)=>n+m.triangles,0),17492);
 const frames=[];
 for(const p of [.055,.865,.89,.915,.935,.992]){
 const frame=await stage.evaluate((s,p)=>{const metrics=s.benchmarkFrame(p);return {p,metrics,visible:s.dataset.interiorSet,hangar:s.dataset.hangarVisible,hits:s.inspectSpatialFrame()};},p);
 if(p>=.865&&p<=.935){assert.equal(frame.hangar,'false');assert.equal(frame.hits.hangar??0,0);assert.ok((frame.hits['reactor-room']??0)>0);}else assert.equal(frame.hits['reactor-room']??0,0);
 await page.screenshot({path:out+'/'+label+'-'+Math.round(p*1000)+'.png',timeout:90000,animations:'disabled'});frames.push(frame);
 }
 const route=await stage.evaluate(s=>s.inspectReactorClearance());
 assert.deepEqual(errors,[]);reports.push({label,frames,components,route,minClearance:Math.min(...route.map(r=>r.distance))});
 await writeFile(out+'/report.json',JSON.stringify(reports,null,2));console.log('reactor study',JSON.stringify({label,minClearance:reports.at(-1).minClearance,components:components.map(m=>({node:m.node,material:m.material,triangles:m.triangles,central:m.components.filter(c=>c.centralCandidate).length,total:m.components.length}))}));
 }finally{await page.close();}
 }
}finally{await browser?.close();server.kill();}
