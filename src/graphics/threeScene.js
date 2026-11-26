import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { cameraPose } from './camera.js';
import { makeScene,objectTransform,importedModels } from './world.js';
import { geometries,materials,partMatrix } from './meshFactory.js';
export async function createThreeScene(host,onLost){
 const loader=new GLTFLoader();
 const loaded=await Promise.all(importedModels.map(async o=>({ ...o,root:(await loader.loadAsync(import.meta.env.BASE_URL+'models/'+o.name+'.glb')).scene })));
 const r=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.28;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x0e1519);scene.fog=new THREE.FogExp2(0x0e1519,.021);
 const camera=new THREE.PerspectiveCamera(47,1,.10,190);
 const mats=materials(),geo=geometries(),world=makeScene();
 const assetRoots=[];for(const o of loaded){o.root.position.set(...o.position);scene.add(o.root);assetRoots.push(o);}
 // Spatial batches avoid rendering distant chapters; independent parts remain movable.
 const zone=o=>Math.floor(o.position[2]/22);
 const groups=new Map();
 for(const o of world.objects){if(o.asset)continue;const key=[o.kind,o.shape,zone(o),o.float||o.hero?'moving':'static'].join(':');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);}
 const batches=[];
 for(const group of groups.values()){
 const first=group[0],mesh=new THREE.InstancedMesh(geo[first.shape],mats[first.kind],group.length),dynamic=group.some(o=>o.float||o.hero);
 mesh.instanceMatrix.setUsage(dynamic?THREE.DynamicDrawUsage:THREE.StaticDrawUsage);
 const update=p=>{group.forEach((o,i)=>{const t=objectTransform(o,p);mesh.setMatrixAt(i,partMatrix(o,t.position,t.rotation));});mesh.instanceMatrix.needsUpdate=true;};
 update(0);mesh.computeBoundingSphere();if(dynamic)mesh.frustumCulled=false;scene.add(mesh);
 batches.push({mesh,group,dynamic,update,z:zone(first)*22+11});
 }
 const pathGroups=new Map();
 for(const p of world.paths){const z=p.points.reduce((a,v)=>a+v[2],0)/p.points.length,key=p.kind+':'+Math.floor(z/22);if(!pathGroups.has(key))pathGroups.set(key,[]);pathGroups.get(key).push(p);}
 const lines=[];
 for(const group of pathGroups.values()){
 const gs=group.map(p=>{const curve=new THREE.CatmullRomCurve3(p.points.map(v=>new THREE.Vector3(...v)));return new THREE.TubeGeometry(curve,Math.min(96,p.points.length-1),p.radius,6,false);});
 const g=mergeGeometries(gs,false);gs.forEach(x=>x.dispose());const mesh=new THREE.Mesh(g,mats[group[0].kind]);scene.add(mesh);
 const z=group[0].points[0][2];lines.push({mesh,z});
 }
 // Procedural reflection environment: softboxes, not licensed external HDRI.
 const studio=new THREE.Scene();studio.background=new THREE.Color(0x3f5058);
 const panelGeo=new THREE.PlaneGeometry(14,9),panelMat=new THREE.MeshBasicMaterial({color:0xffffff});
 for(const [x,y,z] of [[-14,8,10],[12,8,-8],[0,14,-4]]){const p=new THREE.Mesh(panelGeo,panelMat);p.position.set(x,y,z);p.lookAt(0,0,0);studio.add(p);}
 const pmrem=new THREE.PMREMGenerator(r),env=pmrem.fromScene(studio,.07);scene.environment=env.texture;scene.environmentIntensity=.85;pmrem.dispose();panelGeo.dispose();panelMat.dispose();
 scene.add(new THREE.HemisphereLight(0xd9ebe5,0x23353f,1.5));
 const key=new THREE.DirectionalLight(0xffedcf,2.5);key.position.set(-5,12,8);scene.add(key);
 const rim=new THREE.DirectionalLight(0x9cb9ec,2.6);rim.position.set(10,7,-8);scene.add(rim);
 const fill=new THREE.PointLight(0xafd7cd,100,34,2);scene.add(fill);
 let mobile=false,disposed=false;
 function resize(){if(disposed)return;mobile=innerWidth<720;r.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.15:1.6));r.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/Math.max(1,innerHeight);camera.updateProjectionMatrix();}
 function draw(p){if(disposed)return;const start=performance.now(),pose=cameraPose(p,mobile);camera.position.set(...pose.position);camera.up.set(0,1,0);camera.lookAt(...pose.target);camera.fov=pose.fov;camera.updateProjectionMatrix();fill.position.set(pose.position[0]-3,pose.position[1]+6,pose.position[2]-6);
 const z=pose.position[2],range=mobile?43:55;
 for(const b of batches){b.mesh.visible=Math.abs(b.z-z)<range;if(b.dynamic&&b.mesh.visible)b.update(p);}
 for(const b of lines)b.mesh.visible=Math.abs(b.z-z)<range+16;
 for(const a of assetRoots)a.root.visible=Math.abs(a.position[2]-z)<range;
 r.render(scene,camera);
 host.dataset.pose=JSON.stringify(pose);host.dataset.progress=String(p);host.dataset.assets=String(loaded.length);host.dataset.geometries=String(batches.length+lines.length+assetRoots.length);host.dataset.gpuGeometries=String(r.info.memory.geometries);host.dataset.drawCalls=String(r.info.render.calls);host.dataset.triangles=String(r.info.render.triangles);host.dataset.submitMs=String(performance.now()-start);
 }
 function lost(e){e.preventDefault();onLost();}
 function dispose(){if(disposed)return;disposed=true;r.domElement.removeEventListener('webglcontextlost',lost);for(const b of batches)b.mesh.dispose();for(const b of lines)b.mesh.geometry.dispose();const usedGeo=new Set(),usedMat=new Set();for(const a of assetRoots)a.root.traverse(o=>{if(o.geometry)usedGeo.add(o.geometry);if(o.material)usedMat.add(o.material);});usedGeo.forEach(g=>g.dispose());usedMat.forEach(m=>m.dispose());Object.values(geo).forEach(g=>g.dispose());Object.values(mats).forEach(m=>m.dispose());env.dispose();r.dispose();r.domElement.remove();}
 r.domElement.id='three-scene';r.domElement.addEventListener('webglcontextlost',lost);host.insertBefore(r.domElement,host.querySelector('.veil'));return {resize,draw,dispose};
}
