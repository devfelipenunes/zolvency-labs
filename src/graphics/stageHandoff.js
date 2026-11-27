import {windows} from './facilityCamera.js';
import {glyphHolds,glyphPhase} from './glyphChoreography.js';
import {smooth5} from './r67/motion-physics.js';
const clamp=x=>Math.max(0,Math.min(1,x));
export const lanes=Object.freeze([1,1,-1,1,-1,1]);
function makeWindows(fraction){return Object.freeze(lanes.map((direction,i)=>{const cut=windows[i+1];return {index:i,direction,cut,start:cut-(cut-glyphHolds[i])*fraction,end:cut+(glyphHolds[i+1]-cut)*fraction};}));}
export const handoffWindows=makeWindows(.46);
export const sceneHandoffWindows=makeWindows(.68);
// No simultaneous outgoing/incoming phrases. Every chapter boundary occurs
// between two fully offscreen endpoints. At every other point, the scene
// contains just one ordered, opaque group. Reverse scroll resamples exactly.
export function stageHandoff(p,transitions=handoffWindows){
 const {index}=glyphPhase(p);
 const prev=transitions[index-1],next=transitions[index];
 if(prev&&p<prev.end){const u=clamp((p-prev.cut)/(prev.end-prev.cut));return {kind:'enter',index,direction:prev.direction,u,travel:1-smooth5(u),cut:prev.cut};}
 if(next&&p>next.start){const u=clamp((p-next.start)/(next.cut-next.start));return {kind:'exit',index,direction:next.direction,u,travel:smooth5(u),cut:next.cut};}
 return {kind:'hold',index,direction:0,u:1,travel:0,cut:null};
}
export const laneDistance=2.85;
export function stageOffset(h){if(h.kind==='hold')return {x:0,y:0,z:0};const side=h.kind==='exit'?h.direction:-h.direction,arc=Math.sin(Math.PI*h.u);return {x:side*laneDistance*h.travel,y:.12*arc*arc,z:.035*arc};}
// The leading letters leave first; the leading letters arrive first.
// The delay is monotone in the baseline position, not random character index.
// Offset relative to group movement; preserves spacing order in both directions.
export function stageGlyphOffset(h,rank,role='headline'){
 if(h.kind==='hold')return 0;
 const r=clamp(rank),delay=(h.direction===1?1-r:r)*(role==='body'?.17:.27),u=clamp((h.u-delay)/(1-(role==='body'?.17:.27))),q=h.kind==='exit'?smooth5(u):1-smooth5(u),side=h.kind==='exit'?h.direction:-h.direction;
 return side*laneDistance*(q-h.travel);
}
