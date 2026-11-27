import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {expectedAssets} from '../src/graphics/facilityLayout.js';
const out='artifacts/mechanical-acceptance',base='http://127.0.0.1:4193';
await mkdir(out,{recursive:true});
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4193','--strictPort'],{stdio:'inherit'});
let browser;const reports=[];
const pairs=rows=>new Set(rows.flatMap(r=>r.hits.map(h=>h.moving+'|'+h.other)));
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const viewport of [{width:1280,height:720},{width:390,height:844}]){
  for(const candidate of [false,true]){
   const page=await browser.newPage({viewport,deviceScaleFactor:1,recordVideo:{dir:out+'/video',size:viewport}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/?diagnostics=1'+(candidate?'&motion=crane':''));
   await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});
   await page.waitForFunction(n=>Number(document.querySelector('#stage')?.dataset.assets)===n,expectedAssets,{timeout:120000});
   const report=await page.evaluate(()=>document.querySelector('#stage').inspectCraneSweep());
   assert.equal(report.rows.length,162);assert.equal(report.candidate,candidate);
   assert.ok(report.rows.every(r=>Math.abs(r.position[2]-r.expected)<1e-6&&r.movingMeshes>0&&r.otherMeshes>0));
   const forward=report.rows.slice(0,81),reverse=report.rows.slice(81).reverse();
   for(let i=0;i<81;i++){assert.deepEqual(forward[i].position,reverse[i].position);assert.deepEqual(forward[i].hits,reverse[i].hits);}
   assert.ok(Math.abs(Math.max(...forward.map(r=>r.position[2]))-Math.min(...forward.map(r=>r.position[2]))-4)<1e-5);
   const spatial=await page.evaluate(()=>document.querySelector('#stage').inspectCraneSpatialSweep());
   assert.equal(spatial.rows.length,161);assert.ok(spatial.rows.every((r,i)=>Math.abs(r.offset-i*.025)<1e-8&&r.movingMeshes>0&&r.otherMeshes>0));for(const row of spatial.rows)for(const hit of row.hits)for(const key of ['movingBounds','otherBounds','overlapBounds'])assert.ok(hit[key].min.every((v,j)=>Number.isFinite(v)&&Number.isFinite(hit[key].max[j])&&v<=hit[key].max[j]));
   // One independent clearance audition per viewport; the other variant shares identical physical offsets.
   const hoistCandidates=candidate?null:await page.evaluate(()=>document.querySelector('#stage').inspectHoistOffsetCandidates());
   if(hoistCandidates){assert.deepEqual(hoistCandidates.trials.map(t=>t.shift),[0,-.30,-.35,-.40,-.45,-.50,-.55]);for(const trial of hoistCandidates.trials){assert.equal(trial.rows.length,81);assert.ok(trial.rows.every((r,i)=>Math.abs(r.offset-i*.05)<1e-8&&Array.isArray(r.external)&&Array.isArray(r.assembly)));}await writeFile(out+'/hoist-offset-'+viewport.width+'.json',JSON.stringify(hoistCandidates,null,2));
    // Matched actual images at normal opening rail, no camera repositioning or geometry deletion.
    try{for(const shift of [0,-.35,-.40,-.45,-.50]){await page.evaluate(shift=>document.querySelector('#stage').setHoistOffsetStudy(shift),shift);for(const p of [.025,.055,.075]){await page.evaluate(p=>document.querySelector('#stage').benchmarkFrame(p),p);await page.screenshot({path:out+'/hoist-'+viewport.width+'-'+shift+'-'+p+'.png',timeout:120000,animations:'disabled'});}}}finally{await page.evaluate(()=>document.querySelector('#stage').setHoistOffsetStudy(0));}
   }
   const clearance=await page.evaluate(()=>document.querySelector('#stage').inspectOpeningClearance());
   const interior=await page.evaluate(()=>{const s=document.querySelector('#stage');return {floor:s.inspectInteriorFloor(),clearance:s.inspectInteriorClearance()};});
   assert.ok(clearance.every(r=>r.distance>.06));
   // Preserve computed evidence even if subsequent screenshot/video capture fails.
   reports.push({viewport,...report,spatial,clearance,interior});await writeFile(out+'/report.json',JSON.stringify(reports,null,2));
   assert.equal(interior.floor.length,6);assert.ok(interior.floor.every(r=>r&&Number.isFinite(r.y)&&Math.abs(r.y)<.08),JSON.stringify(interior.floor));assert.equal(interior.clearance.length,41);assert.ok(interior.clearance.every(r=>r.distance>.06),JSON.stringify(interior.clearance.filter(r=>r.distance<=.06)));
   const name=viewport.width+'-'+(candidate?'candidate':'control');
   for(const p of [0,.025,.055,.075,.105,.485,.51,.535,.625,.705,.73,.755]){await page.evaluate(p=>document.querySelector('#stage').benchmarkFrame(p),p);await page.screenshot({path:out+'/'+name+'-'+p+'.png',timeout:120000,animations:'disabled'});}
   for(const direction of ['forward','reverse'])for(let i=0;i<=12;i++){const p=.115*(direction==='forward'?i:12-i)/12;await page.evaluate(p=>document.querySelector('#stage').benchmarkFrame(p),p);await page.waitForTimeout(90);}
   assert.deepEqual(errors,[]);await page.close();
  }
 }
 const spatialComparisons=[];
 const summarize=rows=>[...pairs(rows)].map(pair=>{const hits=rows.filter(r=>r.hits.some(h=>h.moving+'|'+h.other===pair));return {pair,count:hits.length,firstOffset:hits[0].offset,lastOffset:hits.at(-1).offset,persistent:hits.length===rows.length};});
 for(let i=0;i<reports.length;i+=2){const a=reports[i].spatial.rows,b=reports[i+1].spatial.rows;const differences=a.flatMap((r,j)=>{const left=r.hits,right=b[j].hits;return JSON.stringify(left)===JSON.stringify(right)?[]:[{offset:r.offset,control:left,candidate:right}];});spatialComparisons.push({viewport:reports[i].viewport,control:summarize(a),candidate:summarize(b),differences,note:'Persistent and intermittent are descriptive categories, not approval of contact.'});}
 await writeFile(out+'/spatial-comparisons.json',JSON.stringify(spatialComparisons,null,2));
 assert.ok(spatialComparisons.every(c=>c.differences.length===0),'different contact sets at identical crane positions '+JSON.stringify(spatialComparisons));
 const comparisons=[];
 for(let i=0;i<reports.length;i+=2){
  const control=pairs(reports[i].rows),candidate=pairs(reports[i+1].rows);
  comparisons.push({viewport:reports[i].viewport,control:[...control],candidate:[...candidate],newPairs:[...candidate].filter(p=>!control.has(p)),note:'All sampled surface intersections reported. A matched pair is not proof of no penetration or permitted contact.'});
 }
 await writeFile(out+'/comparisons.json',JSON.stringify(comparisons,null,2));
 assert.ok(comparisons.every(c=>!c.newPairs.length),'new candidate mesh intersection pairs '+JSON.stringify(comparisons));
}finally{await browser?.close();server.kill();}
