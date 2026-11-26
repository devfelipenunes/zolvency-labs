// Original parametric model blueprints. Coordinates in model-local units; all parts are true solids.
export const box=(position,size,kind='titanium',extra={})=>({shape:'box',position,size,kind,...extra});
export const cylinder=(position,size,kind='gold',extra={})=>({shape:'cylinder',position,size,kind,...extra});
export const sphere=(position,radius,kind='accent',extra={})=>({shape:'sphere',position,size:[radius*2,radius*2,radius*2],kind,...extra});
export const torus=(position,size,kind='gold',extra={})=>({shape:'torus',position,size,kind,...extra});
export const hex=(position,size,kind='gold',extra={})=>({shape:'hex',position,size,kind,...extra});
export const bevel=(position,size,kind='titanium',extra={})=>({shape:'chamfer',position,size,kind,...extra});
export const palette={
 titanium:{color:0xaabcc3,metalness:.83,roughness:.32},gold:{color:0xb99a5a,metalness:.85,roughness:.29},dark:{color:0x19242d,metalness:.48,roughness:.5},ceramic:{color:0xd7dfdd,metalness:.18,roughness:.37},copper:{color:0xa85d36,metalness:.8,roughness:.33},glass:{color:0x527c89,metalness:.35,roughness:.16,clearcoat:1},accent:{color:0x9af0ce,metalness:.15,roughness:.3,emissive:0x53b88c,emissiveIntensity:2.4}
};
export function ledgerParts(variant=0){
 const a=[],finish=['titanium','ceramic','titanium','glass','dark'][variant%5];
 for(let l=0;l<4;l++){
 const y=-1.35+l*.9,part=l-1.5,opt={part};
 a.push(bevel([0,y,0],[3.65,.38,3.65],l%2?'dark':'glass',opt));
 for(const s of [-1,1]){
 a.push(bevel([s*2.04,y,0],[.52,.59,4.54],finish,opt),bevel([0,y,s*2.04],[3.58,.59,.52],finish,opt));
 a.push(box([s*2.25,y-.06,0],[.07,.16,3.28],'dark',opt),box([0,y-.06,s*2.25],[3.28,.16,.07],'dark',opt));
 a.push(box([s*1.72,y+.26,0],[.055,.05,3.38],'accent',opt),box([0,y+.26,s*1.72],[3.38,.05,.055],'accent',opt));
 for(let j=0;j<5;j++){const t=-1.35+j*.67;a.push(box([s*2.295,y-.04,t],[.07,.085,.36],j===(l+variant)%5?'accent':'copper',opt),box([t,y-.04,s*2.295],[.36,.085,.07],j===l?'accent':'dark',opt));}
 }
 for(const x of [-2.04,2.04])for(const z of [-2.04,2.04])a.push(hex([x,y+.32,z],[.24,.12,.24],'gold',opt));
 for(let j=-1;j<=1;j++)a.push(bevel([j*1.04,y+.29,0],[.82,.13,2.5],j===0?'copper':'dark',opt));
 }
 for(const x of [-1.12,0,1.12])for(const z of [-1.12,0,1.12])a.push(bevel([x,1.71,z],[.91,.25,.91],'dark',{part:1.5}),box([x,1.85,z],[.74,.055,.74],(x===0&&z===0)?'accent':'gold',{part:1.5}));
 a.push(bevel([0,1.99,0],[1.12,.14,1.12],'glass',{part:1.5}));return a;
}
export function cryptographyParts(variant=0){
 const a=[];for(let l=0;l<3;l++){const z=l*1.38;for(const s of [-1,1]){
 a.push(bevel([s*2.04,0,z],[.49,4.52,.52],l===1?'dark':'titanium'),bevel([0,s*2.04,z],[3.56,.49,.52],'ceramic'));
 a.push(box([s*1.77,0,z+.25],[.052,3.34,.045],'accent'),box([0,s*1.77,z+.25],[3.34,.052,.045],'copper'));
 for(let j=0;j<5;j++)a.push(box([s*2.055,-1.2+j*.6,z+.29],[.24,.25,.08],(j+l+variant)%3?'dark':'accent'));
 }for(const x of [-2.04,2.04])for(const y of [-2.04,2.04])a.push(hex([x,y,z+.28],[.22,.13,.22],'gold'));}
 return a;
}
export function processorParts(variant=0){
 const a=[bevel([0,-.45,0],[5.96,.40,5.96],'dark'),bevel([0,-.20,0],[5.73,.14,5.73],'copper'),bevel([0,.03,0],[5.35,.28,5.35],'dark'),bevel([0,.37,0],[3.5,.58,3.5],'titanium'),bevel([0,.72,0],[3.03,.14,3.03],'glass'),bevel([0,.83,0],[2.08,.12,2.08],'dark')];
 for(let i=0;i<18;i++)for(const s of [-1,1]){const t=-2.63+i*.31;a.push(box([s*2.86,-.06,t],[.22,.10,.12],'gold'),box([t,-.06,s*2.86],[.12,.10,.22],'gold'));}
 for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++)a.push(box([i*.27,.91,j*.27],[.21,.055,.21],(i+j+variant)%4===0?'accent':(i-j)%3===0?'gold':'copper'));
 for(const s of [-1,1])for(let j=0;j<5;j++){const t=-1.84+j*.92;a.push(bevel([s*2.10,.30,t],[.60,.30,.68],'ceramic'),box([s*2.1,.47,t],[.45,.06,.48],'dark'),box([s*1.71,.19,t],[.27,.045,.075],'gold'));a.push(box([t,.20,s*2.22],[.55,.14,.30],'dark'),box([t,.29,s*2.22],[.44,.05,.23],'copper'));}
 for(const x of [-2.45,2.45])for(const z of [-2.45,2.45])a.push(hex([x,.25,z],[.30,.16,.30],'gold'));return a;
}
export function cryostatParts(variant=0){
 const a=[],ys=[3.8,2.5,1.1,-.35,-1.7,-3.2],ds=[5.8,5.4,4.9,4.1,3.3,2.45];
 ys.forEach((y,i)=>{const d=ds[i];a.push(cylinder([0,y,0],[d,.23,d],i%2?'gold':'titanium'),cylinder([0,y-.16,0],[d*.92,.09,d*.92],'dark'),torus([0,y+.10,0],[d*.91,.13,d*.91],'copper'),torus([0,y+.19,0],[d*.78,.065,d*.78],'accent'));
 for(let j=0;j<12;j++){const t=j*Math.PI/6,r=d*.42,x=r*Math.cos(t),z=r*Math.sin(t);a.push(hex([x,y+.19,z],[.20,.14,.20],'gold'));if(j%2===0)a.push(cylinder([x,y-.25,z],[.16,.31,.16],'ceramic'));}
 if(i<ys.length-1){const next=ys[i+1],r=ds[i+1]*.34;for(let j=0;j<6;j++){const t=j*Math.PI/3,x=r*Math.cos(t),z=r*Math.sin(t);a.push(cylinder([x,(y+next)/2,z],[.14,y-next-.26,.14],'gold'),cylinder([x,(y+next)/2+.16,z],[.23,.34,.23],'copper'));}}});
 a.push(cylinder([0,3.98,0],[3.10,.14,3.10],'dark'),cylinder([0,3.99,0],[1.60,.16,1.60],'titanium'),bevel([0,-3.58,0],[1.68,.45,1.68],'dark'),bevel([0,-3.85,0],[1.30,.15,1.30],'gold'),bevel([0,-3.95,0],[.74,.065,.74],'glass'));
 for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)a.push(box([i*.12,-3.99,j*.12],[.083,.026,.083],(i+j+variant)%3?'gold':'accent'));return a;
}
export function stellarParts(variant=0){const a=[sphere([0,0,0],.48,'glass'),torus([0,0,0],[1.65,.13,1.65],'titanium'),torus([0,.15,0],[1.34,.07,1.34],'accent'),cylinder([0,-.45,0],[1.08,.22,1.08],'dark')];for(let i=0;i<6;i++){const t=i*Math.PI/3;a.push(bevel([.66*Math.cos(t),-.10,.66*Math.sin(t)],[.24,.18,.24],(i+variant)%2?'ceramic':'gold'));}return a;}
export function secondaryParts(family,variant){const n=variant+1,s=.28+(n%5)*.09,a=[];
 if(family==='electronic'){a.push(bevel([0,0,0],[s*2,.16,s*1.6],'dark'),bevel([0,.11,0],[s*1.4,.14,s],'ceramic'));for(let i=0;i<4;i++)a.push(box([-.22+i*.145,.015,s*.72],[.08,.08,.19],'gold'));}
 else if(family==='quantum'){a.push(cylinder([0,0,0],[s*1.8,s*.45,s*1.8],'gold'),torus([0,.13,0],[s*1.6,.07,s*1.6],'copper'),hex([0,-.17,0],[s,.20,s],'dark'));}
 else if(family==='architecture'){for(const x of [-1,1])a.push(bevel([x*s,0,0],[.17,s*3,.2],'titanium'));a.push(bevel([0,s*1.35,0],[s*2,.15,.2],'ceramic'),box([0,-s*1.35,0],[s*2,.07,.08],'accent'));}
 else{a.push(bevel([0,0,0],[s,.11,s*1.4],n%2?'dark':'titanium'),box([0,.065,0],[s*.6,.03,s*.7],n%3?'copper':'accent'));}return a;}
export const modelParts={ledger:ledgerParts,processor:processorParts,cryostat:cryostatParts,cryptography:cryptographyParts,stellar:stellarParts};
export function catalog(){return [['ledger',5],['cryptography',5],['processor',4],['electronic',10],['quantum',8],['architecture',5],['fragment',15]].flatMap(([family,count])=>Array.from({length:count},(_,variant)=>({id:family+'-'+String(variant+1).padStart(2,'0'),family,variant,parts:modelParts[family]?modelParts[family](variant):secondaryParts(family,variant)})));}
