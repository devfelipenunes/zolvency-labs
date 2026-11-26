import test from 'node:test';
import assert from 'node:assert/strict';
import {backlogModes,backlogLayout,stagedCopy} from '../src/graphics/backlogStudy.js';
import {brandPlane} from '../src/graphics/compositionStudy.js';
import {reviewPose} from '../src/graphics/visualReview.js';
import {shotCards} from '../src/graphics/shotCards.js';
import {artEnvelope} from '../src/graphics/artDirection.js';
const layout=[[0,.36,.57,7.2],[.03,-.18,.37,5.2],[.03,-.58,.29,4.4]],mobileY=[.35,-.18,-.59,-.84];
test('copy alternatives keep accepted opening and protected hold poses',()=>{
 for(const mobile of [false,true])for(const mode of backlogModes){
  assert.deepEqual(brandPlane('ORIGIN',mobile,mode),brandPlane('ORIGIN',mobile,'brand-hero'));
  for(const p of [.055,.205,.405,.625,.935,.992])assert.deepEqual(reviewPose(p,mobile,true,'aisle','opposite',true,mode),reviewPose(p,mobile,true,'aisle','opposite',true,'brand-hero'));
 }
});
test('only intended copy layout is modified, final hero remains unchanged',()=>{
 const f=backlogLayout('CONVERGENCE',true,'final-copy',layout,mobileY);
 assert.deepEqual(f.layout[0],layout[0]);assert.ok(f.mobileY[2]>mobileY[2]);
 assert.deepEqual(backlogLayout('QUANTUM',true,'backlog-copy',layout,mobileY),{layout,mobileY});
 assert.deepEqual(backlogLayout('CONVERGENCE',true,'ops-copy',layout,mobileY),{layout,mobileY});
});
test('staged copy retains original envelope at holds and never increases opacity',()=>{
 for(const c of shotCards){const base=artEnvelope(c,c.hold);assert.deepEqual(stagedCopy(c,c.hold,base,true),base);}
 for(let i=0;i<=1000;i++){const p=i/1000,c=shotCards.reduce((a,b)=>Math.abs(a.hold-p)<Math.abs(b.hold-p)?a:b),base=artEnvelope(c,p),candidate=stagedCopy(c,p,base,true);assert.ok(candidate.body<=base.body&&candidate.body>=0);}
});
