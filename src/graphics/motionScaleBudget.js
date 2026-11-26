// Two moving samples before lowering; restore only after sustained quiet.
// One timer requests the final high-quality frame in demand-driven mode.
export function createMotionScaleBudget({low=.8,enterMs=150,quietMs=1200}={}){
 let scale=1,movingSince=null,quietSince=null,movingFrames=0,switches=0;
 function set(next){if(scale!==next){scale=next;switches++;}}
 return {get scale(){return scale;},observe(moving,now){
  if(moving){quietSince=null;if(movingSince===null)movingSince=now;movingFrames++;if(movingFrames>=2&&now-movingSince>=enterMs)set(low);return null;}
  movingSince=null;movingFrames=0;if(scale===1){quietSince=null;return null;}
  if(quietSince===null)quietSince=now;const remaining=quietMs-(now-quietSince);if(remaining<=0){set(1);quietSince=null;return null;}return remaining;
 },reset(){movingSince=quietSince=null;movingFrames=0;set(1);},stats(){return {scale,switches,movingFrames,quietSince};}};
}
