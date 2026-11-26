import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { cameraPose } from './camera.js';
import { makeScene,objectTransform,importedModels } from './world.js';
import { geometries,materials,partMatrix } from './meshFactory.js';
export async function createThreeScene(host,onLost){
 const loader=new GLTFLoader();
 const loaded=[];const loading=new Set();
 const r=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.13;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x0e1519);scene.fog=new THREE.FogExp2(0x0e1519,.018);
 const camera=new THREE.PerspectiveCamera(47,1,.10,190);
 const mats=materials(true),geo=geometries(),world=makeScene();
 const assetRoots=[];
 // Spatial batches avoid rendering distant chapters; independent parts remain movable.
 const zone=o=>Math.floor(o.position[2]/22);
 const groups=new Map();
 for(const o of world.objects){const key=[o.asset??'world',o.kind,o.shape,zone(o),o.float||o.hero?'moving':'static'].join(':');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);}
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
 const pmrem=new THREE.PMREMGenerator(r),env=pmrem.fromScene(studio,.07);scene.environment=env.texture;scene.environmentIntensity=1.05;pmrem.dispose();panelGeo.dispose();panelMat.dispose();
 scene.add(new THREE.HemisphereLight(0xd9ebe5,0x23353f,1.5));
 const key=new THREE.DirectionalLight(0xffedcf,3.1);key.position.set(-5,12,8);scene.add(key);
 const rim=new THREE.DirectionalLight(0x9cb9ec,3.0);rim.position.set(10,7,-8);scene.add(rim);
 const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;const gc=glowCanvas.getContext('2d'),gradient=gc.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(130,255,200,.42)');gradient.addColorStop(.25,'rgba(130,255,200,.12)');gradient.addColorStop(1,'rgba(130,255,200,0)');gc.fillStyle=gradient;gc.fillRect(0,0,64,64);const glowTexture=new THREE.CanvasTexture(glowCanvas),glowMat=new THREE.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});const glows=[];for(const pos of [[0,2,0],[18,4,-24],[0,3.85,-48],[-22,4,-75],[12,3.85,-100],[-6,1,-124],[10,4,-153]]){const s=new THREE.Sprite(glowMat);s.position.set(...pos);s.scale.set(3.5,3.5,1);scene.add(s);glows.push(s);}
 const fill=new THREE.PointLight(0xafd7cd,75,34,2);scene.add(fill);
 let mobile=false,disposed=false,last=0;function fetchModel(o){if(loading.has(o.name))return;loading.add(o.name);loader.loadAsync(import.meta.env.BASE_URL+'models/'+o.name+'.glb').then(g=>{const root=g.scene;if(disposed){root.traverse(m=>{m.geometry?.dispose();m.material?.dispose();});return;}root.position.set(...o.position);root.traverse(m=>{if(m.isMesh&&mats[m.name]){m.material.dispose();m.material=mats[m.name];}});scene.add(root);assetRoots.push({...o,root});loaded.push(o.name);draw(last);}).catch(e=>{console.warn('Using authored blueprint instead of GLB',o.name,e);});}
 function resize(){if(disposed)return;mobile=innerWidth<720;r.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.15:1.6));r.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/Math.max(1,innerHeight);camera.updateProjectionMatrix();}
 function draw(p){if(disposed)return;last=p;const start=performance.now(),pose=cameraPose(p,mobile);camera.position.set(...pose.position);camera.up.set(0,1,0);camera.lookAt(...pose.target);camera.fov=pose.fov;camera.updateProjectionMatrix();fill.position.set(pose.position[0]-3,pose.position[1]+6,pose.position[2]-6);
 const z=pose.position[2],range=mobile?43:55;
 for(const o of importedModels)if(Math.abs(o.position[2]-z)<48)fetchModel(o);for(const b of batches){b.mesh.visible=Math.abs(b.z-z)<range&&!loaded.includes(b.group[0].asset);if(b.dynamic&&b.mesh.visible)b.update(p);}
 for(const b of lines)b.mesh.visible=Math.abs(b.z-z)<range+16;
 for(const a of assetRoots)a.root.visible=Math.abs(a.position[2]-z)<range;for(const g of glows)g.visible=Math.abs(g.position.z-z)<range;
 r.render(scene,camera);
 host.dataset.pose=JSON.stringify(pose);host.dataset.progress=String(p);host.dataset.assets=String(loaded.length);host.dataset.geometries=String(batches.length+lines.length+importedModels.length);host.dataset.gpuGeometries=String(r.info.memory.geometries);host.dataset.drawCalls=String(r.info.render.calls);host.dataset.triangles=String(r.info.render.triangles);host.dataset.submitMs=String(performance.now()-start);
 }
 function lost(e){e.preventDefault();onLost();}
 function dispose(){if(disposed)return;disposed=true;r.domElement.removeEventListener('webglcontextlost',lost);for(const b of batches)b.mesh.dispose();for(const b of lines)b.mesh.geometry.dispose();const usedGeo=new Set(),usedMat=new Set();for(const a of assetRoots)a.root.traverse(o=>{if(o.geometry)usedGeo.add(o.geometry);if(o.material)usedMat.add(o.material);});usedGeo.forEach(g=>g.dispose());usedMat.forEach(m=>{if(!Object.values(mats).includes(m))m.dispose()});glowMat.dispose();glowTexture.dispose();const textures=new Set();for(const m of Object.values(mats)){if(m.normalMap)textures.add(m.normalMap);if(m.roughnessMap)textures.add(m.roughnessMap);}textures.forEach(t=>t.dispose());Object.values(geo).forEach(g=>g.dispose());Object.values(mats).forEach(m=>m.dispose());env.dispose();r.dispose();r.domElement.remove();}
 r.domElement.id='three-scene';r.domElement.addEventListener('webglcontextlost',lost);host.insertBefore(r.domElement,host.querySelector('.veil'));return {resize,draw,dispose};
}
