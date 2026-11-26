import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
const K='kenney/';
export const placements=[
 {id:'pcb',file:'pcb/circuit_board.gltf',position:[0,-1.7,0],size:23,center:true},
 {id:'entry-door',file:'corridor-door.glb',position:[18,.25,-24],scale:2.1,portal:true},
 {id:'server-room',file:'server-room.glb',position:[-22,-1.5,-75],scale:3,room:true},
 {id:'hologram-projector',file:'hologram-projector.glb',position:[-13.4,.2,-71],size:2.5,projector:true},
 {id:'reactor-room',file:'reactor-room.glb',position:[-6,-1.5,-124],scale:1.25,shell:true},
 {id:'structure-panel',file:K+'space-station-kit/structure-panel.glb',position:[-19,-.9,-48],size:5,kenney:true},
 {id:'floor-panel',file:K+'space-station-kit/floor-panel.glb',position:[3.5,-2,-48],size:4.3,kenney:true},
 {id:'wall-detail',file:K+'space-station-kit/wall-detail.glb',position:[-18,2.1,-53],size:4.8,kenney:true},
 {id:'balcony-floor',file:K+'space-station-kit/balcony-floor.glb',position:[-15,1.0,-124],size:4,kenney:true},
 {id:'balcony-rail',file:K+'space-station-kit/balcony-rail.glb',position:[-15,1.8,-124],size:4,kenney:true},
 {id:'cables',file:K+'modular-space-kit/cables.glb',position:[-3,-1.1,-45],size:5.2,kenney:true},
 {id:'stairs-wide',file:K+'modular-space-kit/stairs-wide.glb',position:[-15,0,-119],size:4.6,kenney:true},
 {id:'gate',file:K+'modular-space-kit/gate.glb',position:[7,-.4,-106],size:4.3,kenney:true}
];
export function portalOpen(p){const smooth=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x)};return smooth((p-.125)/.035)*(1-smooth((p-.208)/.045));}
export function createComposition(renderer,scene,disposeRoot,requestDraw){
 const ktx=new KTX2Loader().setTranscoderPath(import.meta.env.BASE_URL+'models/basis/').detectSupport(renderer);
 const loader=new GLTFLoader().setKTX2Loader(ktx).setMeshoptDecoder(MeshoptDecoder);
 const loaded=new Map(),pending=new Set(),failures=new Set(),bones=[];let disposed=false,last=0;
 const clipVec=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 // Only keep the far perimeter of the merged reactor hall. It is an architectural cutaway,
 // not the fictional reactor. All vertices must lie outside the protected core radius.
 function cutShell(root){
  root.updateMatrixWorld(true);
  root.traverse(o=>{
   if(o.name==='ceiling'||o.name==='wall_front'){o.visible=false;return;}
   if(!o.isMesh||!o.geometry?.attributes.position||o.name==='ceiling')return;
   if(o.parent?.name==='ceiling'||o.parent?.name==='wall_front')return;
   const g=o.geometry,attr=g.attributes.position,idx=g.index,keep=[],count=idx?.count??attr.count;
   for(let i=0;i+2<count;i+=3){const j=idx?idx.getX(i):i,k=idx?idx.getX(i+1):i+1,l=idx?idx.getX(i+2):i+2;
    clipVec.fromBufferAttribute(attr,j).applyMatrix4(o.matrixWorld);b.fromBufferAttribute(attr,k).applyMatrix4(o.matrixWorld);c.fromBufferAttribute(attr,l).applyMatrix4(o.matrixWorld);
    if([clipVec,b,c].every(v=>Math.hypot(v.x,v.z)>4.3&&v.z<-2.4))keep.push(j,k,l);
   }
   const next=g.clone();next.setIndex(keep);next.clearGroups();o.geometry=next;g.dispose();if(!keep.length)o.visible=false;
  });
 }
 function adapt(root,spec){
  // Existing asset textures retain detail. Only tint materials; KTX2 textures stay compressed.
  if(spec.shell)cutShell(root);
  if(spec.room)for(const n of ['ceiling_lod1','wall_front_lod1','walls_lod1']){const o=root.getObjectByName(n);if(o)o.visible=false;}
  if(spec.projector){const o=root.getObjectByName('hologram-projector_hologram_glow');if(o)o.visible=false;}
  const seen=new Set();
  root.traverse(o=>{
   if(spec.portal&&/^(door_left|door_right)$/.test(o.name))bones.push({id:spec.id,o,x:o.position.x,sign:o.name==='door_left'?1:-1});
   if(spec.room&&/^rack_[AB]\d+_door$/.test(o.name))bones.push({id:spec.id,o,y:o.rotation.y,sign:o.name.includes('_A')?1:-1});
   if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
    if(seen.has(m))continue;seen.add(m);
    if(spec.kenney){if(m.map)m.map=null;m.color?.setHex(0x46585a);m.metalness=.66;m.roughness=.43;}
    else if(!/glass|glow|led|light|screen|holo/.test(m.name??'')){m.color?.multiply(new THREE.Color(spec.id==='pcb'?0x8ca5a1:0x89999a));m.roughness=Math.max(.36,m.roughness??.4);}
    else if(/led|glow/.test(m.name??'')){m.emissive?.setHex(0x7ce9b3);m.emissiveIntensity=.7;}
   }
  });
  const holder=new THREE.Group();holder.name='composition-'+spec.id;holder.add(root);
  if(spec.size){root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());const s=spec.size/Math.max(size.x,size.y,size.z);root.scale.multiplyScalar(s);root.position.x-=center.x*s;root.position.z-=center.z*s;root.position.y-=(spec.center?center.y:bounds.min.y)*s;}else root.scale.multiplyScalar(spec.scale??1);
  holder.position.set(...spec.position);scene.add(holder);return holder;
 }
 async function acquire(spec){if(pending.has(spec.id))return;pending.add(spec.id);try{const g=await loader.loadAsync(import.meta.env.BASE_URL+'models/composition/'+spec.file);if(disposed){disposeRoot(g.scene);return;}const holder=adapt(g.scene,spec);loaded.set(spec.id,{spec,holder});update(last);requestDraw();}catch(e){failures.add(spec.id);console.warn('Composition asset failed',spec.id,e);}}
 function update(p){last=p;const z=lastZ;for(const spec of placements)if(Math.abs(spec.position[2]-z)<36)acquire(spec);for(const {spec,holder} of loaded.values())holder.visible=Math.abs(spec.position[2]-z)<(spec.shell?28:31);for(const a of bones){if(a.id==='entry-door')a.o.position.x=a.x+a.sign*1.04*portalOpen(p);else{const q=Math.max(0,Math.min(1,(p-.47)/.08));a.o.rotation.y=a.y+a.sign*.30*Math.sin(Math.PI*q);}}}
 let lastZ=22;
 return {loaded,failures,update(p,z){lastZ=z;update(p);},pose(){return bones.map(a=>[a.id,a.o.name,a.o.position.x,a.o.rotation.y]);},dispose(){disposed=true;for(const {holder} of loaded.values()){holder.removeFromParent();disposeRoot(holder);}ktx.dispose();}};
}
