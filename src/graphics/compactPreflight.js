// Compile every authored pose; compact mode skips redundant full-frame
// submissions only. This is an opt-in experiment, not a proven release path.
export const warmHolds=Object.freeze([.055,.205,.405,.485,.51,.535,.625,.73,.79,.81,.83,.935,.952,.965,.978,.992]);
export const renderHolds=Object.freeze([.055,.205,.405,.625,.73,.935,.992]);
export function warmupPlan(compact=false){return warmHolds.map(p=>({p,draw:!compact||renderHolds.includes(p)}));}
