import test from 'node:test';
import assert from 'node:assert/strict';
import {viewports,holds,reviewCases,scrollTargets} from '../scripts/visual-review-plan.mjs';
import {shotCards} from '../src/graphics/shotCards.js';
import {chapters} from '../src/story.js';
test('review plan covers all glass finishes, rack angles and effect treatments',()=>{
 const names=reviewCases.map(x=>x.name);assert.equal(new Set(names).size,names.length);
 for(const name of ['split','clear','smoke','reflection'])assert.ok(names.includes('glass-'+name));
 for(const angle of ['devices','diagonal','opposite'])assert.ok(names.includes('stellar-'+angle));
 for(const mode of ['default','no-ao','no-bloom','neither'])assert.ok(names.includes('effects-'+mode));
 assert.equal(holds.length,7);assert.deepEqual(viewports.mobile,{width:390,height:844});
 assert.ok(scrollTargets.forward.every((p,i,a)=>i===0||p>a[i-1]));assert.ok(scrollTargets.reverse.every((p,i,a)=>i===0||p<a[i-1]));assert.equal(scrollTargets.reverse.at(-1),0);
 assert.equal(reviewCases.find(c=>c.motion).params,'');assert.ok(reviewCases.find(c=>c.name==='quantum-copy').mobileOnly);
});
test('visible spatial headings match semantic chapter headings',()=>{assert.deepEqual(shotCards.map(c=>[c.name,c.title]),chapters.map(c=>[c.name,c.title]));});
