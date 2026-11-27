// One reversible, continuous handoff, driven by the native scroll coordinate.
// Asset readiness is deliberately separate from the geometry of the scroll.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
export function cinematicHandoff(scroll,portalTop,storyTop,storyEnd,viewport){
 if(![scroll,portalTop,storyTop,storyEnd,viewport].every(Number.isFinite)||viewport<=0||storyTop<=portalTop||storyEnd<=storyTop)return {entry:0,cover:1,copy:1,exit:0,near:false,inside:false};
 // The portal is a full-screen sticky beat, with an additional native scroll span.
 // At storyTop - viewport the portal naturally begins to leave the viewport.
 const entryEnd=storyTop-viewport,span=Math.max(1,entryEnd-portalTop);
 const entry=clamp((scroll-portalTop)/span);
 const exit=clamp((scroll-(storyEnd-viewport))/viewport);
 const copy=1-smooth((entry-.05)/.40);
 // No window or aperture clipping. Fade to the full native camera frame.
 const cover=1-smooth((entry-.25)/.65);
 return {entry,cover,copy,exit:smooth(exit),near:scroll>=portalTop-viewport*.75&&scroll<storyEnd-1,inside:scroll>=storyTop&&scroll<storyEnd-viewport*.40};
}
