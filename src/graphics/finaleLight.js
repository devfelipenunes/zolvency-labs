import {ramp} from './facilityCamera.js';
// Only a bounded final-act motivated light adjustment, no geometry or material replacement.
// Compare independently of the known problematic geometry-matte floor experiment.
export function finaleLight(p,mobile=false){
 const k=ramp(p,.978,.992);
 return {hall:1-.28*k,env:1-.18*k,head:1+.10*k,key:1-.10*k,fill:1+.06*k,exposure:1-.025*k};
}
