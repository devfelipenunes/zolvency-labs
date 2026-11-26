// One world-space trajectory; all poses are pure functions of scroll and layout.
export const clamp = (x) => Math.min(1, Math.max(0, x));
export const ease = t => { t=clamp(t); return t*t*(3-2*t); };
const mix = (a,b,t) => a.map((v,i)=>v+(b[i]-v)*t);
export const windows=[0,.12,.26,.43,.57,.72,.86,1];
const desktop=[
 [0,[-6.5,2.8,22],[2.5,2.6,5]],
 [.12,[-6.2,2.5,12],[3,2.8,-6]],
 [.20,[-6.1,2.7,-1],[3,2.7,-14]],
 [.26,[-6.2,2.7,-18],[3,2.6,-35]],
 [.34,[-6.0,2.6,-31],[3,2.6,-43]],
 [.43,[-6.4,2.9,-53],[3,3,-72]],
 [.50,[-7.0,4.2,-65],[3,3.3,-81]],
 [.57,[-6.5,3.8,-82],[3,3.5,-99]],
 [.65,[-6.6,3.6,-92],[3,3.5,-106]],
 [.72,[-6.5,3.8,-109],[3.5,3.1,-125]],
 [.79,[-7.0,4.5,-118],[3.5,3.2,-134]],
 [.86,[-7.5,5.0,-132],[3.5,3.8,-148]],
 [.96,[-12.5,8.2,-139],[4,3.7,-154]],
 [1,[-12.5,8.2,-139],[4,3.7,-154]]
];
const mobile=desktop.map(([p,pos,target])=>[p,[pos[0]*.90,pos[1]+.3,pos[2]+.5],[target[0]*.84,target[1]-1.0,target[2]]]);
export function cameraPose(progress,isMobile=false){
 const p=clamp(Number.isFinite(progress)?progress:0),keys=isMobile?mobile:desktop;
 let i=keys.findIndex((k,j)=>j<keys.length-1 && p<=keys[j+1][0]);if(i<0)i=keys.length-2;
 const a=keys[i],b=keys[i+1],t=ease((p-a[0])/(b[0]-a[0]));
 return {position:mix(a[1],b[1],t),target:mix(a[2],b[2],t),fov:isMobile?58:42};
}
// Section starts in actual document coordinates; the final segment ends at max scroll.
export function storyProgress(scroll,starts,maxScroll){
 if(maxScroll<=0)return {progress:0,index:0};
 const y=Math.min(maxScroll,Math.max(0,scroll));
 const anchors=starts.map(s=>Math.max(0,Math.min(maxScroll,s)));
 let index=0;for(let i=1;i<anchors.length;i++)if(y>=anchors[i])index=i;
 const a=anchors[index],b=index===anchors.length-1?maxScroll:anchors[index+1];
 const local=b>a?clamp((y-a)/(b-a)):1;
 return {index,progress:windows[index]+(windows[index+1]-windows[index])*local};
}
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm=a=>{const n=Math.hypot(...a);return a.map(v=>v/n)};
export function viewBasis(pose){const forward=norm(sub(pose.target,pose.position)),right=norm(cross(forward,[0,1,0]));return {forward,right,up:cross(right,forward)};}
