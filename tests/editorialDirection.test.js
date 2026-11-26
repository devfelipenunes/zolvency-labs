import test from 'node:test';
import assert from 'node:assert/strict';
import {editorialEditions,editorialChapters,getEditorialChapters,getEditorialEdition,getCopyStyle} from '../src/editorialStory.js';
import {getShotCards} from '../src/graphics/shotCards.js';
import {getPacing} from '../src/graphics/cameraPacing.js';
import {readingDistance,readingTarget} from '../src/graphics/readingPacing.js';
import {directedNarrative,beats} from '../src/graphics/directedNarrative.js';
test('edition selection is explicit and rejects unknown values',()=>{
 assert.equal(getEditorialEdition('?copy=manifesto'),'control');
 assert.equal(getEditorialEdition('?experience=editorial&copy=unknown'),'control');
 assert.equal(getEditorialEdition('?experience=editorial&copy=precision'),'precision');
 assert.equal(getCopyStyle('?experience=editorial&copy=precision&copy-style=exploration'),'exploration');
 assert.equal(getCopyStyle('?experience=editorial&copy-style=manifesto'),'control');
 assert.equal(getEditorialChapters(),editorialChapters);
});
for(const edition of editorialEditions.filter(x=>x!=='control')){
 test(edition+' — copy is concise, ordered and shared across rendering modes',()=>{
  const copy=getEditorialChapters(edition),cards=getShotCards(edition);
  assert.equal(copy.length,7);assert.equal(new Set(copy.map(c=>c.title)).size,7);
  for(let i=0;i<7;i++){
   const c=copy[i];assert.equal(c.name,editorialChapters[i].name);assert.equal(cards[i].name,c.name);
   assert.equal(cards[i].title,c.title);assert.equal(cards[i].body,c.body);
   assert.ok(c.title.split(/\s+/).length<=6);assert.ok(c.body.split(/\s+/).length<=15);
   assert.ok(!/\b(guaranteed|world-leading|industry-leading|our clients)\b/i.test(c.body));
   if(i===4||i===5)assert.match(c.body,/exploring|researching/i);
  }
  assert.match(copy[2].body,/Stellar/);assert.match(copy[5].body,/post-quantum/);
 });
 for(const mobile of [false,true])test(edition+' — '+(mobile?'mobile':'desktop')+' reading distance, monotonicity and round trip',()=>{
  const control=getPacing(mobile),candidate=getPacing(mobile,edition),copy=getEditorialChapters(edition);
  let extra=0;
  for(let i=0;i<7;i++){
   const c=candidate.chapters[i],base=control.chapters[i];extra+=c.vh-base.vh;
   assert.equal(c.lo,base.lo);assert.equal(c.hi,base.hi);assert.equal(c.curve[0],0);assert.equal(c.curve.at(-1),1);
   assert.ok(c.curve.every((v,j,a)=>j===0||v>a[j-1]),'strict monotone '+i);
   assert.ok(readingDistance(c,i)>=readingTarget(copy[i])-.01,'reading budget '+i);
   assert.ok(readingDistance(c,i)>=readingDistance(base,i)-.001);
   for(let j=0;j<=100;j++){const u=j/100,p=candidate.progress(i,u);assert.ok(Math.abs(candidate.local(i,p)-u)<1e-8);}
   const p=(beats[i][3]+beats[i][4])/2,n=directedNarrative(p,0);for(const role of ['alpha','label','title','body'])assert.equal(n[role],1);
   assert.equal(directedNarrative(p,1).alpha,0);
  }
  assert.ok(extra<8,'do not add excessive scroll length');
  assert.equal(getPacing(mobile),control);
 });
}
