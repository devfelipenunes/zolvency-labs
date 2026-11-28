// Compile every authored pose; compact mode skips redundant full-frame
// submissions only. This is an opt-in experiment, not a proven release path.
export const warmHolds=Object.freeze([.055,.205,.405,.485,.51,.535,.625,.73,.79,.81,.83,.935,.952,.965,.978,.992]);
export const renderHolds=Object.freeze([.055,.205,.405,.625,.73,.935,.992]);
// The mobile transition into the security wing was the highest first-encounter regression in the compact A/B.
export const guardedTransition=Object.freeze([.485,.51,.535]);
export function warmupPlan(compact=false,guarded=false){return warmHolds.map(p=>({p,draw:!compact||renderHolds.includes(p)||guarded&&guardedTransition.includes(p)}));}

// Entry-first experiment: keep shader compilation at every authored view, but
// submit only the first scene before the reveal. The final origin frame is
// still submitted and fenced by prepare(). Later first encounters are gated by CI.
export function entryFirstWarmupPlan(){return warmHolds.map(p=>({p,draw:p===warmHolds[0]}));}
