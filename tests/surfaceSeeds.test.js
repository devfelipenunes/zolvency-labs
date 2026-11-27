import test from 'node:test';import assert from 'node:assert/strict';import {surfaceSeeds} from '../src/graphics/surfaceSeeds.js';
const make=()=>Array.from({length:15},(_,i)=>({eligible:true,key:'wall:0',mesh:'wall',material:'metal',normal:[0,0,1],point:[i%5,Math.floor(i/5),0],uv:[(i%5)/4,Math.floor(i/5)/2],facing:1}));
test('coplanar contiguous opaque samples produce a deterministic seed',()=>{const a=make(),s=surfaceSeeds(a,3,5);assert.equal(s.length,1);assert.equal(s[0].samples,15);assert.deepEqual(s[0].center,[2,1,0]);assert.deepEqual(surfaceSeeds(a,3,5),s);});
test('reject occluders, mixed materials, curved and non-coplanar samples',()=>{for(const patch of [{eligible:false},{key:'wall:1'},{normal:[0,1,0]},{point:[2,1,.04]}]){const a=make();Object.assign(a[7],patch);assert.deepEqual(surfaceSeeds(a,3,5),[]);}const a=make();a[7]=null;assert.deepEqual(surfaceSeeds(a,3,5),[]);});
test('reject malformed grid',()=>assert.throws(()=>surfaceSeeds([],3,5)));
