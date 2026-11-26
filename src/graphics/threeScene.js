import * as THREE from 'three';
import { cameraPose } from './camera.js';
import { makeWorld } from './world.js';

export function createThreeScene(host,onLost){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x10171a);scene.fog=new THREE.FogExp2(0x10171a,.037);
 const camera=new THREE.PerspectiveCamera(42,1,.12,100);
 const rib=new THREE.MeshStandardMaterial({color:0xa9b1ad,metalness:.28,roughness:.63});
 const accent=new THREE.MeshStandardMaterial({color:0x96c9ad,emissive:0x4c8c66,emissiveIntensity:.9,metalness:.05,roughness:.48});
 const node=new THREE.MeshStandardMaterial({color:0xc5cec5,metalness:.45,roughness:.5});
 const floorMat=new THREE.MeshStandardMaterial({color:0x242f32,roughness:.93});
 const mats={rib,accent,node};
 const world=makeWorld();
 // All geometry is allocated only during initialization.
 for(const path of world){
   const curve=new THREE.CatmullRomCurve3(path.points.map(p=>new THREE.Vector3(...p)));
   const geom=new THREE.TubeGeometry(curve,path.points.length-1,path.radius,8,false);
   const mesh=new THREE.Mesh(geom,mats[path.kind]);scene.add(mesh);
 }
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(85,90),floorMat);floor.rotation.x=-Math.PI/2;floor.position.set(0,-2.55,-9);scene.add(floor);
 scene.add(new THREE.HemisphereLight(0xd2e5e2,0x26353c,2.25));
 const key=new THREE.DirectionalLight(0xf1f4ed,2.8);key.position.set(-8,10,13);scene.add(key);
 const rim=new THREE.DirectionalLight(0x95b5c7,1.5);rim.position.set(7,3,-18);scene.add(rim);
 const interior=new THREE.PointLight(0xa9e3c3,95,25,2);interior.position.set(0,4,-17);scene.add(interior);
 let mobile=false,disposed=false,lastProgress=0;
 function resize(){if(disposed)return;const w=innerWidth,h=innerHeight;mobile=w<720;renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.25:1.75));renderer.setSize(w,h);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();}
 function draw(p){if(disposed)return;lastProgress=p;const pose=cameraPose(p,mobile);camera.position.set(...pose.position);camera.up.set(0,1,0);camera.lookAt(...pose.target);if(camera.fov!==pose.fov){camera.fov=pose.fov;camera.updateProjectionMatrix();}
 renderer.render(scene,camera);host.dataset.pose=JSON.stringify(pose);host.dataset.geometries=String(world.length+1);host.dataset.gpuGeometries=String(renderer.info.memory.geometries);host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.progress=String(lastProgress);}
 function lost(e){e.preventDefault();onLost();}
 function dispose(){if(disposed)return;disposed=true;renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(o=>o.geometry?.dispose());[rib,accent,node,floorMat].forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();}
 renderer.domElement.id='three-scene';renderer.domElement.addEventListener('webglcontextlost',lost);host.insertBefore(renderer.domElement,host.querySelector('.veil'));return {resize,draw,dispose};
}
