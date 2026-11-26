import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters} from '../src/story.js';
import {shotCards} from '../src/graphics/shotCards.js';
test('spatial narrative and semantic HTML source agree on seven acts and titles',()=>{
 assert.equal(chapters.length,7);
 assert.deepEqual(chapters.map(c=>[c.name,c.title]),shotCards.map(c=>[c.name,c.title]));
 assert.equal(chapters[0].title,'Building beyond the known.');
 assert.match(chapters[0].label,/Independent technology company/i);
 assert.equal(shotCards[0].body,'Independent technology company.');
});
test('Stellar remains current; AI and quantum are explicitly exploration',()=>{
 const byName=Object.fromEntries(chapters.map(c=>[c.name,c]));
 assert.match(byName.STELLAR.body,/current focus.*Stellar/i);
 for(const name of ['INTELLIGENCE','QUANTUM']){
  assert.match(byName[name].label,/Future exploration/i);
  assert.match(shotCards.find(c=>c.name===name).body,/Exploring/i);
 }
 assert.match(byName.CONVERGENCE.body,/We start with blockchain/i);
});
test('spatial copy remains concise and no unapproved claims or CTA inserted',()=>{
 for(const c of shotCards){assert.ok(c.title.length<=48);assert.ok(c.body.length<=85);assert.doesNotMatch(c.body,/guaranteed|certified|partner of|trusted by/i);}
});
