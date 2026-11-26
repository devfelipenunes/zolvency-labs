import {spatialPose} from './spatialNarrative.js';
import {ramp} from './facilityCamera.js';

// The additional module spans z=-3.55 to -7.55; bridge front begins at -7.55.
// Keep the original 8.64m width, extend room depth 5.76 -> 7.20m.
export const interiorLayout=Object.freeze({
 corridorCenter:Object.freeze([-5.5,0,-5.55]),
 roomCenter:Object.freeze([-5.5,0,-11.15]),
 roomScale:Object.freeze([.72,1,.9]),
 aperture:Object.freeze({left:-7.1,right:-3.9,bottom:-.2,top:3.25}),
 roomShift:4.9
});
export function extendedPose(p,mobile=false){
 const pose=spatialPose(p,mobile);
 const depth=interiorLayout.roomShift*ramp(p,.68,.715)*(1-ramp(p,.755,.845));
 const offset=v=>[v[0],v[1],v[2]-depth];
 return {...pose,position:offset(pose.position),target:offset(pose.target)};
}
// Both switches occur inside the fully opaque plateau of the directed cuts.
export const interiorSet=p=>p>=.51&&p<.81?'security-wing':p>=.81&&p<.965?'quantum-wing':'facility';
const wing=new Set(['corridor','portal','access-panel','corridor-extension','bridge']);
const hall=new Set(['hangar','servers','rooftop-cable-tray','cable']);
export function setMember(id,p){const set=interiorSet(p);return set==='security-wing'?wing.has(id):set==='quantum-wing'?id==='hangar'||id==='quantum':hall.has(id);}
