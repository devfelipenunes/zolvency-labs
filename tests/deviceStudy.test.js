import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdaptiveAO,createDeviceStudy,summarizeDeviceFrames} from '../src/graphics/deviceStudy.js';
test('slow sustained frames disable AO; brief spikes and cooldown cannot oscillate',()=>{
 const a=createAdaptiveAO({slowFrames:4,fastFrames:8,cooldown:500});
 assert.equal(a.observe(100,0),null);a.reset();assert.equal(a.enabled,true);
 for(let i=0;i<4;i++)a.observe(35,i*16);assert.equal(a.enabled,false);
 for(let i=0;i<40;i++)a.observe(5,100+i*5);assert.equal(a.enabled,false);
 for(let i=0;i<20;i++)a.observe(5,1000+i*16);assert.equal(a.enabled,true);
 a.observe(400,2000);assert.equal(a.enabled,true);
});
test('only finite samples, unique GPU serials and visible active frame intervals',()=>{
 const a=createDeviceStudy();a.start();const d={activeFrameIntervalMs:'16',cpuFrameMs:'5',gpuMs:'3',gpuSampleSerial:'1',drawCalls:'80',targetProgress:'.2',progress:'.19',gpuTimerSupported:'true'};
 a.record(d);a.record(d);a.record({...d,activeFrameIntervalMs:'300'});a.record(d,true);a.record({...d,gpuSampleSerial:'2',gpuMs:'4'});
 const r=a.stop(d,{width:1280,height:720});assert.equal(r.samples,3);assert.equal(r.metrics.gpuMs.samples,2);assert.equal(r.metrics.intervalMs.p95,16);assert.ok(!('deviceId' in r));assert.equal(summarizeDeviceFrames([]).metrics.cpuMs.p95,null);
});

test('native scroll timing is consumed once and only after a valid active frame',()=>{
 const study=createDeviceStudy(),d={activeFrameIntervalMs:'16',cpuFrameMs:'4'};
 study.start();study.markScroll(100);study.markScroll(110);study.record(d,false,125);study.record(d,false,140);
 const result=study.stop(d,{width:1280,height:720});assert.equal(result.metrics.scrollToSubmitMs.samples,1);assert.equal(result.metrics.scrollToSubmitMs.p95,15);
});


test('full observed cadence preserves stalls and exposes truncation, legacy summary remains separate',()=>{const a=createDeviceStudy({maxSamples:3});a.start();for(const interval of [16,300,33,800])a.record({activeFrameIntervalMs:String(interval)});const r=a.stop({},{});assert.equal(r.samples,2);assert.equal(r.metrics.intervalMs.p95,33);assert.deepEqual(r.observedIntervals,{samples:3,p50:33,p95:300,max:300,over50ms:1,over250ms:1});assert.equal(r.truncated,true);a.start();assert.equal(a.stop({},{}).truncated,false);});
