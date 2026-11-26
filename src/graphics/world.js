import {box,cylinder,sphere,torus,ledgerParts,processorParts,cryostatParts,cryptographyParts,stellarParts,secondaryParts} from './models.js';
import {makeArchitecture,architecturePose} from './architecture.js';
import {legacyProgress} from './camera.js';
const TAU=2*Math.PI,sample=(n,fn)=>Array.from({length:n+1},(_,i)=>fn(i/n));
const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sceneNames=['ORIGIN','BLOCKCHAIN','STELLAR','CRYPTOGRAPHY','INTELLIGENCE','QUANTUM','CONVERGENCE'];
export const blockCenters=[-14,-7,0,7,14].map(x=>[x,2,-48]);
export const importedModels=[{name:'processor',position:[12,3,-100]},{name:'cryostat',position:[-6,5,-124]}];
export function makeScene(){
 const objects=[],paths=[];
 const path=(points,radius=.035,kind='accent')=>paths.push({points,radius,kind});
 const link=(a,b,kind='accent',radius=.035,lift=.3)=>path(sample(28,t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+lift*Math.sin(Math.PI*t),a[2]+(b[2]-a[2])*t]),radius,kind);
 const ring=(center,rx,ry,tilt=0,kind='titanium',radius=.065)=>path(sample(80,t=>add(center,[rx*Math.cos(t*TAU),ry*Math.sin(t*TAU),tilt*Math.sin(t*TAU)])),radius,kind);
 const model=(parts,position,extra={})=>parts.forEach(o=>objects.push({...o,position:add(o.position,position),...extra}));
 // Real scanned circuit board replaces this compact authored startup fallback.
 model(processorParts(),[0,0,0],{asset:'pcb'});
 // Small reference markers belong to the circuit, not floating debris.
 for(let i=0;i<4;i++)objects.push(box([-7+i*4,-1.2,-5],[.30,.18,.5],'accent',{float:.04,phase:i}));
 // Cryptography: suspended plates with real apertures, surface tiles, and links.
 model(cryptographyParts(),[18,4,-25],{gate:true,asset:'entry-door'});
 // Floating blockchain, actual gaps along x. The central block opens deterministically.
 blockCenters.forEach((p,i)=>model(ledgerParts(0),p,i===2?{hero:true}:{}));
 for(let i=0;i<4;i++)for(const z of [-49.15,-46.85])link([blockCenters[i][0]+2.35,1.75,z],[blockCenters[i+1][0]-2.35,1.75,z],'accent',.10,.18);
 // Stellar: network across a volume, not actual SCP topology.
 const ns=[[-22,4,-75],[-27,2,-72],[-17,2.5,-77],[-21,7.6,-70],[-25,5.9,-80],[-18,5.5,-70],[-21,1,-80]];
 ns.forEach((p,i)=>{model(stellarParts(i),p,{station:true,phase:i,asset:'server-room'});});
 // Public payment-flow visualization above the external projector; not a real payment.
 const publicNodes=[[-13.4,3.4,-72],[-12,4.3,-71],[-14.7,4.4,-71],[-13.4,5.3,-70],[-12,3.3,-69]];
 publicNodes.forEach((p,i)=>{objects.push(sphere(p,.17,'accent'));if(i)link(publicNodes[0],p,'accent',.04,.05);});
 // Intelligence: processor GLB and neural graph rising behind the chip.
 model(processorParts(),importedModels[0].position,{asset:'processor'});
 const nodes=[];for(let l=0;l<3;l++){const row=[];for(let j=0;j<5;j++){const p=[7.5+j*2.1,4.5+l*1.5,-105-l*2.4+Math.sin(j+l)*.4];row.push(p);objects.push(sphere(p,.20+(j===2?.10:0),l===2?'accent':'titanium'));}nodes.push(row);}
 for(let l=0;l<2;l++)for(let j=0;j<5;j++)for(const k of [j,(j+1)%5])link(nodes[l][j],nodes[l+1][k],'accent',.04,.22);
 for(let j=0;j<5;j++)link([8+j*2,3.0,-102.5],nodes[0][j],'gold',.055,.2);
 for(let j=0;j<3;j++)objects.push(box([9+j*3,1.45,-105],[2.5,.55,2.5],'titanium'),box([9+j*3,1.8,-105],[2.4,.10,2.4],'accent'));
 // Quantum: original cryostat model and bent cable curves.
 model(cryostatParts(),importedModels[1].position,{asset:'cryostat'});
 for(let j=0;j<12;j++){const a=j*TAU/12;path(sample(75,t=>[-6+(2.55-1.65*t)*Math.cos(a+.22*Math.sin(t*TAU*2)),8.8-7.2*t,-124+(2.55-1.65*t)*Math.sin(a+.22*Math.sin(t*TAU*2))]),.045,j%3?'gold':'accent');}
 for(let j=0;j<9;j++)path(sample(80,t=>[-10+8*t,1.0+1.1*Math.sin(t*TAU*2+j*.45)*Math.cos(t*TAU),-132-j*.48]),.037,j%3?'titanium':'accent');
 // Convergence: the common ledger language returns as a connected topology.
 for(const x of [4,10,16])model(ledgerParts(0).filter(o=>o.size[0]>.2&&o.size[2]>.2),[x,2,-153]);
 for(const x of [4,10])link([x+2.35,2,-153],[x+3.65,2,-153],'accent',.075,.12);
 const env=makeArchitecture();objects.push(...env.objects);paths.push(...env.paths);
 return {objects,paths,plates:env.plates};
}
export function objectTransform(o,p){
 if(o.architecture)return architecturePose(o,p);
 p=legacyProgress(p);
 const a=(o.phase??0)+p*TAU*3,spread=o.hero?Math.exp(-(((p-.368)/.038)**2))*.92:0;
 const gate=o.gate?Math.sin(Math.PI*Math.max(0,Math.min(1,(p-.115)/.12)))*.32*(o.position[2]+24):0,station=o.station?.16*Math.sin(p*TAU*8+(o.phase??0)):0;
 const position=[o.position[0]+(o.float??0)*Math.sin(a),o.position[1]+station+(o.float??0)*Math.cos(a*.83)+(o.part??0)*spread,o.position[2]+gate+(o.float??0)*Math.sin(a*.67)];
 return {position,rotation:o.float?[a*.15,a*.25,a*.12]:[0,0,0]};
}
export function clearance(position,paths){let d=Infinity;for(const path of paths)for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],v=b.map((x,k)=>x-a[k]),w=position.map((x,k)=>x-a[k]),len=v.reduce((s,x)=>s+x*x,0);const t=len?Math.max(0,Math.min(1,w.reduce((s,x,k)=>s+x*v[k],0)/len)):0;d=Math.min(d,Math.hypot(...position.map((x,k)=>x-a[k]-t*v[k]))-path.radius);}return d;}
export function solidClearance(position,objects,p){let d=Infinity;for(const o of objects){const q=objectTransform(o,p).position,v=position.map((x,k)=>Math.abs(x-q[k]));const distance=o.float||o.shape==='sphere'?Math.hypot(...v)-Math.hypot(...o.size)/2:Math.hypot(...v.map((x,k)=>Math.max(0,x-o.size[k]/2)));d=Math.min(d,distance);}return d;}
