import * as THREE from 'three';
import {spatialPose} from './spatialNarrative.js';
import {ramp} from './facilityCamera.js';
const start=.415,cut=.51,end=.59;
const visible=o=>{for(let n=o;n;n=n.parent)if(!n.visible)return false;return true;};
const V=a=>new THREE.Vector3(...a);
export function wallCutEnvelope(p){return {active:p>=start&&p<=end,side:p<cut?'server':'corridor',approach:p<cut?ramp(p,start,cut):1-ramp(p,cut,end),mask:ramp(p,.485,cut)*(1-ramp(p,cut,.535))};}
// An opt-in editorial splice: camera never crosses the wall itself.
export function createWallCut(roots,clearance=null,{deferred=false}={}){
 const ray=new THREE.Raycaster(),cache=new Map(),work=new Map();let visiting=false,choice=null;
 function* findEndpoint(side,mobile){
  const root=roots.get(side==='server'?'servers':'corridor');if(!root)return null;
  const key=side+mobile;if(cache.has(key))return cache.get(key);
  const base=spatialPose(side==='server'?start:end,mobile),eye=V(base.position),dir=V(base.target).sub(eye).normalize();
  const cam=new THREE.PerspectiveCamera(base.fov,mobile?.46:1.6,.075,65);cam.position.copy(eye);cam.lookAt(V(base.target));cam.updateMatrixWorld(true);cam.updateProjectionMatrix();
  const all=[...roots.values()],candidates=[];
  for(const x of [0,-.25,.25,-.5,.5,-.72,.72])for(const y of [0,.25,-.25,.5]){
   yield;
   ray.setFromCamera(new THREE.Vector2(x,y),cam);ray.near=.35;ray.far=7;
   const h=ray.intersectObjects(all,true).find(h=>visible(h.object));if(!h?.face)continue;
   let o=h.object;while(o&&o!==root)o=o.parent;if(!o)continue;
   const mat=Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material;
   if(mat?.transparent||/glass|door|screen|light|glow|led/i.test(h.object.name+' '+mat?.name))continue;
   const n=h.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize(),d=h.point.clone().sub(eye).normalize();
   if(Math.abs(n.y)>.42||Math.abs(n.dot(d))<.55)continue;
   const travel=Math.min(1.4,Math.max(0,h.distance-.32)),position=eye.clone().addScaledVector(d,travel);
   if(travel<.12||!clearance)continue;
   let safe=true;for(let j=0;j<=16;j++){yield;const q=eye.clone().lerp(position,j/16);if(clearance(q)<.18){safe=false;break;}}if(!safe)continue;
   const verify=new THREE.PerspectiveCamera(mobile?48:36,mobile?.46:1.6,.075,65);verify.position.copy(position);verify.lookAt(position.clone().add(d));verify.updateMatrixWorld(true);verify.updateProjectionMatrix();
   let hits=0;for(const u of [-.8,-.4,0,.4,.8])for(const v of [-.8,-.4,0,.4,.8]){yield;ray.setFromCamera(new THREE.Vector2(u,v),verify);ray.near=.075;ray.far=3;const match=ray.intersectObjects(all,true).find(h=>visible(h.object));if(match?.object===h.object)hits++;}
   if(hits>=21)candidates.push({base,position:position.toArray(),direction:d.toArray(),mesh:h.object.name,distance:h.distance,coverage:hits/25,score:hits-Math.abs(x)*2-Math.abs(y)});
  }
  const result=candidates.sort((a,b)=>b.score-a.score)[0]??null;cache.set(key,result);return result;
 }
 function endpoint(side,mobile){const key=side+mobile;if(cache.has(key))return cache.get(key);if(deferred)return null;const it=findEndpoint(side,mobile);let s=it.next();while(!s.done)s=it.next();return s.value;}
 function prepareStep(mobile){for(const side of ['server','corridor']){const key=side+mobile;if(cache.has(key))continue;let it=work.get(key);if(!it){it=findEndpoint(side,mobile);work.set(key,it);}const s=it.next();if(s.done){cache.set(key,s.value??null);work.delete(key);}return true;}return false;}
 return {prepareStep,ready(mobile){return cache.has('server'+mobile)&&cache.has('corridor'+mobile);},leave(){visiting=false;choice=null;},pose(p,mobile){
  const e=wallCutEnvelope(p),fallback=spatialPose(p,mobile);if(!e.active){visiting=false;choice=null;return {pose:fallback,mask:0,active:false};}
  if(!visiting||!deferred){visiting=true;choice=[endpoint('server',mobile),endpoint('corridor',mobile)];}
  const [a,b]=choice;if(!a||!b)return {pose:fallback,mask:0,active:false,reason:'no matched opaque wall'};
  const v=e.side==='server'?a:b,k=e.approach;
  const position=v.base.position.map((x,i)=>x+(v.position[i]-x)*k);
  const baseDir=V(v.base.target).sub(V(v.base.position)).normalize(),direction=baseDir.lerp(V(v.direction),k).normalize();const target=position.map((x,i)=>x+direction.getComponent(i)*5);
  return {pose:{position,target,fov:v.base.fov+(43-v.base.fov)*k},mask:e.mask,active:true,mesh:v.mesh,coverage:v.coverage,side:e.side};
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

 // Directed editorial cuts; all fallback endpoints are existing collision-audited poses.
 const edits=[{a:.415,b:.51,z:.59,name:'server-to-security',zoom:34},{a:.755,b:.81,z:.865,name:'operations-to-quantum',zoom:40}];
 export function directedCut(p,mobile=false,wall=null,poseFor=spatialPose){
  const e=edits.find(s=>p>=s.a&&p<=s.z);
  if(!e){wall?.leave?.();return {pose:poseFor(p,mobile),mask:0,active:false};}
  const source=p<e.b,q=source?e.a:e.z,k=source?ramp(p,e.a,e.b):1-ramp(p,e.b,e.z),pose=poseFor(q,mobile);
  const mask=ramp(p,e.b-.024,e.b-.005)*(1-ramp(p,e.b+.005,e.b+.024));
  if(e.name!=='server-to-security')wall?.leave?.();
  if(e.name==='server-to-security'&&wall){
   const candidate=wall.pose(p,mobile);
   if(candidate.active)return {...candidate,mask,name:e.name};
  }
  return {pose:{...pose,fov:pose.fov+((e.zoom+(mobile?10:0))-pose.fov)*k},mask,active:true,side:source?'outgoing':'incoming',name:e.name,mesh:'optical editorial fallback'};
 }
