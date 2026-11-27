import * as THREE from 'three';
// Diagnostics only. Frustum and material estimates are not occlusion queries.
const finite=v=>Number.isFinite(v)?v:null;
export function describeMaterial(material){
 const maps=Object.entries(material).filter(([,v])=>v?.isTexture).map(([slot,t])=>({slot,width:finite(t.image?.width),height:finite(t.image?.height),anisotropy:finite(t.anisotropy),colorSpace:t.colorSpace??null,compressed:!!t.isCompressedTexture,mipLevels:t.mipmaps?.length??0})).sort((a,b)=>a.slot.localeCompare(b.slot));
 return {name:material.name||'(unnamed)',type:material.type,roughness:finite(material.roughness),metalness:finite(material.metalness),transmission:finite(material.transmission),opacity:finite(material.opacity),envMapIntensity:finite(material.envMapIntensity),emissiveIntensity:finite(material.emissiveIntensity),normalScale:material.normalScale?.toArray().map(finite)??null,color:material.color?.toArray().map(finite)??null,transparent:!!material.transparent,depthWrite:!!material.depthWrite,alphaTest:finite(material.alphaTest),maps};
}
export function inspectRenderInventory(roots,camera,renderer){
 camera.updateMatrixWorld(true);
 const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 const rows=[];
 for(const [id,root] of roots){
  const geometries=new Set(),materials=new Set(),textures=new Set(),buffers=new Set(),repeated=new Map();
  let meshes=0,visibleMeshes=0,frustumMeshes=0,triangleEstimate=0,frustumTriangleEstimate=0,transmissionMeshes=0,transparentMeshes=0,geometryBytes=0;
  root.traverse(o=>{
   if(!o.isMesh||!o.geometry)return;meshes++;
   const g=o.geometry,ms=Array.isArray(o.material)?o.material:[o.material],count=(g.index?.count??g.attributes.position?.count??0)/3,instances=o.isInstancedMesh?o.count:1;
   triangleEstimate+=count*instances;
   if(!geometries.has(g)){geometries.add(g);for(const a of [g.index,...Object.values(g.attributes)]){const arr=a?.isInterleavedBufferAttribute?a.data.array:a?.array;if(arr&&!buffers.has(arr)){buffers.add(arr);geometryBytes+=arr.byteLength;}}}
   for(const m of ms.filter(Boolean)){materials.add(m);for(const t of Object.values(m))if(t?.isTexture)textures.add(t);}
   const key=g.uuid+':'+ms.map(m=>m?.uuid).join(':');repeated.set(key,(repeated.get(key)??0)+1);
   let visible=true;for(let n=o;n;n=n.parent)if(!n.visible){visible=false;break;}
   if(!visible)return;visibleMeshes++;
   if(!o.frustumCulled||frustum.intersectsObject(o)){frustumMeshes++;frustumTriangleEstimate+=count*instances;if(ms.some(m=>(m?.transmission??0)>0))transmissionMeshes++;if(ms.some(m=>m?.transparent))transparentMeshes++;}
  });
  rows.push({id,meshes,visibleMeshes,frustumMeshes,triangleEstimate,frustumTriangleEstimate,transmissionMeshes,transparentMeshes,uniqueGeometries:geometries.size,uniqueMaterials:materials.size,materialDetails:[...materials].map(describeMaterial).sort((a,b)=>a.name.localeCompare(b.name)||a.type.localeCompare(b.type)),uniqueTextures:textures.size,geometryBytes,repeatedGeometryMaterialGroups:[...repeated.values()].filter(x=>x>1).sort((a,b)=>b-a)});
 }
 return {roots:rows,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,renderTextures:renderer.info.memory.textures,note:'Per-root frustum/triangle and geometry-buffer estimates; not occlusion, draw-call or VRAM attribution. Shared assets may be counted across roots. Diagnostic traversal after measured frame.'};
}
