import {readFile,mkdir,copyFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const source='artifacts/floor-bake',out='artifacts/floor-review',dest='public/models/asset-study/floor-bake',base='http://127.0.0.1:4192';
await mkdir(out,{recursive:true});await mkdir(dest,{recursive:true});
for(const file of ['uv-mapping.json','uv-audit.json','report.json','floor-indirect.exr'])await copyFile(source+'/'+file,dest+'/'+file);
const audits=JSON.parse(await readFile(source+'/uv-audit.json','utf8')),a=audits.find(x=>x.resolution===2048);
assert.ok(a&&a.overlapTexels===0&&a.islandPairsWithinExpandedPadding===0&&a.coverage>=.2&&a.subpixelTriangles<=.05*a.validTriangles,JSON.stringify(a));
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4192','--strictPort'],{stdio:'inherit'});
let browser;
try{
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/scripts/asset-study.html')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const reports=[];
 for(const viewport of [{width:1280,height:720},{width:390,height:844}]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|THREE.WebGLProgram/i.test(m.text()))errors.push(m.text());});
  await page.goto(base+'/scripts/asset-study.html?file=hangar.glb');await page.waitForSelector('body[data-ready="true"]',{timeout:120000});
  const label=viewport.width+'x'+viewport.height;
  for(const angle of [0,90]){await page.evaluate(v=>window.renderAngle(v,true),angle);await page.screenshot({path:out+'/'+label+'-baseline-'+angle+'.png'});}
  const proof=await page.evaluate(()=>window.applyFloorBake());
  for(const intensity of [0,.5,1])for(const angle of [0,90]){
   await page.evaluate(({intensity,angle})=>{window.setFloorLightmapIntensity(intensity);window.renderAngle(angle,true);},{intensity,angle});
   await page.screenshot({path:out+'/'+label+'-bake-'+intensity+'-'+angle+'.png'});
  }
  assert.deepEqual(errors,[]);reports.push({viewport,...proof});await writeFile(out+'/report.json',JSON.stringify(reports,null,2));await page.close();
 }
}finally{await browser?.close();server.kill();}
