// GLB metadata only. Never decode compressed geometry or textures here.
export function readGlbMetadata(bytes){
 const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(bytes.length<20||dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2||dv.getUint32(8,true)!==bytes.length)throw Error('Invalid GLB header');
 const length=dv.getUint32(12,true);
 if(dv.getUint32(16,true)!==0x4e4f534a||20+length>bytes.length)throw Error('Invalid GLB JSON chunk');
 return JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+length)));
}
export function summarizeGlb(g){
 const meshes=g.meshes??[],nodes=g.nodes??[],mats=g.materials??[],accessors=g.accessors??[],refs=new Map(),materialUse=new Map();
 let uniqueTriangles=0,instancedTriangles=0,primitiveCount=0,transmissionPrimitives=0,alphaBlendPrimitives=0,nonTrianglePrimitives=0;
 const details=meshes.map((m,i)=>{let triangles=0;for(const p of m.primitives??[]){
  primitiveCount++;const mode=p.mode??4,count=accessors[p.indices??p.attributes?.POSITION]?.count??0;
  const n=mode===4?Math.floor(count/3):mode===5||mode===6?Math.max(0,count-2):0;if(mode!==4&&mode!==5&&mode!==6)nonTrianglePrimitives++;
  triangles+=n;const material=mats[p.material];if(material?.extensions?.KHR_materials_transmission?.transmissionFactor>0||material?.extensions?.KHR_materials_transmission?.transmissionTexture)transmissionPrimitives++;
  if(material?.alphaMode==='BLEND')alphaBlendPrimitives++;if(p.material!=null)materialUse.set(p.material,(materialUse.get(p.material)??0)+1);
 }uniqueTriangles+=triangles;return {mesh:i,name:m.name??'',triangles,primitives:(m.primitives??[]).length};});
 for(const n of nodes){if(n.mesh==null)continue;const instances=n.extensions?.EXT_mesh_gpu_instancing?.attributes??{},accessor=Object.values(instances)[0],count=accessor==null?1:accessors[accessor]?.count??1;refs.set(n.mesh,(refs.get(n.mesh)??0)+count);instancedTriangles+=(details[n.mesh]?.triangles??0)*count;}
 return {meshes:meshes.length,nodes:nodes.length,materials:mats.length,textures:(g.textures??[]).length,images:(g.images??[]).length,primitiveCount,uniqueTriangles,instancedTriangles,nonTrianglePrimitives,transmissionPrimitives,alphaBlendPrimitives,meshoptBufferViews:(g.bufferViews??[]).filter(x=>x.extensions?.EXT_meshopt_compression).length,basisTextures:(g.textures??[]).filter(x=>x.extensions?.KHR_texture_basisu).length,extensions:g.extensionsUsed??[],reusedMeshes:details.filter(x=>(refs.get(x.mesh)??0)>1).map(x=>({...x,references:refs.get(x.mesh)})),materialUse:[...materialUse].map(([i,primitives])=>({name:mats[i]?.name??'',primitives}))};
}
