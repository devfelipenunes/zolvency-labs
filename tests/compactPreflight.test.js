import test from 'node:test';
import assert from 'node:assert/strict';
import {warmupPlan,warmHolds,renderHolds,guardedTransition} from '../src/graphics/compactPreflight.js';
test('compact compiles all poses and submits all seven representative holds',()=>{
 const full=warmupPlan(),compact=warmupPlan(true);
 assert.deepEqual(full.map(x=>x.p),warmHolds);assert.deepEqual(compact.map(x=>x.p),warmHolds);
 assert.equal(full.filter(x=>x.draw).length,16);assert.deepEqual(compact.filter(x=>x.draw).map(x=>x.p),renderHolds);
 assert.equal(compact.filter(x=>!x.draw).length,9);
});

test('guarded mobile preflight retains all three critical transition draws',()=>{const guarded=warmupPlan(true,true);assert.deepEqual(guarded.map(x=>x.p),warmHolds);assert.equal(guarded.filter(x=>x.draw).length,10);for(const p of [...renderHolds,...guardedTransition])assert.ok(guarded.find(x=>x.p===p).draw);assert.equal(warmupPlan(false,true).filter(x=>x.draw).length,16);});
