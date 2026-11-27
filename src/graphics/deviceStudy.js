const percentile=(a,q)=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.ceil(q*s.length)-1)];};
export function summarizeDeviceFrames(frames){
 const metrics={};
 for(const key of ['intervalMs','cpuMs','gpuMs','drawCalls','triangles','pixelRatio','geometries','textures','targetError','scrollToSubmitMs']){
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
 const frames=[],observedIntervals=[];let active=false,lastGPU='',longGaps=0,hiddenFrames=0,scrollPending=null,truncated=false;
 const n=v=>v===''||v==null?null:Number(v);
 return {start(){frames.length=0;observedIntervals.length=0;truncated=false;lastGPU='';longGaps=hiddenFrames=0;scrollPending=null;active=true;},markScroll(now){if(active&&Number.isFinite(now))scrollPending=now;},record(d,hidden=false,now=null){
  if(!active)return;if(hidden){hiddenFrames++;scrollPending=null;return;}if(observedIntervals.length>=maxSamples){truncated=true;return;}
  const interval=n(d.activeFrameIntervalMs);if(!Number.isFinite(interval)||interval<=0)return;observedIntervals.push(interval);if(interval>250){longGaps++;return;}
  const serial=d.gpuSampleSerial,unique=!!serial&&serial!==lastGPU;if(unique)lastGPU=serial;
  const requested=n(d.targetProgress),rendered=n(d.progress);const scrollToSubmitMs=scrollPending!==null&&Number.isFinite(now)&&now>=scrollPending?now-scrollPending:null;if(scrollToSubmitMs!==null)scrollPending=null;
  frames.push({intervalMs:interval,scrollToSubmitMs,cpuMs:n(d.cpuFrameMs),gpuMs:unique?n(d.gpuMs):null,drawCalls:n(d.drawCalls),triangles:n(d.triangles),pixelRatio:n(d.pixelRatio),geometries:n(d.geometryCount),textures:n(d.textureCount),targetError:Number.isFinite(requested)&&Number.isFinite(rendered)?Math.abs(requested-rendered):null});
 },stop(d,viewport){active=false;return {...summarizeDeviceFrames(frames),viewport,observedIntervals:{samples:observedIntervals.length,p50:percentile(observedIntervals,.5),p95:percentile(observedIntervals,.95),max:observedIntervals.length?Math.max(...observedIntervals):null,over50ms:observedIntervals.filter(x=>x>50).length,over250ms:longGaps},truncated,excludedLongGaps:longGaps,excludedHiddenFrames:hiddenFrames,firstFrameMs:n(d.firstFrameMs),allAssetsMs:n(d.allAssetsMs),preflightMs:n(d.preflightMs),warmedTextures:n(d.warmedTextures),warmedViews:n(d.warmedViews),gpuPreflight:d.gpuPreflight??null,gpuTimerSupported:d.gpuTimerSupported==='true',renderer:d.renderer,quality:d.effectVariant,note:'Legacy active metrics exclude >250ms; observedIntervals includes all observed positive active intervals, including stalls. Hidden frames excluded. Sample cap explicitly reported. No GPU fingerprint, URL, account or device identifier collected. Scroll event to CPU render submission is a latest-event proxy, not input-to-photon latency. Target error is not input latency.'};}};
}
