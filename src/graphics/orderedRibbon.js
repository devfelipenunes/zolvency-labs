import {smooth5} from './r67/motion-physics.js';
const clamp=x=>Math.max(0,Math.min(1,x));
// One phrase at a time, no inter-title glyph matching or permutation.
// Coherent moving reading plane + bounded traveling wave along the original
// baseline. Never change glyph x-order. Every act has a different wave profile.
export const ribbonStyles=Object.freeze([
 {period:2.8,dir:1,amp:.030,roll:.055,depth:.035},
 {period:2.1,dir:1,amp:.032,roll:.075,depth:.040},
 {period:2.5,dir:1,amp:.022,roll:.045,depth:.055},
 {period:1.8,dir:-1,amp:.018,roll:.065,depth:.030},
 {period:2.2,dir:1,amp:.038,roll:.085,depth:.035},
 {period:3.0,dir:-1,amp:.032,roll:.060,depth:.065},
 {period:3.4,dir:1,amp:.024,roll:.045,depth:.040}
]);
export function ribbonGlyph(act,i,n,seconds,role='headline'){
 if(!Number.isFinite(seconds))return [0,0,0,0,0,0];
 const s=ribbonStyles[act],rank=n>1?i/(n-1):0,angle=2*Math.PI*(seconds/s.period-s.dir*rank*.90),a=role==='body'?.20:1;
 // No independent horizontal translation; source character order and advances
 // remain intact. Individual rise/depth/pitch describe a progressing wave.
 return [0,s.amp*a*Math.sin(angle),s.depth*a*Math.cos(angle),s.roll*a*Math.sin(angle-.5),0,0];
}
export function ribbonTravel(act,phase,seconds){
 const s=ribbonStyles[act],t=Number.isFinite(seconds)?2*Math.PI*seconds/s.period:0,live=Number.isFinite(seconds)?1:0;
 const entering=phase.kind==='enter',leaving=phase.kind==='exit',out=entering?1-smooth5(phase.u):leaving?smooth5(phase.u):0;
 // Same directed exit/entry lane, not an exploding alphabet. At a chapter
 // boundary the old and new phrases occupy opposite outside edges. During
 // reading the whole phrase follows a bounded loop in the fixed world plane.
 const dir=act===3||act===5?-1:1,side=entering?-dir:dir;
 return {x:side*2.35*out+live*.14*Math.sin(t),y:live*.065*Math.cos(t)+.07*out*Math.sin(Math.PI*phase.u),z:live*.045*Math.sin(t+.7),blend:smooth5(clamp(out*2.2)),out};
}
