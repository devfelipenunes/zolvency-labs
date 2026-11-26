// Bound outstanding GPU submissions without blocking the main thread or advancing the camera
// on poll-only RAFs. An unavailable/lost/timed-out fence fails open, not into a frozen site.
export function createSubmissionGate(gl,{limit=2,timeoutMs=4000}={}){
 const supported=!!(gl?.fenceSync&&gl?.clientWaitSync&&gl?.deleteSync&&gl?.flush);
 let enabled=supported,closed=false,blocked=0,submitted=0,completed=0,maxPending=0,failure=null;
 const pending=[];
 function drop(){for(const p of pending){try{gl.deleteSync(p.sync);}catch{}}pending.length=0;}
 function disable(reason){failure=reason;enabled=false;drop();}
 return {
  ready(now){if(closed)return false;if(!enabled)return true;
   try{
    if(gl.isContextLost?.()){disable('context-lost');return true;}
    while(pending.length){const p=pending[0],state=gl.clientWaitSync(p.sync,0,0);
     if(state===gl.ALREADY_SIGNALED||state===gl.CONDITION_SATISFIED){pending.shift();gl.deleteSync(p.sync);completed++;continue;}
     if(state===gl.WAIT_FAILED||now-p.ts>timeoutMs){disable(state===gl.WAIT_FAILED?'wait-failed':'timeout');return true;}break;}
    if(pending.length>=limit){blocked++;return false;}return true;
   }catch{disable('poll-error');return true;}
  },
  submit(now){if(closed||!enabled)return;if(pending.length>=limit){disable('submission-overflow');return;}
   try{const sync=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);if(!sync){disable('no-fence');return;}pending.push({sync,ts:now});submitted++;maxPending=Math.max(maxPending,pending.length);gl.flush();}catch{disable('submit-error');}
  },
  reset(){drop();},dispose(){closed=true;drop();},
  stats(){return {supported,enabled,pending:pending.length,blocked,submitted,completed,maxPending,failure};}
 };
}
