import test from 'node:test';
import assert from 'node:assert/strict';
import {portraitFraming} from '../src/graphics/portraitFraming.js';
const pose={position:[1,2,3],target:[4,5,6],fov:65};
test('portrait changes only bounded lens and aim; no position or quantum change',()=>{
 for(let i=0;i<=1000;i++){const p=i/1000,x=portraitFraming(p,pose,true);assert.equal(x.position,pose.position);assert.ok(Math.abs(x.fov-pose.fov)<=5.000001);assert.ok(Math.abs(x.target[1]-pose.target[1])<=.350001);assert.equal(x.target[0],pose.target[0]);assert.equal(x.target[2],pose.target[2]);assert.equal(portraitFraming(p,pose,false),pose);}
 for(const p of [0,.51,.81,.935,.965])assert.deepEqual(portraitFraming(p,pose,true),pose);
});
