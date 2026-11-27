import {chromium} from 'playwright';import {spawn} from 'node:child_process';import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {glyphPhase,glyphHolds} from '../src/graphics/glyphChoreography.js';import {windows} from '../src/graphics/facilityCamera.js';
const base='http://127.0.0.1:4242',out='artifacts/glyphs';await mkdir(out,{recursive:true});const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4242','--strictPort'],{stdio:'inherit'});let browser;
try{let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});const width=Number(process.env.TYPE_WIDTH??390),page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE.WebGLProgram|shader error/i.test(m.text()))errors.push(m.text());});
 const rows=[],controls=new Map();const positions=glyphHolds.flatMap((h,i)=>[windows[i]+(h-windows[i])*.40,h,...(i<6?[h+(windows[i+1]-h)*.75]:[])]);positions.push(.205,.055,0,1);
 for(const variant of ['cpu','gpu']){
 await page.goto(base+'/?startup=complete&diagnostics=1&benchmark=1&mobile-guide=diagnostic&mobile-type=diagnostic'+'&living-type=kinetic&type-backend='+variant,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});assert.equal(await page.locator('#stage').getAttribute('data-flow-type-prepared'),'7');
 const repeat=new Map();
 for(const [i,p] of positions.entries()){
 const data=await page.evaluate(p=>{const s=document.querySelector('#stage');const metrics=s.benchmarkFrame(p),d=s.dataset;return {p,pose:JSON.parse(d.pose),mask:Number(d.wallCutMask),ready:d.narrativeReady==='true',variant:d.typeBackend,caption:d.guidedCaption,roles:s.inspectKineticFrame(),html:[...document.querySelectorAll('main .copy')].map(x=>Number(getComputedStyle(x).opacity)),brand:Number(getComputedStyle(document.querySelector('.brand')).opacity),metrics};},p);
 rows.push({variant,...data});await writeFile(out+'/report.json',JSON.stringify({width,rows,note:'CPU-deformed real 3D glyph geometry, sampled visual proxy; not phone FPS or physical collision.'},null,2));await page.screenshot({path:out+'/'+variant+'-'+i+'-'+p+'.png',timeout:120000});
 assert.equal(data.variant,variant);assert.equal(data.caption,'false');assert.ok(data.html.every(x=>x===0));assert.equal(data.brand,0);
 if(variant==='cpu')controls.set(p,data.pose);else assert.deepEqual(data.pose,controls.get(p));if(data.mask>=.98){assert.equal(data.roles.length,0);continue;}
 const meshes=data.roles.filter(x=>x.role==='headline'||x.role==='body');const bridging=p>=.205+(.31-.205)*.42&&p<=.31+(.405-.31)*.82;assert.equal(meshes.length,bridging?1:2);assert.ok(meshes.every(x=>x.opacity===1&&x.glyphCount>1&&x.glyphs.length===x.glyphCount&&x.material==='MeshStandardMaterial'&&x.backend===variant&&x.font==='Space Grotesk'&&x.weight===(x.role==='headline'?600:400)));if(variant==='gpu')assert.ok(meshes.every(m=>m.paletteBytes===m.glyphCount*64));
 if(glyphHolds.includes(p))assert.ok(meshes.every(m=>m.architecture?.depth>=.72),JSON.stringify({p,roles:meshes.map(m=>({role:m.role,audit:m.anchorAudit}))}));
 if(glyphHolds.includes(p)){for(const m of meshes){assert.ok(m.inside&&m.visibilityEstimate>=.75,JSON.stringify({p,role:m.role,inside:m.inside,visibility:m.visibilityEstimate}));assert.ok(m.glyphs.every(g=>[...g.translation,...g.rotation].every(x=>x===0)));}}
 else if(glyphPhase(p).kind!=='hold'&&!bridging)assert.ok(meshes.some(m=>m.glyphs.some(g=>g.translation.some(x=>Math.abs(x)>1e-5))));
 const states=meshes.map(m=>({glyphs:m.glyphs,anchor:m.architecture}));if(repeat.has(p))assert.deepEqual(states,repeat.get(p));else repeat.set(p,states);
 }
 }assert.deepEqual(errors,[]);
}finally{await browser?.close();server.kill();}
