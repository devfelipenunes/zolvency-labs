import * as THREE from 'three';
import {ramp} from './facilityCamera.js';
// Independent candidates: never silently change the accepted V0.29 look.
export const realismModes=['baseline','surface','bounce','depth','motion','combined'];
export function realismMode(value){return realismModes.includes(value)?value:'baseline';}
export const enables=(mode,feature)=>mode==='combined'||mode===feature;
const pulse=(p,a,b,c,d)=>ramp(p,a,b)*(1-ramp(p,c,d));
export function localLightWeights(p){
 return {hangar:Math.max(1-ramp(p,.08,.115),ramp(p,.97,.995)),rack:pulse(p,.115,.175,.415,.49),security:pulse(p,.52,.59,.64,.69),ops:pulse(p,.68,.715,.74,.81)};
}
export function photographicRefinement(look,p){
 const {hangar,rack,security,ops}=localLightWeights(p);
 // Match-cut and Quantum holds stay untouched; reduce camera-following fill in favour of actual set lights.
 return {...look,head:look.head*(1-.35*hangar-.24*rack-.20*security-.28*ops),fill:look.fill*(1+.10*hangar+.12*rack+.08*ops),hall:look.hall*(1-.18*hangar-.12*security),env:look.env*(1+.10*rack+.08*ops)};
}
// Material response only; no new maps, invented roughness details or modified transmission.
export function refineSurface(m,id){
 if(!m?.isMeshStandardMaterial||!['hangar','servers','corridor','corridor-extension','portal','bridge'].includes(id))return false;
 const n=m.name??'';
 if(m.transparent||(m.transmission??0)>.001||/glass|light|led|screen|glow|holo/i.test(n))return false;
 if(/floor/i.test(n)){m.roughness=Math.max(m.roughness??0,.78);m.envMapIntensity=(m.envMapIntensity??1)*.65;}
 else if(/device/i.test(n)){m.roughness=THREE.MathUtils.clamp(m.roughness??.4,.40,.72);m.emissiveIntensity=Math.min(m.emissiveIntensity??0,.18);m.envMapIntensity=(m.envMapIntensity??1)*.85;}
 else{m.roughness=THREE.MathUtils.clamp(m.roughness??.5,.33,.85);m.envMapIntensity=(m.envMapIntensity??1)*.78;}
 return true;
}
// Depth-dependent atmospheric approximation, not a volumetric scattering simulation.
// The existing fog shader is reused, no transparent geometry or additional draw calls.
export function depthAtmosphere(p,mobile){
 const {hangar,rack,security,ops}=localLightWeights(p);
 return (mobile?.55:1)*(.006*hangar+.003*rack+.004*security+.002*ops);
}
// Slow local changes to existing status LEDs, deterministic in scroll position.
// Avoid rapid strobing, idle-render changes, camera motion or any new moving geometry.
export function equipmentAccent(p,phase,id){
 const {rack,ops}=localLightWeights(p),w=id==='servers'?rack:id==='bridge'?ops:0;
 return 1+w*.045*(Math.sin(p*36+phase*.91)+1);
}
