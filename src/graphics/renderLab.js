// Experimental render policy. CPU submission time is not GPU frame time.
export function createRenderBudget({target=16.7,min=.75,max=1,initial=1}={}){
 let scale=initial,ema=null,slow=0,fast=0;
 return {get scale(){return scale;},sample(ms){
  if(!Number.isFinite(ms)||ms<0)return scale;
  ema=ema===null?ms:ema*.85+ms*.15;
  if(ema>target*1.2){slow++;fast=0;}else if(ema<target*.65){fast++;slow=0;}else{fast=0;slow=0;}
  if(slow>=8){scale=Math.max(min,scale-.05);slow=0;}
  if(fast>=60){scale=Math.min(max,scale+.05);fast=0;}
  return scale;
 }};
}
export function createGpuTimer(gl){
 const ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
 if(!ext)return null;
 const pending=[];let active=null;
 return {
  begin(){if(active||pending.length>=4)return;const q=gl.createQuery();if(!q)return;gl.beginQuery(ext.TIME_ELAPSED_EXT,q);active=q;},
  end(){if(!active)return;gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(active);active=null;},
  poll(){if(gl.getParameter(ext.GPU_DISJOINT_EXT)){for(const q of pending)gl.deleteQuery(q);pending.length=0;return null;}
   let ms=null;while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){const q=pending.shift();ms=gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6;gl.deleteQuery(q);}return ms;},
  dispose(){if(active){gl.endQuery(ext.TIME_ELAPSED_EXT);gl.deleteQuery(active);active=null;}for(const q of pending)gl.deleteQuery(q);pending.length=0;}
 };
}
// Coalesce many scroll events into one draw per animation frame, latest input wins.
export function createFrameQueue(draw,request,cancel){
 let handle=null,latest,disposed=false;
 return {schedule(...args){if(disposed)return;latest=args;if(handle!==null)return;handle=request(()=>{handle=null;if(!disposed)draw(...latest);});},dispose(){disposed=true;if(handle!==null)cancel(handle);handle=null;}};
}
