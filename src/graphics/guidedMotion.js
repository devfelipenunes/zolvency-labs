// Travel cost follows authored world movement, angular changes and lens changes,
// not raw progress. Full optical masks permit the existing discontinuities.
export const readingHolds=Object.freeze([.055,.205,.405,.625,.73,.935,.992]);
export const opticalCuts=Object.freeze([.51,.81,.965]);
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const length=v=>Math.hypot(...v);
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
function angle(a,b){const u=sub(a.target,a.position),v=sub(b.target,b.position);return Math.acos(clamp(u.reduce((s,x,i)=>s+x*v[i],0)/Math.max(1e-9,length(u)*length(v)),-1,1))*180/Math.PI;}
export function travelCost(poseAt,{samples=1000,metersPerSecond=4,degreesPerSecond=55,fovPerSecond=35}={}){
 if(!Number.isInteger(samples)||samples<1)throw Error('invalid sample count');
 const times=[0];let prev=poseAt(0);
 for(let i=1;i<=samples;i++){
  const next=poseAt(i/samples),a=prev.pose,b=next.pose,masked=prev.mask>=.98&&next.mask>=.98;
  const cost=masked?0:Math.max(length(sub(a.position,b.position))/metersPerSecond,angle(a,b)/degreesPerSecond,Math.abs(a.fov-b.fov)/fovPerSecond);
  times.push(times.at(-1)+Math.max(4/samples,cost));prev=next;
 }
 const total=times.at(-1);
 return {total,toTime(p){const q=clamp(p)*samples,i=Math.min(samples-1,Math.floor(q));return times[i]+(times[i+1]-times[i])*(q-i);},toProgress(t){t=clamp(t,0,total);if(t===total)return 1;let a=0,b=samples;while(b-a>1){const m=(a+b)>>1;if(times[m]<=t)a=m;else b=m;}return (a+(t-times[a])/(times[b]-times[a]))/samples;}};
}
export function createGuidedMotion(map,{initial=0,dwellMs=850}={}){
 let p=initial,target=p,last=null,dwell=0,holdDirection=0,velocity=0;
 const stops=[...readingHolds,...opticalCuts].sort((a,b)=>a-b);
 return {set(q,{snap=false}={}){if(!Number.isFinite(q))return;q=clamp(q);if(dwell>0&&Math.sign(q-p)!==holdDirection){dwell=0;holdDirection=0;}target=q;if(snap){p=q;last=null;dwell=0;velocity=0;}},
 step(now){
  const dt=last===null?.0167:clamp((now-last)/1000,0,.12);last=now;
  if(dwell>0){dwell=Math.max(0,dwell-dt*1000);return p;}
  if(p===target){velocity=0;return p;}
  const t=map.toTime(p),delta=map.toTime(target)-t,dir=Math.sign(delta);
  // Smooth acceleration and deceleration; cap submitted progress per frame.
  const desired=Math.min(1,Math.max(.08,Math.sqrt(2.4*Math.abs(delta))));
  velocity=Math.min(desired,velocity+dt*2.5);
  const travel=Math.min(Math.abs(delta),velocity*dt);
  let next=travel===Math.abs(delta)?target:map.toProgress(t+dir*travel);
  next=dir>0?Math.min(next,p+.018,target):Math.max(next,p-.018,target);
  const crossed=stops.filter(x=>dir>0?x>p&&x<=next:x<p&&x>=next),stop=dir>0?crossed[0]:crossed.at(-1);
  if(stop!==undefined){p=stop;if(readingHolds.includes(stop)&&Math.abs(target-stop)>.006){dwell=dwellMs;holdDirection=dir;velocity=0;}return p;}
  p=next;if(Math.abs(p-target)<1e-9)p=target;return p;
 },get pending(){return p!==target||dwell>0;},get value(){return p;},get target(){return target;},get reading(){return dwell>0;},resetClock(){last=null;}};
}
// Fallback uses existing semantic chapter copy; only fully covered cuts are intentionally blank.
export function needsGuidedCaption({mask=0,ready=false,copyVisible=false}={}){return mask<.98&&(!ready||!copyVisible);}
