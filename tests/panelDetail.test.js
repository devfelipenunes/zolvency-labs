import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';import {applyPanelDetail} from '../src/graphics/panelDetail.js';
test('bounded opaque normal-map audition preserves original textures and Y sign, skips glass/quantum and shared duplicate references',()=>{const root=new THREE.Group(),t=new THREE.Texture(),m=new THREE.MeshPhysicalMaterial({name:'scifi_panels_1',normalMap:t,roughness:.95});m.normalScale.set(1,-1);const glass=new THREE.MeshPhysicalMaterial({name:'scifi_panels_2',normalMap:t,transmission:1});root.add(new THREE.Mesh(new THREE.BoxGeometry(),m),new THREE.Mesh(new THREE.BoxGeometry(),m),new THREE.Mesh(new THREE.BoxGeometry(),glass));assert.equal(applyPanelDetail(root,'quantum'),0);assert.equal(applyPanelDetail(root,'hangar'),1);assert.deepEqual(m.normalScale.toArray(),[1.2,-1.2]);assert.equal(m.normalMap,t);assert.equal(m.roughness,.95);assert.deepEqual(glass.normalScale.toArray(),[1,1]);root.traverse(o=>o.geometry?.dispose());m.dispose();glass.dispose();t.dispose();});

test('roughness audition is bounded and independent of normal map intensity',()=>{
 const root=new THREE.Group(),texture=new THREE.Texture(),geometry=new THREE.BoxGeometry();
 const mat=new THREE.MeshPhysicalMaterial({name:'scifi_panels_1',normalMap:texture,roughness:.42});
 const alreadySmooth=new THREE.MeshPhysicalMaterial({name:'scifi_panels_2',normalMap:texture,roughness:.25});
 const glass=new THREE.MeshPhysicalMaterial({name:'scifi_panels_2',normalMap:texture,transmission:1,roughness:.8});
 root.add(new THREE.Mesh(geometry,mat),new THREE.Mesh(geometry,mat),new THREE.Mesh(geometry,alreadySmooth),new THREE.Mesh(geometry,glass));
 assert.equal(applyPanelDetail(root,'quantum','roughness'),0);
 assert.equal(applyPanelDetail(root,'hangar','control'),0);
 assert.equal(applyPanelDetail(root,'hangar','roughness'),1);
 assert.equal(mat.roughness,.35);assert.equal(alreadySmooth.roughness,.25);assert.equal(glass.roughness,.8);
 assert.deepEqual(mat.normalScale.toArray(),[1,1]);assert.equal(mat.normalMap,texture);
 geometry.dispose();mat.dispose();alreadySmooth.dispose();glass.dispose();texture.dispose();
});
