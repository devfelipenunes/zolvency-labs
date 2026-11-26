import test from 'node:test';
import assert from 'node:assert/strict';
import {studyModes,brandPlane,subjectGrade,craneProgress,opsPracticalMultiplier} from '../src/graphics/compositionStudy.js';
import {reviewPose} from '../src/graphics/visualReview.js';
test('composition alternatives preserve camera path and Quantum/Stellar compositions',()=>{
 for(const mobile of [false,true])for(const mode of studyModes)for(let i=0;i<=1000;i++){
  const p=i/1000,a=reviewPose(p,mobile,true,'aisle','opposite',true,'selected'),b=reviewPose(p,mobile,true,'aisle','opposite',true,mode);
  assert.deepEqual(b.position,a.position);assert.ok(b.target.every(Number.isFinite));assert.ok(b.fov>=30&&b.fov<=90);
  if(p>=.365&&p<=.445||p>=.865&&p<=.95)assert.deepEqual(b,a);
 }
});
test('isolated composition modes do not change unrelated holds',()=>{
 for(const mobile of [false,true])for(const [mode,hold] of [['brand-hero',.055],['final-hero',.992],['ops-hero',.73]])for(const p of [.055,.205,.405,.625,.73,.935,.992]){
  if(p===hold)continue;
  assert.deepEqual(reviewPose(p,mobile,true,'aisle','opposite',true,mode),reviewPose(p,mobile,true,'aisle','opposite',true,'selected'));
 }
});
test('larger brand planes are explicit and portrait widths capped',()=>{
 assert.equal(brandPlane('ORIGIN',false,'brand-hero').mount,'free-space-hero');
 assert.ok(brandPlane('ORIGIN',false,'brand-hero').widths[0]>brandPlane('ORIGIN',true,'brand-hero').widths[0]);
 assert.equal(brandPlane('QUANTUM',false,'composition-first'),null);
});
test('local lighting stays bounded and does not alter quantum reference',()=>{
 const look={fill:1,head:1,hall:1,exposure:1,env:1};
 assert.deepEqual(subjectGrade(look,.935,'subject'),look);assert.equal(opsPracticalMultiplier(.935,true),1);
 for(let i=0;i<=1000;i++){const p=i/1000,v=subjectGrade(look,p,'subject');assert.ok(v.exposure>=1&&v.exposure<=1.1);assert.ok(v.fill<=1.25);assert.ok(v.hall>=.8);assert.ok(v.head<=1.3);assert.ok(opsPracticalMultiplier(p,true)<=1.65);}
});
test('crane stays within original travel and is deterministic forward and reverse',()=>{
 let last=0;for(let i=0;i<=1000;i++){const p=i/1000,v=craneProgress(p,true,0);assert.ok(v>=last&&v<=1);assert.equal(v,craneProgress(p,true,1));last=v;}assert.equal(last,1);assert.equal(craneProgress(.1,false,.25),.25);
});
