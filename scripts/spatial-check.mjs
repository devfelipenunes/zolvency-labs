import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {windows} from '../src/graphics/facilityCamera.js';
import {environments} from '../src/graphics/spatialNarrative.js';
import {spatialFacility} from '../src/graphics/facilityLayout.js';
const base='http://127.0.0.1:4174',server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4174','--strictPort'],{stdio:'inherit'});
const out='artifacts/spatial-transitions',reports=[];let browser;
async function go(page,p){
 await page.evaluate(({p,windows})=>{const max=document.documentElement.scrollHeight-innerHeight;const a=[...document.querySelectorAll('main section')].map((e,i)=>i===0?0:e.getBoundingClientRect().top+scrollY);let i=windows.findIndex((w,j)=>j<windows.length-1&&p<=windows[j+1]);if(i<0)i=windows.length-2;scrollTo(0,Math.round(a[i]+((a[i+1]??max)-a[i])*(p-windows[i])/(windows[i+1]-windows[i])));},{p,windows});
 await page.waitForFunction(p=>Math.abs(Number(document.querySelector('#stage')?.dataset.progress)-p)<.002,p,{timeout:30000});
}
try{
 await mkdir(out,{recursive:true});for(let i=0;i<80;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--disable-smooth-scrolling']});
 for(const [mode,viewport] of [['production',{width:1280,height:800}],['baseline',{width:1280,height:800}],['immersive',{width:1280,height:800}],['immersive',{width:390,height:844}],['lab',{width:1280,height:800}],['connected',{width:1280,height:800}],['wallcut',{width:1280,height:800}],['studio',{width:1280,height:800}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|THREE.WebGLProgram/i.test(m.text()))errors.push(m.text());});
  try{
   await page.goto(base+'/?diagnostics=1'+(mode==='production'?'':'&space='+(mode==='wallcut'||mode==='studio'?'immersive':mode))+'&type=html'+(mode==='production'?'':mode==='wallcut'?'&cut=wall&quality=legacy':mode==='studio'?'&quality=studio':'&quality=legacy'));
   await page.waitForSelector('#stage[data-renderer="three"]',{timeout:90000});
   await page.waitForFunction(n=>Number(document.querySelector('#stage')?.dataset.assets)===n,spatialFacility(mode).length,{timeout:90000});
   const stage=page.locator('#stage'),route=await stage.evaluate(e=>e.auditRoute(480)),min=[...route].sort((a,b)=>a.distance-b.distance)[0];
   const rows=[];
   const points=mode==='production'?[.055,.20,.405,.445,.48,.51,.54,.59,.625,.68,.72,.78,.81,.84,.865,.89,.935,.992].map(p=>({p,name:'PRODUCTION',phase:'directed',roots:environments.findLast(e=>p>=e.points[0]).roots})):mode==='wallcut'?[.415,.445,.48,.495,.51,.525,.54,.565,.59].map(p=>({p,name:'STELLAR-CRYPTOGRAPHY',phase:'wallcut',roots:['servers','corridor','portal']})):mode==='studio'?[.055,.20,.405,.602,.72,.935,.992].map((p,i)=>({p,name:environments[i].name,phase:'studio',roots:environments[i].roots})):mode==='connected'?[.59,.625,.65,.68,.705,.73,.755,.78].map(p=>({p,name:'INTELLIGENCE',phase:'passage',roots:['bridge','portal','corridor']})):mode==='lab'?[.85,.866,.875,.885,.895,.92,.935].map(p=>({p,name:'QUANTUM',phase:'passage',roots:['quantum','cleanroom-airlock','lab-drawer-bench']})):environments.flatMap(e=>{const [a,b,c,d,z]=e.points;return (mode==='baseline'?[[ (c+d)/2,'hold']]:[[ (b+c)/2,'threshold'],[(c+d)/2,'hold'],[(d+z)/2,'release']]).map(([p,phase])=>({p,phase,name:e.name,roots:e.roots}));});
   for(const x of points){await go(page,x.p);const data=await stage.evaluate(e=>({...e.dataset})),hits=await stage.evaluate(e=>e.inspectSpatialFrame());const total=Object.values(hits).reduce((s,v)=>s+v,0);const share=x.roots.reduce((s,k)=>s+(hits[k]??0),0)/total;const file=mode+'-'+viewport.width+'-'+x.name+'-'+Math.round(x.p*1000)+'.png';await page.screenshot({path:out+'/'+file,timeout:120000,animations:'disabled'});rows.push({...x,file,hits,interiorRayShare:share,triangles:Number(data.triangles),drawCalls:Number(data.drawCalls),isolation:Number(data.isolation??0),apertureTriangles:Number(data.apertureTriangles??0),visualChapter:Number(data.visualChapter??-1),wallCut:data.wallCut,wallCutMesh:data.wallCutMesh,wallCutMask:Number(data.wallCutMask??0),editName:data.editName,wallCoverage:Number(data.wallCoverage??0),lighting:data.lighting,studioQuality:data.studioQuality});}
   await go(page,.62);const a=await stage.getAttribute('data-pose');await go(page,.92);await go(page,.62);assert.equal(await stage.getAttribute('data-pose'),a);
   assert.deepEqual(errors,[]);assert.equal(await stage.getAttribute('data-failures'),'');const suspension=await stage.evaluate(e=>e.inspectSuspension());const report={mode,viewport,min,passesSampledClearance:min.distance>.06,rows,suspension};reports.push(report);console.log('spatial report',JSON.stringify(report));await writeFile(out+'/report.json',JSON.stringify(reports,null,2));
   if(mode!=='lab'&&mode!=='connected'&&mode!=='wallcut')assert.ok(min.distance>.06,'default rail clearance');
  }finally{await page.close();}
 }
 // Lab is an audition: record geometry failures, never promote it solely because the test runs.
 console.log('lab route result',JSON.stringify(reports.find(x=>x.mode==='lab')?.min));
}finally{await browser?.close();server.kill();}
