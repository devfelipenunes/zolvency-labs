import * as THREE from 'three';
// Keep the original GLBs immutable; styling and transforms happen in memory.
export const externalSpecs={processor:{file:'graphics-card',size:6.4},cryostat:{file:'quantum-computer',size:7.6},rack:{file:'server-rack',size:2.5}};
export function mechanicalPose(progress){
 const clamp=x=>Math.max(0,Math.min(1,x));
 const ai=clamp((progress-.575)/.155),stellar=clamp((progress-.435)/.14),q=clamp((progress-.73)/.135);
 const smooth=t=>t*t*(3-2*t);
 return {rotor:Math.PI*12*smooth(ai),door:-Math.PI*.43*Math.sin(Math.PI*stellar),quantum:.3+1.15*Math.sin(Math.PI*q)};
}
function neutralTexture(original,cache){
 if(cache.has(original))return cache.get(original);
 const image=original.image;if(!image||!image.width||!image.height)return original;
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
 const frame=ctx.getImageData(0,0,c.width,c.height),v=frame.data;
 for(let i=0;i<v.length;i+=4){const gray=.2126*v[i]+.7152*v[i+1]+.0722*v[i+2];v[i]=gray*.76;v[i+1]=gray*.82;v[i+2]=gray*.85;}
 ctx.putImageData(frame,0,0);
 const t=original.clone();t.image=c;t.needsUpdate=true;cache.set(original,t);return t;
}
export function adaptExternal(root,spec,position){
 const originalBounds=new THREE.Box3().setFromObject(root),center=originalBounds.getCenter(new THREE.Vector3()),size=originalBounds.getSize(new THREE.Vector3());
 const scale=spec.size/Math.max(size.x,size.y,size.z);
 const holder=new THREE.Group();holder.add(root);root.scale.multiplyScalar(scale);root.position.sub(center.multiplyScalar(scale));holder.position.set(...position);
 const textureCache=new Map(),seen=new Set(),rotors=[],emissions=[];let door=null;
 root.traverse(o=>{
 if(/fan_\d+_rotor/.test(o.name))rotors.push({o,base:o.rotation.y});
 if(o.name==='server-rack_door')door={o,base:o.rotation.y};
 if(!o.isMesh)return;
 for(const m of Array.isArray(o.material)?o.material:[o.material]){
 if(seen.has(m))continue;seen.add(m);
 if(/glass/.test(m.name)){m.color?.setHex(0x58767c);m.roughness=.22;continue;}
 if(m.map)m.map=neutralTexture(m.map,textureCache);
 if(m.color)m.color.setHex(m.map?0xc1cccc:/fan_blades/.test(m.name)?0x37464b:0x9caeaf);
 if('metalness' in m)m.metalness=.57;if('roughness' in m)m.roughness=.39;
 if(/rgb|led/.test(m.name)){m.color?.setHex(0x284b40);m.emissive?.setHex(0x79edb8);m.emissiveIntensity=1.2;emissions.push(m);}
 if(spec.file==='quantum-computer'&&m.emissive){m.emissive.setHex(0x174d36);m.emissiveIntensity=.3;emissions.push(m);}
 }
 });
 return {root:holder,rotors,door,emissions,originalTextures:[...textureCache.keys()]};
}
export function animateExternal(asset,p){
 const pose=mechanicalPose(p);
 for(const {o,base} of asset.rotors)o.rotation.y=base+pose.rotor;
 if(asset.door)asset.door.o.rotation.y=asset.door.base+pose.door;
 if(asset.file==='quantum-computer')for(const m of asset.emissions)m.emissiveIntensity=pose.quantum;
 else for(const m of asset.emissions)m.emissiveIntensity=1+0.3*Math.sin(p*30);
 return pose;
}
