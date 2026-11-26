import test from 'node:test';
import assert from 'node:assert/strict';
import {getPacing} from '../src/graphics/cameraPacing.js';
import {travelMapper,createTravelMotion,createBaselineTravelMotion,createResponsiveTravelMotion} from '../src/graphics/travelMotion.js';
test('responsive travel preserves cuts, bounded progress and reversibility at four cadences',()=>{
 for(const mobile of [false,true]){
  const pacing=getPacing(mobile),map=travelMapper(pacing);
  for(const dt of [16.667,33.333,100,250]){
   const report=[];
   for(const [name,create] of [['baseline',createBaselineTravelMotion],['candidate',createTravelMotion],['responsive',createResponsiveTravelMotion]]){
    const d=create(pacing);let ts=0,steps=0,prev=0,max=0;const visited=[];d.set(1);
    while(d.pending&&steps<5000){const p=d.step(ts);max=Math.max(max,Math.abs(map.to(p)-map.to(prev))*map.total);if(name==='responsive')assert.ok(p>=prev-1e-9);prev=p;visited.push(p);ts+=dt;steps++;}
    assert.equal(d.value,1);for(const cut of [.51,.81,.965])assert.ok(visited.some(p=>Math.abs(p-cut)<1e-9));
    if(name==='responsive'){assert.ok(max<=(dt<=33.333?.35:.70)+1e-6);d.set(0);const reverse=[];for(let i=0;i<5000&&d.pending;i++){reverse.push(d.step(ts));ts+=dt;}assert.equal(d.value,0);for(const cut of [.51,.81,.965])assert.ok(reverse.some(p=>Math.abs(p-cut)<1e-9));}
    report.push({name,dt,steps,max,simulatedMs:steps*dt});
   }
   console.log('responsive travel',JSON.stringify({mobile,report}));
  }
  const d=createResponsiveTravelMotion(pacing,.2);d.set(.9);let ts=0;for(let i=0;i<25;i++){d.step(ts);ts+=16.667;}const before=d.value;d.set(.1);assert.ok(d.step(ts)<=before+1e-10);d.set(.4,{snap:true});assert.ok(Math.abs(d.value-.4)<1e-9);
 }
});

test('subthreshold travel cannot bypass a masked cut',()=>{const pacing=getPacing(false),map=travelMapper(pacing),cut=map.to(.51),offset=.0004/map.total,d=createResponsiveTravelMotion(pacing,map.from(cut-offset));d.set(map.from(cut+offset));assert.ok(Math.abs(d.step(0)-.51)<1e-9);d.step(17);assert.equal(d.pending,false);});
