import test from 'node:test';
import assert from 'node:assert/strict';
import {extendedPose,interiorLayout,interiorSet,setMember} from '../src/graphics/extendedInteriors.js';
import {spatialPose} from '../src/graphics/spatialNarrative.js';
import {directedCut} from '../src/graphics/cinematicCut.js';
test('additional corridor connects exactly to the extended room front in the intended layout',()=>{
 assert.ok(Math.abs(interiorLayout.corridorCenter[2]-2-(interiorLayout.roomCenter[2]+4*interiorLayout.roomScale[2]))<1e-8);
 assert.equal(8*interiorLayout.roomScale[2],7.2);
 assert.ok(interiorLayout.roomCenter[2]-4*interiorLayout.roomScale[2]>=-15);
});
test('new room rail retains height, approaches through the extension, and reverses deterministically',()=>{
 for(const mobile of [false,true]){
  assert.deepEqual(extendedPose(.65,mobile),spatialPose(.65,mobile));
  assert.ok(extendedPose(.72,mobile).position[2]<-7.55);
  assert.equal(extendedPose(.72,mobile).position[1],spatialPose(.72,mobile).position[1]);
  assert.deepEqual(extendedPose(.935,mobile),spatialPose(.935,mobile));
  for(const p of [.51,.81])assert.equal(directedCut(p,mobile,null,extendedPose).mask,1);
 }
 assert.equal(interiorSet(.509),'facility');assert.equal(interiorSet(.51),'security-wing');assert.equal(interiorSet(.8),'security-wing');assert.equal(interiorSet(.81),'facility');
 assert.equal(setMember('hangar',.72),false);assert.equal(setMember('corridor-extension',.72),true);assert.equal(setMember('bridge',.72),true);
});
