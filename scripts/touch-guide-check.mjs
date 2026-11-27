import {chromium} from 'playwright';import {spawn} from 'node:child_process';import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
import {windows} from '../src/graphics/facilityCamera.js';
const base='http://127.0.0.1:4235',out=process.env.TOUCH_OUT??'artifacts/touch-guide';await mkdir(out,{recursive:true});const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4235','--strictPort'],{stdio:'inherit'});let browser;
try{let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+(process.env.TOUCH_QUERY??'/'),{waitUntil:'domcontentloaded'});await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
 const state=()=>page.locator('#stage').evaluate(e=>({...e.dataset}));const rows=[];const client=await page.context().newCDPSession(page);
 const emit=async(type,y)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x:195,y,id:1}]});
 // Genuine browser-dispatched touch sequence from origin, not keyboard End
 // and not dispatchEvent-only synthetic input. Verify actual native movement.
 await emit('touchStart',730);for(const y of [650,560,470,380,290,180,100]){await emit('touchMove',y);await new Promise(r=>setTimeout(r,45));}await emit('touchEnd',100);
 await page.waitForFunction(()=>scrollY>100,null,{timeout:15000});
 await page.waitForFunction(()=>Number(document.querySelector('#stage').dataset.progress)>.01,null,{timeout:120000});
 rows.push({phase:'first-native-swipe',scroll:await page.evaluate(()=>scrollY),data:await state()});await writeFile(out+'/partial.json',JSON.stringify(rows,null,2));
 // Native scroll targets must continue to be honored after the touch sequence.
 async function go(p){const y=await page.evaluate(({p,windows})=>{const i=Math.max(0,windows.findLastIndex((v,j)=>j<7&&p>=v)),a=[...document.querySelectorAll('main section')].map((s,j)=>j?s.getBoundingClientRect().top+scrollY:0),max=document.documentElement.scrollHeight-innerHeight;return Math.round(a[i]+((a[i+1]??max)-a[i])*(p-windows[i])/(windows[i+1]-windows[i]));},{p,windows});await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await page.waitForFunction(p=>{const d=document.querySelector('#stage').dataset;return Math.abs(Number(d.progress)-p)<.003&&Math.abs(Number(d.targetProgress)-p)<.003&&d.motionPending!=='true';},p,{timeout:240000});rows.push({phase:'native-target',p,data:await state()});await writeFile(out+'/partial.json',JSON.stringify(rows,null,2));}
 for(const p of [.205,.405,.625,.73,.935,.992,.405,.055])await go(p);
 await page.keyboard.press('Home');await page.waitForFunction(()=>scrollY<=1&&Number(document.querySelector('#stage').dataset.progress)<.002,null,{timeout:120000});assert.deepEqual(errors,[]);
 await writeFile(out+'/report.json',JSON.stringify({rows,errors,note:'Real Chromium-dispatched touch + native scroll progression through all seven scenes, forward and reverse; not physical iOS validation.'},null,2));
}finally{await browser?.close();server.kill();}
