import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {readGlbMetadata,summarizeGlb} from './glb-inventory-core.mjs';
const dir='assets/vendor/facility',out='artifacts/render-inventory';await mkdir(out,{recursive:true});
const files=[];for(const file of (await readdir(dir)).sort()){if(!/\.(glb|hdr)$/i.test(file))continue;const bytes=await readFile(dir+'/'+file);files.push({file,bytes:bytes.length,...(file.endsWith('.glb')?summarizeGlb(readGlbMetadata(bytes)): {})});}
if(!files.length)throw Error('No bundled models');await writeFile(out+'/assets.json',JSON.stringify({files,note:'Metadata counts include all mesh nodes, not scene visibility or actual GPU allocations. GLB bytes are compressed file size, not VRAM.'},null,2));
console.log(JSON.stringify(files.map(({file,bytes,primitiveCount,uniqueTriangles,transmissionPrimitives,reusedMeshes,meshoptBufferViews,basisTextures})=>({file,bytes,primitiveCount,uniqueTriangles,transmissionPrimitives,reusedMeshCount:reusedMeshes?.length,meshoptBufferViews,basisTextures})),null,2));
