import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {transferFloorLightmap} from '../src/graphics/floorLightmapTransfer.js';
const hash='b'.repeat(64);
function fixture(){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,1,0,1,0,0,1],3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));g.setIndex([0,1,2,0,2,3]);
 const mapping={sourceSHA256:hash,bakePass:'INDIRECT',resolution:128,paddingTexels:10,rectangles:[[0,0,128,128]],sourceFaces:[{node:'shell',material:'atlas',triangle:0,sourceVertices:[0,1,2],proxyVertices:[0,1,2]}],faces:[[{vertex:0,uv:[.2,.2]},{vertex:1,uv:[.7,.2]},{vertex:2,uv:[.7,.7]}]]};
 const audit={resolution:128,faces:1,validTriangles:1,invalidTriangles:0,degenerateUVTriangles:0,overlapTexels:0,islandPairsWithinExpandedPadding:0,subpixelTriangles:0,coverage:.25};
 return {g,o:{node:'shell',material:'atlas',assetSHA256:hash,mapping,audit}};
}
test('floor and non-floor material groups preserve all six corners and original UV',()=>{
 const {g,o}=fixture(),r=transferFloorLightmap(g,o);
 assert.equal(r.floorTriangles,1);assert.equal(r.sourceTriangles,2);assert.equal(r.geometry.attributes.position.count,6);
 assert.deepEqual(r.geometry.groups.map(x=>[x.start,x.count,x.materialIndex]),[[0,3,0],[3,3,1]]);
 assert.deepEqual(Array.from(r.geometry.attributes.uv.array),[0,0,1,1,0,1,0,0,1,0,1,1]);assert.equal(g.attributes.uv1,undefined);g.dispose();r.geometry.dispose();
});
test('reject wrong hash, overlaps, chart breach and invalid triangle',()=>{
 const {g,o}=fixture();
 assert.throws(()=>transferFloorLightmap(g,{...o,assetSHA256:'a'.repeat(64)}),/source/);
 assert.throws(()=>transferFloorLightmap(g,{...o,audit:{...o.audit,overlapTexels:1}}),/quality/);
 o.mapping.faces[0][0].uv=[0,0];assert.throws(()=>transferFloorLightmap(g,o),/padded chart/);g.dispose();
});
