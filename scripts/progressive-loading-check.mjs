import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {expectedAssets,spatialFacility} from '../src/graphics/facilityLayout.js';
const base='http://127.0.0.1:4194',out='artifacts/progressive-loading';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4194','--strictPort'],{stdio:'inherit'});
let browser,release=()=>{};const requests=[],errors=[];
try{
 await mkdir(out,{recursive:true});let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 const specs=spatialFacility('production'),hangar=specs.find(x=>x.id==='hangar'),servers=specs.find(x=>x.id==='servers');assert.ok(servers.lowFile&&servers.lowFile!==servers.file);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
 const gate=new Promise(r=>{release=r;});
 await page.route('**/models/facility/*.glb',async route=>{
  const file=new URL(route.request().url()).pathname.split('/').pop();requests.push(file);
  if([hangar.file,hangar.lowFile].includes(file))return route.continue();
  await gate;if(file===servers.lowFile)return route.abort('failed');return route.continue();
 });
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#stage[data-renderer="three"][data-assets="1"]',{timeout:120000});
 const stage=page.locator('#stage');const start=await stage.getAttribute('data-pose');
 await page.keyboard.press('End');await page.waitForFunction(()=>Math.abs(Number(document.querySelector('#stage')?.dataset.progress)-1)<.002,null,{timeout:90000});
 assert.notEqual(await stage.getAttribute('data-pose'),start);assert.equal(await stage.getAttribute('data-assets'),'1');
 await page.keyboard.press('Home');await page.waitForFunction(()=>Number(document.querySelector('#stage')?.dataset.progress)<.002&&scrollY<=1,null,{timeout:90000});
 assert.equal(await stage.getAttribute('data-assets'),'1');
 release();await page.waitForFunction(n=>Number(document.querySelector('#stage')?.dataset.assets)===n,expectedAssets,{timeout:120000});
 const data=await stage.evaluate(e=>({...e.dataset}));
 assert.ok(requests.includes(servers.lowFile)&&requests.includes(servers.file));assert.ok(data.lodFallbacks.split(',').includes('servers'));assert.equal(data.failures,'');assert.ok(Number(data.allAssetsMs)>=Number(data.firstFrameMs));assert.deepEqual(errors,[]);
 await writeFile(out+'/report.json',JSON.stringify({requests,data,errors,note:'Native keyboard scroll before secondary loading; deliberately failed low-detail model request; SwiftShader, not physical device.'},null,2));
 await page.screenshot({path:out+'/recovered.png',timeout:120000,animations:'disabled'});
}finally{release();await browser?.close();server.kill();}
