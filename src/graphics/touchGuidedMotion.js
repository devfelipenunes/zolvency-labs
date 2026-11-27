import {createGuidedMotion,readingHolds,opticalCuts} from './guidedMotion.js';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
// Gesture owns relative progress, including reversal while the document is still
// moving from a previous native gesture. No preventDefault or forced document scroll.
export function createTouchGuidedMotion(map,{initial=0,quietMs=110}={}){
 let auto=createGuidedMotion(map,{initial}),p=initial,target=p,active=false,dir=0,lastInput=-Infinity,lastFrame=null,velocity=0,waiting=false;
 const resetAuto=()=>{auto=createGuidedMotion(map,{initial:p});};
 const begin=now=>{p=auto.value;target=p;active=true;dir=0;velocity=0;lastInput=now;lastFrame=null;waiting=false;};
 function move(delta,now){if(!active||!Number.isFinite(delta)||Math.abs(delta)<1e-7)return;const nextDir=Math.sign(delta);if(dir!==nextDir){target=p;velocity=0;}dir=nextDir;target=clamp(target+delta);lastInput=now;waiting=false;}
 function end({cancel=false}={}){if(!active)return;active=false;resetAuto();if(cancel){target=p;return;}
  // Continue only in the last gesture direction. A nearby reading hold is a
  // gentle magnetic destination, not an automatic full-tour jump.
  target=dir>0?Math.max(p,target):dir<0?Math.min(p,target):p;
  const hold=dir>0?readingHolds.find(x=>x>=target&&x-target<=.022):[...readingHolds].reverse().find(x=>x<=target&&target-x<=.022);
  if(dir&&hold!==undefined)target=hold;auto.set(target);
 }
 return {begin,move,end,set(q,{snap=false}={}){if(!Number.isFinite(q))return;if(active&&!snap)return;if(snap){active=false;p=target=clamp(q);resetAuto();}else{target=clamp(q);auto.set(target);}},
 step(now){
  if(!active){p=auto.step(now);return p;}
  const dt=lastFrame===null?.0167:clamp((now-lastFrame)/1000,0,.1);lastFrame=now;
  if(now-lastInput>quietMs||p===target){velocity=0;waiting=true;return p;}
  const t=map.toTime(p),delta=map.toTime(target)-t,d=Math.sign(delta);
  if(d!==dir){velocity=0;return p;}
  velocity=Math.min(1.35,velocity+dt*5);
  const cost=Math.min(Math.abs(delta),Math.max(.25,velocity)*dt),raw=cost===Math.abs(delta)?target:map.toProgress(t+d*cost);
  let next=d>0?Math.min(raw,p+.025,target):Math.max(raw,p-.025,target);
  const cuts=opticalCuts.filter(x=>d>0?x>p&&x<=next:x<p&&x>=next);if(cuts.length)next=d>0?cuts[0]:cuts.at(-1);
  p=next;return p;
 },get active(){return active;},get direction(){return dir;},get pending(){return active?p!==target&&!waiting:auto.pending;},get value(){return active?p:auto.value;},get target(){return active?target:auto.target;},get reading(){return !active&&auto.reading;},resetClock(){lastFrame=null;auto.resetClock();}};
}
