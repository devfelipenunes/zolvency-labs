import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir,writeFile } from 'node:fs/promises';
import { storyProgress } from '../src/graphics/camera.js';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'inherit'});
const base='http://127.0.0.1:4173';let browser;const evidence=[];
try{
 for(let i=0;i<80;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 await mkdir('artifacts',{recursive:true});
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const [label,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
 const page=await browser.newPage({viewport});const errors=[],shaderErrors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|THREE.WebGLProgram/i.test(m.text()))shaderErrors.push(m.text());});
 await page.goto(base);await page.waitForSelector('#stage[data-pose]');
 const webgl=await page.evaluate(()=>!!document.createElement('canvas').getContext('webgl2'));
 if(webgl)await page.waitForSelector('#stage[data-renderer="three"]',{timeout:30000});
 const mode=await page.locator('#stage').getAttribute('data-renderer');console.log(label,'renderer:',mode,'WebGL2 probe:',webgl);
 const pose=()=>page.locator('#stage').getAttribute('data-pose');
 const scroll=async fraction=>{
 const state=await page.evaluate(f=>{scrollTo(0,Math.round((document.documentElement.scrollHeight-innerHeight)*f));return {y:scrollY,max:document.documentElement.scrollHeight-innerHeight,anchors:[...document.querySelectorAll('main section')].map(e=>e.offsetTop),reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};},fraction);
 const expected=state.reduced?0:storyProgress(state.y,state.anchors,state.max).progress;
 await page.waitForFunction(p=>Math.abs(Number(document.querySelector('#stage')?.dataset.progress)-p)<1e-8,expected,{timeout:20000});
 return pose();
 };
 const start=await scroll(0);const initialGeo=await page.locator('#stage').getAttribute('data-geometries');
 const readouts=[];const stages=await page.locator('.chapter').evaluateAll(es=>es.map((e,i)=>{const r=e.querySelector('.copy').getBoundingClientRect(),top=e.getBoundingClientRect().top+scrollY;return Math.min(1,Math.max(0,(i===0?0:top+r.top-e.getBoundingClientRect().top-innerHeight*.26)/(document.documentElement.scrollHeight-innerHeight)));}));
 for(let i=0;i<stages.length;i++){await scroll(stages[i]);const name=await page.locator('.chapter').nth(i).getAttribute('data-name');await page.screenshot({path:'artifacts/'+label+'-'+name.toLowerCase()+'.png'});readouts.push(await page.locator('#stage').evaluate(e=>({...e.dataset}))); }
 const middle=await scroll(.43),end=await scroll(1);assert.notEqual(start,middle);assert.notEqual(middle,end);assert.equal(await scroll(.43),middle);assert.equal(await scroll(0),start);
 if(mode==='three'){assert.equal(await page.locator('#stage').getAttribute('data-geometries'),initialGeo);assert.ok(readouts.every(r=>Number(r.drawCalls)<=8));}
 await page.keyboard.press('End');await page.waitForFunction(()=>Number(document.querySelector('#stage')?.dataset.progress)===1);assert.equal(await pose(),end);
 await page.keyboard.press('Home');await page.waitForFunction(()=>Number(document.querySelector('#stage')?.dataset.progress)===0);
 assert.equal(await page.locator('main section').count(),6);assert.match(await page.locator('main').innerText(),/Stellar/);assert.equal(await page.locator('h1').count(),1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Layout reflow at half-size viewport approximates 200% desktop zoom, not physical browser zoom.
 await page.setViewportSize({width:Math.max(320,viewport.width/2),height:Math.max(420,viewport.height/2)});await page.waitForTimeout(400);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize(viewport);await page.waitForTimeout(400);
 let lostContext='not available';
 if(mode==='three'){const lost=await page.evaluate(()=>{const c=document.querySelector('#three-scene');const ext=c?.getContext('webgl2')?.getExtension('WEBGL_lose_context');if(!ext)return false;ext.loseContext();return true;});if(lost){await page.waitForSelector('#stage[data-renderer="canvas"]');lostContext='fallback confirmed';}}
 assert.deepEqual(errors,[]);assert.deepEqual(shaderErrors,[]);
 await page.goto(base+'/?renderer=canvas');await page.waitForSelector('#stage[data-renderer="canvas"][data-pose]');const first=await scroll(0);assert.notEqual(await scroll(1),first);assert.equal(await scroll(0),first);await page.screenshot({path:'artifacts/'+label+'-fallback.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#stage')?.dataset.renderer==='canvas' && Number(document.querySelector('#stage')?.dataset.progress)===0);const reduced=await scroll(0);assert.equal(await scroll(1),reduced);assert.match(await page.locator('main').innerText(),/Stellar/);assert.deepEqual(errors,[]);
 evidence.push({label,viewport,mode,webgl,lostContext,readouts});console.log('evidence',label,JSON.stringify({mode,lostContext,drawCalls:readouts.map(x=>x.drawCalls),triangles:readouts.map(x=>x.triangles)}));await page.close();
 }
 await writeFile('artifacts/metrics.json',JSON.stringify({note:'Software Chromium; submitMs is CPU submission duration, not GPU frame time or FPS.',evidence},null,2));
}finally{await browser?.close();server.kill();}
