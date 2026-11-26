// Original conceptual diagrams embodied as architecture. No protocol simulation.
const TAU=2*Math.PI;
const sample=(n,fn)=>Array.from({length:n+1},(_,i)=>fn(i/n));
const mixPoint=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export const sceneNames=['ORIGIN','CRYPTOGRAPHY','BLOCKCHAIN','STELLAR','INTELLIGENCE','QUANTUM','CONVERGENCE'];
export const blockCenters=[-33,-40,-47,-54,-61];
export function makeScene(){
 const paths=[],objects=[];
 const line=(points,radius=.045,kind='accent',profile=.8)=>paths.push({points,radius,kind,profile});
 const box=(position,size,kind='metal')=>objects.push({shape:'box',position,size,kind});
 const node=(position,radius,kind='accent')=>objects.push({shape:'sphere',position,radius,kind});
 const ring=(cx,cy,cz,rx,ry,radius,kind='metal',tilt=0)=>line(sample(72,t=>[cx+rx*Math.cos(t*TAU),cy+ry*Math.sin(t*TAU),cz+tilt*Math.sin(t*TAU)]),radius,kind,.52);
 const link=(a,b,kind='accent',radius=.04)=>line(sample(24,t=>{const v=mixPoint(a,b,t);v[1]+=.32*Math.sin(t*Math.PI);return v}),radius,kind);
 for(let i=0;i<3;i++)line(sample(300,t=>[7.7+i*.32+.6*Math.sin(6*TAU*t+i*.7),.15+i*.23,16-178*t]),.035+i*.014,i===0?'accent':'metal',.65);
 // Origin: information converges into an ordered core.
 for(let i=0;i<100;i++){const a=i*2.399963,b=((i*37)%101)/100,r=1.1+2.8*b;node([3.2+r*.88*Math.cos(a),2.7+r*.65*Math.sin(a),5+2.8*Math.sin(a*.37)],.055+(i%5)*.017,i%7===0?'porcelain':'accent');}
 for(let j=0;j<6;j++)ring(3.2,2.7,4-j*.8,2.1+j*.17,2.1+j*.16,.07+j*.018,j%2?'metal':'porcelain',.8*Math.sin(j));
 for(let i=0;i<4;i++)line(sample(80,t=>[3.2+(2.7-1.4*t)*Math.cos(2*TAU*t+i*TAU/4),2.7+(2.7-1.4*t)*Math.sin(2*TAU*t+i*TAU/4),9-15*t]),.045,i===0?'accent':'metal');
 // Cryptography: conceptual commitment lattice.
 for(let j=0;j<6;j++)line(sample(70,t=>[3.4+(2.9-1.2*t)*Math.cos(j*TAU/6+1.1*t),2.8+(2.7-1.2*t)*Math.sin(j*TAU/6+1.1*t),-4-10*t]),.075,j%2?'porcelain':'accent');
 for(let j=0;j<5;j++)ring(3.4,2.8,-13-j*.72,2.4+j*.17,2.5+j*.1,.14,j%2?'metal':'porcelain',.4);
 box([3.4,2.8,-16],[2.3,2.3,1.15],'metal');
 for(let i=0;i<6;i++)for(let j=0;j<6;j++){const value=((i*19+j*13+i*j*7)%11)<5;box([2.55+i*.34,1.95+j*.34,-15.35],[.22,.22,.07],value?'accent':'porcelain');}
 for(let j=0;j<5;j++)line(sample(75,t=>[3.4+(1.1+.8*t)*Math.cos(j*TAU/5+t*2),2.8+(1.1+.8*t)*Math.sin(j*TAU/5+t*2),-17-13*t]),.055,j%2?'metal':'accent');
 // Blockchain: layered blocks and visible inter-block links.
 for(let i=0;i<blockCenters.length;i++){
  const z=blockCenters[i],x=3.8+(i%2)*.30;
  for(let layer=0;layer<4;layer++){
   const y=.65+layer*.92,wide=layer===1&&i===2?3.15:4.6;
   box([x,y,z],[wide,.70,4.7],layer===1?'metal':'porcelain');
   box([x,y+.44,z],[wide*.97,.07,4.56],'accent');
   for(let k=0;k<5;k++)box([x-wide/2-.018,y,z-1.6+k*.8],[.09,.32,.16],k===i?'accent':'metal');
  }
  if(i===2)for(let a=0;a<3;a++)for(let b=0;b<3;b++)box([x-1.35+a*1.35,4.05,z-1.35+b*1.35],[.82,.35,.82],(a+b)%2?'accent':'metal');
  if(i<blockCenters.length-1)for(const y of [1.2,2.75])for(const dx of [-1.2,1.2])link([x+dx,y,z-2.38],[x+dx,y,blockCenters[i+1]+2.38],'accent',.105);
 }
 // Stellar: illustrative financial network, not actual SCP topology.
 const participants=[[3.7,2.8,-77],[.8,1.0,-71],[6.3,1.2,-70],[8.8,3.8,-77],[6.6,5.3,-83],[.5,4.8,-83],[3.8,1.0,-87]];
 participants.forEach((p,i)=>{node(p,i===0?.65:.36,i===0?'porcelain':'metal');ring(...p,.7,.7,.04,'accent',.15);if(i>0)link(participants[0],p,'accent',.06);});
 for(let i=1;i<participants.length-1;i++)link(participants[i],participants[i+1],'metal',.045);
 for(let j=0;j<3;j++)ring(3.7,2.8,-77,3.3+j*.6,2.3+j*.45,.045,'metal',1.8-j*.2);
 // AI × blockchain: rigid substrate, neural-like graph, authorization gates.
 for(let i=0;i<4;i++)for(let j=0;j<3;j++){const x=1.2+j*2.5,z=-94-i*3.1;box([x,0,z],[2.0,.48,2.5],'metal');box([x,.28,z],[1.92,.09,2.42],'accent');}
 const neurons=[];
 for(let l=0;l<4;l++){const row=[];for(let j=0;j<4;j++){const p=[.4+j*2.35,2.2+1.15*l,-94-l*3.1+Math.sin(j+l)*.7];row.push(p);node(p,.22+(j===1?.12:0),'porcelain');}neurons.push(row);}
 for(let l=0;l<3;l++)for(let j=0;j<4;j++)for(const k of [j,(j+1)%4])link(neurons[l][j],neurons[l+1][k],'accent',.036);
 for(let j=0;j<4;j++){const p=neurons[0][j];link([p[0],.35,p[2]],p,'metal',.08);box([p[0],1.02,p[2]],[.66,.28,.66],'porcelain');}
 // Quantum: waves as artistic metaphor, not a state simulation.
 for(let j=0;j<14;j++){const a=j/13*TAU;line(sample(105,t=>[3.8+(2.1+.6*Math.cos(5*TAU*t))*Math.cos(a+1.6*TAU*t),3.2+(2.1+.6*Math.cos(5*TAU*t))*Math.sin(a+1.6*TAU*t),-113-24*t]),.042,j%4?'metal':'accent',.9);}
 for(let j=0;j<8;j++)line(sample(115,t=>[.4+7.4*t,3.0+1.3*Math.sin(t*3*TAU+j*.38)*Math.cos(t*TAU),-124-j*.42]),.052,j%3?'porcelain':'accent');
 ring(3.8,3.2,-129,2.85,2.85,.10,'porcelain',1.3);ring(3.8,3.2,-129,2.85,2.85,.07,'accent',-1.3);
 // Convergence: rings, layers, nodes and seams become one signature.
 for(let i=0;i<8;i++){const a=i*TAU/8;line(sample(96,t=>[4.5+(3.8+.55*Math.sin(t*TAU*3))*Math.cos(t*TAU+a),3.8+(3.0+.4*Math.cos(t*TAU*2))*Math.sin(t*TAU+a),-153+2.6*Math.sin(t*TAU+a/2)]),.12,i%3===0?'accent':i%2?'porcelain':'metal',.42);}
 for(let i=0;i<3;i++)box([4.5,2.4+i*.9,-153],[2.1,.62,2.1],i===1?'accent':'porcelain');
 for(let i=0;i<8;i++){const a=i*TAU/8,p=[4.5+4.3*Math.cos(a),3.8+3.4*Math.sin(a),-153];node(p,.16,'accent');link([4.5,3.8,-153],p,'metal',.035);}
 return {paths,objects};
}
export const makeWorld=()=>makeScene().paths;
export function clearance(position,paths){
 let d=Infinity;for(const path of paths)for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],v=b.map((x,k)=>x-a[k]),w=position.map((x,k)=>x-a[k]),len=v.reduce((s,x)=>s+x*x,0);const t=len?Math.max(0,Math.min(1,w.reduce((s,x,k)=>s+x*v[k],0)/len)):0;d=Math.min(d,Math.hypot(...position.map((x,k)=>x-a[k]-t*v[k]))-path.radius);}return d;
}
export function solidClearance(position,objects){
 let d=Infinity;for(const o of objects){const v=position.map((x,k)=>Math.abs(x-o.position[k]));const distance=o.shape==='sphere'?Math.hypot(...v)-o.radius:Math.hypot(...v.map((x,k)=>Math.max(0,x-o.size[k]/2)));d=Math.min(d,distance);}return d;
}
