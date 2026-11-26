import test from 'node:test';
import assert from 'node:assert/strict';
import {getPacing} from '../src/graphics/cameraPacing.js';
import {travelMapper,createTravelMotion} from '../src/graphics/travelMotion.js';
import {directedNarrative,beats} from '../src/graphics/directedNarrative.js';
import {shotCards} from '../src/graphics/shotCards.js';
test('all seven reading holds remain fully legible within browser sampling tolerance',()=>{
 for(const c of shotCards)for(const offset of [-.003,0,.003]){
  const n=directedNarrative(c.hold+offset);assert.equal(n.alpha,1);assert.equal(n.label,1);assert.equal(n.title,1);assert.equal(n.body,1);
 }
 for(const [a,b,c,d] of beats){const n=directedNarrative((a+b)/2);assert.equal(n.title,0);assert.equal(n.body,0);assert.ok(n.label>0);assert.equal(directedNarrative((c+d)/2,1).alpha,0);}
});
test('distance mapping is monotonic, reversible, and never exceeds half a viewport per normal rendered step',()=>{
 for(const mobile of [false,true]){
  const pacing=getPacing(mobile),map=travelMapper(pacing);let last=-1;
  for(let i=0;i<=1000;i++){const p=i/1000,x=map.to(p);assert.ok(x>last);assert.ok(Math.abs(map.from(x)-p)<1e-9);last=x;}
  const d=createTravelMotion(pacing);d.set(.95);let before=0;
  for(let i=0;i<1000&&d.pending;i++){const next=d.step(i*100);assert.ok(next>=before);assert.ok((map.to(next)-map.to(before))*map.total<=.500001);before=next;}
  assert.ok(Math.abs(d.value-.95)<1e-8);d.set(.2);assert.ok(d.step(100001)<=.95);d.set(0,{snap:true});assert.equal(d.value,0);
 }
});
