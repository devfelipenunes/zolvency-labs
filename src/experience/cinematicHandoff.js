// Native scroll is the single clock. Geometry and readiness remain orthogonal.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
export function cinematicHandoff(scroll,portalTop,storyTop,storyEnd,viewport,researchTop=storyEnd){
 if(![scroll,portalTop,storyTop,storyEnd,viewport,researchTop].every(Number.isFinite)||viewport<=0||storyTop<=portalTop||storyEnd<=storyTop||researchTop<storyEnd)return {entry:0,cover:1,copy:1,exit:0,near:false,inside:false,light:0};
 const entryEnd=storyTop-viewport,span=Math.max(1,entryEnd-portalTop),entry=clamp((scroll-portalTop)/span);
 // A dedicated 40svh return runway lets the full scene dissolve BEFORE research enters.
 const exitStart=storyEnd-viewport,exitEnd=researchTop>storyEnd?researchTop-viewport:storyEnd;
 const exit=smooth((scroll-exitStart)/Math.max(1,exitEnd-exitStart));
 const copy=1-smooth((entry-.03)/.32);
 const cover=1-smooth((entry-.35)/.52);
 return {entry,cover,copy,exit,light:smooth((entry-.35)/.52),near:scroll>=portalTop-viewport*1.05&&scroll<researchTop-1,inside:scroll>=storyTop&&scroll<exitStart};
}
