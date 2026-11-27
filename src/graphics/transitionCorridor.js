import {smooth5} from './r67/motion-physics.js';
// Deterministic authoring coordinates relative to the authored camera rail.
// This is a moving world-space path, not a fixed mounted sign. The anchor
// endpoints remain fixed. Near-field transit is a deliberate visual compromise.
export function corridorWeight(u){return smooth5(Math.max(0,Math.min(1,u/.23,(1-u)/.23)));}
export function corridorSlot(index,count,u,act){
 const cols=Math.min(6,Math.ceil(Math.sqrt(count*1.6))),rows=Math.ceil(count/cols),col=index%cols,row=Math.floor(index/cols);
 const n=Math.min(cols,count-row*cols),x=(col-(n-1)/2)*1.38/Math.max(1,cols-1),y=((rows-1)/2-row)*.70/Math.max(1,rows-1);
 const phase=u*Math.PI*2+index*.55,arc=Math.sin(Math.PI*u);
 const wave=act===4||act===5?.12:.065;
 return [x+Math.sin(phase)*wave*arc,y+Math.cos(phase)*wave*arc,-.10*(1+Math.sin(phase))*arc];
}
