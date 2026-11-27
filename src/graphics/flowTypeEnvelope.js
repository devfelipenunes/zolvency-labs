import {windows,ramp} from './facilityCamera.js';
// A single active chapter, with progress-driven reveal in both directions.
// No wall-clock opacity, no abrupt switch between HTML and 3D.
export function flowTypeEnvelope(p,mask=0){
 const index=Math.max(0,windows.findLastIndex((v,i)=>i<windows.length-1&&p>=v));
 const local=Math.max(0,Math.min(1,(p-windows[index])/(windows[index+1]-windows[index])));
 const enter=index===0?1:ramp(local,.015,.22),exit=index===6?1:1-ramp(local,.81,1);
 return {index,local,enter,exit,alpha:enter*exit*(1-Math.max(0,Math.min(1,mask))),drift:(1-enter)*.12-(1-exit)*.05};
}
