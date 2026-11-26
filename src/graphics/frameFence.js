// Wait for actual submitted work; never use gl.finish or attribute stale GPU queries.
export async function waitForSubmittedFrame(gl,{timeoutMs=30000,now=()=>performance.now(),pause=()=>new Promise(r=>setTimeout(r,4))}={}){
 const fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);if(!fence)throw Error('GPU fence unavailable');
 const start=now();
 try{gl.flush();for(;;){const result=gl.clientWaitSync(fence,0,0);if(result===gl.ALREADY_SIGNALED||result===gl.CONDITION_SATISFIED)return now()-start;if(result===gl.WAIT_FAILED||gl.isContextLost()||now()-start>timeoutMs)throw Error('GPU fence failed or timed out');await pause();}}
 finally{gl.deleteSync(fence);}
}
