// Map progress to the authored scroll-distance budget before smoothing.
// Units: viewport heights, not metres or physical seconds of scroll input.
export function travelMapper(pacing){
 const starts=[0];for(const c of pacing.chapters)starts.push(starts.at(-1)+c.vh);
 const total=starts.at(-1),index=(value,keys)=>Math.max(0,Math.min(keys.length-2,keys.findLastIndex((x,i)=>i<keys.length-1&&value>=x)));
 const boundaries=[...pacing.chapters.map(c=>c.lo),1];
 return {total,to(p){const i=index(p,boundaries);return (starts[i]+pacing.local(i,p)*pacing.chapters[i].vh)/total;},
 from(t){const x=Math.max(0,Math.min(1,t))*total,i=index(x,starts);return pacing.progress(i,(x-starts[i])/pacing.chapters[i].vh);}};
}
// Acceleration-limited camera travel. Braking distance and target reversal
// are calculated in scroll-viewport units; no normal input teleportation.
export function createBaselineTravelMotion(pacing,initial=0){
 const map=travelMapper(pacing),total=map.total,stops=[.51,.81,.965].map(p=>map.to(p)*total);
 let x=map.to(initial)*total,target=x,v=0,last=null;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 return {set(p,{snap=false}={}){target=map.to(clamp(p,0,1))*total;if(snap){x=target;v=0;last=null;}},
 step(now){
  const dt=last===null?1/60:clamp((now-last)/1000,0,.10);last=now;
  const delta=target-x;
  if(Math.abs(delta)<.0008&&Math.abs(v)<.06){x=target;v=0;return map.from(x/total);}
  // A bounded acceleration with a braking-speed envelope, no overshooting.
  const desired=Math.sign(delta)*Math.min(5.5,Math.sqrt(2*18*Math.abs(delta)),Math.abs(delta)*12);
  v+=clamp(desired-v,-18*dt,18*dt);
  let step=clamp(v*dt,-.35,.35);
  if(Math.sign(step)===Math.sign(delta)&&Math.abs(step)>=Math.abs(delta)){step=delta;v=0;}
  const next=clamp(x+step,0,total);
  // Every optical splice submits at least one fully covered frame in either direction.
  const crossed=stops.filter(s=>next>x?s>x+1e-9&&s<=next:s<x-1e-9&&s>=next);
  x=crossed.length?(next>x?crossed[0]:crossed.at(-1)):next;
  if(x===0||x===total)v=0;
  return map.from(x/total);
 },resetClock(){last=null;},get pending(){return x!==target||v!==0;},get value(){return map.from(x/total);},get target(){return map.from(target/total);},get velocity(){return v;}};
}

 // Authored speed envelopes, in scroll-viewport units per second. Interpolated
 // at chapter centers so there is no abrupt change at a scene boundary.
 export const sceneSpeedLimits=[4.4,5.0,4.6,5.5,4.8,4.3,3.8];
 export function sceneSpeedLimit(p,pacing){
  const centers=pacing.chapters.map(c=>(c.lo+c.hi)*.5);
  if(p<=centers[0])return sceneSpeedLimits[0];
  for(let i=1;i<centers.length;i++)if(p<=centers[i]){
   const t=(p-centers[i-1])/(centers[i]-centers[i-1]),s=t*t*(3-2*t);
   return sceneSpeedLimits[i-1]+(sceneSpeedLimits[i]-sceneSpeedLimits[i-1])*s;
  }
  return sceneSpeedLimits.at(-1);
 }
 // Jerk-limited acceleration command (not a guarantee on physical camera-space
 // jerk). Endpoint protection, explicit snaps and optical splices take precedence.
 export function createTravelMotion(pacing,initial=0,{baseline=false}={}){
  if(baseline)return createBaselineTravelMotion(pacing,initial);
  const map=travelMapper(pacing),total=map.total,stops=[.51,.81,.965].map(p=>map.to(p)*total);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  let x=map.to(initial)*total,target=x,v=0,a=0,last=null;
  return {
   set(p,{snap=false}={}){target=map.to(clamp(p,0,1))*total;if(snap){x=target;v=a=0;last=null;}},
   step(now){
    const dt=last===null?1/60:clamp((now-last)/1000,0,.06);last=now;
    const delta=target-x;
    if(Math.abs(delta)<.002&&Math.abs(v)<.015&&Math.abs(a)<.08){x=target;v=a=0;return map.from(x/total);}
    if(!dt)return map.from(x/total);
    const limit=sceneSpeedLimit(map.from(x/total),pacing);
    const desired=Math.sign(delta)*Math.min(limit,Math.sqrt(18*Math.abs(delta)),Math.abs(delta)*2.4);
    // Integrate at small substeps so a delayed render cannot destabilize the filter.
    const steps=Math.ceil(dt/(1/120)),h=dt/steps;let distance=0;
    for(let i=0;i<steps;i++){
     const command=clamp((desired-v)*10,-18,18);
     a+=clamp(command-a,-120*h,120*h);
     const nextV=clamp(v+a*h,-5.5,5.5);
     distance+=(v+nextV)*.5*h;v=nextV;
    }
    let step=clamp(distance,-.35,.35);
    if(Math.sign(step)===Math.sign(delta)&&Math.abs(step)>=Math.abs(delta)){step=delta;v=a=0;}
    const next=clamp(x+step,0,total);
    const crossed=stops.filter(s=>next>x?s>x+1e-9&&s<=next:s<x-1e-9&&s>=next);
    x=crossed.length?(next>x?crossed[0]:crossed.at(-1)):next;
    if(x===0||x===total)v=a=0;
    return map.from(x/total);
   },
   resetClock(){last=null;},
   get pending(){return x!==target||v!==0||a!==0;},
   get value(){return map.from(x/total);},get target(){return map.from(target/total);},
   get velocity(){return v;},get acceleration(){return a;}
  };
 }
