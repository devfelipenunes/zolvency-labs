import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {windows} from '../src/graphics/facilityCamera.js';
import {expectedAssets} from '../src/graphics/facilityLayout.js';
const out='artifacts/visual-review',base='http://127.0.0.1:4188',server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4188','--strictPort'],{stdio:'inherit'});
let browser;const reports=[];
try{
 await mkdir(out,{recursive:true});let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const holds=[.055,.205,.405,.625,.73,.935,.992];
 for(const [label,viewport] of [['desktop',{width:1280,height:720}],['mobile',{width:390,height:844}]]){
  for(const [mode,params,poses] of [['legacy','art=legacy&plate=1',holds],['split','glass=split&plate=1',holds],['stellar-diagonal','stellar=diagonal&plate=1',[.405]],['stellar-opposite','stellar=opposite&plate=1',[.405]],['world','glass=split',[.005,.025,.055,.075,.105,.145,.17,.185,.205,.24,.31,.365,.405,.425,.625,.73,.935,.992]]]){
   const page=await browser.newPage({viewport,deviceScaleFactor:1}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{await page.goto(base+'/?diagnostics=1&'+params);
    await page.waitForSelector('#stage[data-renderer="three"]',{timeout:90000});
    await page.waitForFunction(n=>Number(document.querySelector('#stage').dataset.assets)===n,expectedAssets,{timeout:90000});
    if(mode==='world'){await page.waitForSelector('#stage[data-narrative-ready="true"]',{timeout:90000});const clearance=await page.evaluate(()=>document.querySelector('#stage').inspectServerClearance());await writeFile(out+'/'+label+'-server-clearance.json',JSON.stringify(clearance,null,2));assert.ok(clearance.every(r=>r.distance>.06),'server path clearance '+JSON.stringify(clearance.filter(r=>r.distance<=.06)));}
    for(const p of poses){const frame=await page.evaluate(p=>{const s=document.querySelector('#stage');const metrics=s.benchmarkFrame(p);return {p,metrics,pose:JSON.parse(s.dataset.pose),hits:s.inspectSpatialFrame(),subject:s.inspectSubject(),text:s.inspectKineticFrame(),ready:s.dataset.narrativeReady};},p);await page.screenshot({path:out+'/'+label+'-'+mode+'-'+Math.round(p*1000)+'.png',timeout:90000,animations:'disabled'});reports.push({label,mode,...frame});await writeFile(out+'/report.json',JSON.stringify(reports,null,2));}
    if(mode==='world'){assert.equal(await page.locator('.build-version').count(),0);for(const p of holds){await page.evaluate(({p,windows})=>{const i=windows.findLastIndex((v,j)=>j<windows.length-1&&p>=v),sections=[...document.querySelectorAll('main section')],starts=sections.map((s,j)=>j===0?0:s.getBoundingClientRect().top+scrollY),max=document.documentElement.scrollHeight-innerHeight,a=starts[i],b=i===sections.length-1?max:starts[i+1];window.scrollTo(0,Math.round(a+(b-a)*(p-windows[i])/(windows[i+1]-windows[i])));},{p,windows});await page.waitForFunction(p=>Math.abs(Number(document.querySelector('#stage').dataset.progress)-p)<.003,p,{timeout:30000});await page.screenshot({path:out+'/'+label+'-scroll-'+Math.round(p*1000)+'.png',timeout:90000,animations:'disabled'});}}
    assert.deepEqual(errors,[]);
   }finally{await page.close();}
  }
 }
}finally{await browser?.close();server.kill();}
