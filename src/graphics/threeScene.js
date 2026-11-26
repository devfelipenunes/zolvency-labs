import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cameraPose } from './camera.js';
import { makeWorld } from './world.js';

// Elliptical sweep (the long radius bounds the clearance calculation).
function ribbon(path){
 const curve=new THREE.CatmullRomCurve3(path.points.map(p=>new THREE.Vector3(...p)));
 const n=path.points.length-1,sides=8,frames=curve.computeFrenetFrames(n,false);
 const positions=[],uv=[],indices=[];
 for(let i=0;i<=n;i++){
  const center=curve.getPointAt(i/n),a=frames.normals[i],b=frames.binormals[i];
  for(let j=0;j<=sides;j++){
   const theta=j/sides*Math.PI*2;
   const v=center.clone().addScaledVector(a,Math.cos(theta)*path.radius).addScaledVector(b,Math.sin(theta)*path.radius*path.profile);
   positions.push(v.x,v.y,v.z);uv.push(i/n,j/sides);
   if(i<n&&j<sides){const k=i*(sides+1)+j,l=k+sides+1;indices.push(k,l,k+1,l,l+1,k+1);}
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function createThreeScene(host,onLost){
 const r=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.24;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x11191b);scene.fog=new THREE.FogExp2(0x11191b,.023);
 const camera=new THREE.PerspectiveCamera(42,1,.12,140);
 const ceramic=new THREE.MeshStandardMaterial({color:0xc9d0c8,metalness:.12,roughness:.45,side:THREE.DoubleSide});
 const metal=new THREE.MeshStandardMaterial({color:0x778c8d,metalness:.64,roughness:.3,side:THREE.DoubleSide});
 const accent=new THREE.MeshStandardMaterial({color:0xb4efc7,emissive:0x76c98c,emissiveIntensity:.8,roughness:.36,side:THREE.DoubleSide});
 const pulse={value:0};
 accent.onBeforeCompile=shader=>{
  shader.uniforms.uStory=pulse;
  shader.vertexShader='varying vec3 vScenePosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvScenePosition = position;');
  shader.fragmentShader='uniform float uStory; varying vec3 vScenePosition;\n'+shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat wave = exp(-pow((vScenePosition.z-(20.0-95.0*uStory))/5.5,2.0)); totalEmissiveRadiance *= 0.65 + wave*1.6;');
 };
 accent.customProgramCacheKey=()=> 'woven-story-pulse-v1';
 const mats={ceramic,metal,accent};
 const world=makeWorld();
 // Batch immutable meshes by material to reduce draw calls.
 for(const [kind,mat] of Object.entries(mats)){
  const gs=world.filter(p=>p.kind===kind).map(ribbon);const combined=mergeGeometries(gs,false);gs.forEach(g=>g.dispose());if(!combined)throw Error('Geometry merge failed');scene.add(new THREE.Mesh(combined,mat));
 }
 const floorMat=new THREE.MeshStandardMaterial({color:0x293538,roughness:.83,metalness:.2});
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(130,135),floorMat);floor.rotation.x=-Math.PI/2;floor.position.set(0,-3,-32);scene.add(floor);
 // Procedural studio reflection: a few soft light panels, no licensed HDRI.
 const studio=new THREE.Scene();studio.background=new THREE.Color(0x425052);
 const panelMat=new THREE.MeshBasicMaterial({color:0xffffff});const panelGeo=new THREE.PlaneGeometry(12,8);
 for(const [x,y,z] of [[-12,8,8],[12,6,-8],[0,14,-4]]){const panel=new THREE.Mesh(panelGeo,panelMat);panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);}
 const pmrem=new THREE.PMREMGenerator(r);const env=pmrem.fromScene(studio,.08);scene.environment=env.texture;scene.environmentIntensity=.7;pmrem.dispose();panelGeo.dispose();panelMat.dispose();
 scene.add(new THREE.HemisphereLight(0xe9f0e6,0x27393d,1.5));
 const key=new THREE.DirectionalLight(0xfff5df,2.7);key.position.set(-8,11,8);scene.add(key);
 const rim=new THREE.DirectionalLight(0xa4c1dd,1.9);rim.position.set(8,6,-35);scene.add(rim);
 const atrium=new THREE.PointLight(0xb1e1bd,120,34,2);atrium.position.set(1,5,-17);scene.add(atrium);
 const horizon=new THREE.PointLight(0xdde5ca,160,45,2);horizon.position.set(0,8,-62);scene.add(horizon);
 let mobile=false,disposed=false;
 function resize(){if(disposed)return;const w=innerWidth,h=innerHeight;mobile=w<720;r.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.25:1.65));r.setSize(w,h);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();}
 function draw(p){if(disposed)return;const start=performance.now(),pose=cameraPose(p,mobile);camera.position.set(...pose.position);camera.up.set(0,1,0);camera.lookAt(...pose.target);if(camera.fov!==pose.fov){camera.fov=pose.fov;camera.updateProjectionMatrix();}
 pulse.value=p;r.render(scene,camera);host.dataset.pose=JSON.stringify(pose);host.dataset.geometries='4';host.dataset.gpuGeometries=String(r.info.memory.geometries);host.dataset.drawCalls=String(r.info.render.calls);host.dataset.triangles=String(r.info.render.triangles);host.dataset.submitMs=String(performance.now()-start);host.dataset.progress=String(p);}
 function lost(e){e.preventDefault();onLost();}
 function dispose(){if(disposed)return;disposed=true;r.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(o=>o.geometry?.dispose());[ceramic,metal,accent,floorMat].forEach(m=>m.dispose());env.dispose();r.dispose();r.domElement.remove();}
 r.domElement.id='three-scene';r.domElement.addEventListener('webglcontextlost',lost);host.insertBefore(r.domElement,host.querySelector('.veil'));return {resize,draw,dispose};
}
