import {createGuidedMotion,opticalCuts} from './guidedMotion.js';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
// Native scroll never loses ownership. Touch only suspends automatic reading
// holds and continuation after the last input, not native progress updates.
export function createTouchGuidedMotion(map,{initial=0,quietMs=160}={}){
 let auto=createGuidedMotion(map,{initial}),p=initial,target=p,nativeTarget=p,active=false,dir=0,lastInput=-Infinity,lastFrame=null,waiting=false;
 const resetAuto=()=>{auto=createGuidedMotion(map,{initial:p});};
 function begin(now){if(active)return;p=auto.value;target=p;active=true;dir=0;lastInput=now;lastFrame=null;waiting=true;}
 function end(){if(!active)return;active=false;resetAuto();auto.set(target);}
 function set(q,{snap=false,now=0}={}){
  if(!Number.isFinite(q))return;q=clamp(q);
  if(snap){active=false;p=target=nativeTarget=q;resetAuto();return;}
  const changed=q!==nativeTarget;
  if(changed)dir=Math.sign(q-nativeTarget);
  nativeTarget=q;
  if(active){if(!changed)return;target=q;lastInput=now;waiting=false;}
  else{target=q;auto.set(q);}
 }
 function step(now){
  if(!active){p=auto.step(now);return p;}
  const dt=lastFrame===null?.0167:clamp((now-lastFrame)/1000,0,.12);lastFrame=now;
  // Always submit at least a bounded frame for a new native target, even if
  // a slow device missed the input window. Then stop while the finger rests.
  if(waiting||p===target){waiting=true;return p;}
  const t=map.toTime(p),delta=map.toTime(target)-t,d=Math.sign(delta),cost=Math.min(Math.abs(delta),Math.max(.0167,dt)*1.5);
  if(!d){p=target;waiting=true;return p;}
  const raw=cost===Math.abs(delta)?target:map.toProgress(t+d*cost);
  let next=d>0?Math.min(raw,p+.025,target):Math.max(raw,p-.025,target);
  const cuts=opticalCuts.filter(x=>d>0?x>p&&x<=next:x<p&&x>=next);if(cuts.length)next=d>0?cuts[0]:cuts.at(-1);
  p=next;if(now-lastInput>quietMs||p===target)waiting=true;return p;
 }
 return {begin,end,set,step,get active(){return active;},get direction(){return dir;},get pending(){return active?!waiting&&p!==target:auto.pending;},get value(){return active?p:auto.value;},get target(){return active?target:auto.target;},get reading(){return !active&&auto.reading;},resetClock(){lastFrame=null;auto.resetClock();}};
}
