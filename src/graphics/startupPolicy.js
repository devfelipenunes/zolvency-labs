// Normal visits wait for the entire selected facility; keep explicit comparison routes.
export function completeStartup(search=''){
 const q=new URLSearchParams(search);
 if(q.get('renderer')==='canvas')return false;
 if(q.get('experience')==='editorial'&&q.get('direction')==='staged')return true;
 if(q.get('startup')==='complete')return true;
 return q.get('startup')!=='progressive'&&!q.has('diagnostics')&&q.get('perf')!=='legacy';
}
export function mobileStartupBudget(search='',width=0){
 const q=new URLSearchParams(search);
 return width<720&&completeStartup(search)&&q.get('experience')!=='editorial'&&!q.has('profile')&&!q.has('quality')&&!q.has('aa')&&!q.has('diagnostics');
}

// A/B escape hatch retains the old motion with the same startup and GPU budget.
export function mobileMotionEnabled(search='',width=0){return mobileStartupBudget(search,width)&&new URLSearchParams(search).get('mobile-motion')!=='control';}

// Software-rendered, full-startup diagnostics may need the longer internal
// preparation budget. Normal visits retain their existing 100s deadline.
export function startupDeadline(search=''){const q=new URLSearchParams(search);return q.has('diagnostics')&&q.has('benchmark')&&q.get('type-choreography')==='scene-presence'&&q.get('startup')==='complete'?270000:100000;}
