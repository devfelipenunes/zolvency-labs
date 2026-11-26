// Original parametric model blueprints. Coordinates in model-local units; all parts are true solids.
export const box=(position,size,kind='titanium',extra={})=>({shape:'box',position,size,kind,...extra});
export const cylinder=(position,size,kind='gold',extra={})=>({shape:'cylinder',position,size,kind,...extra});
export const sphere=(position,radius,kind='accent',extra={})=>({shape:'sphere',position,size:[radius*2,radius*2,radius*2],kind,...extra});
export const torus=(position,size,kind='gold',extra={})=>({shape:'torus',position,size,kind,...extra});
export function ledgerParts(){
 const parts=[];
 for(let l=0;l<4;l++){
 const y=-1.35+l*.9,part=l-1.5;
 parts.push(box([0,y,0],[4.65,.58,4.65],l===1?'dark':'titanium',{part}));
 parts.push(box([0,y+.34,0],[4.46,.075,4.46],'accent',{part}));
 for(const x of [-2.1,2.1])for(const z of [-2.1,2.1])parts.push(cylinder([x,y+.40,z],[.20,.14,.20],'gold',{part}));
 for(let j=0;j<7;j++){parts.push(box([-2.34,y,-1.65+j*.55],[.08,.18,.28],j===l?'accent':'dark',{part}));parts.push(box([-.0-1.65+j*.55,y,2.34],[.28,.18,.08],j===l?'accent':'dark',{part}));}
 }
 for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)parts.push(box([x*1.07,1.72,z*1.07],[.8,.18,.8],(x+z)%2===0?'gold':'dark',{part:1.5}));
 parts.push(box([0,1.95,0],[1.45,.13,1.45],'accent',{part:1.5}));
 return parts;
}
export function processorParts(){
 const parts=[box([0,-.45,0],[6,.38,6],'dark'),box([0,-.20,0],[5.7,.14,5.7],'titanium'),box([0,.28,0],[3.4,.8,3.4],'titanium'),box([0,.72,0],[2.85,.12,2.85],'dark'),box([0,.82,0],[2.2,.08,2.2],'accent')];
 for(let i=0;i<16;i++)for(const s of [-1,1]){const t=-2.6+i*.345;parts.push(box([s*2.85,-.06,t],[.26,.08,.13],'gold'),box([t,-.06,s*2.85],[.13,.08,.26],'gold'));}
 for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)parts.push(box([i*.4,.89,j*.4],[.29,.06,.29],(i+j)%3===0?'gold':'dark'));
 for(const x of [-2.15,2.15])for(const z of [-2.15,2.15])parts.push(box([x,.02,z],[.5,.17,.5],'gold'));
 return parts;
}
export function cryostatParts(){
 const parts=[];
 // Gold plates, thermal stages, support posts and chip package; stylized not a physical schematic.
 const ys=[3.8,2.5,1.1,-.35,-1.7,-3.2],rs=[5.8,5.4,4.9,4.1,3.3,2.45];
 ys.forEach((y,i)=>{parts.push(cylinder([0,y,0],[rs[i],.22,rs[i]],i%2?'gold':'titanium'));parts.push(torus([0,y+.09,0],[rs[i]*.92,.15,rs[i]*.92],'accent'));for(let j=0;j<8;j++){const a=j*Math.PI/4,r=rs[i]*.40;parts.push(cylinder([r*Math.cos(a),y+.18,r*Math.sin(a)],[.23,.30,.23],'gold'));}});
 for(let i=0;i<8;i++){const a=i*Math.PI/4;parts.push(cylinder([2.1*Math.cos(a),2.45,2.1*Math.sin(a)],[.14,2.5,.14],'gold'));parts.push(cylinder([1.6*Math.cos(a),.05,1.6*Math.sin(a)],[.13,2.2,.13],'gold'));parts.push(cylinder([.95*Math.cos(a),-2.5,.95*Math.sin(a)],[.13,1.45,.13],'gold'));}
 parts.push(box([0,-3.58,0],[1.65,.44,1.65],'dark'),box([0,-3.85,0],[1.28,.14,1.28],'gold'),box([0,-3.95,0],[.72,.06,.72],'accent'));
 return parts;
}
export const modelParts={ledger:ledgerParts,processor:processorParts,cryostat:cryostatParts};
