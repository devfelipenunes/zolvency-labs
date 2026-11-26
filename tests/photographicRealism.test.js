import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {realismModes,realismMode,enables,localLightWeights,photographicRefinement,refineSurface,depthAtmosphere,equipmentAccent} from '../src/graphics/photographicRealism.js';
test('independent candidates are opt-in and combined enables all four',()=>{
 assert.equal(realismMode('bad'),'baseline');
 assert.equal(new Set(realismModes).size,6);
 for(const k of ['surface','bounce','depth','motion']){assert.equal(enables('baseline',k),false);assert.equal(enables('combined',k),true);}
});
test('Quantum is untouched and all changes bounded over the entire camera rail',()=>{
 const look={head:1,fill:1,hall:1,env:1,exposure:1,fog:.01};
 assert.deepEqual(photographicRefinement(look,.935),look);assert.equal(depthAtmosphere(.935,false),0);
 for(let i=0;i<=1000;i++){const p=i/1000,w=localLightWeights(p),v=photographicRefinement(look,p);
  assert.ok(Object.values(w).every(x=>x>=0&&x<=1));
  assert.ok(v.head>=.55&&v.head<=1);assert.ok(v.fill>=1&&v.fill<=1.25);assert.equal(v.exposure,look.exposure);
  assert.ok(depthAtmosphere(p,false)>=0&&depthAtmosphere(p,false)<=.012);assert.ok(depthAtmosphere(p,true)<=depthAtmosphere(p,false));
 }
});
test('PBR refinement preserves original texture maps, transmission, quantum and transparent materials',()=>{
 const map=new THREE.Texture(),normal=new THREE.Texture(),m=new THREE.MeshStandardMaterial({map,normalMap:normal,roughness:.3});m.name='floor';
 assert.equal(refineSurface(m,'hangar'),true);assert.equal(m.map,map);assert.equal(m.normalMap,normal);assert.ok(m.roughness>=.78);
 const g=new THREE.MeshPhysicalMaterial({transmission:1,roughness:.04});g.name='rack_glass';
 assert.equal(refineSurface(g,'servers'),false);assert.equal(g.transmission,1);assert.equal(g.roughness,.04);
 assert.equal(refineSurface(m,'reactor-room'),false);assert.equal(refineSurface(m,'quantum'),false);
 m.dispose();g.dispose();map.dispose();normal.dispose();
});
test('equipment changes are scroll deterministic, slow and localized',()=>{
 for(let i=0;i<=1000;i++){const p=i/1000;for(const id of ['servers','bridge','quantum']){const x=equipmentAccent(p,3,id);assert.ok(x>=1&&x<=1.09);assert.equal(x,equipmentAccent(p,3,id));if(id==='quantum')assert.equal(x,1);}}
 assert.equal(equipmentAccent(.935,0,'servers'),1);assert.notEqual(equipmentAccent(.205,0,'servers'),equipmentAccent(.205,1,'servers'));
});
