// Authored procedural greybox. The same static centerlines power both renderers.
const TAU=Math.PI*2;
function sample(n,fn){return Array.from({length:n+1},(_,i)=>fn(i/n));}
export const portal={z:0,centerY:1.7,rx:4.2,ry:3.8};
export function makeWorld(){
 const paths=[];
 const add=(points,radius,kind='rib')=>paths.push({points,radius,kind});
 // Foreground strands sweep toward the portal; their closest edges stay outside the camera path.
 for(const side of [-1,1]) for(let j=0;j<5;j++){
   add(sample(100,t=>{const z=17-17*t,offset=j*.45;const cx=-4.9*(1-t);const x=cx+side*(2.8+offset+1.55*t+.25*Math.sin(t*TAU+j*.5));const y=-.4+j*.73+.65*Math.sin(t*Math.PI+j*.25);return [x,y,z]}),.15+j*.015,j===0?'accent':'rib');
 }
 // One thick continuous oval profile defines each threshold and the interior nave.
 for(const [z,rx,ry] of [[0,4.2,3.8],[-.9,4.35,3.9],[-2.1,4.7,4.1],[-5,5.5,4.4],[-9,5.7,4.6],[-13,5.9,4.7],[-17,6,4.7],[-21,5.8,4.6],[-25,5.4,4.4],[-29,4.6,4]]){
  add(sample(100,t=>[rx*Math.cos(t*TAU),1.7+ry*Math.sin(t*TAU),z]),z===0?.40:.23,'rib');
  add(sample(100,t=>[(rx-.38)*Math.cos(t*TAU),1.7+(ry-.38)*Math.sin(t*TAU),z+.05]),.045,'accent');
 }
 // Longitudinal threads weave the repeating ribs into a single volume.
 for(let j=0;j<12;j++){
  const theta=j*TAU/12;
  add(sample(150,t=>{const angle=theta+.17*Math.sin(t*TAU),r=4.6+1.1*Math.sin(t*Math.PI);return [r*Math.cos(angle),1.7+(r*.78)*Math.sin(angle),-30*t]}),.12,j%4===0?'accent':'rib');
 }
 // A distant node closes the perspective; camera stops before it.
 for(let j=0;j<3;j++)add(sample(90,t=>[(1.5+j*.5)*Math.cos(t*TAU),1.7+(1.5+j*.5)*Math.sin(t*TAU),-31-j*.55]),.14,'node');
 return paths;
}
export function clearance(position,paths){
 let d=Infinity;
 for(const path of paths) for(let i=1;i<path.points.length;i++){
 const a=path.points[i-1],b=path.points[i],v=b.map((x,k)=>x-a[k]),w=position.map((x,k)=>x-a[k]),len=v.reduce((s,x)=>s+x*x,0);
 const t=len?Math.max(0,Math.min(1,w.reduce((s,x,k)=>s+x*v[k],0)/len)):0;
 d=Math.min(d,Math.hypot(...position.map((x,k)=>x-a[k]-t*v[k]))-path.radius);
 }return d;
}
