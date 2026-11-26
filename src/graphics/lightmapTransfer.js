import * as THREE from 'three';

// Offline proof only. A candidate must identify the exact source asset and every
// triangle of the target mesh. Reject partial mappings, LOD substitution, or
// overlapping/undersampled atlases instead of assigning arbitrary UV coordinates.
export function transferLightmapUV(geometry,{node,material,assetSHA256,mapping,uvAudit}){
 if(!/^[0-9a-f]{64}$/.test(assetSHA256??'')||assetSHA256!==mapping?.sourceSHA256)throw Error('lightmap source hash mismatch');
 if(!uvAudit||uvAudit.invalidTriangles||uvAudit.degenerateUVTriangles||uvAudit.overlapTexels||uvAudit.coverage<.2||uvAudit.subpixelTriangles>uvAudit.validTriangles*.05||uvAudit.islandPairsWithinExpandedPadding)throw Error('lightmap UV audit not acceptable');
 if(geometry.attributes.uv1)throw Error('existing secondary UV must be preserved');
 const count=geometry.index?.count??geometry.attributes.position.count;
 if(count%3!==0)throw Error('non-triangle source geometry');
 const rows=new Map();
 if(mapping.sourceFaces.length!==mapping.faces.length)throw Error('mapping length mismatch');
 for(let i=0;i<mapping.sourceFaces.length;i++){
  const f=mapping.sourceFaces[i];if(f.node!==node||f.material!==material)continue;
  if(rows.has(f.triangle))throw Error('duplicate triangle mapping');rows.set(f.triangle,{f,uv:mapping.faces[i]});
 }
 if(rows.size!==count/3)throw Error('incomplete triangle mapping');
 const uv=new Float32Array(count*2);
 for(let i=0;i<count/3;i++){
  const row=rows.get(i);if(!row||row.uv.length!==3)throw Error('missing triangle UV');
  for(let j=0;j<3;j++){
   const source=geometry.index?geometry.index.getX(i*3+j):i*3+j,corner=row.uv[j];
   if(row.f.sourceVertices[j]!==source||corner.vertex!==row.f.proxyVertices[j])throw Error('source triangle identity mismatch');
   if(!Array.isArray(corner.uv)||corner.uv.length!==2||!corner.uv.every(x=>Number.isFinite(x)&&x>=0&&x<=1))throw Error('invalid UV');
   uv.set(corner.uv,(i*3+j)*2);
  }
 }
 const out=geometry.index?geometry.toNonIndexed():geometry.clone();
 out.setAttribute('uv1',new THREE.BufferAttribute(uv,2));
 return out;
}
