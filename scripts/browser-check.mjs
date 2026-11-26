import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'inherit'});
const base='http://127.0.0.1:4173';let browser;
try{
 for(let i=0;i<60;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 await mkdir('artifacts',{recursive:true});
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const [label,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
 const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForSelector('#stage[data-pose]');
 const webgl=await page.evaluate(()=>!!document.createElement('canvas').getContext('webgl2'));
 if(webgl)await page.waitForSelector('#stage[data-renderer="three"]',{timeout:20000});
 const mode=await page.locator('#stage').getAttribute('data-renderer');console.log(label,'renderer:',mode,'WebGL2 probe:',webgl);
 const pose=()=>page.locator('#stage').getAttribute('data-pose');
 const scroll=async fraction=>{await page.evaluate(f=>scrollTo(0,Math.round((document.documentElement.scrollHeight-innerHeight)*f)),fraction);await page.waitForTimeout(180);return pose();};
 const start=await scroll(0);await page.screenshot({path:'artifacts/'+label+'-origin.png'});
 const before=await page.locator('#stage').getAttribute('data-geometries');
 const middle=await scroll(.43);await page.screenshot({path:'artifacts/'+label+'-exploration.png'});
 const end=await scroll(1);await page.screenshot({path:'artifacts/'+label+'-connection.png'});
 assert.notEqual(start,middle);assert.notEqual(middle,end);assert.equal(await scroll(.43),middle);assert.equal(await scroll(0),start);
 if(mode==='three')assert.equal(await page.locator('#stage').getAttribute('data-geometries'),before);
 await page.keyboard.press('End');await page.waitForFunction(()=>Number(document.querySelector('#stage')?.dataset.progress)===1);assert.equal(await pose(),end);
 assert.equal(await page.locator('main section').count(),3);assert.match(await page.locator('main').innerText(),/Stellar/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 await page.goto(base+'/?renderer=canvas');await page.waitForSelector('#stage[data-renderer="canvas"][data-pose]');const first=await scroll(0);assert.notEqual(await scroll(1),first);assert.equal(await scroll(0),first);await page.screenshot({path:'artifacts/'+label+'-fallback.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(250);const reduced=await scroll(0);assert.equal(await scroll(1),reduced);assert.match(await page.locator('main').innerText(),/Stellar/);await page.close();
 }
}finally{await browser?.close();server.kill();}
