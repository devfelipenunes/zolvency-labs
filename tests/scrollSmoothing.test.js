import test from 'node:test';
import assert from 'node:assert/strict';
import {smoothProgress} from '../src/graphics/scrollSmoothing.js';
test('small visual moves ease, reverse and settle exactly',()=>{
 let p=.3;const t=.32;const first=smoothProgress(p,t,16);assert.ok(first>p&&first<t);
 for(let i=0;i<90;i++)p=smoothProgress(p,t,16);assert.equal(p,t);
 for(let i=0;i<90;i++)p=smoothProgress(p,.3,16);assert.equal(p,.3);
});
test('lag is bounded and large jumps do not animate unseen rooms',()=>{
 assert.ok(.4-smoothProgress(.3,.4,16)<=.025000001);
 assert.equal(smoothProgress(.2,1,16),1);
 assert.equal(smoothProgress(1,0,16),0);
});
