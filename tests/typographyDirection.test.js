import test from 'node:test';
import assert from 'node:assert/strict';
import {stations,modes,typeMode,wrapWords,readability,titleReadability} from '../src/graphics/typographyDirection.js';
import {chapters} from '../src/story.js';
import {windows} from '../src/graphics/facilityCamera.js';
test('all seven chapters have distinct scene directions and windows',()=>{
 assert.deepEqual(stations.map(s=>s.name),chapters.map(s=>s.name));
 for(const [i,s] of stations.entries()){assert.ok(s.root&&s.hints.length>=3);assert.ok(s.hold>=windows[i]&&s.hold<=windows[i+1]);assert.ok(s.range.every((v,j,a)=>!j||v>a[j-1]));}
 assert.equal(new Set(stations.map(s=>s.style)).size,5);
});
test('modes and safe fallback',()=>{for(const mode of modes)assert.equal(typeMode(mode),mode);assert.equal(typeMode('arbitrary'),'architectural');});
test('word wrap preserves content',()=>{const text='Building beyond the known.';const lines=wrapWords(text,s=>s.length,15);assert.equal(lines.join(' '),text);assert.ok(lines.every(s=>s.length<=15));});
test('do not remove HTML when sign is clipped, occluded or too small',()=>{
 const b={inside:true,clear:true,width:440,height:200,titlePx:30,bodyPx:15};
 assert.equal(readability(b),true);for(const k of ['inside','clear'])assert.equal(readability({...b,[k]:false}),false);
 assert.equal(readability({...b,bodyPx:11}),false);assert.equal(titleReadability({...b,bodyPx:11}),true);assert.equal(readability({...b,titlePx:18}),false);
});
