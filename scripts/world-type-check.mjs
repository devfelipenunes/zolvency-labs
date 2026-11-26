import {chromium} from 'playwright';import {spawn} from 'node:child_process';import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const out='artifacts/world-type',base='http://127.0.0.1:4240',view=process.env.TYPE_VIEW??'desktop',mode=process.env.TYPE_MATERIAL??'flat',mobile=view==='mobile';
await mkdir(out,{recursive:true});const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4240','--strictPort'],{stdio:'inherit'});let browser;
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:720},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?experience=editorial&direction=staged&copy=manifesto&profile=economy&lighting=local&transmission=threequarter&framing=portrait&diagnostics=1&benchmark=1&warmup=targeted&world-type='+mode,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
 const inventory=await page.locator('#stage').evaluate(s=>JSON.parse(s.dataset.worldTypeInventory??'[]'));assert.equal(inventory.length,7);
 const holds=[.055,.205,.405,.625,.73,.935,.992],rows=[];
 for(const [i,p] of holds.entries()){
   const r=await page.evaluate(p=>{const s=document.querySelector('#stage');const costs=s.benchmarkFrame(p);return {p,active:s.dataset.worldTypeActive,chapter:s.dataset.worldTypeChapter,reason:s.dataset.worldTypeReason,costs,copyOpacity:getComputedStyle(document.querySelector('.chapter .copy')).opacity};},p);
   assert.equal(r.chapter,inventory[i].name);if(mobile)assert.equal(r.active,'false');
   await page.screenshot({path:out+'/'+i+'-'+r.chapter+'.png',timeout:120000});rows.push(r);
 }
 await writeFile(out+'/report.json',JSON.stringify({mode,view,inventory,rows,errors,note:'Diagnostic fixed holds; native scroll, physical GPU, full visual review and portrait spatial anchors remain release gates.'},null,2));assert.deepEqual(errors,[]);
}finally{await browser?.close();server.kill();}
