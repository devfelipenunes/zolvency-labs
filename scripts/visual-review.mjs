import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {windows} from '../src/graphics/facilityCamera.js';
import {expectedAssets} from '../src/graphics/facilityLayout.js';
import {reviewCases,holds,viewports,scrollTargets} from './visual-review-plan.mjs';
const view=process.env.REVIEW_VIEW??'all',group=process.env.REVIEW_GROUP??'all';
const out='artifacts/visual-review',base='http://127.0.0.1:4188';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4188','--strictPort'],{stdio:'inherit'});
let browser;const reports=[],failures=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function save(){await writeFile(out+'/report.json',JSON.stringify({view,group,reports,failures,note:'SwiftShader; diagnostic frames are not real scroll or physical device evidence. Images require visual inspection.'},null,2));}
async function open(page,params,diagnostic){
 await page.goto(base+(diagnostic?'/?diagnostics=1&'+params:params?'/?'+params:'/'));
 await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});
 await page.waitForFunction(n=>Number(document.querySelector('#stage')?.dataset.assets)===n,expectedAssets,{timeout:120000});
}
async function scrollTo(page,p){
 await page.evaluate(({p,windows})=>{const i=Math.max(0,windows.findLastIndex((v,j)=>j<windows.length-1&&p>=v)),sections=[...document.querySelectorAll('main section')],starts=sections.map((s,j)=>j===0?0:s.getBoundingClientRect().top+scrollY),max=document.documentElement.scrollHeight-innerHeight,a=starts[i],b=i===sections.length-1?max:starts[i+1];window.scrollTo(0,Math.round(a+(b-a)*(p-windows[i])/(windows[i+1]-windows[i])));},{p,windows});
 await page.waitForFunction(p=>Math.abs(Number(document.querySelector('#stage')?.dataset.progress)-p)<.005,p,{timeout:90000});
}
async function frame(page,p,diagnostic){
 return page.evaluate(({p,diagnostic})=>{const s=document.querySelector('#stage');const metrics=diagnostic?s.benchmarkFrame(p):null;
 const data={...s.dataset};return {p,actualProgress:Number(data.progress),pose:JSON.parse(data.pose),metrics,subject:diagnostic?s.inspectSubject():null,hits:diagnostic?s.inspectSpatialFrame():null,text:diagnostic?s.inspectKineticFrame():null,ready:data.narrativeReady,renderer:data.renderer,angle:data.stellarAngle,glass:data.glassVariant,effects:data.effects,effectVariant:data.effectVariant,pixelRatio:Number(data.pixelRatio),drawingBuffer:{width:document.querySelector('#three-scene')?.width,height:document.querySelector('#three-scene')?.height},assets:data.facility,assetFailures:data.failures,versionVisible:!!document.querySelector('.build-version')};},{p,diagnostic});
}
async function capture(page,label,mode,p,diagnostic,direction='fixed'){
 const f=await frame(page,p,diagnostic);const file=label+'-'+mode+'-'+direction+'-'+Math.round(p*1000)+'.png';
 await page.screenshot({path:out+'/'+file,timeout:120000,animations:'disabled'});reports.push({label,mode,direction,file,...f});await save();
}
try{
 await mkdir(out,{recursive:true});let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await pause(250);}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const [label,viewport] of Object.entries(viewports).filter(([l])=>view==='all'||l===view)){
  for(const item of reviewCases.filter(c=>(group==='all'||group===c.group)&&(!c.desktopOnly||label==='desktop'))){
   const context=await browser.newContext({viewport,deviceScaleFactor:1,...(item.motion?{recordVideo:{dir:out+'/video',size:viewport}}:{})});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await open(page,item.params,!item.motion);
    if(item.name==='world'){await page.waitForSelector('#stage[data-narrative-ready="true"]',{timeout:120000});const clearance=await page.evaluate(()=>document.querySelector('#stage').inspectServerClearance());await writeFile(out+'/'+label+'-server-clearance.json',JSON.stringify(clearance,null,2));assert.ok(clearance.every(r=>r.distance>.06),'server path clearance '+JSON.stringify(clearance.filter(r=>r.distance<=.06)));}
    if(item.motion){
     assert.equal(await page.locator('.build-version').count(),0);
     for(const [direction,targets] of Object.entries(scrollTargets)){for(const p of targets){await scrollTo(page,p);await capture(page,label,item.name,p,false,direction);}}
    }else{
     for(const p of item.poses)await capture(page,label,item.name,p,true);
    }
    assert.deepEqual(errors,[]);
   }catch(e){failures.push({label,mode:item.name,error:String(e),pageErrors:errors});await save();}
   finally{await context.close();}
  }
 }
 await save();assert.deepEqual(failures,[]);
}finally{await browser?.close();server.kill();}
