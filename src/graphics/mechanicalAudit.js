import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';

// Diagnostic narrow phase only. This detects triangle surface intersections at
// sampled poses, not solid containment or continuous collision certification.
// Intended rail/support contacts are reported, never silently whitelisted.
export function createMechanicalAudit(){
 const cache=new Map();
 const box=new THREE.Box3(),otherBox=new THREE.Box3(),relative=new THREE.Matrix4();
 function get(g){
  if(cache.has(g))return cache.get(g);
  const a=g.attributes.position,xyz=new Float32Array(a.count*3);
  for(let i=0;i<a.count;i++){xyz[i*3]=a.getX(i);xyz[i*3+1]=a.getY(i);xyz[i*3+2]=a.getZ(i);}
  const copy=new THREE.BufferGeometry();copy.setAttribute('position',new THREE.BufferAttribute(xyz,3));
  if(g.index)copy.setIndex(g.index.clone());copy.computeBoundingBox();
  const bvh=new MeshBVH(copy);copy.boundsTree=bvh;
  const entry={geometry:copy,bvh};cache.set(g,entry);return entry;
 }
 const valid=o=>o.isMesh&&o.geometry?.attributes.position?.count>=3;
 function inspect(root,moving,{details=false}={}){
  if(!root||!moving)throw Error('mechanical audit requires root and moving subtree');
  const dynamic=[],fixed=[];moving.traverse(o=>{if(valid(o))dynamic.push(o);});
  const movingSet=new Set(dynamic);
  root.traverse(o=>{if(valid(o)&&!movingSet.has(o))fixed.push(o);});
  if(!dynamic.length||!fixed.length)throw Error('empty mechanical audit geometry');
  root.updateWorldMatrix(true,true);
  const hits=[];let broadPhasePairs=0;
  for(const m of dynamic){
   const mg=m.geometry;if(!mg.boundingBox)mg.computeBoundingBox();box.copy(mg.boundingBox).applyMatrix4(m.matrixWorld);
   for(const n of fixed){
    const ng=n.geometry;if(!ng.boundingBox)ng.computeBoundingBox();otherBox.copy(ng.boundingBox).applyMatrix4(n.matrixWorld);
    if(!box.intersectsBox(otherBox))continue;broadPhasePairs++;
    const a=get(mg),b=get(ng);
    relative.copy(m.matrixWorld).invert().multiply(n.matrixWorld);
    if(a.bvh.intersectsGeometry(b.geometry,relative)){const hit={moving:m.name,other:n.name};if(details){const intersection=box.clone().intersect(otherBox);const bounds=b=>({min:b.min.toArray(),max:b.max.toArray()});hit.movingBounds=bounds(box);hit.otherBounds=bounds(otherBox);hit.overlapBounds=bounds(intersection);}hits.push(hit);}
   }
  }
  return {movingMeshes:dynamic.length,otherMeshes:fixed.length,broadPhasePairs,hits:hits.sort((a,b)=>(a.moving+'|'+a.other).localeCompare(b.moving+'|'+b.other))};
 }
 return {inspect,dispose(){for(const x of cache.values())x.geometry.dispose();cache.clear();}};
}
