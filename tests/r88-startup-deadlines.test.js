import test from 'node:test';import assert from 'node:assert/strict';import {startupDeadlines} from '../src/graphics/startupPolicy.js';
test('R88 visitor budget unchanged; only explicit scene diagnostics get matching deadlines',()=>{
 const regular={preflight:90000,lifecycle:100000},diagnostic={preflight:240000,lifecycle:270000};
 for(const q of ['', '?startup=complete','?diagnostics=1','?diagnostics=1&type-choreography=scene-presence','?living-type=kinetic&type-formation=ribbon&type-visibility=continuous&type-choreography=scene-presence'])assert.deepEqual(startupDeadlines(q),regular);
 assert.deepEqual(startupDeadlines('?diagnostics=1&living-type=kinetic&type-formation=ribbon&type-visibility=continuous&type-choreography=scene-presence'),diagnostic);
 assert.ok(diagnostic.lifecycle>diagnostic.preflight);
});
