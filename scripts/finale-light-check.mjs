import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {getPacing} from '../src/graphics/cameraPacing.js';
import {windows} from '../src/graphics/facilityCamera.js';
const mobile=process.env.LIGHT_VIEW==='mobile',viewport=mobile?{width:390,height:844}:{width:1280,height:720},pacing=getPacing(mobile),base='http://127.0.0.1:4197',out='artifacts/finale-light';
const holds=[.055,.405,.73,.935,.985,.992,1];
await mkdir(out,{recursive:true});const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4197','--strictPort'],{stdio:'inherit'});
let browser;const rows=[];
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const variant of ['control','surface']){
  const page=await browser.newPage({viewport,deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base+'/?experience=editorial&profile=economy&direction=staged&lighting=local&travel=responsive&framing=portrait&transmission=threequarter&preflight='+(mobile?'full':'compact')+'&finale-light='+variant,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
   await page.waitForFunction(()=>!!document.querySelector('.chapter').style.getPropertyValue('--pace-height'));
   assert.equal(await page.locator('#stage').getAttribute('data-finale-light'),variant);
   const geometry=await page.evaluate(()=>({starts:[...document.querySelectorAll('main section')].map((s,i)=>i?s.getBoundingClientRect().top+scrollY:0),max:document.documentElement.scrollHeight-innerHeight}));
   for(const p of holds){const i=Math.max(0,windows.findLastIndex((v,j)=>j<7&&p>=v)),a=geometry.starts[i],b=geometry.starts[i+1]??geometry.max;
    await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),a+(b-a)*pacing.local(i,p));
    await page.waitForFunction(p=>{const s=document.querySelector('#stage').dataset;return Math.abs(Number(s.progress)-p)<.003&&s.motionPending==='false';},p,{timeout:180000});
    const data=await page.locator('#stage').evaluate(s=>({...s.dataset}));
    const screenshot=await page.screenshot({path:out+'/'+variant+'-'+p+'.png',timeout:120000,animations:'disabled'});
    // Whole-image luminance distribution is only a reproducible composition proxy, not subject visibility.
    const luminance=await page.evaluate(async uri=>{const img=new Image();img.src=uri;await img.decode();const c=document.createElement('canvas');c.width=160;c.height=Math.round(160*img.height/img.width);const ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);const data=ctx.getImageData(0,0,c.width,c.height).data,v=[];for(let i=0;i<data.length;i+=4)v.push((.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])/255);v.sort((a,b)=>a-b);const q=p=>v[Math.ceil(p*v.length)-1];return {p10:q(.1),p50:q(.5),p90:q(.9),darkFraction:v.filter(x=>x<.08).length/v.length,brightFraction:v.filter(x=>x>.8).length/v.length};},'data:image/png;base64,'+screenshot.toString('base64'));
    assert.equal(data.overlapPrepared,'true');rows.push({variant,p,luminance,removedOverlap:Number(data.removedOverlap),drawCalls:Number(data.drawCalls),floorFaces:Number(data.floorFaces),floorReason:data.floorReason,pose:JSON.parse(data.pose),exposure:Number(data.exposure)});
    await writeFile(out+'/comparison.json',JSON.stringify({viewport,rows,errors,note:'Software-rendered screenshot proxies; visual review required.'},null,2));
   }assert.deepEqual(errors,[]);
  }finally{await page.close();}
 }
 assert.equal(rows.length,14);assert.ok(rows.filter(r=>r.variant==='surface').every(r=>r.floorFaces>0),'No actual floor surfaces isolated');
 for(const p of holds){const [a,...candidates]=rows.filter(r=>r.p===p);for(const b of candidates){for(const key of ['position','target'])for(let i=0;i<3;i++)assert.ok(Math.abs(a.pose[key][i]-b.pose[key][i])<.02);assert.ok(Math.abs(a.pose.fov-b.pose.fov)<.02);assert.equal(b.removedOverlap,a.removedOverlap,'material partition must not prevent overlap removal');}}

}finally{await browser?.close();server.kill();}
