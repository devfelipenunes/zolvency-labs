import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {expectedAssets} from '../src/graphics/facilityLayout.js';
const base='http://127.0.0.1:4199',out='artifacts/render-inventory',mobile=process.env.INVENTORY_VIEW==='mobile';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4199','--strictPort'],{stdio:'inherit'});let browser;
await mkdir(out,{recursive:true});
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:720},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?experience=editorial&direction=staged&profile=economy&diagnostics=1&benchmark=1');
 await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});await page.waitForFunction(n=>Number(document.querySelector('#stage').dataset.assets)===n,expectedAssets,{timeout:120000});
 await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
 const report=await page.evaluate(()=>{const s=document.querySelector('#stage'),rows=[];for(const p of [.055,.205,.405,.625,.73,.935,.992]){const frame=s.benchmarkFrame(p),inventory=s.inspectRenderInventory();rows.push({p,frame,inventory});}return rows;});
 assert.equal(report.length,7);assert.ok(report.every(x=>x.inventory.roots.length===expectedAssets));assert.ok(report.every(x=>x.frame.drawCalls>0));assert.deepEqual(errors,[]);
 await writeFile(out+'/scene-'+(mobile?'mobile':'desktop')+'.json',JSON.stringify({report,errors},null,2));
}finally{await browser?.close();server.kill();}
