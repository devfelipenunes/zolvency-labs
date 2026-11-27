import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4196',out='artifacts/typography-audition';await mkdir(out,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4196','--strictPort'],{stdio:'inherit'});let browser;const reports=[];
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base+'/scripts/typography-audition.html')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const mode of ['html','sdf','msdf'])for(const ratio of [.6,1,1.5])for(const size of [14,20,32]){
  const page=await browser.newPage({viewport:{width:960,height:240},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  console.log('audition',mode,ratio,size);await page.goto(base+'/scripts/typography-audition.html?mode='+mode+'&ratio='+ratio+'&size='+size);await page.waitForSelector('body[data-ready="true"]',{state:'attached',timeout:60000});
  const audit=await page.evaluate(()=>window.audit);assert.ok(audit.dom||audit.triangles>0);assert.deepEqual(errors,[]);
  await page.screenshot({path:out+'/'+mode+'-'+ratio+'-'+size+'.png',timeout:120000});reports.push(audit);await writeFile(out+'/report.json',JSON.stringify(reports,null,2));await page.close();
 }
}finally{await browser?.close();server.kill();}
