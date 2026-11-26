// Explicit cinematic blocking in a shared three-dimensional world. Scroll is the only clock.
export const clamp=(x)=>Math.min(1,Math.max(0,x));
export const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
export const windows=[0,.115,.435,.575,.68,.80,.91,1];
export function legacyProgress(p){if(p<=.575)return p;if(p<=.68)return .575;if(p<=.80)return .575+(p-.68)*.155/.12;if(p<=.91)return .73+(p-.80)*.135/.11;return .865+(p-.91)*.135/.09;}
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
// progress, position, optical target, vertical lens FOV, desktop composition (-1 left copy, +1 right)
const originalShots=[
 [0,[12,7,22],[0,2,0],47,-1,'Establishing'],
 [.055,[7,4.5,11],[0,2,0],35,-1,'Dolly'],
 [.115,[15,8,-8],[18,4,-24],53,1,'Reveal'],
 [.165,[26,8,-17],[18,4,-24],40,1,'Orbit'],
 [.205,[24,4,-24],[18,4,-24],33,1,'Macro'],
 [.235,[13,17,-38],[0,2,-48],57,-1,'Crane'],
 [.28,[3.5,12,-40],[0,2,-48],48,-1,'Overhead'],
 [.33,[3.5,4.8,-43],[3.5,3,-51],61,0,'Dive'],
 [.36,[3.5,4.8,-48],[3.5,3.0,-55],61,0,'Between blocks'],
 [.377,[3.5,5.5,-52.5],[-4,4,-55],53,-1,'Orbit turn'],
 [.395,[3.5,6.5,-55],[0,3,-48],47,-1,'Orbit reverse'],
 [.435,[-10,11,-63],[-22,4,-75],55,1,'Pull back'],
 [.49,[-32,11,-65],[-22,4,-75],48,1,'Network orbit'],
 [.575,[-25,13,-88],[12,3,-100],56,-1,'Network exit'],
 [.62,[4,12,-91],[12,3,-100],39,-1,'Processor approach'],
 [.67,[18,8,-94],[12,3,-100],36,1,'Chip orbit'],
 [.705,[19,5.8,-104],[12,3,-100],51,1,'Low-angle detail'],
 [.73,[7,13,-113],[-6,5,-124],56,1,'Quantum reveal'],
 [.785,[2,10,-124],[-6,5,-124],43,1,'Vertical descent'],
 [.825,[0,1.4,-130],[-6,1,-124],35,0,'Chip macro'],
 [.839,[6,4,-132],[-6,3,-133],49,0,'Bank'],
 [.851,[7,8,-137],[1,4,-151],55,-1,'Turn'],
 [.865,[0,10,-141],[10,4,-153],55,-1,'Convergence reveal'],
 [.925,[19,12,-141],[10,4,-153],46,-1,'Final orbit'],
 [.98,[27,15,-131],[10,4,-153],54,0,'Dolly out'],
 [1,[27,15,-131],[10,4,-153],54,0,'Hold']
];
const remap=p=>p<=.575?p:p<=.73?.68+(p-.575)*.12/.155:p<=.865?.80+(p-.73)*.11/.135:.91+(p-.865)*.09/.135;
export const shots=[...originalShots.filter(k=>k[0]<=.575),
 [.59,[-15,10,-94],[-4,4,-86],51,-1,'Proof chamber reveal'],
 [.615,[-4,11,-97],[-4,4,-86],45,-1,'Verifier overhead'],
 [.64,[7,9,-94],[-4,4,-86],42,1,'Proof orbit'],
 [.66,[10,12,-91],[0,4,-92],55,1,'Arithmetic exit'],
 [.68,[8,13,-88],[12,3,-100],58,-1,'Intelligence reveal'],
 ...originalShots.filter(k=>k[0]>.575).map(k=>[remap(k[0]),...k.slice(1)])];
// Mobile uses separate framing and wider lens, plus higher approach points at select shots.
const mobile=shots.map(([p,pos,target,fov,align,name])=>[p,[pos[0],pos[1]+(name==='Between blocks'?0:.55),pos[2]],[...target],Math.min(74,fov+13),0,name]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n)};
export function viewBasis(pose){const forward=norm(sub(pose.target,pose.position)),right=norm(cross(forward,[0,1,0]));return {forward,right,up:cross(right,forward)};}
export function cameraPose(progress,isMobile=false){
 const p=clamp(Number.isFinite(progress)?progress:0),keys=isMobile?mobile:shots;
 let i=keys.findIndex((k,j)=>j<keys.length-1&&p<=keys[j+1][0]);if(i<0)i=keys.length-2;
 const a=keys[i],b=keys[i+1],t=ease((p-a[0])/(b[0]-a[0])),position=mix(a[1],b[1],t),target=mix(a[2],b[2],t),fov=a[3]+(b[3]-a[3])*t;
 const align=a[4]+(b[4]-a[4])*t,d=Math.hypot(...sub(target,position)),basis=viewBasis({position,target});
 const offset=isMobile?basis.up.map(v=>-v*d*.17):basis.right.map(v=>v*d*.24*align);
 return {position,target:target.map((v,j)=>v+offset[j]),fov};
}
export function storyProgress(scroll,starts,maxScroll){
 if(maxScroll<=0)return {progress:0,index:0};
 // Browser scroll extent and scrollY can differ by subpixels on mobile.
 const y=scroll<=1?0:scroll>=maxScroll-1?maxScroll:Math.max(0,Math.min(maxScroll,scroll));
 const anchors=starts.map(s=>Math.max(0,Math.min(maxScroll,s)));
 let index=0;for(let i=1;i<anchors.length;i++)if(y>=anchors[i])index=i;
 const a=anchors[index],b=index===anchors.length-1?maxScroll:anchors[index+1],local=b>a?clamp((y-a)/(b-a)):1;
 return {index,progress:windows[index]+(windows[index+1]-windows[index])*local};
}
