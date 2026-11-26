import test from 'node:test';
import assert from 'node:assert/strict';
import {environments,spatialState,spatialPose,environmentBlend} from '../src/graphics/spatialNarrative.js';
import {cameraPose} from '../src/graphics/facilityCamera.js';
import {spatialFacility,facility} from '../src/graphics/facilityLayout.js';
test('all seven environments have a reversible five-stage envelope',()=>{
 assert.equal(environments.length,7);
 for(const e of environments){const [a,b,c,d,z]=e.points;assert.equal(spatialState(a).strength,0);assert.equal(spatialState((a+b)/2).phase,'approach');assert.equal(spatialState((b+c)/2).phase,'threshold');assert.equal(spatialState(b+.85*(c-b)).phase,'commit');assert.equal(spatialState((c+d)/2).strength,1);assert.equal(spatialState((c+d)/2).phase,'hold');assert.equal(spatialState((d+z)/2).phase,'release');}
});
test('camera positions stay on audited rail and optical settings remain continuous',()=>{
 for(const mobile of [false,true])for(let i=0;i<=1000;i++){const p=i/1000,a=spatialPose(p,mobile),b=cameraPose(p,mobile);assert.deepEqual(a.position,b.position);assert.ok(a.fov>=45&&a.fov<=80);assert.ok(a.target.every(Number.isFinite));}
 for(const e of environments.slice(1)){const p=e.points[0],a=environmentBlend(p-1e-6),b=environmentBlend(p);assert.ok(Math.abs(a.global-b.global)<.001);assert.ok(Math.abs(a.fog-b.fog)<.001);}
});
test('new architecture modes retain the base geometry and stage only approved candidates',()=>{
 assert.deepEqual(spatialFacility('baseline'),facility);
 const a=spatialFacility('immersive'),b=spatialFacility('lab');
 assert.equal(a.length,facility.length);assert.ok(a.some(s=>s.id==='rooftop-cable-tray'&&s.mount==='server-roof'));assert.equal(b.length,a.length+2);
 assert.ok(b.some(s=>s.id==='cleanroom-airlock'&&s.position[0]===0));assert.ok(b.some(s=>s.id==='lab-drawer-bench'));
 for(const spec of b)assert.ok(spec.file.endsWith('.glb'));
});

test('production combines the two previously audited architecture modes',()=>{const p=spatialFacility('production');assert.equal(p.length,11);assert.deepEqual(p.find(s=>s.id==='corridor-extension').position,[-5.5,0,-5.55]);assert.deepEqual(p.find(s=>s.id==='bridge').scaleXYZ,[.72,1,.9]);for(const id of ['rooftop-cable-tray','cleanroom-airlock','lab-drawer-bench'])assert.ok(p.some(s=>s.id===id));assert.ok(p.find(s=>s.id==='bridge').aperture);});
