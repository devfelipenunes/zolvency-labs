import * as THREE from 'three';
// Experimental helper. Caller must use the matching locked source, not a mobile LOD.
// Output is non-indexed with original attributes and two material groups.
export function transferFloorLightmap(geometry,{node,material,assetSHA256,mapping,audit}){
 const fail=message=>{throw Error(message);};
 if(!/^[0-9a-f]{64}$/.test(assetSHA256??'')||assetSHA256!==mapping?.sourceSHA256||mapping.bakePass!=='INDIRECT')fail('source or bake pass mismatch');
 if(!audit||audit.resolution!==mapping.resolution||audit.faces!==mapping.faces.length||audit.invalidTriangles||audit.degenerateUVTriangles||audit.overlapTexels||audit.islandPairsWithinExpandedPadding||audit.subpixelTriangles>audit.validTriangles*.05||audit.coverage<.2)fail('UV quality gate failed');
 if(geometry.attributes.uv1)fail('existing secondary UV');
 const count=geometry.index?.count??geometry.attributes.position.count;
 if(count%3||geometry.groups.length>1||geometry.groups.some(g=>g.start!==0||g.count!==count||g.materialIndex!==0))fail('unsupported source groups');
 if(mapping.sourceFaces.length!==mapping.faces.length||mapping.rectangles.length!==mapping.faces.length)fail('mapping lengths');
 const byTriangle=new Map(),size=mapping.resolution,pad=mapping.paddingTexels;
 if(!Number.isInteger(size)||!Number.isInteger(pad)||pad<8)fail('invalid atlas dimensions');
 for(let i=0;i<mapping.sourceFaces.length;i++){
  const f=mapping.sourceFaces[i],corners=mapping.faces[i],rect=mapping.rectangles[i];
  if(!Array.isArray(rect)||rect.length!==4||!rect.every(Number.isInteger))fail('invalid chart rectangle');
  const [x,y,w,h]=rect;if(x<0||y<0||w<=2*pad||h<=2*pad||x+w>size||y+h>size)fail('chart bounds');
  for(const [xx,yy,ww,hh] of mapping.rectangles.slice(0,i))if(!(x+w<=xx||xx+ww<=x||y+h<=yy||yy+hh<=y))fail('chart overlap');
  if(corners.length!==3||corners.some((c,j)=>c.vertex!==f.proxyVertices[j]||c.uv.length!==2||!c.uv.every(Number.isFinite)||c.uv[0]*size<x+pad-1e-6||c.uv[0]*size>x+w-pad+1e-6||c.uv[1]*size<y+pad-1e-6||c.uv[1]*size>y+h-pad+1e-6))fail('UV exceeds padded chart');
  if(f.node!==node||f.material!==material)continue;
  if(!Number.isInteger(f.triangle)||f.triangle<0||f.triangle>=count/3||byTriangle.has(f.triangle))fail('invalid triangle identity');
  byTriangle.set(f.triangle,{f,corners});
 }
 if(!byTriangle.size)fail('no matching floor triangles');
 const rest=[],floor=[],uv=[];
 for(let i=0;i<count/3;i++){
  const ids=[0,1,2].map(j=>geometry.index?geometry.index.getX(3*i+j):3*i+j),row=byTriangle.get(i);
  if(!row){rest.push(...ids);continue;}
  if(ids.some((v,j)=>v!==row.f.sourceVertices[j]))fail('source triangle indices mismatch');
  floor.push(...ids);for(const c of row.corners)uv.push(...c.uv);
 }
 const indexed=geometry.clone();indexed.setIndex(rest.concat(floor));indexed.clearGroups();
 const out=indexed.toNonIndexed();indexed.dispose();
 const values=new Float32Array(count*2);values.set(uv,rest.length*2);out.setAttribute('uv1',new THREE.BufferAttribute(values,2));
 if(rest.length)out.addGroup(0,rest.length,0);out.addGroup(rest.length,floor.length,1);
 return {geometry:out,floorTriangles:floor.length/3,sourceTriangles:count/3};
}
