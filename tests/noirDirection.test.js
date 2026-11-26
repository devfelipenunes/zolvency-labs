import test from 'node:test';import assert from 'node:assert/strict';
import {noirPose,noirGrade,drawingRatio,editorialMotion} from '../src/graphics/noirDirection.js';
import {reactorStudyPose} from '../src/graphics/reactorStudy.js';
import {photographicLook} from '../src/graphics/photographicLighting.js';
import {cues,cueEnvelope} from '../src/graphics/kineticTitles.js';
test('noir uses less diffuse illumination and preserves the audited rail',()=>{for(let i=0;i<=1000;i++){const p=i/1000,a=photographicLook(p),b=noirGrade(a);assert.ok(b.fill<a.fill&&b.env<a.env&&b.exposure<a.exposure);for(const mobile of [false,true])assert.deepEqual(noirPose(p,mobile).position,reactorStudyPose(p,mobile).position);}});
test('quantum aim includes the elevated installation',()=>{assert.ok(Math.abs(noirPose(.935).target[1]-8.85)<1e-9);assert.equal(noirPose(.935,true).fov,74);});
test('editorial motion deterministic and title cues bounded',()=>{assert.equal(cues.length,7);for(const cue of cues){assert.equal(cueEnvelope(cue,cue.hold),1);for(let i=0;i<=1000;i++){const x=cueEnvelope(cue,i/1000);assert.ok(x>=0&&x<=1);const m=editorialMotion(i/1000);assert.ok(m.enter>=0&&m.enter<=1&&m.chapter>=0&&m.chapter<7);}}assert.deepEqual(editorialMotion(.72),editorialMotion(.72));});
test('resolution quality caps, no forced diagnostic downsampling outside benchmark',()=>{assert.equal(drawingRatio({device:3,mobile:true}),1.65);assert.equal(drawingRatio({device:3,high:true}),2);assert.equal(drawingRatio({device:1}),1);assert.equal(drawingRatio({device:1,benchmark:true}),.7);});
