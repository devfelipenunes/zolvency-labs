const clamp=x=>Math.max(0,Math.min(1,x));export const smooth5=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
export function bezier(a,b,c,d,t){t=clamp(t);if(t===0)return a.slice();if(t===1)return d.slice();const q=1-t;return a.map((v,i)=>q*q*q*v+3*q*q*t*b[i]+3*q*t*t*c[i]+t*t*t*d[i]);}
export function choreograph(act,i,n,u,exit=false,role='headline'){
 const rank=n>1?i/(n-1):0,side=i%2?1:-1,delay=.20*(exit?1-rank:rank),t=smooth5(clamp((u-delay)/.8)),q=exit?1-t:t;
 if(q===1)return [0,0,0,0,0,0];
 const off=exit?-1:1,mid=rank-.5;
 const paths=[[[side*3.8,mid*.7,-.7],[side*1.1,side*.7,-.9],[side*.25,0,.12]],[[-off*3.8,0,-.35],[-off*2.1,0,-.22],[-off*.2,side*.16,.06]],[[side*3.8,side*.7,-1.1],[side*1.2,side*.7,-.9],[0,side*.2,-.15]],[[0,off*3.8,-.6],[side*1.0,off*1.5,-.6],[side*.25,.15,0]],[[off*3.8,mid*.7,-.4],[off*1.7,side*1.0,-.6],[.2,side*.25,0]],[[side*3.8,mid*1.4,-1.2],[side*2.1,-side*1.5,-1.2],[-side*.25,side*.3,.12]],[[side*3.8,mid*.9,-.7],[side*1.4,side*.6,-.7],[0,.2,.15]]];
 const [a,b,c]=paths[act]??paths[0],p=bezier(a,b,c,[0,0,0],q),r=role==='body'?.55:1,rem=1-q;
 return [...p.map((v,k)=>k===1?v*(role==='body'?.8:1):v),side*.65*rem*r,off*side*1.1*rem*r,side*.32*rem*r];
}
// Fixed-step 1D proxy interval contact, not actual glyph hull collision.
export function solveContact(a,b,e=.15){const overlap=(a.width+b.width)/2-(b.x-a.x);if(overlap<0)return 0;const invA=1/a.mass,invB=1/b.mass,inv=invA+invB;if(overlap>0){a.x-=overlap*invA/inv;b.x+=overlap*invB/inv;}const rel=b.v-a.v;if(rel>=0)return 0;const j=-(1+e)*rel/inv;a.v-=j*invA;b.v+=j*invB;return j;}
export function bakeChain(widths,{restitution=.15,damping=.50,dt=1/240,seconds=3}={}){if(!widths.length||widths.some(w=>!(w>0&&Number.isFinite(w))))throw Error('invalid widths');let cursor=0;const p=widths.map((width,i)=>{const x=cursor+width/2;cursor+=width+.025;return {x,width,mass:width,v:i===0?2.2:0};}),frames=[],contacts=[];
 for(let step=0;step<=Math.round(seconds/dt);step++){if(step%4===0)frames.push(p.map(o=>o.x));if(step===Math.round(seconds/dt))break;for(const o of p){o.x+=o.v*dt;o.v*=Math.exp(-damping*dt);}for(let iter=0;iter<16;iter++)for(let i=0;i<p.length-1;i++){const j=solveContact(p[i],p[i+1],restitution);if(j>1e-8)contacts.push({step,i,impulse:j});}}
 return {frames,contacts,dt:dt*4,tailVelocity:p.map(o=>o.v),final:p.map(o=>o.x)};
}
export function correctEndpoint(frames,rest){const end=frames.at(-1),n=frames.length;return frames.map((row,i)=>{if(i===n-1)return rest.slice();const q=Math.max(0,(i/(n-1)-.65)/.35),s=q*q*(3-2*q);return row.map((x,j)=>x+(rest[j]-end[j])*s);});}
