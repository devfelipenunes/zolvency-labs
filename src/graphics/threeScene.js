import * as THREE from 'three';
import { N,S,pose,point,visible,smooth } from './geometry.js';
export function createThreeScene(host,onLost){
 const r=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 r.setPixelRatio(Math.min(devicePixelRatio||1,1.75));r.setClearColor(0,0);r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.28;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,100),group=new THREE.Group();scene.add(group);
 scene.add(new THREE.HemisphereLight(0xd8f5ef,0x15252f,2.2));const key=new THREE.DirectionalLight(0xd3f8e9,3);key.position.set(2,4,7);scene.add(key);const fill=new THREE.DirectionalLight(0x80aaff,2);fill.position.set(-4,-2,-3);scene.add(fill);
 const lines=[],tubes=[];let last=-1,mobile=false,disposed=false;
 for(let j=0;j<N;j++){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array((S+1)*3),3).setUsage(THREE.DynamicDrawUsage));const mat=new THREE.LineBasicMaterial({color:j%7===0?0xd8ffdf:0x719eaa,transparent:true,opacity:j%7===0?.98:.62});const line=new THREE.Line(g,mat);line.frustumCulled=false;group.add(line);lines.push(line);if(j%7===0){const mesh=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshStandardMaterial({color:0x92bdb8,metalness:.76,roughness:.3,emissive:0x284e44,emissiveIntensity:.6}));group.add(mesh);tubes.push({j,mesh})}}
 function resize(){if(disposed)return;const w=innerWidth,h=innerHeight;mobile=w<720;r.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.25:1.75));r.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
 function draw(p){if(disposed)return;const o=pose(p);if(last!==p){for(let j=0;j<N;j++){const line=lines[j],a=line.geometry.attributes.position;for(let k=0;k<=S;k++)a.setXYZ(k,...point(j,k/S,o));a.needsUpdate=true;line.geometry.setDrawRange(0,Math.max(2,Math.floor((S+1)*visible(j,p))));line.visible=visible(j,p)>0;}
 for(const {j,mesh} of tubes){const a=visible(j,p);mesh.visible=a>.025;if(!mesh.visible)continue;const pts=[];for(let k=0;k<=Math.max(2,Math.floor(S*a));k++)pts.push(new THREE.Vector3(...point(j,k/S,o)));const next=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),72,.028+smooth(p)*.015,6,false);mesh.geometry.dispose();mesh.geometry=next;}last=p;}
 camera.position.set(0,0,mobile?17:14);camera.lookAt(0,0,0);group.position.set(mobile?0:3.2,mobile?2.2:.15,0);r.render(scene,camera);}
 function lost(e){e.preventDefault();onLost();}
 function dispose(){if(disposed)return;disposed=true;r.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose()});r.dispose();r.domElement.remove();}
 r.domElement.id='three-scene';r.domElement.addEventListener('webglcontextlost',lost);host.insertBefore(r.domElement,host.querySelector('.veil'));return {resize,draw,dispose};
}
