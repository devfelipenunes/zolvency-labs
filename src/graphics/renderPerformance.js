// A single render queue; scroll, async assets and ambient tick share one RAF.
export function createRenderQueue(render,{raf=requestAnimationFrame,cancel=cancelAnimationFrame,timer=setTimeout,clear=clearTimeout,hidden=()=>document.hidden,idleMs=()=>250}={}){
 let frame=null,timeout=null,closed=false,target=0,dirty=false;
 const cancelIdle=()=>{if(timeout!==null){clear(timeout);timeout=null;}};
 function arm(){cancelIdle();const delay=idleMs();if(!closed&&!hidden()&&Number.isFinite(delay)&&delay>0)timeout=timer(()=>{timeout=null;request();},delay);}
 function request(p){if(closed)return;if(Number.isFinite(p)){target=p;dirty=true;}cancelIdle();if(hidden()||frame!==null)return;frame=raf(ts=>{frame=null;if(closed||hidden())return;const moving=dirty;dirty=false;render(target,ts,moving);if(frame===null)arm();});}
 function pause(){cancelIdle();if(frame!==null){cancel(frame);frame=null;}}
 return {request,pause,wake(){request();},dispose(){closed=true;pause();},get pending(){return frame!==null;}};
}

// Resolution changes only after sustained load; use active frames, never idle intervals.
export function createResolutionGovernor({budget=16.7,levels=[1,.9,.8,.7,.6],severeFrames=Infinity}={}){
 let index=0,slow=0,fast=0,severe=0,ema=null,lastChange=-Infinity;
 return {get scale(){return levels[index];},observe(ms,now){
  if(!Number.isFinite(ms)||ms<=0)return null;
  ema=ema===null?ms:ema*.85+ms*.15;severe=ms>budget*3?severe+1:0;
  if(ema>budget*1.18){slow++;fast=0;}else if(ema<budget*.72){fast++;slow=0;}else{slow=0;fast=0;}
  if(now-lastChange<1500)return null;
  const next=slow>=12||severe>=severeFrames?Math.min(index+1,levels.length-1):fast>=90?Math.max(0,index-1):index;
  if(next===index)return null;index=next;lastChange=now;slow=fast=severe=0;ema=null;return levels[index];
 },reset(){slow=fast=severe=0;ema=null;}};
}

// GPU timings are asynchronous and optional. Never gl.finish() or read unready results.
export function createGpuTimer(gl,{every=6,maxPending=4}={}){
 const ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
 let frame=0,active=null,latest=null,serial=0;const pending=[];
 function discard(){for(const q of pending)gl.deleteQuery(q.query);pending.length=0;latest=null;}
 return {supported:!!ext,poll(){
  if(!ext)return null;
  if(gl.getParameter(ext.GPU_DISJOINT_EXT)){discard();return null;}
  while(pending.length&&gl.getQueryParameter(pending[0].query,gl.QUERY_RESULT_AVAILABLE)){
   const {query:q,submitted}=pending.shift(),ns=gl.getQueryParameter(q,gl.QUERY_RESULT);gl.deleteQuery(q);
   if(Number.isFinite(ns)&&ns>=0)latest={ms:ns/1e6,serial:++serial,frame:submitted};
  }
  return latest;
 },begin(){frame++;if(!ext||active||pending.length>=maxPending||frame%every!==0)return;const q=gl.createQuery();if(q){gl.beginQuery(ext.TIME_ELAPSED_EXT,q);active={query:q,submitted:frame};}},
 end(){if(!active)return;gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(active);active=null;},
 dispose(){if(active){gl.endQuery(ext.TIME_ELAPSED_EXT);gl.deleteQuery(active.query);active=null;}discard();}
 };
}
