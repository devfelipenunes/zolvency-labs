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
 const hybridSoftware=q.get('hybrid')==='1'&&q.get('hybrid-ci')==='software'&&q.get('type-choreography')==='scene-presence'&&q.get('type-spatial')==='control';
 return diagnostic||hybridSoftware?{preflight:240000,lifecycle:270000}:{preflight:90000,lifecycle:100000};
}

// Hybrid-only recovery experiments; keep a single exact rollback and independent controls.
export function hybridPerformance(search=''){const q=new URLSearchParams(search),enabled=q.get('hybrid')==='1'&&q.get('hybrid-perf')!=='control';return {startup:enabled&&q.get('hybrid-startup')!=='control',motion:enabled&&q.get('hybrid-motion')!=='control',gpu:enabled&&q.get('hybrid-gpu')!=='control',scroll:enabled&&q.get('hybrid-scroll')!=='control'};}
export function hybridPreflightMode(search='',mobile=false){const q=new URLSearchParams(search);return q.get('preflight')??(hybridPerformance(search).startup?(mobile?'guarded':'compact'):null);}
export function hybridRasterRatio(ratio,device,scale){return Math.min(ratio,Math.min(1,device||1)*Math.max(.65,Math.min(1,scale)));}
