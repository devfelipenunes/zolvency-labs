import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {transferLightmapUV} from '../src/graphics/lightmapTransfer.js';
const hash='a'.repeat(64);
function fixture(){
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,1,1,0,0,1,0],3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));g.setIndex([0,1,2,0,2,3]);
 const sourceFaces=[[0,1,2],[0,2,3]].map((vertices,triangle)=>({node:'shell',material:'atlas',triangle,sourceVertices:vertices,proxyVertices:vertices}));
 const faces=sourceFaces.map(f=>f.proxyVertices.map((vertex,j)=>({vertex,uv:[[.1,.1],[.7,.1],[.7,.7]][j]})));
 const o={node:'shell',material:'atlas',assetSHA256:hash,mapping:{sourceSHA256:hash,sourceFaces,faces},uvAudit:{invalidTriangles:0,degenerateUVTriangles:0,overlapTexels:0,coverage:.5,subpixelTriangles:0,validTriangles:2,islandPairsWithinExpandedPadding:0}};
 return {g,o};
}
test('indexed source is unchanged, position and original UV preserved on cloned geometry',()=>{
 const {g,o}=fixture(),out=transferLightmapUV(g,o),expected=g.toNonIndexed();
 assert.deepEqual([...out.attributes.position.array],[...expected.attributes.position.array]);assert.deepEqual([...out.attributes.uv.array],[...expected.attributes.uv.array]);
 assert.equal(out.attributes.uv1.count,6);assert.equal(g.attributes.uv1,undefined);assert.equal(g.index.count,6);
 g.dispose();out.dispose();expected.dispose();
});
test('reject mismatched source, incomplete mapping, bad atlas and triangle order',()=>{
 const {g,o}=fixture();
 assert.throws(()=>transferLightmapUV(g,{...o,assetSHA256:'b'.repeat(64)}),/hash/);
 assert.throws(()=>transferLightmapUV(g,{...o,uvAudit:{...o.uvAudit,coverage:.007}}),/audit/);
 assert.throws(()=>transferLightmapUV(g,{...o,uvAudit:{...o.uvAudit,overlapTexels:1}}),/audit/);
 assert.throws(()=>transferLightmapUV(g,{...o,mapping:{...o.mapping,sourceFaces:o.mapping.sourceFaces.slice(1),faces:o.mapping.faces.slice(1)}}),/incomplete/);
 o.mapping.sourceFaces[0].sourceVertices=[1,0,2];assert.throws(()=>transferLightmapUV(g,o),/identity/);g.dispose();
});
