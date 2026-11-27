import test from 'node:test';
import assert from 'node:assert/strict';
import {organicTravel,sceneTravel,sceneMotion,sceneGlyphMotion,sceneProfiles} from '../src/graphics/scenePresence.js';

test('R83 travel is monotonic, symmetric and docks without velocity or acceleration',()=>{
 const n=10000, dt=1/n;
 assert.equal(organicTravel(0),0);assert.equal(organicTravel(1),1);
 let prev=0, velocity=0;
 for(let i=1;i<=n;i++){
   const u=i/n,x=organicTravel(u),v=(x-prev)/dt;
   assert.ok(x>=prev&&x<=1);
   assert.ok(Math.abs(x+organicTravel(1-u)-1)<1e-12);
   assert.ok(v<=1.2);
   assert.ok(Math.abs(v-velocity)/dt<12);
   prev=x;velocity=v;
 }
 assert.ok(organicTravel(dt)/dt<.00001);
 assert.ok(Math.abs(organicTravel(2*dt)-2*organicTravel(dt))/(dt*dt)<.05);
 for(const p of [.16,.84]){
   const x=organicTravel(p),left=(x-2*organicTravel(p-dt)+organicTravel(p-2*dt))/(dt*dt),right=(organicTravel(p+2*dt)-2*organicTravel(p+dt)+x)/(dt*dt);
   assert.ok(Math.abs(left-right)<.05);
 }
});
test('R83 all chapters have deterministic bounded individual travel, exact docking and rank-specific depth',()=>{
 for(let index=0;index<sceneProfiles.length;index++){
   for(const kind of ['enter','exit']){
     if(index===6&&kind==='exit')continue;
     const h={index,kind,u:.5};
     assert.ok(new Set([0,.25,.5,.75,1].map(r=>sceneGlyphMotion(h,r)[2])).size>2);
     for(let i=0;i<=100;i++){
       const u=i/100,h={index,kind,u};
       assert.ok(Math.abs(sceneTravel(h)-sceneTravel({index,kind:kind==='enter'?'exit':'enter',u:1-u}))<1e-12);
       assert.ok(Object.values(sceneMotion(h)).filter(x=>typeof x==='number').every(Number.isFinite));
       for(let j=0;j<=40;j++){
         const r=j/40,g=sceneGlyphMotion(h,r),body=sceneGlyphMotion(h,r,'body');
         assert.deepEqual(g,sceneGlyphMotion(h,r));
         assert.ok(g.every(Number.isFinite));
         assert.ok(Math.abs(g[0])<=.23&&Math.abs(g[1])<=.23&&Math.abs(g[2])<=.043);
         assert.ok(Math.abs(body[2])<=Math.abs(g[2])+1e-12);
         if(i===0||i===100)assert.ok(g.every(x=>Math.abs(x)<1e-10));
       }
     }
   }
 }
});
