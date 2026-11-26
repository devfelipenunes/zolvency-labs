import {ramp,windows} from './facilityCamera.js';
export const backlogModes=['final-copy','ops-copy','backlog-copy','backlog-selected'];
export const finalCopy=mode=>mode==='final-copy'||mode==='backlog-copy'||mode==='backlog-selected';
export const opsCopy=mode=>mode==='ops-copy'||mode==='backlog-copy'||mode==='backlog-selected';
export function backlogLayout(name,mobile,mode,layout,mobileY){
 if(name==='CONVERGENCE'&&finalCopy(mode)){
  // Keep the proven mounted/free-space logo and camera. Move only copy
  // toward the dark wall above the floor, with separate portrait spacing.
  return {layout:[layout[0],[.03,-.02,.37,5.2],[.03,-.29,.32,4.4]],mobileY:[mobileY[0],-.04,-.28,-.84]};
 }
 if(name==='INTELLIGENCE'&&opsCopy(mode)){
  return {layout:[[-.52,.73,.34,2.8],[-.52,-.52,.30,2.5],[-.52,-.76,.27,2.6]],mobileY:[.75,-.54,-.78,-.91]};
 }
 return {layout,mobileY};
}
// Reversible, scroll-based timing study, not elapsed reading time.
// All roles are at full opacity at their authored hold.
export function stagedCopy(card,p,base,enabled){
 if(!enabled||card.name==='QUANTUM')return base;
 const i=windows.findLastIndex((v,j)=>j<windows.length-1&&p>=v);
 if(i<0)return base;
 const lo=windows[i],hi=windows[i+1],t=(p-lo)/(hi-lo),hold=(card.hold-lo)/(hi-lo);
 const bodyRamp=ramp(t,Math.max(0,hold-.055),hold);
 return {...base,body:Math.min(base.body,bodyRamp)};
}
