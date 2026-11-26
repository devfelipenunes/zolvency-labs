import {createMotionDriver} from './editorialMotion.js';
// Map progress to the authored scroll-distance budget before smoothing.
// Units: viewport heights, not metres or physical seconds of scroll input.
export function travelMapper(pacing){
 const starts=[0];for(const c of pacing.chapters)starts.push(starts.at(-1)+c.vh);
 const total=starts.at(-1),index=(value,keys)=>Math.max(0,Math.min(keys.length-2,keys.findLastIndex((x,i)=>i<keys.length-1&&value>=x)));
 const boundaries=[...pacing.chapters.map(c=>c.lo),1];
 return {total,to(p){const i=index(p,boundaries);return (starts[i]+pacing.local(i,p)*pacing.chapters[i].vh)/total;},
 from(t){const x=Math.max(0,Math.min(1,t))*total,i=index(x,starts);return pacing.progress(i,(x-starts[i])/pacing.chapters[i].vh);}};
}
export function createTravelMotion(pacing,initial=0){
 const map=travelMapper(pacing),driver=createMotionDriver(map.to(initial),{tau:95,maxRate:5.5/map.total,maxStep:.50/map.total});
 return {set(p,options){driver.set(map.to(p),options);},step(now){return map.from(driver.step(now));},resetClock(){driver.resetClock();},get pending(){return driver.pending;},get value(){return map.from(driver.value);},get target(){return map.from(driver.target);}};
}
