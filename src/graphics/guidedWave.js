import {smooth5} from './r67/motion-physics.js';
export const motionFamilies=Object.freeze(['magnetic-assembly','traveling-wave','depth-stream','precision-lock','signal-flow','orbital-assembly']);
// Source reading order, not alphabetic group order. Matched characters occupy
// the central train; separate source/target-only glyphs follow its side lanes.
export function trainOrder(items){const order={};for(const kind of ['keep','depart','arrive']){const part=items.filter(g=>g.kind===kind).sort((a,b)=>(a.from??a.to)-(b.from??b.to)||a.id.localeCompare(b.id));part.forEach((g,i)=>order[g.id]={rank:i,count:part.length,kind});}return order;}
const clamp=x=>Math.max(0,Math.min(1,x));
export function waveTiming(u,rank,count){const r=count>1?rank/(count-1):0;return smooth5(clamp((u-.10*r)/.90));}
export function trainSlot(meta,u,act){
 const {rank,count,kind}=meta,lanes=Math.max(1,Math.ceil(count/7)),lane=Math.floor(rank/7),col=rank%7,n=Math.min(7,count-lane*7),r=count>1?rank/(count-1):.5;
 const x=n===1?0:(col/(n-1)-.5)*1.28, y=(lanes===1?0:(.5-lane/(lanes-1))*.56);
 const e=Math.sin(Math.PI*u),pulse=2*Math.PI*u-r*4.8;let dx=0,dy=0,dz=0,rz=0;
 switch(act){
 case 0: dx=-.12*x*e;dy=.08*(1-r)*e;dz=-.12*(1-r)*e;rz=-.10*x*e;break;
 case 1: dy=.12*Math.sin(pulse)*e;dz=-.08*(1+Math.cos(pulse))*e;rz=.13*Math.cos(pulse)*e;break;
 case 2: dx=.035*Math.sin(pulse)*e;dy=.075*x*e;dz=-.20*r*e;rz=.10*x*e;break;
 case 3: dx=(lane%2?1:-1)*.045*e;dy=-.08*y*e;dz=-.06*(rank%2)*e;rz=(rank%2?1:-1)*.10*e;break;
 case 4: dy=.095*Math.sin(pulse)*e;dz=-.09*(1+Math.sin(pulse))*e;rz=.16*Math.cos(pulse)*e;break;
 case 5: {const a=.28*Math.sin(Math.PI*u),cx=x*Math.cos(a)-y*Math.sin(a),cy=x*Math.sin(a)+y*Math.cos(a);dx=cx-x;dy=cy-y;dz=-.10*(1+Math.cos(pulse))*e;rz=a;break;}
 }
 const side=kind==='depart'?-1:kind==='arrive'?1:0;
 // Unlike the core train, unmatched characters have authored exit/entry lanes.
 const away=kind==='depart'?smooth5((u-.42)/.30):kind==='arrive'?smooth5((.58-u)/.30):0;
 return {position:[x+dx+side*(.18+2.8*away),y+dy+(side?side*.38:0),dz+(side?-.08:0)],roll:rz,scaleFactor:side?.78:1};
}
