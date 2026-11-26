import test from 'node:test';
import assert from 'node:assert/strict';
import {readGlbMetadata,summarizeGlb} from '../scripts/glb-inventory-core.mjs';
test('GLB metadata triangle and mesh reuse accounting',()=>{
 const meta={meshes:[{primitives:[{indices:0,material:0}]}],accessors:[{count:12}],nodes:[{mesh:0},{mesh:0}],materials:[{extensions:{KHR_materials_transmission:{transmissionFactor:.8}}}]};
 const payload=new TextEncoder().encode(JSON.stringify(meta)),size=Math.ceil(payload.length/4)*4,bytes=new Uint8Array(20+size),v=new DataView(bytes.buffer);
 v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,bytes.length,true);v.setUint32(12,size,true);v.setUint32(16,0x4e4f534a,true);bytes.fill(32,20);bytes.set(payload,20);
 const info=summarizeGlb(readGlbMetadata(bytes));assert.equal(info.uniqueTriangles,4);assert.equal(info.instancedTriangles,8);assert.equal(info.transmissionPrimitives,1);assert.equal(info.reusedMeshes[0].references,2);assert.throws(()=>readGlbMetadata(bytes.subarray(0,19)));
});
