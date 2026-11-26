import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {getPacing} from '../src/graphics/cameraPacing.js';
import {windows} from '../src/graphics/facilityCamera.js';
const mobile=process.env.LIGHT_VIEW==='mobile',viewport=mobile?{width:390,height:844}:{width:1280,height:720},pacing=getPacing(mobile),base='http://127.0.0.1:4197',out='artifacts/subject-lighting';
const focused=process.env.LIGHT_FOCUS==='ops',variants=focused?['control','local','ops-balanced']:['control','refined','local','floor'],holds=focused?[.705,.73,.744]:[.055,.205,.405,.625,.73,.935,.992];
await mkdir(out,{recursive:true});const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4197','--strictPort'],{stdio:'inherit'});
let browser;const rows=[];
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const variant of variants){
  const page=await browser.newPage({viewport,deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base+'/?experience=editorial&profile=economy&direction=staged&lighting='+variant,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
   await page.waitForFunction(()=>!!document.querySelector('.chapter').style.getPropertyValue('--pace-height'));
   assert.equal(await page.locator('#stage').getAttribute('data-subject-lighting'),variant);
   const geometry=await page.evaluate(()=>({starts:[...document.querySelectorAll('main section')].map((s,i)=>i?s.getBoundingClientRect().top+scrollY:0),max:document.documentElement.scrollHeight-innerHeight}));
   for(const p of holds){const i=Math.max(0,windows.findLastIndex((v,j)=>j<7&&p>=v)),a=geometry.starts[i],b=geometry.starts[i+1]??geometry.max;
    await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),a+(b-a)*pacing.local(i,p));
    await page.waitForFunction(p=>{const s=document.querySelector('#stage').dataset;return Math.abs(Number(s.progress)-p)<.003&&s.motionPending==='false';},p,{timeout:180000});
    const data=await page.locator('#stage').evaluate(s=>({...s.dataset}));
    const screenshot=await page.screenshot({path:out+'/'+variant+'-'+p+'.png',timeout:120000,animations:'disabled'});
    // Whole-image luminance distribution is only a reproducible composition proxy, not subject visibility.
    const luminance=await page.evaluate(async uri=>{const img=new Image();img.src=uri;await img.decode();const c=document.createElement('canvas');c.width=160;c.height=Math.round(160*img.height/img.width);const ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);const data=ctx.getImageData(0,0,c.width,c.height).data,v=[];for(let i=0;i<data.length;i+=4)v.push((.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])/255);v.sort((a,b)=>a-b);const q=p=>v[Math.ceil(p*v.length)-1];return {p10:q(.1),p50:q(.5),p90:q(.9),darkFraction:v.filter(x=>x<.08).length/v.length,brightFraction:v.filter(x=>x>.8).length/v.length};},'data:image/png;base64,'+screenshot.toString('base64'));
    const roi=focused&&mobile&&p===.73?await page.evaluate(async uri=>{const img=new Image();img.src=uri;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const sample=([x0,y0,x1,y1])=>{const x=Math.round(x0*c.width),y=Math.round(y0*c.height),w=Math.round(x1*c.width)-x,h=Math.round(y1*c.height)-y,d=ctx.getImageData(x,y,w,h).data,v=[];for(let i=0;i<d.length;i+=4)v.push((.2126*d[i]+.7152*d[i+1]+.0722*d[i+2])/255);v.sort((a,b)=>a-b);return {p50:v[Math.floor(v.length/2)],p90:v[Math.ceil(v.length*.9)-1]};};return {screen:sample([.62,.42,.84,.56]),wall:sample([.13,.40,.38,.54])};},'data:image/png;base64,'+screenshot.toString('base64')):null;
    assert.equal(data.overlapPrepared,'true');rows.push({variant,p,luminance,roi,removedOverlap:Number(data.removedOverlap),drawCalls:Number(data.drawCalls),floorFaces:Number(data.floorFaces),floorReason:data.floorReason,pose:JSON.parse(data.pose),exposure:Number(data.exposure)});
    await writeFile(out+'/comparison.json',JSON.stringify({viewport,rows,errors,note:'Software-rendered screenshot proxies; visual review required.'},null,2));
   }assert.deepEqual(errors,[]);
  }finally{await page.close();}
 }
 assert.equal(rows.length,variants.length*holds.length);
 for(const p of holds){const [a,...candidates]=rows.filter(r=>r.p===p);for(const b of candidates){for(const key of ['position','target'])for(let i=0;i<3;i++)assert.ok(Math.abs(a.pose[key][i]-b.pose[key][i])<.02);assert.ok(Math.abs(a.pose.fov-b.pose.fov)<.02);assert.equal(b.removedOverlap,a.removedOverlap,'material partition must not prevent overlap removal');}}
 if(!focused)for(const variant of ['refined','floor'])assert.ok(rows.some(r=>r.variant===variant&&r.floorFaces>0),'No hangar floor isolated: '+variant);
}finally{await browser?.close();server.kill();}
