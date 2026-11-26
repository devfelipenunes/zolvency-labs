import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {externalSpecs,adaptExternal,animateExternal} from './externalAssets.js';
import {signalPaths,signalPoint} from './signal.js';
import {createSpatialPlates} from './spatialType.js';
import {createComposition} from './compositionAssets.js';
import { cameraPose } from './camera.js';
import { makeScene,objectTransform,importedModels } from './world.js';
import { geometries,materials,partMatrix } from './meshFactory.js';
export async function createThreeScene(host,onLost){
 const loader=new GLTFLoader();
 const loaded=[];const loading=new Set();
 const r=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.03;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x0e1519);scene.fog=new THREE.FogExp2(0x0e1519,.024);
 const camera=new THREE.PerspectiveCamera(47,1,.10,190);
 const mats=materials(true),geo=geometries(),world=makeScene();
 const assetRoots=[];
 const spatial=createSpatialPlates(world.plates,scene);
 // Spatial batches avoid rendering distant chapters; independent parts remain movable.
 const zone=o=>Math.floor(o.position[2]/22);
 const groups=new Map();
 for(const o of world.objects){const key=[o.asset??'world',o.kind,o.shape,zone(o),o.float||o.hero||o.gate||o.station||o.proofDoor?'moving':'static'].join(':');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);}
 const batches=[];
 for(const group of groups.values()){
 const first=group[0],mesh=new THREE.InstancedMesh(geo[first.shape],mats[first.kind],group.length),dynamic=group.some(o=>o.float||o.hero||o.gate||o.station||o.proofDoor);
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
 const pmrem=new THREE.PMREMGenerator(r),env=pmrem.fromScene(studio,.07);scene.environment=env.texture;scene.environmentIntensity=.68;pmrem.dispose();panelGeo.dispose();panelMat.dispose();
 scene.add(new THREE.HemisphereLight(0xc7e4d8,0x17252b,.85));
 const key=new THREE.DirectionalLight(0xe0ece4,2.2);key.position.set(-5,12,8);scene.add(key);
 const rim=new THREE.DirectionalLight(0x8fb3c9,1.65);rim.position.set(10,7,-8);scene.add(rim);
 const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;const gc=glowCanvas.getContext('2d'),gradient=gc.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(130,255,200,.42)');gradient.addColorStop(.25,'rgba(130,255,200,.12)');gradient.addColorStop(1,'rgba(130,255,200,0)');gc.fillStyle=gradient;gc.fillRect(0,0,64,64);const glowTexture=new THREE.CanvasTexture(glowCanvas),glowMat=new THREE.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});const glows=[];for(const pos of [[0,2,0],[18,4,-24],[0,3.85,-48],[-22,4,-75],[12,3.85,-100],[-6,1,-124],[10,4,-153]]){const s=new THREE.Sprite(glowMat);s.position.set(...pos);s.scale.set(3.5,3.5,1);scene.add(s);glows.push(s);}
 const pulses=signalPaths(world.paths),pulseGeo=new THREE.SphereGeometry(.095,8,6),pulseMat=new THREE.MeshBasicMaterial({color:0xaaffd8}),pulseMesh=new THREE.InstancedMesh(pulseGeo,pulseMat,pulses.length),pulseDummy=new THREE.Object3D();pulseMesh.frustumCulled=false;scene.add(pulseMesh);
 const fill=new THREE.PointLight(0xafd7cd,110,28,2);scene.add(fill);
 let mobile=false,disposed=false,last=0;
 function releaseRoot(root){const gs=new Set(),ms=new Set(),ts=new Set();root.traverse(m=>{if(m.geometry)gs.add(m.geometry);if(m.material)for(const mat of Array.isArray(m.material)?m.material:[m.material])ms.add(mat);});gs.forEach(g=>g.dispose());for(const m of ms){if(Object.values(mats).includes(m))continue;for(const value of Object.values(m))if(value?.isTexture)ts.add(value);m.dispose();}ts.forEach(t=>t.dispose());}
 async function fetchModel(o){
 if(loading.has(o.name))return;loading.add(o.name);
 const spec=externalSpecs[o.name];let external=null,g=null;
 try{g=await loader.loadAsync(import.meta.env.BASE_URL+'models/external/'+spec.file+'.glb');if(disposed){releaseRoot(g.scene);return;}external=adaptExternal(g.scene,spec,o.position);}
 catch(e){if(g)releaseRoot(g.scene);if(disposed)return;console.warn('External model unavailable; keeping authored fallback',o.name);if(o.name==='rack')return;try{g=await loader.loadAsync(import.meta.env.BASE_URL+'models/'+o.name+'.glb');}catch{return;}}
 if(disposed){releaseRoot(external?.root??g.scene);return;}
 const root=external?.root??g.scene;
 if(!external){root.position.set(...o.position);root.traverse(m=>{if(m.isMesh&&mats[m.name]){m.material.dispose();m.material=mats[m.name];}});}
 scene.add(root);assetRoots.push({...o,root,external:external?{...external,file:spec.file}:null});loaded.push(o.name);draw(last);
 }
 const composition=createComposition(r,scene,releaseRoot,()=>draw(last));
 function resize(){if(disposed)return;mobile=innerWidth<720;r.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.15:1.6));r.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/Math.max(1,innerHeight);camera.updateProjectionMatrix();}
 function draw(p){if(disposed)return;last=p;const start=performance.now(),pose=cameraPose(p,mobile);camera.position.set(...pose.position);camera.up.set(0,1,0);camera.lookAt(...pose.target);camera.fov=pose.fov;camera.updateProjectionMatrix();fill.position.set(pose.position[0]-3,pose.position[1]+6,pose.position[2]-6);
 const z=pose.position[2],range=mobile?30:39;spatial.update(z,range);composition.update(p,z);
 for(const o of importedModels)if(Math.abs(o.position[2]-z)<48)fetchModel(o);for(const b of batches){b.mesh.visible=Math.abs(b.z-z)<range&&!loaded.includes(b.group[0].asset)&&!composition.loaded.has(b.group[0].asset);if(b.dynamic&&b.mesh.visible)b.update(p);}
 for(const b of lines)b.mesh.visible=Math.abs(b.z-z)<range+16;
 for(const a of assetRoots){a.root.visible=Math.abs(a.position[2]-z)<range;if(a.external)animateExternal(a.external,p);}for(const g of glows)g.visible=Math.abs(g.position.z-z)<range;
 let visible=0;for(let i=0;i<pulses.length;i++){const pos=signalPoint(pulses[i],p,i);if(Math.abs(pos[2]-z)>range)continue;pulseDummy.position.set(...pos);pulseDummy.updateMatrix();pulseMesh.setMatrixAt(visible++,pulseDummy.matrix);}pulseMesh.count=visible;pulseMesh.instanceMatrix.needsUpdate=true;
 r.render(scene,camera);
 host.dataset.composed=[...composition.loaded.keys()].sort().join(',');host.dataset.compositionFailures=[...composition.failures].join(',');host.dataset.compositionPose=JSON.stringify(composition.pose());host.dataset.plates=String(spatial.items.length);host.dataset.visiblePlates=String(spatial.items.filter(i=>i.holder.visible).length);host.dataset.pose=JSON.stringify(pose);host.dataset.progress=String(p);host.dataset.assets=String(loaded.length);host.dataset.externalAssets=assetRoots.filter(a=>a.external).map(a=>a.external.file).sort().join(',');host.dataset.mechanical=JSON.stringify(assetRoots.filter(a=>a.external).map(a=>({name:a.name,rotors:a.external.rotors.map(r=>r.o.rotation.y),door:a.external.door?.o.rotation.y??null,emission:a.external.emissions[0]?.emissiveIntensity??null})));host.dataset.geometries=String(batches.length+lines.length+importedModels.length);host.dataset.gpuGeometries=String(r.info.memory.geometries);host.dataset.drawCalls=String(r.info.render.calls);host.dataset.triangles=String(r.info.render.triangles);host.dataset.submitMs=String(performance.now()-start);
 }
 function lost(e){e.preventDefault();onLost();}
 function dispose(){if(disposed)return;disposed=true;r.domElement.removeEventListener('webglcontextlost',lost);for(const b of batches)b.mesh.dispose();for(const b of lines)b.mesh.geometry.dispose();for(const a of assetRoots){releaseRoot(a.root);a.external?.originalTextures.forEach(t=>t.dispose());}composition.dispose();spatial.dispose();pulseMesh.dispose();pulseGeo.dispose();pulseMat.dispose();glowMat.dispose();glowTexture.dispose();const textures=new Set();for(const m of Object.values(mats)){if(m.normalMap)textures.add(m.normalMap);if(m.roughnessMap)textures.add(m.roughnessMap);}textures.forEach(t=>t.dispose());Object.values(geo).forEach(g=>g.dispose());Object.values(mats).forEach(m=>m.dispose());env.dispose();r.dispose();r.domElement.remove();}
 r.domElement.id='three-scene';r.domElement.addEventListener('webglcontextlost',lost);host.insertBefore(r.domElement,host.querySelector('.veil'));return {resize,draw,dispose};
}
