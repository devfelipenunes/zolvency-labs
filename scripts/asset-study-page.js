import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const file=new URLSearchParams(location.search).get('file');
if(!['bridge.glb','control-room.glb','server-rack.glb','hangar.glb'].includes(file))throw Error('unknown audition asset');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x141c21);
const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.05);room.dispose();scene.environment=env.texture;scene.environmentIntensity=.65;
const sky=new THREE.HemisphereLight(0xe1f1fc,0x4c4944,1.3);scene.add(sky);
const key=new THREE.DirectionalLight(0xe7edfa,2.2);key.position.set(4,8,6);scene.add(key);
const rim=new THREE.DirectionalLight(0x9ddbd9,1.4);rim.position.set(-5,4,-3);scene.add(rim);
const ktx=new KTX2Loader().setTranscoderPath('/models/basis/').detectSupport(renderer);
const loader=new GLTFLoader().setKTX2Loader(ktx).setMeshoptDecoder(MeshoptDecoder);
const {scene:root}=await loader.loadAsync('/models/asset-study/facility/'+file);scene.add(root);root.updateMatrixWorld(true);
const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),diameter=Math.max(size.x,size.y,size.z);
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.01,Math.max(100,diameter*10));
const nodes=[];let triangles=0;
root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,mats=Array.isArray(o.material)?o.material:[o.material];triangles+=(g.index?.count??g.attributes.position.count)/3;nodes.push({name:o.name,materials:mats.map(m=>m.name),uv:!!g.attributes.uv,uv1:!!g.attributes.uv1,triangles:(g.index?.count??g.attributes.position.count)/3});});
window.audit={file,size:size.toArray(),center:center.toArray(),triangles,nodes};
window.renderAngle=(angle,interior=false)=>{
 const theta=angle*Math.PI/180;
 if(interior&&file!=='server-rack.glb'){camera.fov=65;camera.position.set(center.x+Math.sin(theta)*size.x*.21,box.min.y+size.y*.52,center.z+Math.cos(theta)*size.z*.30);camera.lookAt(center.x,box.min.y+size.y*.46,center.z-Math.cos(theta)*size.z*.27);}
 else{camera.fov=50;camera.position.copy(center).add(new THREE.Vector3(Math.sin(theta)*diameter*1.55,diameter*.8,Math.cos(theta)*diameter*1.55));camera.lookAt(center);}
 camera.updateProjectionMatrix();renderer.render(scene,camera);
};window.renderAngle(40);document.body.dataset.ready='true';

window.exportStaticShell=()=>{
 if(file!=='hangar.glb')throw Error('hangar only');
 const shell=root.getObjectByName('hangar_bay');if(!shell)throw Error('source hangar_bay missing');
 const meshes=[],v=new THREE.Vector3();
 shell.traverse(o=>{
  if(!o.isMesh||Array.isArray(o.material)||o.material.transparent||(o.material.transmission??0)>.001||/glass|light|led|screen|glow|holo/i.test(o.material.name??''))return;
  const g=o.geometry,attr=g.attributes.position,positions=[];
  for(let i=0;i<attr.count;i++)positions.push(...v.fromBufferAttribute(attr,i).applyMatrix4(o.matrixWorld).toArray());
  const indices=g.index?Array.from(g.index.array):Array.from({length:attr.count},(_,i)=>i);
  if(indices.length%3)throw Error('nontriangle geometry');
  meshes.push({node:o.name,material:o.material.name,positions,indices});
 });
 if(!meshes.length)throw Error('no static meshes');
 return {file,meshes,coordinates:'Three.js world metres, Y-up'};
};
