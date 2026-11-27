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
