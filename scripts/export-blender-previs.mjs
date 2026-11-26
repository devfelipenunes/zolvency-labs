import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='artifacts/blender-input',base='http://127.0.0.1:4227';
await mkdir(out,{recursive:true});
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4227','--strictPort'],{stdio:'inherit'});let browser;
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?experience=editorial&direction=staged&profile=economy&lighting=local&transmission=threequarter&copy=manifesto&diagnostics=1&benchmark=1&warmup=targeted&previs=blender',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
 for(const [name,p] of [['stellar',.405],['office',.73],['quantum',.935]]){
  const data=await page.evaluate(p=>{const s=document.querySelector('#stage');s.benchmarkFrame(p);return s.exportBlenderPrevis();},p);
  assert.ok(data.meshes.length&&data.hits.length&&data.camera.position.every(Number.isFinite));
  await writeFile(out+'/'+name+'.json',JSON.stringify(data));
  await page.screenshot({path:out+'/'+name+'-web-reference.png',timeout:120000});
  console.log(name,data.interior,data.meshes.length,data.hits.length);
 }
 assert.deepEqual(errors,[]);
}finally{await browser?.close();server.kill();}
