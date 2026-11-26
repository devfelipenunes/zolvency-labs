import * as THREE from 'three';
// Only authored static opaque rack-door mesh leaves. Do not batch glass, moving
// racks, alpha tested surfaces, skinned meshes or arbitrary scenery. Group
// by the same geometry/material AND render semantics; preserve transforms.
export function batchStaticRackMeshes(root,animatedNodes=[]){
 const animated=new Set(animatedNodes),groups=new Map(),batches=[];
 root.updateWorldMatrix(true,true);
 const inv=new THREE.Matrix4().copy(root.matrixWorld).invert();
 root.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.children.length||!/^rack_[AB]\d+_door_mesh(?:_lod\d+)?$/i.test(o.name))return;
  const m=o.material,g=o.geometry;
  if(!g||Array.isArray(m)||!m?.isMeshStandardMaterial||!m.visible||m.transparent||m.alphaTest>0||(m.transmission??0)>0||m.opacity!==1||m.clippingPlanes?.length||o.morphTargetInfluences?.length||o.customDepthMaterial||o.customDistanceMaterial||o.layers.mask!==1||!o.frustumCulled)return;
  for(let n=o;n&&n!==root;n=n.parent)if(!n.visible||animated.has(n))return;
  const matrix=new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld);
  if(matrix.determinant()<=0)return;
  const key=[g.uuid,m.uuid,o.castShadow,o.receiveShadow,o.renderOrder].join(':');
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push({o,matrix});
 });
 for(const members of groups.values()){
  if(members.length<2)continue;
  const first=members[0].o,b=new THREE.InstancedMesh(first.geometry,first.material,members.length);
  b.name='static-rack-batch:'+first.name;b.castShadow=first.castShadow;b.receiveShadow=first.receiveShadow;b.renderOrder=first.renderOrder;
  for(let i=0;i<members.length;i++)b.setMatrixAt(i,members[i].matrix);
  b.instanceMatrix.needsUpdate=true;b.computeBoundingBox();b.computeBoundingSphere();
  // Remove leaves from the render/raycast tree rather than duplicating geometry.
  // Restore them on demand for diagnostics; parents never change.
  const originals=members.map(({o})=>({o,parent:o.parent}));for(const {o} of originals)o.removeFromParent();
  root.add(b);batches.push({mesh:b,originals});
 }
 return {batches,groups:batches.length,sourceMeshes:batches.reduce((n,b)=>n+b.originals.length,0),potentialDrawReduction:batches.reduce((n,b)=>n+b.originals.length-1,0),dispose(){for(const b of batches){b.mesh.removeFromParent();b.mesh.dispose();for(const {o,parent} of b.originals)parent.add(o);}}};
}
