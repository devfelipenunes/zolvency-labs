import * as THREE from 'three';
import {spatialPose} from './spatialNarrative.js';
import {ramp} from './facilityCamera.js';
const start=.415,cut=.51,end=.59;
const visible=o=>{for(let n=o;n;n=n.parent)if(!n.visible)return false;return true;};
const V=a=>new THREE.Vector3(...a);
export function wallCutEnvelope(p){return {active:p>=start&&p<=end,side:p<cut?'server':'corridor',approach:p<cut?ramp(p,start,cut):1-ramp(p,cut,end),mask:ramp(p,.485,cut)*(1-ramp(p,cut,.535))};}
// An opt-in editorial splice: camera never crosses the wall itself.
export function createWallCut(roots){
 const ray=new THREE.Raycaster(),cache=new Map();
 function endpoint(side,mobile){
  const root=roots.get(side==='server'?'servers':'corridor');if(!root)return null;
  const key=side+mobile;if(cache.has(key))return cache.get(key);
  const base=spatialPose(side==='server'?start:end,mobile),eye=V(base.position),dir=V(base.target).sub(eye).normalize();
  ray.set(eye,dir);ray.near=.4;ray.far=10;
  const h=ray.intersectObject(root,true).find(h=>visible(h.object)&&h.face&&!/glass|door|screen|light|glow/i.test(h.object.name+' '+h.object.material?.name));
  if(!h)return null;
  const travel=Math.max(0,h.distance-.26),position=eye.clone().addScaledVector(dir,travel).toArray();
  const result={base,position,direction:dir.toArray(),mesh:h.object.name,distance:h.distance};cache.set(key,result);return result;
 }
 return {pose(p,mobile){
  const e=wallCutEnvelope(p),fallback=spatialPose(p,mobile);if(!e.active)return {pose:fallback,mask:0,active:false};
  const a=endpoint('server',mobile),b=endpoint('corridor',mobile);if(!a||!b)return {pose:fallback,mask:0,active:false,reason:'no matched opaque wall'};
  const v=e.side==='server'?a:b,k=e.approach;
  const position=v.base.position.map((x,i)=>x+(v.position[i]-x)*k);
  const target=position.map((x,i)=>x+v.direction[i]*5);
  return {pose:{position,target,fov:v.base.fov+(43-v.base.fov)*k},mask:e.mask,active:true,mesh:v.mesh,side:e.side};
 }};
}
// Inspect the original hangar mesh rather than guessing that a mezzanine is a lab.
export function auditSuspension(roots){
 const hall=roots.get('hangar'),q=roots.get('quantum');if(!hall||!q)return null;
 const box=new THREE.Box3().setFromObject(q),size=box.getSize(new THREE.Vector3()),ray=new THREE.Raycaster(),rows=[];
 for(const x of [-4,0,4.7])for(const z of [-11,-8.6,-5]){
  ray.set(new THREE.Vector3(x,.2,z),new THREE.Vector3(0,1,0));ray.near=.01;ray.far=16;
  const hits=ray.intersectObject(hall,true).filter(h=>visible(h.object)).map(h=>({y:h.point.y,node:h.object.name}));
  rows.push({x,z,hits:hits.slice(0,5)});
 }
 return {modelDimensions:size.toArray(),mountableParts:q.getObjectByName('quantum-computer_body')?.isMesh===true?'single body; base and support not separable as nodes':'inspect hierarchy',samples:rows,decision:'No automatic suspension: verify overhead structure, load-bearing visual support and model base independently.'};
}

 // Default editorial transition: optical zoom and a short fully masked cut.
 // Both endpoints stay on the already audited rail. No claim of a physical wall traversal.
 export function editorialCut(p,mobile=false){
  const base=spatialPose(p,mobile),a=.415,b=.51,z=.59;
  if(p<a||p>z)return {pose:base,mask:0,active:false};
  const source=p<b,t=source?ramp(p,a,b):ramp(p,b,z);
  const q=source?a:z;
  const pose=spatialPose(q,mobile),zoom=source?t:1-t;
  const mask=ramp(p,.485,.505)*(1-ramp(p,.515,.54));
  return {pose:{...pose,fov:pose.fov+((mobile?48:36)-pose.fov)*zoom},mask,active:true,side:source?'server':'corridor',mesh:'editorial optical cut'};
 }
