// R112/R113 — stable composition and presentation-driven readiness.
export function seamlessThreshold(search=''){const q=new URLSearchParams(search);return q.get('hybrid')==='1'&&q.get('type-entry')!=='control'&&q.get('type-threshold')!=='control'&&q.get('hybrid-seam')!=='control'&&q.get('hybrid-perf')!=='control';}
export function preparationPercent(status){if(!status)return 0;const fraction=Math.max(0,Math.min(1,Number(status.done||0)/Math.max(1,Number(status.total||1))));switch(status.phase){case 'assets':return Math.round(65*fraction);case 'environment':return 65+Math.round(5*fraction);case 'textures':return 70+Math.round(15*fraction);case 'warming':return 85+Math.round(14*fraction);case 'revealing':return 99;case 'ready':return 100;default:return 0;}}
export function presentationReady({rendered,target,narrativeReady,submitted}={}){return submitted===true&&narrativeReady===true&&Number.isFinite(rendered)&&Number.isFinite(target)&&Math.abs(rendered-target)<=.0005;}
// Only renderer submission is observed. No assertion about display scanout.
export function warmOpeningShaders(search=''){const q=new URLSearchParams(search);return seamlessThreshold(search)&&q.get('hybrid-decoder')!=='control';}

// R116: editorial copy owns the early reveal; Origin geometry owns the late reveal.
export function originTitleHandoff(search=''){return seamlessThreshold(search)&&new URLSearchParams(search).get('hybrid-title')!=='control';}
export function originTitleAlpha(entry){if(!Number.isFinite(entry))return 1;const t=Math.max(0,Math.min(1,(entry-.70)/.22));return t*t*(3-2*t);}
// Keep the opening legible on phone displays. Retain adaptive budget but avoid
// sub-.85 CSS-pixel buffers that visibly damaged the R115 typography.
export function readableRasterRatio(ratio,device,scale){const cap=Math.min(1.15,Math.max(.1,device||1));return Math.min(cap,Math.max(ratio,cap*Math.max(.85,Math.min(1,scale))));}

// R117: actual rendered Origin still, short architectural entrance; R116 is the exact control.
export function cinematicEntrance(search=''){return seamlessThreshold(search)&&new URLSearchParams(search).get('hybrid-entrance')!=='control';}
export function entranceCanJoin(progress,storyTop,viewport){return Number.isFinite(progress)&&Number.isFinite(storyTop)&&Number.isFinite(viewport)&&viewport>0&&progress<=.045&&storyTop>=-viewport*.25;}
