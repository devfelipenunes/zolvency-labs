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
