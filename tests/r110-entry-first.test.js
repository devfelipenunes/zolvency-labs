import test from 'node:test';import assert from 'node:assert/strict';
import {entryFirstWarmupPlan,warmHolds} from '../src/graphics/compactPreflight.js';
import {entryFirstPreflight} from '../src/graphics/startupPolicy.js';
import {lateThresholdReady} from '../src/experience/cinematicHandoff.js';
test('R110 compiles every authored pose, submits entry only before final origin fence',()=>{const plan=entryFirstWarmupPlan();assert.deepEqual(plan.map(x=>x.p),warmHolds);assert.deepEqual(plan.filter(x=>x.draw).map(x=>x.p),[.055]);assert.equal(entryFirstPreflight('?hybrid=1'),true);for(const q of ['','?hybrid=1&hybrid-warmup=control','?hybrid=1&hybrid-perf=control','?hybrid=1&preflight=guarded'])assert.equal(entryFirstPreflight(q),false);});
test('R110 late readiness cannot abruptly replace the reading route',()=>{assert.equal(lateThresholdReady(0,844,844),false);assert.equal(lateThresholdReady(.01,300,844),false);assert.equal(lateThresholdReady(.017,1,844),true);assert.equal(lateThresholdReady(.04,300,844),true);assert.equal(lateThresholdReady(.018,211,844),false);});
