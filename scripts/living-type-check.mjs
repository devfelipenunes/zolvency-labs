import {chromium} from 'playwright';import {spawn} from 'node:child_process';import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {livingCopy} from '../src/graphics/livingCopy.js';import {windows} from '../src/graphics/facilityCamera.js';
const base='http://127.0.0.1:4241',out='artifacts/living-type';await mkdir(out,{recursive:true});const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4241','--strictPort'],{stdio:'inherit'});let browser;
try{let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});const width=Number(process.env.TYPE_WIDTH??390),viewport={width,height:844};const page=await browser.newPage({viewport,deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));const rows=[];const holds=[.055,.205,.405,.625,.73,.935,.992];
const positions=[...holds,...windows.slice(1,-1).map((p,i)=>p+(windows[i+2]-p)*.10),.205,.055];
const controls=new Map();
for(const variant of ['control','candidate']){
 await page.goto(base+'/?startup=complete&diagnostics=1&benchmark=1&mobile-guide=diagnostic&mobile-type=diagnostic'+(variant==='candidate'?'&living-type=1':''),{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
 assert.equal(await page.locator('#stage').getAttribute('data-flow-type-prepared'),'7');
 if(variant==='candidate'){const content=await page.locator('main').innerText();assert.ok(!/stellar/i.test(content));assert.deepEqual(await page.locator('main :is(h1,h2)').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label'))),livingCopy.map(x=>x.title));}
 const repeats=new Map();
 for(const [i,p] of positions.entries()){
  const data=await page.evaluate(p=>{const s=document.querySelector('#stage');const metrics=s.benchmarkFrame(p),d=s.dataset;return {p,pose:JSON.parse(d.pose),mask:Number(d.wallCutMask),alpha:Number(d.narrativeAlpha),ready:d.narrativeReady==='true',variant:d.livingType,caption:d.guidedCaption==='true',roles:s.inspectKineticFrame(),html:[...document.querySelectorAll('main .copy')].map(x=>Number(getComputedStyle(x).opacity)),brand:Number(getComputedStyle(document.querySelector('.brand')).opacity),stats:JSON.parse(d.narrativeStats),metrics};},p);rows.push({variant,...data});await writeFile(out+'/report.json',JSON.stringify({width,rows,note:'SwiftShader diagnostic rendering; physical phone performance and aesthetic review not inferred.'},null,2));await page.screenshot({path:out+'/'+variant+'-'+i+'-'+p+'.png',timeout:120000});
  assert.equal(data.variant,variant);assert.equal(data.caption,false);assert.ok(data.html.every(x=>x===0));assert.equal(data.brand,0);assert.equal(data.stats.builds,7);
  if(variant==='control')controls.set(p,data.pose);else assert.deepEqual(data.pose,controls.get(p),'camera changed');
  if(data.mask>=.98)assert.equal(data.roles.length,0);
  if(holds.includes(p)){assert.equal(data.ready,true);const title=data.roles.filter(x=>x.role==='headline'),body=data.roles.filter(x=>x.role==='body');assert.ok(title.length&&body.length===1);for(const mesh of [...title,...body]){assert.ok(mesh.triangles>0&&mesh.inside&&mesh.visibilityEstimate>=.75,JSON.stringify({p,mesh}));if(variant==='candidate'){assert.ok(mesh.offset.every(x=>Math.abs(x)<1e-7));assert.ok(Math.abs(mesh.rotation)<1e-7);}}}
  if(variant==='candidate'){const transform=data.roles.map(x=>({word:x.word,role:x.role,offset:x.offset,rotation:x.rotation}));if(repeats.has(p))assert.deepEqual(transform,repeats.get(p));else repeats.set(p,transform);}
 }
}
assert.deepEqual(errors,[]);}finally{await browser?.close();server.kill();}
