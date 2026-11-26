import test from 'node:test';
import assert from 'node:assert/strict';
import {N,pose,point,visible,clamp} from '../src/graphics/geometry.js';
test('poses are finite, bounded and deterministic',()=>{for(let i=0;i<=100;i++){const p=i/100;assert.deepEqual(pose(p),pose(p));for(let j=0;j<N;j++){for(const s of [0,.5,1])assert.ok(point(j,s,pose(p)).every(Number.isFinite));assert.ok(visible(j,p)>=0&&visible(j,p)<=1);}}assert.deepEqual(pose(-1),pose(0));assert.deepEqual(pose(2),pose(1));assert.equal(clamp(-3),0);});
test('reversing scroll returns the same coordinates',()=>{const path=[0,.25,.5,1,.5,.25,0].map(p=>point(7,.3,pose(p)));assert.deepEqual(path[0],path[6]);assert.deepEqual(path[1],path[5]);assert.deepEqual(path[2],path[4]);});
