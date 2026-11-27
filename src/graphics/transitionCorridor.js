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

// R72: authored near-field avoidance at the cryostat threshold. No runtime
// raycasts to choose poses. Depth is deterministic and blends continuously
// with the unchanged fixed reading anchors.
export function cinematicDepth(act,u){
 const t=smooth5(Math.max(0,Math.min(1,(u-.12)/.18,(.88-u)/.18)));
 return .55-(act===4?.32:act===5?.14:0)*t;
}
// Six bounded formations, each with distinct mechanical intent. They retain
// ordered packing and use the same collision/visibility gates as the control.
export function cinematicSlot(index,count,u,act){
 const cols=Math.min(6,Math.ceil(Math.sqrt(count*1.6))),rows=Math.ceil(count/cols),col=index%cols,row=Math.floor(index/cols),n=Math.min(cols,count-row*cols);
 const x=(col-(n-1)/2)*1.38/Math.max(1,cols-1),y=((rows-1)/2-row)*.70/Math.max(1,rows-1);
 const envelope=Math.sin(Math.PI*u),phase=2*Math.PI*u,rank=count>1?index/(count-1):0;
 let dx=0,dy=0,dz=0;
 switch(act){
  case 0: // magnetic alignment along structural axes
   dx=-x*.13*envelope;dy=-y*.10*envelope;dz=-.09*(1+Math.cos(phase+col*.7))*envelope;break;
  case 1: // neighbor impulse traveling along the rack
   dx=.07*Math.sin(phase-col*.85)*envelope;dy=.045*Math.sin(phase-col*.85)*envelope;dz=-.09*(1+Math.sin(phase-col*.85))*envelope;break;
  case 2: // staggered docking of separate layers
   dx=(row%2?1:-1)*.065*envelope;dy=.045*Math.cos(phase+row*.9)*envelope;dz=-(.05+.05*(col%3))*envelope;break;
  case 3: // precision lock: paired counter motion
   dx=(col%2?1:-1)*.06*Math.cos(phase)*envelope;dy=-y*.10*envelope;dz=-(.07+.035*(col%2))*envelope;break;
  case 4: // signal wave into quantum corridor, shallow depth for clearance
   dx=.055*Math.sin(phase-rank*5)*envelope;dy=.055*Math.cos(phase-rank*5)*envelope;dz=-.05*(1+Math.sin(phase-rank*5))*envelope;break;
  case 5: // orbital assembly, rotation of the formation in its local plane
   {const angle=.16*Math.sin(phase)*envelope;dx=x*(Math.cos(angle)-1)-y*Math.sin(angle);dy=x*Math.sin(angle)+y*(Math.cos(angle)-1);dz=-.09*(1+Math.cos(phase+rank*6))*envelope;break;}
 }
 return [x+dx,y+dy,dz];
}
