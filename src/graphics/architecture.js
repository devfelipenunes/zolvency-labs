// The environment is made of reusable, scale-consistent architectural modules.
const box=(position,size,kind='dark',extra={})=>({shape:'box',position,size,kind,architecture:true,...extra});
const sample=(a,b,n=16)=>Array.from({length:n+1},(_,i)=>a.map((v,k)=>v+(b[k]-v)*i/n));
export const architectureCenters=[[0,2,0],[18,4,-24],[0,2,-48],[-22,4,-75],[-4,4,-86],[12,3,-100],[-6,5,-124],[10,4,-153]];
export const proofLayout={private:[-8,3,-86],public:[-4,3,-86],verifier:[1,3,-86],witness:[-8,3,-86]};
export const plates=[
 {id:'origin',title:'SYSTEM 00',sub:'ZOLVENCY LABS  /  DIGITAL INFRASTRUCTURE',position:[-3.7,3.8,-3.5],width:6.1,height:3.5,yaw:.40},
 {id:'entry',title:'01 / ACCESS',sub:'01  /  VERIFIABLE INFRASTRUCTURE',position:[22.7,5.8,-24.0],width:4.6,height:1.9,yaw:.36},
 {id:'ledger',title:'DISTRIBUTED\nLEDGER',sub:'COMMITMENTS  /  SHARED STATE',position:[-9.4,4.6,-50.5],width:6.3,height:2.8,yaw:.28},
 {id:'stellar',title:'02 / NETWORK',sub:'STELLAR  /  PAYMENTS  /  ASSETS',position:[-22,8.4,-79.7],width:6.5,height:2.8,yaw:-.46},
 {id:'prover',title:'PROVER',sub:'PRIVATE WITNESS',position:[-8,5.7,-85.0],width:3.2,height:1.25,yaw:Math.PI},
 {id:'verifier',title:'VERIFIER',sub:'PUBLIC INPUTS + PROOF',position:[1,5.7,-85.0],width:3.2,height:1.25,yaw:Math.PI},
 {id:'proof',title:'03 / PROOF FLOW',sub:'ZERO-KNOWLEDGE  /  CONCEPTUAL FLOW',position:[-3.5,6.8,-83.3],width:6.0,height:2.3,yaw:Math.PI},
 {id:'ai',title:'04 / COMPUTE',sub:'AGENTS  /  POLICIES  /  AUTHORIZATION',position:[12,6.0,-106.6],width:6.8,height:2.5,yaw:.44},
 {id:'quantum',title:'05 / QUANTUM',sub:'QUANTUM  /  POST-QUANTUM SECURITY',position:[-6,8.8,-128.3],width:6.0,height:2.4,yaw:.44},
 {id:'final',title:'ZOLVENCY\nLABS',sub:'INDEPENDENT TECHNOLOGY COMPANY',position:[10,8.1,-157.3],width:7.2,height:3.2,yaw:.48}
];
export function makeArchitecture(){
 const objects=[],paths=[],add=(p,s,k,e)=>objects.push(box(p,s,k,e)),rail=(a,b,k='accent',radius=.045)=>paths.push({points:sample(a,b),kind:k,radius});
 // A continuous dark substrate, not one pedestal per scene. Offset rails join actual scene centers.
 add([-4,-3.15,-72],[74,.8,190],'dark');
 for(let z=15;z>=-165;z-=6)for(const x of [-31,-19,-7,5,17,29]){
  add([x,-2.67,z],[11.8,.12,5.8],'dark');
 }
 const spine=[[0,-2.52,17],[0,-2.52,0],[18,-2.52,-24],[0,-2.52,-48],[-22,-2.52,-75],[-4,-2.52,-86],[12,-2.52,-100],[-6,-2.52,-124],[10,-2.52,-153]];
 for(let i=1;i<spine.length;i++){const a=spine[i-1],b=spine[i];for(const dx of [-.78,.78]){rail([a[0]+dx,a[1],a[2]],[b[0]+dx,b[1],b[2]],'accent',.075);}rail(a,b,'dark',.32);}
 // Ledger is attached to the substrate by dark continuous machinery, no floating platforms.
 for(const x of [-14,-7,0,7,14]){add([x,-.62,-48],[4.65,1.9,4.65],'dark');add([x,-1.65,-48],[5.15,.23,5.15],'titanium');}
 // Logic chamber: two physically distinct enclosures, a public path and private witness.
 for(const [x,side] of [[-8,-1],[1,1]]){
  add([x,1.2,-86],[3.6,.65,3.6],'dark');
  add([x,1.65,-86],[3.3,.16,3.3],'accent');
  for(const s of [-1,1]){add([x+s*1.65,3.4,-86],[.4,3.7,3.6],'titanium');add([x+s*1.4,3.4,-86],[.075,2.8,2.9],'dark');}
  add([x,5.25,-86],[3.6,.35,3.6],'dark');
  add([x,3.1,-87.6],[3.4,2.7,.22],'glass',{proofDoor:true,doorSide:side});
 }
 // Private data stays inside the prover. Only the public proof path joins the verifier.
 for(let j=0;j<3;j++)for(let k=0;k<3;k++)add([-8+(j-1)*.52,2.15+k*.55,-86],[.36,.30,.46],'dark');
 rail([-6.1,2.6,-86],[ -4,2.6,-86],'accent',.105);
 rail([-4,2.6,-86],[-.9,2.6,-86],'accent',.105);
 // Arithmetical plus gate and multiplication gate (not a literal circuit).
 for(const [x,symbol] of [[-5.3,'plus'],[-1.7,'times']]){
  add([x,4.0,-82.8],[1.55,1.55,.32],'dark');
  add([x,4.0,-82.59],[.13,.9,.08],'accent',{logic:symbol});
  add([x,4.0,-82.57],[.9,.13,.08],'accent',{logic:symbol});
 }
 // Post-quantum lattice is a separate abstract exhibit, not the quantum computer.
 for(let j=0;j<4;j++)for(let k=0;k<4;k++){const a=[-12+j*.8,-.9+k*.8,-128];add(a,[.16,.16,.16],'accent');if(j<3)rail(a,[a[0]+.8,a[1],a[2]],'titanium',.025);if(k<3)rail(a,[a[0],a[1]+.8,a[2]],'titanium',.025);}
 return {objects,paths,plates};
}
export function architecturePose(o,p){
 const t=Math.max(0,Math.min(1,(p-.575)/.105)),open=Math.sin(Math.PI*t)**2;
 return {position:[o.position[0]+(o.proofDoor?o.doorSide*1.15*open:0),o.position[1],o.position[2]],rotation:[0,0,o.logic==='times'?Math.PI/4:0]};
}
