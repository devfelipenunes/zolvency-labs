import test from 'node:test';
import assert from 'node:assert/strict';
import {createSubmissionGate} from '../src/graphics/submissionGate.js';
function fake(){
 const states=new Map();let id=0;const deleted=[];let flushes=0;
 const gl={SYNC_GPU_COMMANDS_COMPLETE:1,ALREADY_SIGNALED:2,CONDITION_SATISFIED:3,WAIT_FAILED:4,TIMEOUT_EXPIRED:5,fenceSync:()=>{states.set(++id,5);return id;},clientWaitSync:(s,f,t)=>{assert.equal(f,0);assert.equal(t,0);return states.get(s);},deleteSync:s=>{assert.ok(states.has(s));states.delete(s);deleted.push(s);},flush:()=>flushes++,isContextLost:()=>false};
 return {gl,states,deleted,get flushes(){return flushes;}};
}
test('two outstanding submissions at most; completion unlocks the newest target',()=>{
 const f=fake(),g=createSubmissionGate(f.gl);
 assert.equal(g.ready(0),true);g.submit(0);assert.equal(g.ready(1),true);g.submit(1);
 assert.equal(g.ready(2),false);assert.equal(g.stats().pending,2);assert.equal(f.flushes,2);
 f.states.set(1,f.gl.CONDITION_SATISFIED);assert.equal(g.ready(3),true);g.submit(3);
 assert.equal(g.stats().pending,2);assert.equal(g.stats().completed,1);assert.equal(g.stats().maxPending,2);
 g.dispose();assert.deepEqual(f.deleted,[1,2,3]);assert.equal(g.ready(4),false);
});
test('missing API, timeout and WAIT_FAILED fail open, without leaked fences',()=>{
 const unsupported=createSubmissionGate({});assert.equal(unsupported.ready(0),true);unsupported.submit(0);assert.equal(unsupported.stats().supported,false);
 for(const reason of ['timeout','wait-failed']){
  const f=fake(),g=createSubmissionGate(f.gl,{timeoutMs:20});g.submit(0);g.submit(1);
  if(reason==='wait-failed')f.states.set(1,f.gl.WAIT_FAILED);
  assert.equal(g.ready(22),true);assert.equal(g.stats().enabled,false);assert.equal(g.stats().failure,reason);assert.equal(g.stats().pending,0);assert.equal(f.states.size,0);
  g.submit(23);assert.equal(f.states.size,0);g.dispose();
 }
});
test('reset and context loss release pending fences',()=>{const f=fake(),g=createSubmissionGate(f.gl);g.submit(0);g.reset();assert.equal(f.states.size,0);g.submit(1);f.gl.isContextLost=()=>true;assert.equal(g.ready(2),true);assert.equal(g.stats().failure,'context-lost');assert.equal(f.states.size,0);});
