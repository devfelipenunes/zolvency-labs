// Native scroll is the single clock. Geometry and readiness remain orthogonal.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
export function cinematicHandoff(scroll,portalTop,storyTop,storyEnd,viewport,researchTop=storyEnd,finalHold=false,earlyPrepare=false,threshold=false,entrance=false){
 if(![scroll,portalTop,storyTop,storyEnd,viewport,researchTop].every(Number.isFinite)||viewport<=0||storyTop<=portalTop||storyEnd<=storyTop||researchTop<storyEnd)return {entry:0,cover:1,copy:1,exit:0,near:false,inside:false,light:0};
 const entryEnd=storyTop-viewport,span=Math.max(1,entryEnd-portalTop),entry=clamp((scroll-portalTop)/span);
 // A dedicated 40svh return runway lets the full scene dissolve BEFORE research enters.
 const exitStart=storyEnd-viewport,exitEnd=researchTop>storyEnd?researchTop-viewport:storyEnd;
 const exitFraction=clamp((scroll-exitStart)/Math.max(1,exitEnd-exitStart));
 const hold=finalHold&&researchTop>storyEnd?.16:0;
 const exit=exitFraction<=hold+1e-12?0:smooth((exitFraction-hold)/(1-hold));
 // Threshold candidate: retain an editorial focal point while the actual scene becomes visible.
 const copy=1-smooth(entrance?(entry-.08)/.53:threshold?(entry-.18)/.62:(entry-.03)/.32);
 const cover=1-smooth(entrance?(entry-.02)/.60:threshold?(entry-.12)/.73:(entry-.35)/.52);
 return {entry,cover,copy,exit,light:1-cover,near:scroll>=(earlyPrepare?Math.max(viewport*(entrance?.10:.35),portalTop-viewport*(entrance?2.6:1.8)):portalTop-viewport*1.05)&&scroll<researchTop-1,inside:scroll>=storyTop-2&&scroll<exitStart};
}

// Never swap HTML to WebGL after the reader has already crossed the threshold.
// The entry cover can safely blend while at least one quarter viewport remains.
export function lateThresholdReady(progress,storyTop,viewport){return progress>.02||Number.isFinite(storyTop)&&Number.isFinite(viewport)&&viewport>0&&storyTop<viewport*.25;}
