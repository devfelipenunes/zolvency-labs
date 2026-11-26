import test from 'node:test';
import assert from 'node:assert/strict';
import {createPacing,pacedStoryProgress,angularDistance} from '../src/graphics/cameraPacing.js';
import {createMotionDriver} from '../src/graphics/editorialMotion.js';
import {windows} from '../src/graphics/facilityCamera.js';
import {reviewPose} from '../src/graphics/visualReview.js';
import {directedCut} from '../src/graphics/cinematicCut.js';
import {editorialChapters} from '../src/editorialStory.js';
import {qualityProfiles} from '../src/graphics/qualityProfiles.js';
test('pacing preserves all chapter boundaries, is strictly monotonic and invertible',()=>{
 for(const mobile of [false,true]){
  const p=createPacing({mobile});
  assert.ok(p.chapters.reduce((s,c)=>s+c.vh,0)<21);
  for(let i=0;i<7;i++){
   assert.equal(p.progress(i,0),windows[i]);assert.equal(p.progress(i,1),windows[i+1]);let last=windows[i];
   for(let k=1;k<=1000;k++){const t=k/1000,v=p.progress(i,t);assert.ok(v>last);assert.ok(Math.abs(p.local(i,v)-t)<1e-9);last=v;}
  }
  const starts=[0];for(let i=0;i<6;i++)starts.push(starts.at(-1)+p.chapters[i].vh*1000);
  const max=starts.at(-1)+p.chapters[6].vh*1000;
  assert.equal(pacedStoryProgress(0,starts,max,p).progress,0);assert.equal(pacedStoryProgress(max,starts,max,p).progress,1);
 }
});
test('server travel and final angular peaks decrease using authored scroll budget',()=>{
 for(const mobile of [false,true]){
  const map=createPacing({mobile}),pose=p=>directedCut(p,mobile,null,(p,m)=>reviewPose(p,m,true,'aisle','opposite',true,'brand-hero'));
  for(const i of [1,6]){
   const c=map.chapters[i],measure=(fn,vh)=>{let a=pose(fn(0)),m=0,deg=0;for(let j=1;j<=1000;j++){const b=pose(fn(j/1000));if(a.mask<.98&&b.mask<.98){m=Math.max(m,Math.hypot(...b.pose.position.map((x,k)=>x-a.pose.position[k]))*1000/vh);deg=Math.max(deg,angularDistance(a.pose,b.pose)*1000/vh);}a=b;}return {m,deg};};
   const old=measure(t=>c.lo+(c.hi-c.lo)*t,i===1?(mobile?1.75:2):(mobile?.35:.45)),next=measure(t=>map.progress(i,t),c.vh);
   if(i===1)assert.ok(next.m<old.m*.2);assert.ok(next.deg<old.deg*.2);
  }
 }
});
test('large normal scroll never snaps; explicit navigation can snap; reverse is bounded',()=>{
 const d=createMotionDriver();d.set(.9);let old=0;
 for(let t=0;t<5000;t+=16.7){const p=d.step(t);assert.ok(p>=old&&p-old<=.065+1e-9);old=p;}
 assert.equal(d.value,.9);d.set(.1);assert.ok(d.step(5100)>.1);d.set(0,{snap:true});assert.equal(d.value,0);assert.equal(d.pending,false);
});
test('institutional narrative has seven acts, explicit current and exploratory directions',()=>{
 assert.equal(editorialChapters.length,7);assert.equal(editorialChapters[0].title,'Building beyond the known.');
 assert.match(editorialChapters[2].body,/Stellar/);assert.match(editorialChapters[4].body,/explor/i);assert.match(editorialChapters[5].body,/separately/);
 assert.equal(qualityProfiles.economy.ao,false);assert.equal(qualityProfiles.balanced.msaa,0);assert.ok(qualityProfiles.cinematic.msaa>0);
});
