import * as THREE from 'three';
// Existing screen primitives are the canvases. No new meshes, logos on floating panels, or fake transactions.
export function installDisplay(material,kind,textures,mesh){
 if(!material.map||!material.name||!/screen/i.test(material.name))return null;
 const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d');
 ctx.fillStyle='#09181c';ctx.fillRect(0,0,1024,512);ctx.strokeStyle='#28564f';ctx.lineWidth=3;ctx.strokeRect(14,14,996,484);
 ctx.fillStyle='#a2e1c3';ctx.font='bold 32px monospace';ctx.fillText('ZOLVENCY LABS',38,63);
 ctx.font='24px monospace';ctx.fillText(kind==='servers'?'FINANCIAL NETWORK':kind==='portal'?'PRIVACY & VERIFICATION':'INTELLIGENCE SYSTEMS',38,105);
 ctx.fillStyle='#6f9a94';ctx.font='17px monospace';ctx.fillText('CONCEPT DISPLAY / NO LIVE TRANSACTIONS',38,145);
 const points=[[100,250],[310,200],[500,310],[700,200],[900,270]];
 ctx.strokeStyle='#4a9282';ctx.lineWidth=4;ctx.beginPath();for(const [i,p] of points.entries())i?ctx.lineTo(...p):ctx.moveTo(...p);ctx.stroke();
 for(const [i,p] of points.entries()){ctx.fillStyle='#102c2c';ctx.strokeStyle='#91d8b4';ctx.beginPath();ctx.arc(...p,27,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#bdebd9';ctx.font='18px monospace';ctx.fillText('0'+(i+1),p[0]-11,p[1]+7);}
 ctx.fillStyle='#bdebd9';ctx.font='20px monospace';ctx.fillText(kind==='servers'?'PAYMENTS / ASSETS / VERIFICATION':kind==='portal'?'PROOF / PUBLIC INPUTS / VERIFIER':'POLICY / AGENTS / AUTHORIZATION',38,446);
 const t=new THREE.CanvasTexture(c);t.flipY=false;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;textures.add(t);const uv=mesh?.geometry?.attributes.uv;if(uv){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(let i=0;i<uv.count;i++){minX=Math.min(minX,uv.getX(i));maxX=Math.max(maxX,uv.getX(i));minY=Math.min(minY,uv.getY(i));maxY=Math.max(maxY,uv.getY(i));}if(maxX-minX>.001&&maxY-minY>.001){t.repeat.set(1/(maxX-minX),1/(maxY-minY));t.offset.set(-minX*t.repeat.x,-minY*t.repeat.y);}}
 material.map=t;material.emissiveMap=t;material.color.setHex(0xffffff);material.emissive?.setHex(0xffffff);material.emissiveIntensity=.25;material.needsUpdate=true;
 return t;
}
