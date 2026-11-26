import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {partitionFloor,isolateHangarFloor} from '../src/graphics/floorMaterial.js';
function geometry(){
 const g=new THREE.BufferGeometry();
 // Up-facing square at ground, vertical triangle, elevated upward triangle.
 g.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,-1,-1,0,1,1,0,1,1,0,-1,0,0,0,0,2,0,1,0,0,0,1,0,0,1,1,1,1,0],3));
 g.setIndex([0,1,2,0,2,3,4,5,6,7,8,9]);
 return g;
}
const triangles=indices=>Array.from({length:indices.length/3},(_,i)=>Array.from(indices.slice(i*3,i*3+3)).join(',')).sort();
test('classify only upward ground triangles; preserve winding and all original faces',()=>{
 const g=geometry(),matrix=new THREE.Matrix4(),split=partitionFloor(g,matrix);
 assert.equal(split.floorCount,6);assert.equal(split.restCount,6);assert.equal(split.area,4);
 assert.deepEqual(triangles(split.indices),triangles(g.index.array));assert.deepEqual(Array.from(g.index.array),[0,1,2,0,2,3,4,5,6,7,8,9]);
 assert.equal(partitionFloor(g,new THREE.Matrix4().makeTranslation(0,4,0)),null);
 g.addGroup(0,6,0);g.addGroup(6,6,1);assert.equal(partitionFloor(g,matrix),null);g.dispose();
});
test('only the static shell is split and the source atlas remains shared',()=>{
 const root=new THREE.Group(),shell=new THREE.Group();shell.name='hangar_bay';root.add(shell);
 const texture=new THREE.Texture(),material=new THREE.MeshStandardMaterial({map:texture,roughness:.5}),g=geometry(),mesh=new THREE.Mesh(g,material);
 material.name='scifi_panels_2';shell.add(mesh);
 const outside=new THREE.Mesh(g,material);root.add(outside);
 const result=isolateHangarFloor(root);assert.equal(result.faces,2);assert.equal(result.area,4);
 assert.equal(outside.geometry,g);assert.equal(outside.material,material);
 assert.equal(mesh.material[0],material);assert.equal(mesh.material[1].map,texture);
 assert.equal(material.roughness,.5);assert.equal(mesh.material[1].roughness,.88);
 assert.deepEqual(triangles(mesh.geometry.index.array),triangles(g.index.array));
 assert.deepEqual(mesh.geometry.groups.map(x=>[x.start,x.count,x.materialIndex]),[[0,6,0],[6,6,1]]);
 result.changed.forEach(x=>{x.geometry.dispose();x.material.dispose();});g.dispose();material.dispose();texture.dispose();
});
