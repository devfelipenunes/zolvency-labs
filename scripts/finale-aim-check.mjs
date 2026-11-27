import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {getPacing} from '../src/graphics/cameraPacing.js';
import {windows,ramp} from '../src/graphics/facilityCamera.js';
const mobile=process.env.LIGHT_VIEW==='mobile',viewport=mobile?{width:390,height:844}:{width:1280,height:720},pacing=getPacing(mobile,'manifesto'),base='http://127.0.0.1:4197',out='artifacts/finale-aim';
const holds=[.965,.978,.985,.992,1],reverse=[.992,.985,.978,.965],trials=[...holds.map(p=>({p,direction:'forward'})),...reverse.map(p=>({p,direction:'reverse'}))];
await mkdir(out,{recursive:true});const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4197','--strictPort'],{stdio:'inherit'});
let browser;const rows=[];
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 for(const variant of ['control','raised25','raised50']){
  const page=await browser.newPage({viewport,deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base+'/?experience=editorial&profile=economy&direction=staged&copy=manifesto&lighting=local&travel=responsive&framing=portrait&transmission=threequarter&preflight='+(mobile?'full':'compact')+'&finale-light=surface&finale-frame='+variant,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#stage[data-renderer="three"]',{timeout:120000});await page.waitForSelector('.experience-loader',{state:'detached',timeout:120000});
   await page.waitForFunction(()=>!!document.querySelector('.chapter').style.getPropertyValue('--pace-height'));
   assert.equal(await page.locator('#stage').getAttribute('data-finale-frame'),variant);
   const geometry=await page.evaluate(()=>({starts:[...document.querySelectorAll('main section')].map((s,i)=>i?s.getBoundingClientRect().top+scrollY:0),max:document.documentElement.scrollHeight-innerHeight}));
   for(const {p,direction} of trials){const i=Math.max(0,windows.findLastIndex((v,j)=>j<7&&p>=v)),a=geometry.starts[i],b=geometry.starts[i+1]??geometry.max;
    await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),a+(b-a)*pacing.local(i,p));
    await page.waitForFunction(p=>{const s=document.querySelector('#stage').dataset;return Math.abs(Number(s.progress)-p)<.003&&s.motionPending==='false';},p,{timeout:180000});
    const data=await page.locator('#stage').evaluate(s=>({...s.dataset}));
    const screenshot=await page.screenshot({path:out+'/'+variant+'-'+direction+'-'+p+'.png',timeout:120000,animations:'disabled'});
    // Whole-image luminance distribution is only a reproducible composition proxy, not subject visibility.
    const luminance=await page.evaluate(async uri=>{const img=new Image();img.src=uri;await img.decode();const c=document.createElement('canvas');c.width=160;c.height=Math.round(160*img.height/img.width);const ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);const data=ctx.getImageData(0,0,c.width,c.height).data,v=[];for(let i=0;i<data.length;i+=4)v.push((.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])/255);v.sort((a,b)=>a-b);const q=p=>v[Math.ceil(p*v.length)-1];return {p10:q(.1),p50:q(.5),p90:q(.9),darkFraction:v.filter(x=>x<.08).length/v.length,brightFraction:v.filter(x=>x>.8).length/v.length};},'data:image/png;base64,'+screenshot.toString('base64'));
    // Native-pixel green ink proxy within the reviewed final wordmark region. Not glyph segmentation or contrast certification.
    const brandInk=p>=.992?await page.evaluate(async uri=>{const image=new Image();image.src=uri;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const {width:w,height:h}=c;const pixels=ctx.getImageData(0,0,w,h).data,lo=Math.floor(.15*h),hi=Math.floor(.48*h),left=Math.floor(.04*w),right=Math.floor(.94*w),counts=new Uint32Array(h);const ink=(x,y)=>{const i=(y*w+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];return g>100&&g-r>22&&g-b>10&&r>45;};for(let y=lo;y<hi;y++)for(let x=left;x<right;x++)if(ink(x,y))counts[y]++;let peak=lo;for(let y=lo+1;y<hi;y++)if(counts[y]>counts[peak])peak=y;if(!counts[peak])return {span:0,ink:0,band:0};let a=peak,b=peak;while(a>lo&&counts[a-1]>=counts[peak]*.25)a--;while(b<hi-1&&counts[b+1]>=counts[peak]*.25)b++;let first=-1,last=-1,total=0;for(let x=left;x<right;x++){let n=0;for(let y=a;y<=b;y++)if(ink(x,y))n++;total+=n;if(n>=Math.max(2,.1*(b-a+1))){if(first<0)first=x;last=x;}}return {span:first<0?0:(last-first+1)/w,ink:total,band:(b-a+1)/h};},'data:image/png;base64,'+screenshot.toString('base64')):null;
    const bottom=await page.evaluate(async uri=>{const img=new Image();img.src=uri;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const y=Math.floor(.55*c.height),px=ctx.getImageData(0,y,c.width,c.height-y).data,v=[];for(let i=0;i<px.length;i+=4)v.push((.2126*px[i]+.7152*px[i+1]+.0722*px[i+2])/255);v.sort((a,b)=>a-b);return {p50:v[Math.ceil(v.length*.5)-1],p90:v[Math.ceil(v.length*.9)-1],bright:v.filter(x=>x>.5).length/v.length};},'data:image/png;base64,'+screenshot.toString('base64'));
    assert.equal(data.overlapPrepared,'true');rows.push({variant,p,actualProgress:Number(data.progress),direction,luminance,brandInk,bottom,removedOverlap:Number(data.removedOverlap),drawCalls:Number(data.drawCalls),floorFaces:Number(data.floorFaces),floorReason:data.floorReason,pose:JSON.parse(data.pose),exposure:Number(data.exposure)});
    await writeFile(out+'/comparison.json',JSON.stringify({viewport,rows,errors,note:'Software-rendered aim-only study; bottom ROI includes captions and is not an obstacle mask. Green ink is not exact logo segmentation. No positive outcome asserted. Native image review required.'},null,2));
   }assert.deepEqual(errors,[]);
  }finally{await page.close();}
 }
 assert.equal(rows.length,3*trials.length);assert.ok(rows.every(r=>r.floorFaces>0));
 for(const {p,direction} of trials){const [a,...candidates]=rows.filter(r=>r.p===p&&r.direction===direction);assert.equal(candidates.length,2);for(const b of candidates){for(let i=0;i<3;i++)assert.ok(Math.abs(a.pose.position[i]-b.pose.position[i])<.02);assert.ok(Math.abs(a.pose.fov-b.pose.fov)<.02);for(const i of [0,2])assert.ok(Math.abs(a.pose.target[i]-b.pose.target[i])<.02);assert.ok(Math.abs(a.actualProgress-b.actualProgress)<.0002,`unmatched settled progress ${JSON.stringify({p,direction,variant:b.variant,control:a.actualProgress,candidate:b.actualProgress})}`);const shift=(b.variant==='raised25'?.25:.5)*ramp(b.actualProgress,.978,.992);const measured=b.pose.target[1]-a.pose.target[1];assert.ok(Math.abs(measured-shift)<.035,`unexpected aim delta ${JSON.stringify({p,direction,variant:b.variant,controlProgress:a.actualProgress,candidateProgress:b.actualProgress,shift,measured})}`);assert.equal(b.removedOverlap,a.removedOverlap);}}
 for(const v of ['control','raised25','raised50'])for(const p of reverse){const a=rows.find(r=>r.variant===v&&r.p===p&&r.direction==='forward'),b=rows.find(r=>r.variant===v&&r.p===p&&r.direction==='reverse');for(const key of ['position','target'])for(let i=0;i<3;i++)assert.ok(Math.abs(a.pose[key][i]-b.pose[key][i])<.02,'reverse pose mismatch');assert.ok(Math.abs(a.pose.fov-b.pose.fov)<.02);}
 const decisions=rows.filter(r=>r.variant!=='control'&&r.p>=.992).map(r=>{const control=rows.find(x=>x.variant==='control'&&x.p===r.p&&x.direction===r.direction);return {variant:r.variant,p:r.p,direction:r.direction,span:r.brandInk.span,inkRatio:control.brandInk.ink?r.brandInk.ink/control.brandInk.ink:null,spanPreserved:r.brandInk.span>=control.brandInk.span-.03&&(!mobile||r.brandInk.span>=.75),bottomP90Delta:r.bottom.p90-control.bottom.p90};});
 await writeFile(out+'/decisions.json',JSON.stringify(decisions,null,2));

}finally{await browser?.close();server.kill();}
