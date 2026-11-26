import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export function materials(){
 return {titanium:new THREE.MeshStandardMaterial({color:0xc6cfce,metalness:.78,roughness:.28}),gold:new THREE.MeshStandardMaterial({color:0xb5a278,metalness:.83,roughness:.27}),dark:new THREE.MeshStandardMaterial({color:0x243237,metalness:.55,roughness:.43}),accent:new THREE.MeshStandardMaterial({color:0xbcebd3,metalness:.26,roughness:.25,emissive:0x68a58a,emissiveIntensity:1.15})};
}
export function geometries(){
 const ring=new THREE.TorusGeometry(.43,.07,6,32);ring.rotateX(Math.PI/2);
 return {box:new RoundedBoxGeometry(1,1,1,1,.075),sphere:new THREE.SphereGeometry(.5,12,8),cylinder:new THREE.CylinderGeometry(.5,.5,1,24,1),torus:ring};
}
export function partMatrix(part,position=part.position,rotation=[0,0,0]){
 const scale=[...part.size];if(part.shape==='torus')scale[1]/=.14;
 return new THREE.Matrix4().compose(new THREE.Vector3(...position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale));
}
// Bake per material into reusable real meshes, retaining independent authoring blueprints.
export function bakedModel(parts,geo,mats){
 const root=new THREE.Group();
 for(const [kind,material] of Object.entries(mats)){
 const gs=parts.filter(o=>o.kind===kind).map(o=>{const g=geo[o.shape].clone();g.applyMatrix4(partMatrix(o));if(g.index){const n=g.toNonIndexed();g.dispose();return n;}return g;});
 if(!gs.length)continue;const g=mergeGeometries(gs,false);gs.forEach(x=>x.dispose());if(!g)throw Error('Asset geometry merge failed');const mesh=new THREE.Mesh(g,material);mesh.name=kind;root.add(mesh);
 }return root;
}
