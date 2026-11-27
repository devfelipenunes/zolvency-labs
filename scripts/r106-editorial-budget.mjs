import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4251',out='artifacts/editorial-budget';await mkdir(out,{recursive:true});const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4251','--strictPort'],{stdio:'inherit'});let browser;
try{let up=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){up=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(up);browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const reports=[];
for(const width of [320,390,768,1280,1440])for(const entry of ['hero','research']){
 const ctx=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:width<720,hasTouch:width<720,reducedMotion:'no-preference'});const page=await ctx.newPage(),graphics=[],errors=[];
 page.on('request',r=>{if(/threeScene[^/]*\.js|\/models\//i.test(r.url()))graphics.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__editorialMetrics={lcpMs:null,cls:0};for(const type of ['largest-contentful-paint','layout-shift']){try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(type==='largest-contentful-paint')window.__editorialMetrics.lcpMs=e.startTime;else if(!e.hadRecentInput)window.__editorialMetrics.cls+=e.value;}).observe({type,buffered:true});}catch{}}});
 await page.goto(base+'/?hybrid=1'+(entry==='research'?'#research':''),{waitUntil:'load'});
 if(entry==='research')await page.waitForFunction(()=>Math.abs(document.getElementById('research').getBoundingClientRect().top)<4);else await page.getByRole('heading',{level:1}).waitFor();
 await page.waitForTimeout(800);
 const result=await page.evaluate(()=>{const resources=performance.getEntriesByType('resource'),js=resources.filter(r=>/\.js(?:\?|$)/.test(r.name));return {...window.__editorialMetrics,scriptEncodedBytes:js.reduce((n,r)=>n+r.encodedBodySize,0),scriptTransferBytes:js.reduce((n,r)=>n+r.transferSize,0),resources:resources.length,stageMounted:!!document.getElementById('stage'),overflow:document.documentElement.scrollWidth>innerWidth+1,scrollY};});
 reports.push({width,entry,...result,graphicsRequests:graphics.length,errors});assert.equal(result.stageMounted,false);assert.equal(graphics.length,0);assert.equal(result.overflow,false);assert.deepEqual(errors,[]);await ctx.close();
}
await writeFile(out+'/report.json',JSON.stringify({reports,targets:{scriptEncodedBytes:153600,lcpMs:2500,cls:.1},limitation:'Local cold Chromium samples, unthrottled; encoded sizes reflect local Vite server compression, not Vercel transfer sizes. CLS is simple accumulated lab shifts, not session-window field CLS. LCP may be null at deep links. INP and physical FPS not measured; targets informational.'},null,2));
}finally{await browser?.close();server.kill();}
