import {smooth5} from './r67/motion-physics.js';
import {glyphHolds} from './glyphChoreography.js';
import {windows} from './facilityCamera.js';
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
export function ribbonTravel(act,phase,seconds,idle=0){
 const s=ribbonStyles[act],t=Number.isFinite(seconds)?2*Math.PI*seconds/s.period:0,live=Number.isFinite(seconds)?1:0;
 const entering=phase.kind==='enter',leaving=phase.kind==='exit',rawOut=entering?1-smooth5(phase.u):leaving?smooth5(phase.u):0,out=rawOut*(1-clamp(idle));
 // Same directed exit/entry lane, not an exploding alphabet. At a chapter
 // boundary the old and new phrases occupy opposite outside edges. During
 // reading the whole phrase follows a bounded loop in the fixed world plane.
 const dir=act===3||act===5?-1:1,side=entering?-dir:dir;
 return {x:side*2.35*out+live*.14*Math.sin(t),y:live*.065*Math.cos(t)+.07*out*Math.sin(Math.PI*phase.u),z:live*.045*Math.sin(t+.7),blend:Math.max(smooth5(clamp(rawOut*2.2)),smooth5(clamp(out*2.2))),out,rawOut,idle};
}

// A paused scroll position is not a frozen animation. Ease the phrase back
// into view without changing the camera or current chapter. Resume smoothly.
export function ribbonIdleStep(previous,dt,stationarySeconds){const goal=stationarySeconds>.12?1:0,rate=goal>previous?4:9;return clamp(previous+(goal-previous)*(1-Math.exp(-Math.max(0,Math.min(.1,dt))*rate)));}

// R76: the only animation clock for the ribbon is actual camera progress.
// Authored reading holds are exactly neutral. Every other pose is a pure
// function of the rail coordinate, including mid-transition stops/reversals.
export function cameraWaveEnvelope(act,p){
 if(!Number.isFinite(p))return 0;
 const h=glyphHolds[act],a=windows[act],b=windows[act+1],d=Math.abs(p-h),span=p<h?h-a:b-h;
 return smooth5(clamp(d/Math.max(.001,span*.36)));
}
export function cameraRibbonGlyph(act,i,n,p,role='headline'){
 const e=cameraWaveEnvelope(act,p);
 if(e===0)return [0,0,0,0,0,0];
 return ribbonGlyph(act,i,n,p*24,role).map(v=>v*e);
}
export function cameraRibbonTravel(act,phase,p){
 const base=ribbonTravel(act,phase,null,0),e=cameraWaveEnvelope(act,p),live=e?ribbonTravel(act,{kind:'hold',u:1},p*24,0):{x:0,y:0,z:0};
 // Limit horizontal excursion so a paused transition doesn't leave the
 // whole title offscreen. Keep the coherent depth/rail blend.
 return {...base,x:Math.sign(base.x)*.20*base.out+live.x*.42*e,y:base.y+live.y*e,z:live.z*e,idle:0};
}
