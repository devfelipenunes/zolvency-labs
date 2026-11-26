import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {stageAssets} from './facility-assets.mjs';
const interiors=JSON.parse(await readFile('assets/interior-lock.json','utf8'));
const external=JSON.parse(await readFile('assets/external-lock.json','utf8')).assets;
const rack=external.find(x=>x.name==='server-rack');
const assets=[...interiors.filter(x=>['bridge','control-room'].includes(x.name)).flatMap(x=>x.files),{file:'server-rack.glb',url:rack.url,sha256:rack.sha256,bytes:rack.bytes}];
await stageAssets(assets,{dir:'public/models/asset-study'});
const out='artifacts/asset-study',base='http://127.0.0.1:4191';
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4191','--strictPort'],{stdio:'inherit'});
let browser;const reports=[];
try{
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/scripts/asset-study.html')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const asset of assets){const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/scripts/asset-study.html?file='+asset.file);await page.waitForSelector('body[data-ready="true"]',{timeout:120000});
  const audit=await page.evaluate(()=>window.audit);assert.ok(audit.triangles>0);assert.ok(audit.size.every(x=>Number.isFinite(x)&&x>0));
  for(const [angle,inside] of [[40,false],[180,false],[0,true],[90,true]].filter(([,inside])=>!inside||asset.file!=='server-rack.glb')){
   await page.evaluate(({angle,inside})=>window.renderAngle(angle,inside),{angle,inside});await page.screenshot({path:out+'/'+asset.file+'-'+angle+'-'+inside+'.png'});
  }
  assert.deepEqual(errors,[]);reports.push({...audit,sha256:asset.sha256,source:asset.url,bytes:asset.bytes});
  await writeFile(out+'/report.json',JSON.stringify(reports,null,2));await page.close();
 }
}finally{await browser?.close();server.kill();}
