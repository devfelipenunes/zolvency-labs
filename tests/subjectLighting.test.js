import test from 'node:test';
import assert from 'node:assert/strict';
import {subjectLighting,subjectPractical} from '../src/graphics/subjectLighting.js';
test('local lighting changes preserve opening and quantum and remain bounded',()=>{
 for(const mobile of [false,true]){
  for(const p of [0,.055,.935]){const g=subjectLighting(p,mobile);for(const k of ['fill','head','hall','exposure','env'])assert.equal(g[k],1);}
  for(let i=0;i<=1000;i++){const g=subjectLighting(i/1000,mobile);assert.ok(g.fill>=1&&g.fill<=1.30);assert.ok(g.head>=1&&g.head<=1.40);assert.ok(g.hall>=.84&&g.hall<=1);assert.ok(g.exposure>=1&&g.exposure<=1.04);assert.ok(g.env>=.90&&g.env<=1);}
  assert.ok(subjectPractical('server-front',.205,mobile)>1);assert.ok(subjectPractical('security-threshold',.625,mobile)>1);assert.ok(subjectPractical('operations-ceiling',.73,mobile)>1);assert.equal(subjectPractical('quantum-key',.935,mobile),1);assert.ok(subjectLighting(.992,mobile).hall<1);
 }
});

test('operations-only isolation retains head lighting and all other acts',()=>{for(const mobile of [false,true]){for(let i=0;i<=1000;i++){const p=i/1000,a=subjectLighting(p,mobile),b=subjectLighting(p,mobile,'ops-balanced');for(const k of ['head','hall','env','rack','security','ops','final'])assert.equal(a[k],b[k]);assert.ok(b.fill<=a.fill&&b.exposure<=a.exposure);if(!a.ops)assert.deepEqual(a,b);}const a=subjectLighting(.73,mobile),b=subjectLighting(.73,mobile,'ops-balanced');assert.ok(b.fill<a.fill&&b.exposure<a.exposure&&b.head>1);}});
