import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';import {cutAperture} from '../src/graphics/architectureAperture.js';
test('cut preserves surface attributes and leaves the actual opening unobstructed',()=>{
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(8,4,4,4));mesh.position.set(-5.5,2,0);mesh.updateMatrixWorld(true);
 const result=cutAperture(mesh,{left:-6.9,right:-4.1,bottom:-.2,top:2.65});assert.ok(result.changed>0);assert.ok(result.geometry.attributes.uv);assert.equal(result.geometry.attributes.position.count,result.geometry.attributes.uv.count);
 mesh.geometry=result.geometry;mesh.material.side=THREE.DoubleSide;mesh.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(-5.5,1.8,2),new THREE.Vector3(0,0,-1));assert.equal(ray.intersectObject(mesh).length,0);ray.set(new THREE.Vector3(-8,1.8,2),new THREE.Vector3(0,0,-1));assert.ok(ray.intersectObject(mesh).length>0);
});
