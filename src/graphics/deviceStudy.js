const percentile=(a,q)=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.ceil(q*s.length)-1)];};
export function summarizeDeviceFrames(frames){
 const metrics={};
 for(const key of ['intervalMs','cpuMs','gpuMs','drawCalls','triangles','pixelRatio','geometries','textures','targetError']){
  const values=frames.map(x=>x[key]).filter(Number.isFinite);
  metrics[key]={samples:values.length,p50:percentile(values,.5),p95:percentile(values,.95),max:values.length?Math.max(...values):null};
 }
 return {samples:frames.length,metrics};
}
export function createAdaptiveAO({budget=16.7,slowFrames=24,fastFrames=120,cooldown=5000}={}){
 let enabled=true,slow=0,fast=0,ema=null,lastChange=-Infinity;
 return {get enabled(){return enabled;},observe(ms,now){
  if(!Number.isFinite(ms)||ms<=0||ms>250){this.reset();return null;}
  ema=ema===null?ms:ema*.85+ms*.15;
  if(ema>budget*1.25){slow++;fast=0;}else if(ema<budget*.65){fast++;slow=0;}else{slow=fast=0;}
  if(now-lastChange<cooldown)return null;
  if(enabled&&slow>=slowFrames||!enabled&&fast>=fastFrames){enabled=!enabled;lastChange=now;this.reset();return enabled;}
  return null;
 },reset(){slow=fast=0;ema=null;}};
}
export function createDeviceStudy({maxSamples=3000}={}){
 const frames=[];let active=false,lastGPU='';
 const n=v=>v===''||v==null?null:Number(v);
 return {start(){frames.length=0;lastGPU='';active=true;},record(d,hidden=false){
  if(!active||hidden||frames.length>=maxSamples)return;
  const interval=n(d.activeFrameIntervalMs);if(!Number.isFinite(interval)||interval<=0||interval>250)return;
  const serial=d.gpuSampleSerial,unique=!!serial&&serial!==lastGPU;if(unique)lastGPU=serial;
  const requested=n(d.targetProgress),rendered=n(d.progress);
  frames.push({intervalMs:interval,cpuMs:n(d.cpuFrameMs),gpuMs:unique?n(d.gpuMs):null,drawCalls:n(d.drawCalls),triangles:n(d.triangles),pixelRatio:n(d.pixelRatio),geometries:n(d.geometryCount),textures:n(d.textureCount),targetError:Number.isFinite(requested)&&Number.isFinite(rendered)?Math.abs(requested-rendered):null});
 },stop(d,viewport){active=false;return {...summarizeDeviceFrames(frames),viewport,firstFrameMs:n(d.firstFrameMs),allAssetsMs:n(d.allAssetsMs),gpuTimerSupported:d.gpuTimerSupported==='true',renderer:d.renderer,quality:d.effectVariant,note:'Active rendered intervals only; >250ms gaps excluded. No GPU fingerprint, URL, account or device identifier collected. Target error is not input latency.'};}};
}
