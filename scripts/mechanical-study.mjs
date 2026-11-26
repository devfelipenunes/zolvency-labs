import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {expectedAssets} from '../src/graphics/facilityLayout.js';
const out='artifacts/mechanical-study',base='http://127.0.0.1:4193';
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
   const clearance=await page.evaluate(()=>document.querySelector('#stage').inspectOpeningClearance());
   assert.ok(clearance.every(r=>r.distance>.06));
   const name=viewport.width+'-'+(candidate?'candidate':'control');
   for(const p of [0,.025,.055,.075,.105]){await page.evaluate(p=>document.querySelector('#stage').benchmarkFrame(p),p);await page.screenshot({path:out+'/'+name+'-'+p+'.png'});}
   for(const direction of ['forward','reverse'])for(let i=0;i<=12;i++){const p=.115*(direction==='forward'?i:12-i)/12;await page.evaluate(p=>document.querySelector('#stage').benchmarkFrame(p),p);await page.waitForTimeout(90);}
   assert.deepEqual(errors,[]);reports.push({viewport,...report,clearance});await writeFile(out+'/report.json',JSON.stringify(reports,null,2));await page.close();
  }
 }
 const comparisons=[];
 for(let i=0;i<reports.length;i+=2){
  const control=pairs(reports[i].rows),candidate=pairs(reports[i+1].rows);
  comparisons.push({viewport:reports[i].viewport,control:[...control],candidate:[...candidate],newPairs:[...candidate].filter(p=>!control.has(p)),note:'All sampled surface intersections reported. A matched pair is not proof of no penetration or permitted contact.'});
 }
 await writeFile(out+'/comparisons.json',JSON.stringify(comparisons,null,2));
 assert.ok(comparisons.every(c=>!c.newPairs.length),'new candidate mesh intersection pairs '+JSON.stringify(comparisons));
}finally{await browser?.close();server.kill();}
