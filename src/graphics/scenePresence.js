import {stageHandoff,sceneHandoffWindows} from './stageHandoff.js';
const clamp=x=>Math.max(0,Math.min(1,x));
// Cubic motion has less near-stationary travel than the quintic curve.
// Exact endpoints and zero endpoint velocity preserve reversible docking.
const ease=u=>{u=clamp(u);return u*u*(3-2*u);};
export const sceneTravel=h=>h.kind==='hold'?0:h.kind==='exit'?ease(h.u):1-ease(h.u);
export function sceneHandoff(p){const h=stageHandoff(p,sceneHandoffWindows);return {...h,travel:sceneTravel(h)};}
// Each chapter has its own entrance and exit, with a common solid reading pose.
// x/y in camera half-extents; z in camera half-height. The edge endpoint is
// deliberately outside the viewport. No opacity, no unrelated animation clock.
export const sceneProfiles=Object.freeze([
 {name:'assembly',enter:[0,-2.95],exit:[2.85,.18],arc:.12,depth:.16,stagger:.10,twist:.06},
 {name:'chain',enter:[-2.85,0],exit:[2.85,.12],arc:.08,depth:.035,stagger:.14,twist:.035},
 {name:'corridor',enter:[-.35,-2.95],exit:[.30,2.95],arc:.06,depth:.40,stagger:.06,twist:.025},
 {name:'precision-lock',enter:[0,2.95],exit:[-2.85,0],arc:0,depth:.035,stagger:.055,twist:.02},
 {name:'signal',enter:[-2.85,-.12],exit:[2.85,.58],arc:.23,depth:.12,stagger:.12,twist:.065},
 {name:'field-deflection',enter:[2.95,-.28],exit:[-2.95,.45],arc:.48,depth:.23,stagger:.085,twist:.10},
 {name:'convergence',enter:[0,-2.95],exit:[0,0],arc:.14,depth:.28,stagger:.075,twist:.045}
]);
export function sceneMotion(h){
 const profile=sceneProfiles[h.index];if(h.kind==='hold')return {x:0,y:0,z:0,profile:profile.name,axis:[0,0],energy:0};
 const axis=profile[h.kind],q=sceneTravel(h),arc=Math.sin(Math.PI*q)**2,perp=[-axis[1]/Math.max(.001,Math.hypot(...axis)),axis[0]/Math.max(.001,Math.hypot(...axis))];
 return {x:axis[0]*q+perp[0]*profile.arc*arc,y:axis[1]*q+perp[1]*profile.arc*arc,z:profile.depth*arc,profile:profile.name,axis,energy:arc};
}
// Use a short, bounded delay, not the huge letter spacing of R80.
// Horizontal path order is monotone; vertically arriving glyphs remain on
// the same horizontal baseline slots. At endpoints all residuals are zero.
export function sceneGlyphMotion(h,rank,role='headline'){
 if(h.kind==='hold')return [0,0,0,0,0,0];
 const profile=sceneProfiles[h.index],axis=profile[h.kind],r=clamp(rank),dir=Math.sign(axis[0])||1;
 const leading=h.kind==='exit'?dir:-dir,delay=(leading>0?1-r:r)*profile.stagger*(role==='body'?.40:1),duration=1-profile.stagger*(role==='body'?.40:1);
 const u=clamp((h.u-delay)/duration),q=h.kind==='exit'?ease(u):1-ease(u),travel=sceneTravel(h),diff=q-travel;
 // Keep the extreme positions locked, limiting stretching in midflight.
 const delta=.115*Math.tanh(diff/.115),arc=Math.sin(Math.PI*travel)**2,k=role==='body'?.25:1;
 return [axis[0]*delta,axis[1]*delta,profile.depth*.12*arc*Math.sin(r*Math.PI),profile.twist*.4*k*arc*Math.cos(r*Math.PI),profile.twist*k*arc*Math.sin(r*Math.PI),profile.twist*.5*k*arc*Math.cos(r*Math.PI)];
}
export const readingLayout=Object.freeze([{x:0,y:-.19},{x:-.035,y:-.21},{x:.02,y:-.20},{x:-.025,y:-.15},{x:.02,y:-.21},{x:-.025,y:-.24},{x:0,y:-.13}]);
// Reserve room for the mobile safe area and browser chrome. Keep horizontal
// composition aligned without forcing a lower placement in Quantum.
export function readingFrame(index,aspect,driftX=0,driftY=0){const b=readingLayout[index],portrait=aspect<1;return {x:Math.max(-.09,Math.min(.09,b.x+driftX)),y:Math.max(portrait?-.30:-.36,Math.min(.10,b.y+driftY)),halfWidth:portrait?.82:.62,halfHeight:portrait?.40:.43};}

// Neutralize the authored tilt before entering an optical cut. This keeps
// the reading orientation continuous on both sides of the .65 plate boundary.
export function readingTilt(mask){return 1-ease((mask-.35)/.30);}
// Keep the R81 raster floor at full quality, but let the existing governor
// reduce it under load instead of pinning the entire framebuffer to 1.25 DPR.
export function presencePixelRatio(dpr,device,governorScale){return Math.max(dpr,Math.min(1.25,device||1)*clamp(governorScale));}
// Translation-only corrections should never shrink the reading composition.
export function readingFitScale(shrink){return shrink<1?shrink*.995:1;}

// A stable world-space reference near each authored reading shot. The blend
// releases smoothly when the camera travels away or an optical cut approaches.
// The actual text remains in the collision-checked reading volume.
export function spatialInfluence(distance,angle,mask){return .48*(1-ease(distance/1.6))*(1-ease(angle/.70))*readingTilt(mask);}
export function spatialDrift(projectedX,projectedY,baseX,baseY,weight){return {x:.16*Math.tanh((projectedX-baseX)/.16)*weight,y:.20*Math.tanh((projectedY-baseY)/.20)*weight};}

// Authored elastic fields, sampled on the same rail as the camera. Adjacent
// glyphs share a continuous wave; horizontal strain is affine, so it cannot
// invert baseline order by itself. No physics solver or extra animation clock.
const elasticFields=Object.freeze([
 {strain:-.075,lift:.26,depth:.34,cycles:.5,roll:.06},
 {strain:.065,lift:.12,depth:.22,cycles:1,roll:.045},
 {strain:.025,lift:.09,depth:.65,cycles:.5,roll:.025},
 {strain:-.045,lift:.06,depth:.16,cycles:1.5,roll:.035},
 {strain:.04,lift:.46,depth:.30,cycles:1.25,roll:.10},
 {strain:.075,lift:.37,depth:.58,cycles:1,roll:.12},
 {strain:-.08,lift:.20,depth:.38,cycles:.5,roll:.055}
]);
export function elasticGlyph(h,rank,line,width,size,role='headline'){
 if(h.kind==='hold')return [0,0,0,0,0,0];
 const f=elasticFields[h.index],r=clamp(rank),q=sceneTravel(h),e=Math.sin(Math.PI*q)**2,k=role==='body'?.18:1,theta=2*Math.PI*(r*f.cycles+(h.kind==='enter'?-1:1)*q*.65+line*.13),gain=e*k;
 return [f.strain*(r-.5)*width*gain,f.lift*size*gain*Math.sin(theta),f.depth*size*gain*Math.cos(theta),.05*gain*Math.cos(theta),.08*gain*Math.sin(theta),f.roll*gain*Math.cos(theta)];
}
