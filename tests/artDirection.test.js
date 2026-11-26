import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceFrames,brandSurfaces,stellarAngles,artAim,artEnvelope,artLighting} from '../src/graphics/artDirection.js';
import {shotCards} from '../src/graphics/shotCards.js';
import {reviewPose} from '../src/graphics/visualReview.js';
test('reference frames represent the three distinct focal subjects',()=>{assert.deepEqual(referenceFrames.map(f=>f.name),['ORIGIN','BLOCKCHAIN','QUANTUM']);assert.equal(brandSurfaces.ORIGIN.normal,1);assert.equal(brandSurfaces.CONVERGENCE.normal,-1);});
test('rack shot candidates change aim without changing the collision-tested camera position',()=>{for(const mobile of [false,true]){const base=reviewPose(.405,mobile);for(const angle of Object.keys(stellarAngles)){const pose=reviewPose(.405,mobile,true,'aisle',angle);assert.deepEqual(pose.position,base.position);assert.ok(pose.target.every(Number.isFinite));assert.deepEqual(artAim('STELLAR',mobile,angle),stellarAngles[angle]);}}});
test('reference typography envelopes stage copy and remain deterministic',()=>{const origin=shotCards[0];assert.equal(artEnvelope(origin,0).hero,1);assert.equal(artEnvelope(origin,0).headline,0);assert.equal(artEnvelope(origin,0).body,0);for(const s of shotCards){const at=artEnvelope(s,s.hold);for(const v of Object.values(at))assert.ok(v>=0&&v<=1);assert.deepEqual(at,artEnvelope(s,s.hold));assert.ok(at.hero>.8);assert.ok(at.headline>.8);assert.ok(at.body<.5);}assert.equal(artEnvelope(shotCards.at(-1),1).body,1);});
test('lighting profiles keep a neutral transition outside the local subject sets',()=>{assert.ok(artLighting(.205).rack>.9);assert.ok(artLighting(.73).ops>.9);assert.equal(artLighting(.935).rack,0);assert.equal(artLighting(.935).ops,0);});
