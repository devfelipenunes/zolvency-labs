import {windows} from './facilityCamera.js';
import {glyphHolds} from './glyphChoreography.js';
import {smooth5} from './r67/motion-physics.js';
export const placementTargets=Object.freeze([
 {x:0,y:-.28},{x:-.035,y:-.36},{x:.035,y:-.32},{x:-.035,y:-.18},{x:.035,y:-.34},{x:-.04,y:-.52},{x:0,y:-.18}
]);
export function layoutCandidates(index){const p=placementTargets[index];return [p,{x:0,y:p.y},{x:0,y:-.46}].filter((v,i,a)=>a.findIndex(k=>k.x===v.x&&k.y===v.y)===i);}
const clamp=x=>Math.max(0,Math.min(1,x));
export function directedBodyPhase(p,index){
 const a=windows[index],b=windows[index+1],h=glyphHolds[index],start=index===0?a:a+(h-a)*.82,arrive=h,leave=h+(b-h)*.10,depart=h+(b-h)*.42;
 if(p<arrive)return {index,kind:'enter',u:clamp((p-start)/(arrive-start))};
 if(index!==6&&p>leave)return {index,kind:'exit',u:clamp((p-leave)/(depart-leave))};
 return {index,kind:'hold',u:1};
}
// A quiet sequential downward retreat/arrival, opaque geometry, no opacity fade.
export function directedBodyTransform(i,n,phase){
 if(phase.kind==='hold')return [0,0,0,0,0,0];
 const rank=n>1?i/(n-1):0,exit=phase.kind==='exit',t=smooth5(clamp((phase.u-.18*(exit?1-rank:rank))/.82)),q=exit?t:1-t;
 if(q===0)return [0,0,0,0,0,0];
 return [.10*Math.sin(Math.PI*q)*Math.sin(rank*Math.PI),-3.7*q,-.10*q,.12*q,0,0];
}
