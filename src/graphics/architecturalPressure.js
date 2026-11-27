// Selected guide samples from R73 survey artifacts 15169991313 and 15169742681.
// Both viewports returned identical x/y/depth and world centers. Coordinates
// reconstructed from authored rail instead of interpolating across optical cuts.
// Entries: progress, vertical position, depth, nearest center-ray surface depth.
// Null surface = no hit in survey range. Not a swept collision certificate.
import {smooth5} from './r67/motion-physics.js';
export const measuredGuides=Object.freeze([
 [[.0802,-.42,1.35,null],[.093775,-.42,1.35,null],[.10735,-.42,1.35,null],[.120925,-.42,1.35,2.571],[.1345,-.42,1.35,2.254],[.148075,-.42,1.35,1.459],[.16165,-.42,1.35,2.406],[.175225,-.42,1.35,2.648],[.1888,-.42,1.35,2.648]],
 [[.2491,-.42,.85,3.263],[.26645,-.42,.85,5.207],[.2838,-.42,.85,5.409],[.30115,-.42,.85,5.287],[.3185,-.42,.85,5.152],[.33585,-.42,.85,5.029],[.3532,-.42,.85,4.948],[.37055,-.42,.85,4.941],[.3879,-.42,.85,1.176]],
 [[.4491,-.22,.85,1.082],[.4685,-.22,.85,1.080],[.4879,-.22,.85,1.079],[.5267,-.22,.85,6.125],[.5461,-.22,.85,6.123],[.5655,-.22,.85,6.120],[.5849,-.22,.85,6.119],[.6043,-.22,.85,null]],
 [[.6355,-.22,.85,7.148],[.6455125,-.22,.85,6.063],[.655525,-.22,.85,5.448],[.6655375,-.22,.85,7.717],[.67555,-.22,.85,6.891],[.6855625,-.22,.85,6.015],[.695575,-.22,.85,3.947],[.7055875,-.22,.85,5.416],[.7156,-.22,.85,6.419]],
 [[.7804,-.22,1.8,6.435],[.7978125,-.22,1.8,6.438],[.8326375,-.62,1.8,null],[.85005,-.62,1.8,null],[.8674625,-.62,1.8,null],[.884875,-.42,1.8,null],[.9022875,-.42,1.8,null],[.9197,-.42,1.8,null]],
 [[.9413,-.22,1.8,6.916],[.9466925,-.22,1.8,6.916],[.952085,-.22,1.8,6.922],[.9574775,-.22,1.8,6.972],[.973655,-.22,1.8,null],[.9790475,-.22,1.8,null],[.98444,-.22,1.8,null]]
]);
const clamp=x=>Math.max(0,Math.min(1,x));
const margin=s=>s[3]===null?6:Math.max(0,s[3]-s[2]);
export function guideAt(index,p){const rows=measuredGuides[index],i=rows.findIndex(r=>r[0]>=p);if(i<=0){const r=i===0?rows[0]:rows.at(-1);return {y:r[1],depth:r[2],margin:margin(r)};}const a=rows[i-1],b=rows[i],t=smooth5(clamp((p-a[0])/(b[0]-a[0])));return {y:a[1]+(b[1]-a[1])*t,depth:a[2]+(b[2]-a[2])*t,margin:margin(a)+(margin(b)-margin(a))*t};}
// Authored reaction to observed proximity, not a rigid body simulation.
// Stronger pressure only in regions with smaller sampled center-ray margin.
export function pressureAt(index,p,u,rank){const g=guideAt(index,p),e=Math.sin(Math.PI*clamp(u))**2,pressure=clamp((.65-g.margin)/.65),pulse=Math.sin(Math.PI*2*(u-rank*.28))*e;return {compression:1-.14*pressure*e,depthOffset:-.08*pressure*e,deflection:.085*pressure*e,roll:.12*pressure*pulse,pressure};}
