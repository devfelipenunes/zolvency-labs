import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderBudget,createFrameQueue,createGpuTimer} from '../src/graphics/renderLab.js';
test('render budget responds slowly, stays within bounds and recovers',()=>{
 const b=createRenderBudget();
 for(let i=0;i<7;i++)assert.equal(b.sample(30),1);
 assert.ok(b.sample(30)<1);
 for(let i=0;i<200;i++)b.sample(30);
 assert.equal(b.scale,.75);
 for(let i=0;i<1000;i++)b.sample(3);
 assert.equal(b.scale,1);
 assert.equal(b.sample(NaN),1);
});
test('frame queue coalesces inputs and cancels on dispose',()=>{
 let callback,requests=0,cancelled=0;const calls=[];
 const q=createFrameQueue(x=>calls.push(x),fn=>{callback=fn;return ++requests;},()=>cancelled++);
 q.schedule(.1);q.schedule(.6);q.schedule(.2);assert.equal(requests,1);callback();assert.deepEqual(calls,[.2]);
 q.schedule(.9);q.dispose();callback();assert.equal(cancelled,1);assert.deepEqual(calls,[.2]);
});
test('GPU timer is optional and does not invent unsupported timings',()=>{
 assert.equal(createGpuTimer({getExtension:()=>null}),null);
});
test('GPU timer ignores disjoint results and releases completed queries',()=>{
 const ext={TIME_ELAPSED_EXT:1,GPU_DISJOINT_EXT:2};let disjoint=false,deleted=0,ended=0;
 const gl={QUERY_RESULT_AVAILABLE:3,QUERY_RESULT:4,getExtension:()=>ext,createQuery:()=>({}),beginQuery(){},endQuery(){ended++},getParameter:()=>disjoint,getQueryParameter:(q,k)=>k===3?true:5_000_000,deleteQuery(){deleted++}};
 const timer=createGpuTimer(gl);
 timer.begin();timer.end();assert.equal(timer.poll(),5);assert.equal(deleted,1);
 timer.begin();timer.end();disjoint=true;assert.equal(timer.poll(),null);assert.equal(deleted,2);
 timer.dispose();assert.equal(ended,2);
});
