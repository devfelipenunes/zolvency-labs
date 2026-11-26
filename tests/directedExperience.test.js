import test from 'node:test';
import assert from 'node:assert/strict';
import {getPacing} from '../src/graphics/cameraPacing.js';
import {travelMapper,createTravelMotion,createBaselineTravelMotion,sceneSpeedLimit} from '../src/graphics/travelMotion.js';
import {directedNarrative,beats} from '../src/graphics/directedNarrative.js';
import {shotCards} from '../src/graphics/shotCards.js';
import {createResolutionGovernor} from '../src/graphics/renderPerformance.js';
test('all seven reading holds remain fully legible within browser sampling tolerance',()=>{
 for(const c of shotCards)for(const offset of [-.003,0,.003]){
  const n=directedNarrative(c.hold+offset);assert.equal(n.alpha,1);assert.equal(n.label,1);assert.equal(n.title,1);assert.equal(n.body,1);
 }
 for(const [a,b,c,d] of beats){const n=directedNarrative((a+b)/2);assert.equal(n.title,0);assert.equal(n.body,0);assert.ok(n.label>0);assert.equal(directedNarrative((c+d)/2,1).alpha,0);}
});
test('distance mapping is monotonic, reversible, and never exceeds 0.35 viewport per normal rendered step',()=>{
 for(const mobile of [false,true]){
  const pacing=getPacing(mobile),map=travelMapper(pacing);let last=-1;
  for(let i=0;i<=1000;i++){const p=i/1000,x=map.to(p);assert.ok(x>last);assert.ok(Math.abs(map.from(x)-p)<1e-9);last=x;}
  const d=createTravelMotion(pacing);d.set(.95);let before=0;
  for(let i=0;i<1000&&d.pending;i++){const next=d.step(i*100);assert.ok(next>=before);assert.ok((map.to(next)-map.to(before))*map.total<=.350001);before=next;}
  assert.ok(Math.abs(d.value-.95)<1e-8);d.set(.2);assert.ok(d.step(100001)<=.95);d.set(0,{snap:true});assert.equal(d.value,0);
 }
});

test('camera starts gently, brakes and submits the fully masked splice positions in either direction',()=>{
 for(const mobile of [false,true]){
  const d=createTravelMotion(getPacing(mobile));d.set(1);let previous=0,velocity=0,ts=0;const frames=[];
  for(let i=0;i<2000&&d.pending;i++){const p=d.step(ts);ts+=16.667;assert.ok(p>=previous);assert.ok(Math.abs(d.velocity-velocity)<=18*.017+1e-6||d.velocity===0);frames.push(p);previous=p;velocity=d.velocity;}
  assert.equal(d.value,1);
  for(const cut of [.51,.81,.965])assert.ok(frames.some(p=>Math.abs(p-cut)<1e-9),'missing forward cut '+cut);
  d.set(0);const reverse=[];for(let i=0;i<2000&&d.pending;i++){reverse.push(d.step(ts));ts+=16.667;}
  assert.equal(d.value,0);for(const cut of [.51,.81,.965])assert.ok(reverse.some(p=>Math.abs(p-cut)<1e-9),'missing reverse cut '+cut);
 }
});

test('staged motion preserves the baseline control and bounds jerk during normal acceleration and reversal',()=>{
 for(const mobile of [false,true]){
  const pacing=getPacing(mobile),map=travelMapper(pacing);
  const stats=[];
  for(const [name,create] of [['baseline',createBaselineTravelMotion],['candidate',createTravelMotion]]){
   const d=create(pacing,.2);let ts=0,prev=d.value,prevA=0,peak=0,peakJerk=0,reversals=0,maxStep=0;
   d.set(.92);
   for(let i=0;i<2000&&d.pending;i++){
    if(i===35)d.set(.12);
    const p=d.step(ts),step=Math.abs(map.to(p)-map.to(prev))*map.total;
    maxStep=Math.max(maxStep,step);peak=Math.max(peak,Math.abs(d.velocity));
    if(name==='candidate'&&d.pending&&d.velocity!==0){peakJerk=Math.max(peakJerk,Math.abs(d.acceleration-prevA)/.016667);assert.ok(Math.abs(d.acceleration)<=18.000001);}
    if(p<prev)reversals++;
    prevA=d.acceleration??0;prev=p;ts+=16.667;
   }
   assert.ok(Math.abs(d.value-.12)<1e-8);assert.ok(reversals>0);assert.ok(maxStep<=.350001);
   if(name==='candidate'){assert.ok(peakJerk<=120.01);assert.ok(peak<=5.50001);}
   stats.push({name,simulatedMs:Math.round(ts),peak,maxStep,peakJerk:name==='candidate'?peakJerk:null});
  }
  for(let i=0;i<=1000;i++){const p=i/1000;assert.ok(sceneSpeedLimit(p,pacing)>=3.8&&sceneSpeedLimit(p,pacing)<=5.5);}
  console.log('travel comparison',JSON.stringify({mobile,stats}));
 }
});

test('severe sustained frame cost triggers one early resolution reduction, not single-frame flicker',()=>{
 const governor=createResolutionGovernor({budget:16.7,severeFrames:4});
 assert.equal(governor.observe(100,0),null);
 assert.equal(governor.observe(100,16),null);
 assert.equal(governor.observe(100,32),null);
 assert.equal(governor.observe(100,48),.9);
 for(let i=0;i<10;i++)assert.equal(governor.observe(100,64+16*i),null);
 assert.equal(governor.scale,.9);
});
test('motion settles after irregular frame cadence without skipping optical cuts',()=>{
 for(const mobile of [false,true]){
  const pacing=getPacing(mobile),map=travelMapper(pacing),d=createTravelMotion(pacing);let time=0,prev=0;const visited=[];
  d.set(1);
  for(let i=0;i<2000&&d.pending;i++){
   time+=[8,16,33,100,500][i%5];const p=d.step(time);
   assert.ok(p>=prev-1e-10);assert.ok((map.to(p)-map.to(prev))*map.total<=.350001);visited.push(p);prev=p;
  }
  assert.equal(d.value,1);for(const cut of [.51,.81,.965])assert.ok(visited.some(p=>Math.abs(p-cut)<1e-9));
 }
});
