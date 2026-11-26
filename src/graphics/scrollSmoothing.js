// Time-based visual easing, independent from native document scrolling.
// Large jumps (Home/End, restoration) snap rather than traverse unseen rooms.
export function smoothProgress(current,target,dt){
 if(Math.abs(target-current)>.12)return target;
 const delta=target-current;
 if(Math.abs(delta)<.00008)return target;
 const eased=current+delta*(1-Math.exp(-Math.max(0,Math.min(64,dt))/85));
 return delta>0?Math.max(eased,target-.025):Math.min(eased,target+.025);
}
