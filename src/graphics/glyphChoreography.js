import {windows} from './facilityCamera.js';
export const glyphHolds=[.055,.205,.405,.625,.73,.935,.992];
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
// Stable reading window around the authored camera hold, especially the
// late quantum hold. Only the existing full optical mask may obscure text.
export function glyphPhase(p){
 p=clamp(p);const index=Math.max(0,windows.findLastIndex((v,i)=>i<7&&p>=v)),a=windows[index],b=windows[index+1],h=glyphHolds[index];
 const arrive=a+(h-a)*.82,depart=h+(b-h)*.42;
 const entering=p<arrive,exiting=index!==6&&p>depart;
 return {index,kind:entering?'enter':exiting?'exit':'hold',u:entering?clamp((p-a)/(arrive-a)):exiting?clamp((p-depart)/(b-depart)):1};
}
// x/y offsets are in local viewport half-extents; z in local units of
// viewport height. Every character has a deterministic stagger and 3-axis
// rotation. Phase endpoints are exact, so reversing is just resampling.
export function glyphTransform(act,i,n,phase,role='headline'){
 if(phase.kind==='hold')return [0,0,0,0,0,0];
 const rank=n<=1?0:i/(n-1),exit=phase.kind==='exit',stagger=.30*(exit?1-rank:rank);
 const t=clamp((phase.u-stagger)/.70),u=exit?1-t:t,q=ease(u),a=1-q;
 if(u===1)return [0,0,0,0,0,0];
 const side=i%2?1:-1,mid=rank-.5,arc=Math.sin(Math.PI*q),recoil=Math.sin(Math.PI*3*q)*Math.sin(Math.PI*q)*Math.exp(-4*q);
 let x=0,y=0,z=-.28*a,rx=0,ry=0,rz=0;
 switch(act){
 case 0:x=side*3.4*a;y=mid*.45*a+.24*side*arc;ry=side*1.0*a;rz=side*.32*a;break;
 case 1:x=(exit?1:-1)*3.7*a+.10*recoil;y=side*.18*arc;z=-.48*a;ry=(exit?1:-1)*1.15*a;break;
 case 2:x=side*3.5*a;y=side*.65*arc;z=-(.25+.65*(i%3)/2)*a;rx=side*.7*a;ry=side*.9*a;break;
 case 3:y=(exit?-1:1)*3.5*a;x=side*.60*arc;z=-.5*a;rx=side*1.25*a;rz=side*.22*a;break;
 case 4:x=(exit?-1:1)*3.6*a;y=Math.sin(rank*9+q*4)*.55*arc;z=-.35*a;ry=side*.85*a;rz=side*.28*arc;break;
 case 5:x=side*3.6*a;y=Math.sin(rank*5+q*Math.PI)*1.1*arc;z=-.65*a;rx=side*.6*a;ry=side*1.2*a;rz=side*.6*a;break;
 case 6:x=side*3.5*a;y=mid*.8*a;z=-.55*a;ry=side*.95*a;rz=side*.18*a;break;
 default:throw Error('unknown act');
 }
 // Body letters remain independent; smaller secondary motion, same offscreen endpoint.
 if(role==='body'){y*=.8;z*=.65;rx*=.6;ry*=.65;rz*=.5;}
 return [x,y,z,rx,ry,rz];
}
