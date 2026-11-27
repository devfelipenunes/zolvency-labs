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

// Diagnostic scene-presence CI uses a software renderer. Keep the visitor
// deadline unchanged and allow the outer lifecycle to outlast preflight.
export function startupDeadlines(search=''){
 const q=new URLSearchParams(search),diagnostic=q.has('diagnostics')&&q.get('type-choreography')==='scene-presence'&&q.get('living-type')==='kinetic'&&q.get('type-formation')==='ribbon'&&q.get('type-visibility')==='continuous';
 return diagnostic?{preflight:240000,lifecycle:270000}:{preflight:90000,lifecycle:100000};
}
