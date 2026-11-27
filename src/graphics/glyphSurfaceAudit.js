import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';
// Diagnostic only: broad-phase AABB, narrow-phase triangle surface
// intersection at actual rendered sampled poses. Does NOT prove containment,
// continuous swept clearance, or deforming GPU-only facility geometry.
export function createGlyphSurfaceAudit(){
 const cache=new Map(),m=new THREE.Matrix4(),instance=new THREE.Matrix4(),relative=new THREE.Matrix4();
 function entry(key,source){if(cache.has(key))return cache.get(key);const geometry=new THREE.BufferGeometry(),a=source.attributes.position,xyz=new Float32Array(a.count*3);for(let i=0;i<a.count;i++){xyz[i*3]=a.getX(i);xyz[i*3+1]=a.getY(i);xyz[i*3+2]=a.getZ(i);}geometry.setAttribute('position',new THREE.BufferAttribute(xyz,3));if(source.index)geometry.setIndex(source.index.clone());geometry.computeBoundingBox();const v={geometry,bvh:new MeshBVH(geometry)};cache.set(key,v);return v;}
 function glyph(item){if(cache.has(item))return cache.get(item);const {data,glyph:g}=item,xyz=new Float32Array(g.count*3);for(let j=0;j<g.count;j++){const k=(g.start+j)*3;xyz[j*3]=data.positions[k]-g.center.x;xyz[j*3+1]=data.positions[k+1]-g.center.y;xyz[j*3+2]=data.positions[k+2]-g.center.z;}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(xyz,3));geometry.computeBoundingBox();const v={geometry,bvh:new MeshBVH(geometry)};cache.set(item,v);return v;}
 function inspect(items,poses,roots){const moving=items.map((item,i)=>{const e=glyph(item),p=poses[i],world=new THREE.Matrix4().compose(new THREE.Vector3(...p.position),new THREE.Quaternion(...p.rotation),new THREE.Vector3().setScalar(p.scale));return {id:item.id,e,world,box:e.geometry.boundingBox.clone().applyMatrix4(world),inFrame:p.inFrame};});const fixed=[],skipped=[];
 for(const [rootId,root] of roots){if(!root.visible)continue;root.updateWorldMatrix(true,true);root.traverseVisible(o=>{if(!o.isMesh||!o.geometry?.attributes.position||o.geometry.attributes.position.count<3)return;if(o.isSkinnedMesh||Object.keys(o.geometry.morphAttributes??{}).length){skipped.push({root:rootId,name:o.name});return;}const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){m.copy(o.matrixWorld);if(o.isInstancedMesh){o.getMatrixAt(i,instance);m.multiply(instance);}fixed.push({key:g,world:m.clone(),box:g.boundingBox.clone().applyMatrix4(m),root:rootId,name:o.name,instance:o.isInstancedMesh?i:null});}});}
 const hits=[],glyphHits=[];let broadPhase=0,glyphBroadPhase=0;
 for(const a of moving)for(const b of fixed){if(!a.box.intersectsBox(b.box))continue;broadPhase++;const e=entry(b.key,b.key);relative.copy(a.world).invert().multiply(b.world);if(a.e.bvh.intersectsGeometry(e.geometry,relative))hits.push({glyph:a.id,root:b.root,object:b.name,instance:b.instance,inFrame:a.inFrame});}
 for(let i=0;i<moving.length;i++)for(let j=i+1;j<moving.length;j++){const a=moving[i],b=moving[j];if(!a.box.intersectsBox(b.box))continue;glyphBroadPhase++;relative.copy(a.world).invert().multiply(b.world);if(a.e.bvh.intersectsGeometry(b.e.geometry,relative))glyphHits.push({a:a.id,b:b.id,bothInFrame:a.inFrame&&b.inFrame});}
 return {glyphs:moving.length,facilityMeshes:fixed.length,broadPhase,glyphBroadPhase,facilityHits:hits,glyphHits,skipped,note:'Sampled triangle surfaces only; not solid containment or swept contact certification.'};
 }
 return {inspect,dispose(){for(const e of cache.values())e.geometry.dispose();cache.clear();}};
}
