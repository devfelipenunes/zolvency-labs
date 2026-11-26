import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';
// Accurate closest triangle surface for each visible decoded mesh, including animated doors.
// Copies only collision geometry. No geometry created by this module is rendered.
export function createMeshAudit(){
 const cache=new Map(),local=new THREE.Vector3(),scale=new THREE.Vector3(),inverse=new THREE.Matrix4();
 function get(g){if(cache.has(g))return cache.get(g);const a=g.attributes.position,xyz=new Float32Array(a.count*3);
 for(let i=0;i<a.count;i++){xyz[i*3]=a.getX(i);xyz[i*3+1]=a.getY(i);xyz[i*3+2]=a.getZ(i);}
 const copy=new THREE.BufferGeometry();copy.setAttribute('position',new THREE.BufferAttribute(xyz,3));if(g.index)copy.setIndex(g.index.clone());copy.computeBoundingBox();
 const item={geometry:copy,bvh:new MeshBVH(copy),box:copy.boundingBox};cache.set(g,item);return item;
 }
 function measure(roots,position,max=.8){let distance=max,object=null;
 for(const root of roots)root.traverseVisible(o=>{if(!o.isMesh||!o.geometry?.attributes.position)return;const g=o.geometry;scale.setFromMatrixScale(o.matrixWorld);const s=Math.min(scale.x,scale.y,scale.z);if(s<1e-8)return;local.copy(position).applyMatrix4(inverse.copy(o.matrixWorld).invert());if(!g.boundingBox)g.computeBoundingBox();if(g.boundingBox.distanceToPoint(local)*s>=distance)return;const item=get(g);
 const hit=item.bvh.closestPointToPoint(local,{},0,distance/s);if(hit&&hit.distance*s<distance){distance=hit.distance*s;object=root.name+'/'+o.name;}});
 return {distance,object};
 }
 return {measure,dispose(){for(const x of cache.values())x.geometry.dispose();cache.clear();}};
}
