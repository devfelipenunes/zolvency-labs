// One world-space trajectory; all poses are pure functions of scroll and layout.
export const clamp = (x) => Math.min(1, Math.max(0, x));
export const ease = t => { t=clamp(t); return t*t*(3-2*t); };
const mix = (a,b,t) => a.map((v,i)=>v+(b[i]-v)*t);
export const windows = [0,.27,.62,1];
const desktop = [
 [0,[-5.5,1.4,18],[-2.7,1.9,3]],
 [.27,[-5,1.5,15],[-1.7,1.9,3]],
 [.46,[-3.4,1.55,9],[-.2,1.85,-2]],
 [.62,[0,1.6,3],[0,1.8,-12]],
 [.86,[0,1.65,-8],[0,1.8,-23]],
 [1,[0,1.65,-8],[0,1.8,-23]]
];
const mobile = [
 [0,[-4.8,1.4,18],[-1.2,1.0,2]],
 [.27,[-4.3,1.45,15],[-1,1.0,1]],
 [.46,[-2.6,1.5,9],[0,1.0,-2]],
 [.62,[0,1.6,3],[0,1.1,-12]],
 [.86,[0,1.65,-8],[0,1.1,-23]],
 [1,[0,1.65,-8],[0,1.1,-23]]
];
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
