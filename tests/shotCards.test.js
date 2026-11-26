import test from 'node:test';import assert from 'node:assert/strict';
import {shotCards,currentShot,shotAnimation,shotLayout} from '../src/graphics/shotCards.js';
import {chapters} from '../src/story.js';
test('every camera shot has an intent, focal object and complete spatial copy',()=>{assert.deepEqual(shotCards.map(s=>s.name),chapters.map(s=>s.name));for(const s of shotCards){assert.equal(currentShot(s.hold).card.name,s.name);assert.ok(s.hero&&s.title&&s.body&&s.intent&&s.focus);assert.ok(s.body.length<100);for(const mobile of [false,true]){const l=shotLayout(s,mobile);assert.ok(l.span>0&&l.span<1);assert.ok(Math.abs(l.x)<1&&Math.abs(l.y)<1);}}});
test('scroll-driven shot envelopes are reversible and bounded, fully masked edits hide typography',()=>{for(let i=0;i<=1000;i++){const p=i/1000,a=shotAnimation(p);assert.ok(a.alpha>=0&&a.alpha<=1);assert.deepEqual(a,shotAnimation(p));assert.equal(shotAnimation(p,1).alpha,0);}});
