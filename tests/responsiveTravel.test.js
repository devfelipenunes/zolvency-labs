import test from 'node:test';
import assert from 'node:assert/strict';
import {createTravelMotion,travelMapper} from '../src/graphics/travelMotion.js';
import {createPacing,pacingFromChapters} from '../src/graphics/cameraPacing.js';
import {windows} from '../src/graphics/facilityCamera.js';
for(const mobile of [false,true]){
 const pacing=createPacing({mobile}),map=travelMapper(pacing),holds=[.055,.205,.405,.625,.73,.935,.992,.73,.405,.205,0];
 test('responsive travel settles, preserves submitted cuts and step budget '+mobile,()=>{
  for(const dt of [16.67,33.33,100,250]){
   const d=createTravelMotion(pacing,0,{responsive:true});let now=0,previous=0;
   for(const target of holds){
    d.set(target);let frames=0;const observed=[previous];
    while(d.pending&&frames++<600){now+=dt;const p=d.step(now);assert.ok(p>=0&&p<=1);assert.ok(Math.abs(map.to(p)-map.to(previous))*map.total<=.650001);observed.push(p);previous=p;}
    assert.equal(d.pending,false);assert.ok(Math.abs(d.value-target)<1e-8);
    for(const cut of [.51,.81,.965])if(cut>Math.min(observed[0],target)&&cut<Math.max(observed[0],target))assert.ok(observed.some(p=>Math.abs(p-cut)<1e-8),'missed cut '+cut);
    d.resetClock();
   }
  }
 });
 test('responsive reversal and repeated timestamp '+mobile,()=>{
  const d=createTravelMotion(pacing,.2,{responsive:true});d.set(.8);let now=0;for(let i=0;i<10;i++)d.step(now+=16.67);d.set(0);const start=d.value;assert.equal(d.step(now),start);
  for(let i=0;i<300&&d.pending;i++){const prev=d.value;d.step(now+=16.67);assert.ok(d.value<=prev+1e-9);}
  assert.equal(d.pending,false);assert.equal(d.value,0);
 });
 test('serialized pacing exact reconstruction '+mobile,()=>{
  const restored=pacingFromChapters(JSON.parse(JSON.stringify(pacing.chapters)));
  for(let i=0;i<windows.length-1;i++)for(let j=0;j<=100;j++){const x=j/100;assert.equal(restored.progress(i,x),pacing.progress(i,x));assert.equal(restored.local(i,pacing.progress(i,x)),pacing.local(i,pacing.progress(i,x)));}
 });
}
