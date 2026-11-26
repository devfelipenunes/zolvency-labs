// Original procedural architecture: one strand family across three spatial scales.
const TAU=Math.PI*2;
const sample=(n,fn)=>Array.from({length:n+1},(_,i)=>fn(i/n));
export function makeWorld(){
 const paths=[];
 const add=(points,radius,kind='ceramic',profile=.45)=>paths.push({points,radius,kind,profile});
 // Arrival: broad sweeping ribbons, paired with a slender seam.
 for(const side of [-1,1])for(let j=0;j<7;j++){
  const strand=t=>{const z=23-23*t,cx=-5*(1-t);return [cx+side*(3.2+j*.46+1.7*t+.7*Math.sin(t*Math.PI+j*.18)),.2+j*.85+.85*Math.sin(t*Math.PI+j*.2),z]};
  add(sample(88,strand),.20+j*.032,j%3===0?'metal':'ceramic',.48);
  if(j%2===0)add(sample(88,t=>{const v=strand(t);v[1]+=.12;return v}),.025,'accent',.8);
 }
 // Threshold: irregular angled ribs. Open oval profile, no literal circular tunnel.
 for(let j=0;j<5;j++){
  const z=1.2-j*.83,rx=5.4+j*.15,ry=4.6+j*.1;
  const shape=t=>{const a=t*TAU;return [rx*Math.cos(a)+.45*Math.sin(2*a),2.3+ry*Math.sin(a),z+1.0*Math.sin(a)+.5*Math.sin(2*a)]};
  add(sample(104,shape),.33+j*.018,j===1?'metal':'ceramic',.36);
  if(j%2===0)add(sample(104,t=>{const v=shape(t);v[2]+=.18;return v}),.032,'accent',.65);
 }
 // Atrium: vaulted, staggered open ribs and tapering longitudinal seams.
 for(let j=0;j<9;j++){
  const z=-5-j*2.2,rx=7.2+.8*Math.sin(j*.52),ry=5.9+.7*Math.sin(j*.41);
  add(sample(70,t=>{const a=.03+t*(Math.PI-.06);return [rx*Math.cos(a)+.5*Math.sin(j*.6),.1+ry*Math.sin(a),z+.85*Math.cos(a+j*.14)]}),.27,j%3===0?'metal':'ceramic',.42);
 }
 for(const side of [-1,1])for(let j=0;j<5;j++){
  add(sample(90,t=>{const z=-2-21*t;return [side*(5.4+j*.45+1.6*Math.sin(t*Math.PI)),.4+j*1.15+.3*Math.sin(t*TAU+j),z]}),j===0?.045:.12,j===0?'accent':'metal',.55);
 }
 // Construction: off-axis woven core, surrounded by generous camera clearance.
 for(let j=0;j<12;j++){
  const phase=j*TAU/12;
  add(sample(100,t=>{const a=t*TAU+phase,b=phase+.75*Math.sin(t*TAU);const r=1.55+.35*Math.sin(3*a);return [5.1+r*Math.cos(a)*Math.cos(b),2.4+1.95*Math.sin(a),-27+r*Math.cos(a)*Math.sin(b)]}),j%4===0?.06:.15,j%4===0?'accent':j%3===0?'metal':'ceramic',.55);
 }
 // Open horizons: split branches run along the edge of an elevated field.
 for(const side of [-1,1])for(let j=0;j<8;j++){
  add(sample(100,t=>{const z=-31-43*t;return [side*(7.6+j*.65+8*t*t)+1.4*Math.sin(t*Math.PI),-.8+j*.67+4.4*t*t+.7*Math.sin(t*TAU+j*.17),z]}),.13+j*.015,j%4===0?'accent':j%3===0?'metal':'ceramic',.48);
 }
 // Final signature: three interlocking crescent-like blades, offset to the right.
 for(let j=0;j<3;j++)add(sample(100,t=>{const a=-1.1+t*4.3;const r=4.1+j*.7;return [5.1+r*Math.cos(a),4.1+r*.72*Math.sin(a)+j*.42,-70+j*.9+1.3*Math.sin(a)]}),.25,j===1?'metal':'ceramic',.34);
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
