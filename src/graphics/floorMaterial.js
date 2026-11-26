import * as THREE from 'three';

// Identify actual low, upward-facing triangles in the static hangar shell.
// Keep the original vertex attributes and every triangle; only regroup indices
// for a separately tunable copy of the source material. No new scenery.
export function partitionFloor(geometry,matrix,{height=.16,normalY=.85}={}){
 const pos=geometry.attributes.position;if(!pos)return null;
 const index=geometry.index,count=index?.count??pos.count;
 if(count%3!==0)return null;
 const groups=geometry.groups;
 if(groups.length&&(groups.length!==1||groups[0].start!==0||groups[0].count!==count||groups[0].materialIndex!==0))return null;
 const floor=[],rest=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),ab=new THREE.Vector3(),ac=new THREE.Vector3(),n=new THREE.Vector3();
 let area=0;
 for(let i=0;i<count;i+=3){
  const ia=index?index.getX(i):i,ib=index?index.getX(i+1):i+1,ic=index?index.getX(i+2):i+2;
  a.fromBufferAttribute(pos,ia).applyMatrix4(matrix);b.fromBufferAttribute(pos,ib).applyMatrix4(matrix);c.fromBufferAttribute(pos,ic).applyMatrix4(matrix);
  n.crossVectors(ab.subVectors(b,a),ac.subVectors(c,a));const len=n.length();
  const selected=len>1e-8&&n.y/len>=normalY&&Math.max(Math.abs(a.y),Math.abs(b.y),Math.abs(c.y))<=height;
  (selected?floor:rest).push(ia,ib,ic);if(selected)area+=len*.5;
 }
 if(!floor.length)return null;
 return {indices:rest.concat(floor),restCount:rest.length,floorCount:floor.length,area};
}
export function isolateHangarFloor(root,{neutral=false}={}){
 root.updateMatrixWorld(true);
 const shell=root.getObjectByName('hangar_bay');if(!shell)return {faces:0,area:0,changed:[],reason:'hangar_bay missing'};
 const changed=[];let faces=0,area=0;
 shell.traverse(o=>{
  if(!o.isMesh||Array.isArray(o.material)||!o.material?.isMeshStandardMaterial||o.material.transparent||(o.material.transmission??0)>.001||/glass|light|led|screen|glow|holo/i.test(o.material.name??''))return;
  const split=partitionFloor(o.geometry,o.matrixWorld);if(!split)return;
  const original=o.material,material=original.clone(),geometry=o.geometry.clone();
  material.name='isolated-hangar-floor';
  if(!neutral){material.color.multiply(new THREE.Color(0x536269));
  material.roughness=.88;material.envMapIntensity=(original.envMapIntensity??1)*.45;
  material.normalScale?.multiplyScalar(.55);}
  geometry.setIndex(split.indices);geometry.clearGroups();
  if(split.restCount)geometry.addGroup(0,split.restCount,0);
  geometry.addGroup(split.restCount,split.floorCount,1);
  o.geometry=geometry;o.material=[original,material];
  faces+=split.floorCount/3;area+=split.area;changed.push({geometry,material,node:o.name});
 });
 return {faces,area,changed,reason:faces?'':'no eligible floor faces'};
}
