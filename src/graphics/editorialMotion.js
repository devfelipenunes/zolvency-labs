// Normal wheel/touch motion never snaps. Explicit Home/End and initial restoration may.
export function createMotionDriver(initial=0,{tau=110,maxRate=.65}={}){
 let value=initial,target=initial,last=null;
 return {set(p,{snap=false}={}){target=Math.max(0,Math.min(1,p));if(snap){value=target;last=null;}},step(now){
  const dt=last===null?16.7:Math.max(0,Math.min(50,now-last));last=now;
  const delta=target-value;if(Math.abs(delta)<.00008){value=target;return value;}
  const step=Math.min(Math.abs(delta)*(1-Math.exp(-dt/tau)),maxRate*dt/1000);
  value+=Math.sign(delta)*step;return value;
 },get pending(){return value!==target;},get value(){return value;},get target(){return target;},resetClock(){last=null;}};
}
