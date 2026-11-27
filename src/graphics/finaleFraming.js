import {ramp} from './facilityCamera.js';
export function finaleFrameMode(value){return ['raised25','raised50'].includes(value)?value:'control';}
// Preserve collision-tested camera positions and original lens. Smooth aim-only study.
export function finaleFraming(p,pose,mode){
 const shift=mode==='raised25'?.25:mode==='raised50'?.5:0;
 if(!shift||p<=.978)return pose;
 return {...pose,target:pose.target.map((v,i)=>i===1?v+shift*ramp(p,.978,.992):v)};
}
