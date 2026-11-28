import {storyProgress} from '../graphics/facilityCamera.js';
// Coordinates are in document pixels, but the camera only owns its local range.
export function facilityProgress(scroll,starts,end,viewport){
 if(!Array.isArray(starts)||starts.length!==7||!starts.every(Number.isFinite)||!Number.isFinite(end)||!Number.isFinite(viewport)||viewport<=0)return {progress:0,index:0};
 const origin=starts[0],max=Math.max(0,end-viewport-origin);
 return storyProgress(scroll-origin,starts.map(x=>x-origin),max);
}
export function facilityWindow(scroll,portalTop,start,end,viewport){
 if(![scroll,portalTop,start,end,viewport].every(Number.isFinite)||viewport<=0||end<=start)return {near:false,visible:false};
 return {near:scroll>=portalTop-viewport*.75&&scroll<end-1,visible:scroll>=start-viewport*.15&&scroll<end-1};
}

// Reuse only the first 0.012 of the approved rail. The first chapter absorbs
// the lead smoothly; every subsequent chapter has exactly its original target.
const smooth=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
export const spatialLead=.012;
export function spatialFacilityProgress(scroll,starts,end,viewport,threshold=false){
 const base=facilityProgress(scroll,starts,end,viewport);
 if(!Array.isArray(starts)||starts.length!==7||!starts.every(Number.isFinite)||!Number.isFinite(scroll)||!Number.isFinite(viewport)||viewport<=0||!Number.isFinite(end)||end<=starts[0]+viewport)return base;
 const lead=threshold?.018:spatialLead;
 if(scroll<starts[0]){
  const leadStart=starts[0]-viewport*(threshold?1.42:1.13);
  return {index:0,progress:lead*smooth((scroll-leadStart)/(starts[0]-leadStart))};
 }
 if(base.index!==0)return base;
 return {index:0,progress:base.progress+lead*(1-smooth(base.progress/.115))};
}
