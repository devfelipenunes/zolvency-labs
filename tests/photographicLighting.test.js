import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {looks,photographicLook} from '../src/graphics/photographicLighting.js';
import {directedCut} from '../src/graphics/cinematicCut.js';
test('seven distinct photographic looks interpolate continuously and stay bounded',()=>{assert.equal(looks.length,7);for(let i=0;i<=1000;i++){const l=photographicLook(i/1000);assert.ok(l.exposure>0&&l.exposure<2);assert.ok(l.fill>=0&&l.fill<1);assert.ok(l.env>0&&l.env<1);assert.ok(l.accent instanceof THREE.Color);}for(const l of looks){const a=photographicLook(l.p-1e-7),b=photographicLook(l.p+1e-7);assert.ok(Math.abs(a.exposure-b.exposure)<.0001);}});
test('both editorial cuts are reversible and fully conceal their spatial discontinuity',()=>{for(const mobile of [false,true])for(const p of [.51,.81]){const before=directedCut(p-.001,mobile),after=directedCut(p+.001,mobile);assert.equal(before.mask,1);assert.equal(after.mask,1);assert.notDeepEqual(before.pose.position,after.pose.position);assert.deepEqual(directedCut(p-.001,mobile),before);}assert.equal(directedCut(.72).active,false);assert.equal(directedCut(.935).mask,0);});
