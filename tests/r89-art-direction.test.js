import test from 'node:test';import assert from 'node:assert/strict';import {readingFrame,artReadingFrame} from '../src/graphics/scenePresence.js';
test('R89 retains desktop and improves portrait positioning within safe area',()=>{
 for(let i=0;i<7;i++){assert.deepEqual(artReadingFrame(i,1280/844),readingFrame(i,1280/844));for(const aspect of [320/844,390/844])for(const dx of [-.5,0,.5])for(const dy of [-.5,0,.5]){const f=artReadingFrame(i,aspect,dx,dy);assert.ok(Math.abs(f.x)+f.halfWidth<=.92);assert.ok(f.y-f.halfHeight>=-.80);assert.ok(f.y+f.halfHeight<=.56);}}
 assert.ok(artReadingFrame(5,390/844).y<readingFrame(5,390/844).y);assert.ok(artReadingFrame(6,390/844).y>readingFrame(6,390/844).y);
});