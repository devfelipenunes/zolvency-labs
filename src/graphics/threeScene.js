import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {cameraPose,facilityMotion} from './facilityCamera.js';
import {facility} from './facilityLayout.js';
export async function createThreeScene(host,onLost){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x0a1116);scene.fog=new THREE.FogExp2(0x0a1116,.008);
 const camera=new THREE.PerspectiveCamera(64,1,.055,80);
 const ktx=new KTX2Loader().setTranscoderPath(import.meta.env.BASE_URL+'models/basis/').detectSupport(renderer);
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(ktx);
 const pmrem=new THREE.PMREMGenerator(renderer),studio=new RoomEnvironment(),environment=pmrem.fromScene(studio,.05);studio.dispose();pmrem.dispose();scene.environment=environment.texture;scene.environmentIntensity=.52;
 scene.add(new THREE.HemisphereLight(0xd1e4ef,0x2b3332,1.1));
 const light=(color,intensity,distance,position)=>{const l=new THREE.PointLight(color,intensity,distance,2);l.position.set(...position);scene.add(l);return l};
 const key=new THREE.DirectionalLight(0xe2e9f0,1.25);key.position.set(-5,11,8);scene.add(key);
 light(0x99d8c4,110,18,[0,7,5]);light(0xc8d8ed,95,15,[0,7,-7]);light(0x89d5b4,32,7,[5.8,2.7,6.8]);light(0xc3d9eb,27,6,[-5.5,2.7,-1.5]);const quantumLight=light(0x9edfcf,70,11,[4.7,5.8,-8.6]);
 const head=light(0xf0f6f8,11,5,[0,2,0]);
 const roots=new Map(),bones=[],failures=[],materials=new Set(),textures=new Set(),geometries=new Set();let disposed=false,mobile=false;
 const base=import.meta.env.BASE_URL+'models/facility/';
 function collect(root){root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});}
 function add(spec,g){
  const root=g.scene;collect(root);
  if(spec.openFront){const front=root.getObjectByName('wall_front');if(front)front.visible=false;}
  if(spec.hideHologram){const h=root.getObjectByName('hologram-projector_hologram_glow');if(h)h.visible=false;}
  root.traverse(o=>{
   const name=o.name??'';
   if(spec.id==='hangar'&&name==='blast_door')bones.push({id:'blast',o,axis:'y',base:o.position.y});
   if(spec.id==='hangar'&&name==='crane_bridge')bones.push({id:'crane',o,axis:'z',base:o.position.z});
   if(spec.id==='servers'&&name==='door')bones.push({id:'serverDoor',o,axis:'ry',base:o.rotation.y});
   if(spec.id==='portal'&&/^(door_left|door_right)$/.test(name))bones.push({id:name,o,axis:'x',base:o.position.x});
   if(spec.id==='gpu'&&/fan_\d+_rotor/.test(name))bones.push({id:'fan',o,axis:'ry',base:o.rotation.y});
  });
  const seen=new Set();root.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(seen.has(m))continue;seen.add(m);if(m.color&&!/glass|light|glow|led|screen|holo/i.test(m.name??'')){m.color.multiply(new THREE.Color(spec.id==='pcb'?0xaabbbb:0x9caeae));m.roughness=Math.max(m.roughness??.35,.34);}if(/led|glow/i.test(m.name??'')){m.emissive?.setHex(0x75c9a3);m.emissiveIntensity=Math.min(1.4,Math.max(.5,m.emissiveIntensity??1));}}});
  const holder=new THREE.Group();holder.name='facility-'+spec.id;holder.add(root);
  if(spec.size){root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),scale=spec.size/Math.max(s.x,s.y,s.z);root.scale.multiplyScalar(scale);root.position.x-=c.x*scale;root.position.z-=c.z*scale;root.position.y-=b.min.y*scale;}else root.scale.multiplyScalar(spec.scale);
  holder.position.set(...spec.position);scene.add(holder);roots.set(spec.id,holder);
 }
 // Load the actual architectural shell first so the first visible frame is never an empty world.
 try{const g=await loader.loadAsync(base+facility[0].file);add(facility[0],g);
 await Promise.all(facility.slice(1).map(async spec=>{try{add(spec,await loader.loadAsync(base+spec.file));}catch(e){failures.push(spec.id);console.warn('Facility asset unavailable',spec.id,e);}}));
 if(failures.length)throw Error('Facility assets missing: '+failures.join(','));
 }catch(e){dispose();throw e;}
 const ray=new THREE.Raycaster(),dirs=[new THREE.Vector3(1,0,0),new THREE.Vector3(-1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,-1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,-1)];
 const debug=new URLSearchParams(location.search).has('diagnostics');
 function clearance(){scene.updateMatrixWorld(true);let min=Infinity;for(const d of dirs){ray.set(camera.position,d);ray.far=.75;const hits=ray.intersectObjects([...roots.values()],true).filter(h=>{let o=h.object;while(o){if(!o.visible)return false;o=o.parent;}return true;});if(hits.length)min=Math.min(min,hits[0].distance);}return Number.isFinite(min)?min:.75;}
 function resize(){if(disposed)return;mobile=innerWidth<720;renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.15:1.5));renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/Math.max(1,innerHeight);camera.updateProjectionMatrix();}
 function draw(p){if(disposed)return;const pose=cameraPose(p,mobile),motion=facilityMotion(p);camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.fov=pose.fov;camera.updateProjectionMatrix();head.position.copy(camera.position);head.position.y+=.5;
 for(const b of bones){if(b.id==='blast')b.o.position.y=b.base+7.1*motion.blast;else if(b.id==='crane')b.o.position.z=b.base+4.0*motion.crane;else if(b.id==='serverDoor')b.o.rotation.y=b.base-1.0*motion.serverDoor;else if(b.id==='door_left')b.o.position.x=b.base+1.04*motion.portal;else if(b.id==='door_right')b.o.position.x=b.base-1.04*motion.portal;else if(b.id==='fan')b.o.rotation.y=b.base+motion.fans;}
 quantumLight.intensity=55+40*motion.quantum;
 renderer.render(scene,camera);host.dataset.pose=JSON.stringify(pose);host.dataset.progress=String(p);host.dataset.facility=[...roots.keys()].sort().join(',');host.dataset.assets=String(roots.size);host.dataset.authoredModels='0';host.dataset.mechanical=JSON.stringify(bones.map(b=>[b.id,b.o.position.x,b.o.position.y,b.o.position.z,b.o.rotation.y]));host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);host.dataset.clearance=debug?String(clearance()):'not sampled';
 }
 function lost(e){e.preventDefault();onLost();}
 function dispose(){if(disposed)return;disposed=true;renderer.domElement.removeEventListener('webglcontextlost',lost);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();ktx.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();}
 renderer.domElement.id='three-scene';renderer.domElement.addEventListener('webglcontextlost',lost);host.insertBefore(renderer.domElement,host.querySelector('.veil'));return {resize,draw,dispose};
}
