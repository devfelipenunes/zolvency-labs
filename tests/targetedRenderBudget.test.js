import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {batchStaticRackMeshes} from '../src/graphics/staticRackBatch.js';
import {selectWarmHolds} from '../src/graphics/warmupPlan.js';
import {waitForSubmittedFrame} from '../src/graphics/frameFence.js';
test('diagnostic warmup opt-in requires both flags',()=>{
 assert.equal(selectWarmHolds({mode:'targeted'}).length,16);
 assert.equal(selectWarmHolds({diagnostics:true,mode:'targeted'}).length,16);
 assert.equal(selectWarmHolds({diagnostics:true,benchmark:true,mode:'targeted'}).length,7);
});
test('static batches preserve world transforms and exclude animated glass',()=>{
 const root=new THREE.Group(),g=new THREE.BoxGeometry(),m=new THREE.MeshStandardMaterial(),glass=new THREE.MeshPhysicalMaterial({transmission:1});
 root.position.set(2,3,4);root.scale.setScalar(1.12);
 const make=(i,mat=m)=>{const parent=new THREE.Group();parent.position.x=i;root.add(parent);const mesh=new THREE.Mesh(g,mat);mesh.name='rack_A'+i+'_door_mesh_lod2';mesh.position.z=2;parent.add(mesh);return mesh;};
 const one=make(1),two=make(2),three=make(3),four=make(4,glass);root.updateWorldMatrix(true,true);const expected=[two.matrixWorld.clone(),three.matrixWorld.clone()];
 const b=batchStaticRackMeshes(root,[one.parent]);assert.equal(b.groups,1);assert.equal(b.sourceMeshes,2);assert.equal(one.parent!==null,true);assert.equal(four.parent!==null,true);
 const mesh=b.batches[0].mesh,local=new THREE.Matrix4();root.updateWorldMatrix(true,true);
 for(let i=0;i<2;i++){mesh.getMatrixAt(i,local);const actual=local.clone().premultiply(mesh.matrixWorld);assert.ok(actual.elements.every((x,j)=>Math.abs(x-expected[i].elements[j])<1e-6));}
 b.dispose();assert.ok(two.parent&&three.parent);g.dispose();m.dispose();glass.dispose();
});
test('fence cleans up on success and timeout',async()=>{
 let deleted=0,time=0,polls=0;const gl={SYNC_GPU_COMMANDS_COMPLETE:1,ALREADY_SIGNALED:2,CONDITION_SATISFIED:3,WAIT_FAILED:4,fenceSync:()=>({}),flush(){},clientWaitSync:()=>++polls===2?3:0,isContextLost:()=>false,deleteSync(){deleted++;}};
 const options={timeoutMs:10,now:()=>time,pause:async()=>{time+=5;}};
 assert.equal(await waitForSubmittedFrame(gl,options),5);assert.equal(deleted,1);
 gl.clientWaitSync=()=>0;await assert.rejects(waitForSubmittedFrame(gl,options));assert.equal(deleted,2);
});
