import {ramp} from './facilityCamera.js';
// Portrait-only shot audition. Never change collision-tested camera positions.
// Use smooth local envelopes, leaving optical splice shoulders and Quantum alone.
export function portraitFraming(p,pose,mobile){
 if(!mobile)return pose;
 const e=(a,b,c,d)=>ramp(p,a,b)*(1-ramp(p,c,d));
 const blockchain=e(.145,.17,.24,.28),stellar=e(.365,.39,.415,.445),ops=e(.705,.715,.74,.755),final=ramp(p,.985,.992);
 const fov=pose.fov+4*blockchain-3*stellar+5*ops-3*final;
 const target=pose.target.map((x,i)=>i===1?x+.12*stellar-.22*ops+.35*final:x);
 return {...pose,target,fov:Math.max(25,Math.min(85,fov))};
}
