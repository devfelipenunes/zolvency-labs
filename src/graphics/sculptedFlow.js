import {windows} from './facilityCamera.js';
import {glyphHolds} from './glyphChoreography.js';
import {smooth5} from './r67/motion-physics.js';
const clamp=x=>Math.max(0,Math.min(1,x));
// Directional motion paths in the camera's local reading volume. Seven
// different profiles. Hold is the common, fully neutral docking keyframe.
export const signatures=Object.freeze([
 {entry:[-.18,-.22,.46],exit:[.20,.12,.95],yaw:.32,roll:.14,curve:.075,twist:.26},
 {entry:[-.24,.08,1.0],exit:[.24,-.10,.48],yaw:-.35,roll:-.12,curve:.060,twist:.22},
 {entry:[.14,-.19,1.0],exit:[-.18,.15,.38],yaw:.42,roll:.10,curve:.055,twist:.28},
 {entry:[-.17,.19,.40],exit:[.22,.10,.70],yaw:-.28,roll:.16,curve:.045,twist:.20},
 {entry:[.22,.16,.58],exit:[-.22,-.16,.92],yaw:.37,roll:-.16,curve:.072,twist:.30},
 {entry:[-.20,-.17,.35],exit:[.18,.12,.45],yaw:-.44,roll:.18,curve:.070,twist:.32},
 {entry:[.18,-.20,.85],exit:[0,0,.56],yaw:.30,roll:-.10,curve:.052,twist:.22}
]);
export function travelState(act,p){const a=windows[act],b=windows[act+1],h=glyphHolds[act],enter=p<h,u=clamp(enter?(h-p)/(h-a):(p-h)/(b-h)),e=smooth5(u),s=signatures[act];return {enter,u,e,s};}
export function sculptedPose(act,p){const {enter,u,e,s}=travelState(act,p),v=enter?s.entry:s.exit,sign=enter?-1:1,arc=Math.sin(Math.PI*u)*e;return {x:v[0]*e+.065*sign*arc,y:v[1]*e+.055*arc,depth:.56+(v[2]-.56)*e+.12*arc,yaw:s.yaw*sign*e,pitch:-.14*e*Math.cos(Math.PI*u),roll:s.roll*sign*e,scale:1-.13*e,energy:e};}
// The line is a continuous bent strip, not individually drifting glyphs.
// Stretch is monotone in original centerX; wave has a bounded slope;
// character depth and tangent change with rank. Bodies follow quieter bends.
export function sculptedGlyph(act,p,glyph,lineRange,role){if(!Number.isFinite(p))return [0,0,0,0,0,0];const {enter,u,e,s}=travelState(act,p);if(e===0)return [0,0,0,0,0,0];const width=Math.max(.001,lineRange.max-lineRange.min),r=clamp((glyph.center.x-lineRange.min)/width),center=(lineRange.min+lineRange.max)/2,side=enter?-1:1,strength=role==='body'?.22:1,angle=Math.PI*(r*1.35+side*u*.8);const y=s.curve*strength*e*Math.sin(angle),z=s.curve*.95*strength*e*Math.cos(angle);return [(glyph.center.x-center)*.085*strength*e,y,z,s.twist*.40*e*strength*Math.cos(angle),s.twist*side*e*strength*Math.sin(angle),s.curve*3.2*e*strength*Math.cos(angle)];}

// R79: coherent cinematic arc + restrained traveling line cascade.
// Keep the text readable when the user scrubs to any point, not just holds.
export function cinematicPose(act,p){const {enter,u,e,s}=travelState(act,p),v=enter?s.entry:s.exit,sign=enter?-1:1,arc=Math.sin(Math.PI*u),sweep=arc*arc,quantum=act===5;
 const y=quantum?(-.025+.12*sweep)*e:v[1]*e*.82+.13*sweep*sign;
 return {x:v[0]*e*.92+.095*sweep*sign,y,depth:.54+(v[2]-.54)*e+.16*sweep,yaw:s.yaw*sign*e*.86,pitch:-.085*e*Math.cos(Math.PI*u),roll:s.roll*sign*e*.60,scale:1-.085*e,energy:e};
}
export function cinematicGlyph(act,p,glyph,lineRange,role){
 if(!Number.isFinite(p))return [0,0,0,0,0,0];
 const {enter,u,e,s}=travelState(act,p);if(e===0)return [0,0,0,0,0,0];
 const width=Math.max(.001,lineRange.max-lineRange.min),rank=clamp((glyph.center.x-lineRange.min)/width),center=(lineRange.min+lineRange.max)/2,side=enter?-1:1,k=role==='body'?.20:1;
 const phase=rank*1.1+side*u*.95+glyph.line*.13,theta=Math.PI*phase,amp=Math.min(.024,s.curve*.33)*e*k;
 // Positive affine expansion preserves reading order. The wave runs along
 // the line, and depth/roll follow its tangent rather than random rotations.
 const x=(glyph.center.x-center)*.065*e*k,y=amp*Math.sin(theta),z=amp*.63*Math.cos(theta),lineShift=role==='headline'?Math.sin(Math.PI*u)*e*(glyph.line%2?-.009:.009):0;
 return [x,y+lineShift,z,.055*e*k*Math.cos(theta),.075*side*e*k*Math.sin(theta),.085*e*k*Math.cos(theta)];
}
