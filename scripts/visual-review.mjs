import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {windows} from '../src/graphics/facilityCamera.js';
import {expectedAssets} from '../src/graphics/facilityLayout.js';
import {reviewCases,viewports,scrollTargets} from './visual-review-plan.mjs';
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
async function readScroll(page,p){
 return page.evaluate(({p,windows})=>{
  const root=document.scrollingElement,sections=[...document.querySelectorAll('main section')],max=Math.max(0,root.scrollHeight-innerHeight),y=root.scrollTop;
  const anchors=sections.map((s,j)=>Math.max(0,Math.min(max,j===0?0:s.getBoundingClientRect().top+y)));
  const index=Math.max(0,windows.findLastIndex((v,j)=>j<windows.length-1&&p>=v)),a=anchors[index],b=anchors[index+1]??max;
  const target=Math.round(a+(b-a)*(p-windows[index])/(windows[index+1]-windows[index]));
  const chapter=Math.max(0,anchors.findLastIndex(v=>y>=v)),lo=anchors[chapter],hi=anchors[chapter+1]??max;
  const documentProgress=y<=1?0:y>=max-1?1:windows[chapter]+(windows[chapter+1]-windows[chapter])*Math.max(0,Math.min(1,hi>lo?(y-lo)/(hi-lo):1));
  const stage=document.querySelector('#stage'),data=stage?.dataset??{};
  return {p,y,target,max,anchors,documentProgress,appProgress:Number(data.targetProgress),renderProgress:Number(data.progress),renderer:data.renderer,ready:data.narrativeReady,renderCount:Number(data.renderCount),pixelRatio:Number(data.pixelRatio),visibility:document.visibilityState,viewport:[innerWidth,innerHeight]};
 },{p,windows});
}
async function scrollTo(page,p){
 // Wait for the native document scroll separately from the WebGL rail. Never drive
 // the benchmark API or retry a failed smooth scroll as an instant one.
 const before=await readScroll(page,p);
 await page.evaluate(y=>window.scrollTo({top:y,behavior:'smooth'}),before.target);
 try{
  await page.waitForFunction(y=>Math.abs(document.scrollingElement.scrollTop-y)<=2,before.target,{timeout:90000,polling:100});
  const settled=await readScroll(page,p);
  assert.ok(Math.abs(settled.documentProgress-p)<.003,'document geometry mismatch '+JSON.stringify(settled));
  await page.waitForFunction(expected=>{
   const stage=document.querySelector('#stage');return stage?.dataset.renderer==='three'&&Math.abs(Number(stage.dataset.progress)-expected)<.002&&Math.abs(Number(stage.dataset.targetProgress)-expected)<.002;
  },settled.documentProgress,{timeout:90000,polling:100});
  return {before,settled,after:await readScroll(page,p)};
 }catch(e){
  const after=await readScroll(page,p);throw Error('native scroll or renderer did not settle: '+JSON.stringify({before,after,cause:String(e)}));
 }
}
async function frame(page,p,diagnostic){
 return page.evaluate(({p,diagnostic})=>{const s=document.querySelector('#stage');const metrics=diagnostic?s.benchmarkFrame(p):null;
 const data={...s.dataset};return {p,actualProgress:Number(data.progress),scrollY:window.scrollY,viewport:{width:innerWidth,height:innerHeight},pose:JSON.parse(data.pose),metrics,subject:diagnostic?s.inspectSubject():null,hits:diagnostic?s.inspectSpatialFrame():null,text:diagnostic?s.inspectKineticFrame():null,ready:data.narrativeReady,renderer:data.renderer,angle:data.stellarAngle,glass:data.glassVariant,effects:data.effects,effectVariant:data.effectVariant,composition:data.composition,floorVariant:data.floorVariant,floorFaces:Number(data.floorFaces),floorArea:Number(data.floorArea),floorReason:data.floorReason,lightVariant:data.lightVariant,pixelRatio:Number(data.pixelRatio),drawingBuffer:{width:document.querySelector('#three-scene')?.width,height:document.querySelector('#three-scene')?.height},assets:data.facility,assetFailures:data.failures,versionVisible:!!document.querySelector('.build-version')};},{p,diagnostic});
}
async function capture(page,label,mode,p,diagnostic,direction='fixed'){
 const f=await frame(page,p,diagnostic);const file=label+'-'+mode+'-'+direction+'-'+Math.round(p*1000)+'.png';
 await page.screenshot({path:out+'/'+file,timeout:120000,animations:'disabled'});reports.push({label,mode,direction,file,...f});await save();
}
try{
 await mkdir(out,{recursive:true});let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await pause(250);}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const [label,viewport] of Object.entries(viewports).filter(([l])=>view==='all'||l===view)){
  for(const item of reviewCases.filter(c=>(group==='all'||group===c.group)&&(!c.desktopOnly||label==='desktop')&&(!c.mobileOnly||label==='mobile'))){
   const context=await browser.newContext({viewport,deviceScaleFactor:1,...(item.motion?{recordVideo:{dir:out+'/video',size:viewport}}:{})});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|THREE.WebGLProgram/i.test(m.text()))errors.push(m.text());});
   try{
    await open(page,item.params,!item.motion);
    if(item.group==='narrative'||item.motion)await page.waitForSelector('#stage[data-narrative-ready="true"]',{timeout:120000});
    if(item.name==='world'){await page.waitForSelector('#stage[data-narrative-ready="true"]',{timeout:120000});const clearance=await page.evaluate(()=>document.querySelector('#stage').inspectServerClearance());await writeFile(out+'/'+label+'-server-clearance.json',JSON.stringify(clearance,null,2));assert.ok(clearance.every(r=>r.distance>.06),'server path clearance '+JSON.stringify(clearance.filter(r=>r.distance<=.06)));}
    if(item.motion){
     assert.equal(await page.locator('.build-version').count(),0);
     for(const [direction,targets] of Object.entries(scrollTargets)){for(const p of targets){const scroll=await scrollTo(page,p);await capture(page,label,item.name,p,false,direction);reports.at(-1).scroll=scroll;await save();}}
    }else{
     for(const p of item.poses){await capture(page,label,item.name,p,true);if(item.name==='floor-geometry-matte')assert.ok(reports.at(-1).floorFaces>0&&reports.at(-1).floorArea>0,'actual floor faces required '+JSON.stringify(reports.at(-1)));if(item.group==='effects'){const samples=await page.evaluate(async p=>{const s=document.querySelector('#stage'),next=()=>new Promise(r=>requestAnimationFrame(r));await next();s.benchmarkFrame(p);let previous=await next();const rows=[];for(let i=0;i<5;i++){const now=await next();rows.push({...s.benchmarkFrame(p),rafMs:now-previous});previous=now;}return rows;},p);reports.at(-1).effectSamples=samples;await save();}}
    }
    assert.deepEqual(errors,[]);
   }catch(e){failures.push({label,mode:item.name,error:String(e),pageErrors:errors});await save();}
   finally{await context.close();}
  }
 }
 await save();assert.deepEqual(failures,[]);
}finally{await browser?.close();server.kill();}
