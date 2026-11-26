import {cameraPose,ramp,windows} from './facilityCamera.js';
// Independent look direction from path position; the original collision-audited rail is retained.
export const environments=[
 {name:'ORIGIN',roots:['hangar'],points:[0,.015,.035,.08,.115],focus:[0,2.7,-8],fov:64,fog:.009,ambient:.72,global:1.0,accent:0xa9d4cb},
 {name:'BLOCKCHAIN',roots:['servers','cable','rooftop-cable-tray'],points:[.115,.145,.17,.24,.31],focus:[5.5,1.8,6.9],fov:52,fog:.025,ambient:.56,global:.70,accent:0x8cd9ba},
 {name:'STELLAR',roots:['servers'],points:[.31,.345,.39,.415,.49],focus:[3.3,1.85,4.66],fov:54,fog:.066,ambient:.45,global:.26,accent:0xb7e5d7},
 {name:'CRYPTOGRAPHY',roots:['corridor','portal','access-panel','corridor-extension'],points:[.51,.565,.59,.625,.68],focus:[-5.5,1.85,-1.55],fov:52,fog:.076,ambient:.48,global:.22,accent:0xa6c9e6},
 {name:'INTELLIGENCE',roots:['bridge','portal','corridor-extension'],points:[.68,.70,.705,.73,.80],focus:[-5.5,1.7,-7.7],fov:54,fog:.075,ambient:.51,global:.20,accent:0x9dd6e5},
 {name:'QUANTUM',roots:['quantum','lab-drawer-bench','cleanroom-airlock'],points:[.85,.885,.92,.945,.95],focus:[4.7,2.9,-8.6],fov:53,fog:.045,ambient:.48,global:.36,accent:0xd8c58a},
 {name:'CONVERGENCE',roots:['hangar'],points:[.95,.97,.985,.995,1],focus:null,fov:68,fog:.008,ambient:.74,global:1,accent:0xc0e8ce}
];
export function spatialState(p){
 p=Math.min(1,Math.max(0,Number.isFinite(p)?p:0));
 const e=environments.findLast(s=>p>=s.points[0])??environments[0];
 const [a,b,c,d,z]=e.points;
 const phase=p<b?'approach':p<b+(c-b)*.65?'threshold':p<c?'commit':p<d?'hold':p<z?'release':'exit';
 const strength=ramp(p,a,c)*(1-ramp(p,d,z));
 return {...e,phase,strength};
}
export function spatialPose(p,mobile=false){
 const base=cameraPose(p,mobile),e=spatialState(p);
 const s=e.strength*.72,focus=e.focus;
 // Recenter on actual architectural axes and keep camera positions unchanged.
 // Use unit directions to avoid target-distance changing the interpolation.
 const u=base.target.map((x,i)=>x-base.position[i]),un=Math.hypot(...u);
 const v=focus?.map((x,i)=>x-base.position[i]),vn=v?Math.hypot(...v):0;
 const weight=focus&&vn>.3?s*(e.name==='QUANTUM'?ramp(p,.89,.92):1):0;
 const dir=u.map((x,i)=>x/un*(1-weight)+(vn>.3?v[i]/vn:0)*weight);
 const target=base.position.map((x,i)=>x+dir[i]*5/Math.max(.001,Math.hypot(...dir)));
 return {position:base.position,target,fov:base.fov+(e.fov+(mobile?10:0)-base.fov)*s};
}
export function environmentBlend(p){
 const e=spatialState(p),s=e.strength;
 return {state:e,ambient:.72+(e.ambient-.72)*s,global:1+(e.global-1)*s,fog:.008+(e.fog-.008)*s};
}
