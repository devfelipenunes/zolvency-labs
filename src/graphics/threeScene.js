import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {cameraPose,facilityMotion} from './facilityCamera.js';
import {spatialFacility,facilityHDRI} from './facilityLayout.js';
import {installDisplay} from './facilityDisplays.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {createDiegeticTypography} from './diegeticTypography.js';
import {typeMode} from './typographyDirection.js';
import {spatialPose,environmentBlend} from './spatialNarrative.js';
export async function createThreeScene(host,onLost){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x0a1116);scene.fog=new THREE.FogExp2(0x0a1116,.008);
 const camera=new THREE.PerspectiveCamera(64,1,.075,65);
 const debug=new URLSearchParams(location.search).has('diagnostics'),cinema=new URLSearchParams(location.search).get('quality')==='cinema';
 const initialMobile=innerWidth<720;const typographyMode=typeMode(new URLSearchParams(location.search).get('type'));let typography=null;let effects=null,audit=null,last=0,frame=0,previousTick=0,firstFrame=false,environmentMode='studio',removedOverlap=0,shadowMotion='';const startTime=performance.now();
 const ktx=new KTX2Loader().setTranscoderPath(import.meta.env.BASE_URL+'models/basis/').detectSupport(renderer);
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(ktx);
 const pmrem=new THREE.PMREMGenerator(renderer),studio=new RoomEnvironment();let environment=pmrem.fromScene(studio,.05);studio.dispose();scene.environment=environment.texture;scene.environmentIntensity=.40;
 const hemisphere=new THREE.HemisphereLight(0xc9d9e1,0x26312f,.72);scene.add(hemisphere);const spaceMode=new URLSearchParams(location.search).get('space')??'immersive';const spatialEnabled=spaceMode!=='baseline';const facility=spatialFacility(spaceMode);const isolationUniforms=new Map();
 const light=(color,intensity,distance,position)=>{const l=new THREE.PointLight(color,intensity,distance,2);l.position.set(...position);scene.add(l);return l};
 const key=new THREE.DirectionalLight(0xe2e9f0,1.05);key.position.set(-5,12,8);scene.add(key);key.castShadow=!initialMobile;key.shadow.mapSize.set(debug?512:1024,debug?512:1024);Object.assign(key.shadow.camera,{left:-12,right:12,top:16,bottom:-16,near:.5,far:38});key.shadow.bias=-.0003;key.shadow.normalBias=.035;key.shadow.radius=3;key.shadow.camera.updateProjectionMatrix();renderer.shadowMap.enabled=!initialMobile;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 const hallA=light(0x99d8c4,90,18,[0,7,5]);const hallB=light(0xc8d8ed,85,15,[0,7,-7]);light(0x89d5b4,12,5,[5.8,2.7,6.8]);light(0xc3d9eb,27,6,[-5.5,2.7,-1.5]);const quantumLight=light(0x9edfcf,70,11,[4.7,5.8,-8.6]);
 const head=light(0xf0f6f8,11,5,[0,2,0]);const accent=light(0xc0e8ce,0,7,[0,2,0]);
 function installIsolation(m,id){if(!spatialEnabled||isolationUniforms.has(m))return;const u={value:0};isolationUniforms.set(m,{u,id});const before=m.onBeforeCompile.bind(m);m.onBeforeCompile=(shader,renderer)=>{before(shader,renderer);shader.uniforms.uExteriorIsolation=u;shader.fragmentShader='uniform float uExteriorIsolation;\n'+shader.fragmentShader.replace('#include <fog_fragment>','#include <fog_fragment>\n#ifdef USE_FOG\ngl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, uExteriorIsolation * smoothstep(2.8, 12.0, vFogDepth));\n#endif');};m.customProgramCacheKey=()=> 'facility-exterior-fog-v1';m.needsUpdate=true;}
 const roots=new Map(),bones=[],leds=[],displays=[],failures=[],pending=new Set(),materials=new Set(),textures=new Set(),geometries=new Set();let disposed=false,mobile=initialMobile,activeLoads=0,scaleFactor=1;const timings={firstFrameMs:null,allAssetsMs:null};
 const base=import.meta.env.BASE_URL+'models/facility/';
 function collect(root){root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});}
 // Adapt only the original merged hangar body. Remove triangles from built-in
 // fixtures that occupy the inserted server room, retaining floor and shell.
 function clearServerOverlap(){
  const hall=roots.get('hangar')?.getObjectByName('hangar_bay'),room=roots.get('servers');if(!hall||!room)return;
  scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(room);box.min.y=.16;box.max.y-=.04;box.min.x+=.04;box.max.x-=.04;box.min.z+=.04;box.max.z-=.04;
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),center=new THREE.Vector3();
  for(const child of hall.children){if(child.name==='crane_bridge')continue;child.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const g=o.geometry,p=g.attributes.position,index=g.index,keep=[];if(!p)return;const count=index?.count??p.count;
   for(let i=0;i+2<count;i+=3){const j=index?index.getX(i):i,k=index?index.getX(i+1):i+1,l=index?index.getX(i+2):i+2;a.fromBufferAttribute(p,j).applyMatrix4(o.matrixWorld);b.fromBufferAttribute(p,k).applyMatrix4(o.matrixWorld);c.fromBufferAttribute(p,l).applyMatrix4(o.matrixWorld);center.copy(a).add(b).add(c).multiplyScalar(1/3);
    if(box.containsPoint(center)&&Math.min(a.y,b.y,c.y)>.12){removedOverlap++;continue;}keep.push(j,k,l);
   }if(keep.length<count){const copy=g.clone();copy.setIndex(keep);copy.clearGroups();copy.computeBoundingBox();copy.computeBoundingSphere();o.geometry=copy;geometries.add(copy);}
  });}
 }
 function add(spec,g){
  const root=g.scene;collect(root);
  if(spec.openFront){const front=root.getObjectByName('wall_front');if(front)front.visible=false;}
  if(spec.hideHologram){const h=root.getObjectByName('hologram-projector_hologram_glow');if(h)h.visible=false;}
  root.traverse(o=>{
   const name=o.name??'';
   if(spec.id==='hangar'&&name==='blast_door')bones.push({id:'blast',o,axis:'y',base:o.position.y});
   if(spec.id==='hangar'&&name==='crane_bridge')bones.push({id:'crane',o,axis:'z',base:o.position.z});
   if(spec.id==='servers'&&name==='door')bones.push({id:'serverDoor',o,axis:'ry',base:o.rotation.y});
   if(spec.id==='servers'&&/^rack_A1_door$/.test(name))bones.push({id:'rack',o,axis:'ry',base:o.rotation.y});
   if(spec.id==='portal'&&/^(door_left|door_right)$/.test(name))bones.push({id:name,o,axis:'x',base:o.position.x});
   if(spec.id==='cleanroom-airlock'&&/^(door_front|door_back)$/.test(name))bones.push({id:name==='door_front'?'cleanroomFront':'cleanroomBack',o,axis:'x',base:o.position.x});
   if(spec.id==='gpu'&&/fan_\d+_rotor/.test(name))bones.push({id:'fan',o,axis:'ry',base:o.rotation.y});
  });
  const seen=new Set();root.traverse(o=>{if(!o.isMesh)return;o.receiveShadow=true;o.castShadow=spec.id==='quantum'||spec.id==='access-panel'||spec.id==='cable'||/crane|blast_door|rack_devices/.test(o.name);for(const m of Array.isArray(o.material)?o.material:[o.material]){if(seen.has(m))continue;seen.add(m);installIsolation(m,spec.id);if(m.color&&!/glass|light|glow|led|screen|holo/i.test(m.name??'')){m.color.multiply(new THREE.Color(spec.id==='servers'?0x72878a:spec.id==='quantum'?0xa2a7aa:0x9caeae));m.roughness=Math.max(m.roughness??.35,.34);}if(/led|glow/i.test(m.name??'')){m.emissive?.setHex(0x75c9a3);m.emissiveIntensity=Math.min(1.1,Math.max(.42,m.emissiveIntensity??1));leds.push({m,base:m.emissiveIntensity,phase:leds.length});}if(spec.id==='servers'||spec.id==='bridge'||spec.id==='portal'){const t=installDisplay(m,spec.id,textures,o);if(t)displays.push(spec.id);}}});
  const holder=new THREE.Group();holder.name='facility-'+spec.id;holder.add(root);
  if(spec.size){root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),scale=spec.size/Math.max(s.x,s.y,s.z);root.scale.multiplyScalar(scale);root.position.x-=c.x*scale;root.position.z-=c.z*scale;root.position.y-=b.min.y*scale;}else root.scale.multiplyScalar(spec.scale);
  holder.position.set(...spec.position);if(spec.mount==='server-roof'){const server=roots.get('servers');if(!server)throw Error('server roof unavailable');scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(server);holder.position.y=box.max.y;holder.position.z=(box.min.z+box.max.z)/2;}scene.add(holder);roots.set(spec.id,holder);if(spec.id==='servers')clearServerOverlap();renderer.shadowMap.needsUpdate=true;
 }
 // First render needs only the actual hangar. Subsequent geometry loads by distance
 // and narrative priority, with at most two concurrent model decodes.
 const fileFor=s=>initialMobile&&s.lowFile?s.lowFile:s.file;
 async function loadOne(spec){const g=await loader.loadAsync(base+fileFor(spec));if(disposed){collect(g.scene);for(const o of g.scene.children)o.removeFromParent();disposeCollected();return;}add(spec,g);}
 function pump(){if(disposed)return;const pos=cameraPose(last,mobile).position;const todo=facility.filter(s=>(!s.mount||roots.has('servers'))&&!roots.has(s.id)&&!pending.has(s.id)&&!failures.includes(s.id)).sort((a,b)=>score(a)-score(b));function score(s){return Math.hypot(s.position[0]-pos[0],s.position[2]-pos[2])+s.priority*2;}
 while(activeLoads<2&&todo.length){const s=todo.shift();pending.add(s.id);activeLoads++;loadOne(s).catch(e=>{failures.push(s.id);console.warn('Secondary facility asset unavailable',s.id,e);}).finally(()=>{activeLoads--;pending.delete(s.id);if(!disposed){if(roots.size===facility.length)timings.allAssetsMs=Math.round(performance.now()-startTime);draw(last);pump();}});}
 }
 try{await loadOne(facility[0]);if(debug){const {createMeshAudit}=await import('./meshAudit.js');audit=createMeshAudit();}}
 catch(e){dispose();throw e;}
 if(facilityHDRI&&cinema&&!initialMobile)new RGBELoader().loadAsync(base+facilityHDRI).then(t=>{if(disposed){t.dispose();return;}t.mapping=THREE.EquirectangularReflectionMapping;const next=pmrem.fromEquirectangular(t);t.dispose();const old=environment;environment=next;scene.environment=next.texture;scene.environmentIntensity=.30;environmentMode='hdr';old.dispose();draw(last);}).catch(e=>console.warn('HDRI unavailable; using studio reflections',e));
 if(cinema&&!initialMobile){try{const [{EffectComposer},{RenderPass},{GTAOPass},{UnrealBloomPass},{OutputPass}]=await Promise.all([import('three/addons/postprocessing/EffectComposer.js'),import('three/addons/postprocessing/RenderPass.js'),import('three/addons/postprocessing/GTAOPass.js'),import('three/addons/postprocessing/UnrealBloomPass.js'),import('three/addons/postprocessing/OutputPass.js')]);const composer=new EffectComposer(renderer);const ao=new GTAOPass(scene,camera,1,1);ao.updateGtaoMaterial({radius:.6,samples:8});ao.blendIntensity=.55;const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.16,.35,1.25);composer.addPass(new RenderPass(scene,camera));composer.addPass(ao);composer.addPass(bloom);composer.addPass(new OutputPass());effects=composer;}catch(e){console.warn('Cinema effects unavailable',e);}}
 function resize(){if(disposed)return;mobile=innerWidth<720;const dpr=Math.min(devicePixelRatio||1,mobile?1.15:1.5)*scaleFactor*(debug&&cinema?.70:1);renderer.setPixelRatio(dpr);renderer.setSize(innerWidth,innerHeight);effects?.setPixelRatio(dpr);effects?.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/Math.max(1,innerHeight);camera.updateProjectionMatrix();}
 function applyMotion(p,ambient=0){const motion=facilityMotion(p);
 for(const b of bones){if(b.id==='blast')b.o.position.y=b.base+7.1*motion.blast;else if(b.id==='crane')b.o.position.z=b.base+4.0*motion.crane;else if(b.id==='serverDoor')b.o.rotation.y=b.base-1.49*motion.serverDoor;else if(b.id==='rack')b.o.rotation.y=b.base-.32*motion.rack;else if(b.id==='door_left')b.o.position.x=b.base+1.04*motion.portal;else if(b.id==='door_right')b.o.position.x=b.base-1.04*motion.portal;else if(b.id==='cleanroomFront'||b.id==='cleanroomBack'){const z=cameraPose(p,mobile).position[2],doorZ=b.id==='cleanroomFront'?-.604:-3.796;const distance=Math.abs(z-doorZ);const opening=p>.85&&p<.92?1-THREE.MathUtils.smoothstep(distance,.85,1.7):0;b.o.position.x=b.base+1.17*opening;}else if(b.id==='fan')b.o.rotation.y=b.base+motion.fans;}
 for(const {m,base,phase} of leds)m.emissiveIntensity=base*(1+.06*Math.sin(ambient*1.4+phase*.8));
 quantumLight.intensity=50+35*motion.quantum;
 }
 function draw(p,ambient=0){if(disposed)return;const changed=p!==last;last=p;const pose=spatialEnabled?spatialPose(p,mobile):cameraPose(p,mobile);camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.fov=pose.fov;camera.updateProjectionMatrix();head.position.copy(camera.position);head.position.y+=.5;applyMotion(p,ambient);
 if(spatialEnabled){const {state,ambient:fill,global,fog}=environmentBlend(p);hemisphere.intensity=fill;key.intensity=1.05*global;hallA.intensity=90*global;hallB.intensity=85*global;scene.fog.density=fog;accent.intensity=state.focus?16*state.strength:0;accent.color.setHex(state.accent);if(state.focus){accent.position.set(...state.focus);accent.position.y+=1.3;}for(const {u,id} of isolationUniforms.values())u.value=state.roots.includes(id)?0:state.strength*.83;host.dataset.spatialPhase=state.phase;host.dataset.spatialEnvironment=state.name;host.dataset.isolation=String(state.strength);}
 const motion=facilityMotion(p),signature=[motion.blast,motion.crane].map(v=>Math.round(v*40)).join(':');if(signature!==shadowMotion){shadowMotion=signature;renderer.shadowMap.needsUpdate=true;}
 if(typography&&roots.size===facility.length){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const t=typography.update(p,camera,roots,mobile,innerWidth,innerHeight);host.dataset.surfaceTitle=t.name;host.dataset.surfaceAnchor=t.anchor;host.dataset.surfaceStyle=t.style??'';host.dataset.surfaceExtruded=String(!!t.extruded);host.dataset.surfaceReadable=String(t.readable);host.parentElement?.style.setProperty('--scene-sign-alpha',String(t.alpha??0));if(debug)host.dataset.surfaceDiagnostics=JSON.stringify(typography.diagnostics());}const before=performance.now();if(effects)effects.render();else renderer.render(scene,camera);
 const elapsed=performance.now()-before;if(!firstFrame){firstFrame=true;timings.firstFrameMs=Math.round(performance.now()-startTime);}
 host.dataset.spaceMode=spaceMode;host.dataset.pose=JSON.stringify(pose);host.dataset.progress=String(p);host.dataset.facility=[...roots.keys()].sort().join(',');host.dataset.assets=String(roots.size);host.dataset.authoredModels='0';host.dataset.mechanical=JSON.stringify(bones.map(b=>[b.id,b.o.position.x,b.o.position.y,b.o.position.z,b.o.rotation.y]));host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);host.dataset.displayCount=String(displays.length);host.dataset.failures=failures.join(',');host.dataset.lod=initialMobile?'mobile':'desktop';host.dataset.firstFrameMs=String(timings.firstFrameMs);host.dataset.allAssetsMs=String(timings.allAssetsMs??'');host.dataset.cpuRenderMs=String(elapsed);host.dataset.effects=effects?'cinema':'standard';host.dataset.environment=environmentMode;host.dataset.removedOverlap=String(removedOverlap);
 if(debug&&audit){scene.updateMatrixWorld(true);const c=audit.measure(roots.values(),camera.position);host.dataset.clearance=String(c.distance);host.dataset.nearest=c.object??'';}
 if(!debug&&changed&&elapsed>30&&scaleFactor>.8){scaleFactor=Math.max(.75,scaleFactor-.05);resize();}
 pump();
 }
 // Small independent ambient light animation, never drives camera; pause when hidden.
 function idle(ts){if(disposed)return;frame=requestAnimationFrame(idle);if(document.hidden||debug||!firstFrame||ts-previousTick<100)return;previousTick=ts;draw(last,ts/1000);}
 if(!debug)frame=requestAnimationFrame(idle);
 if(debug)host.inspectSpatialFrame=()=>{scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const ray=new THREE.Raycaster(),counts={};for(let y=-.8;y<=.81;y+=.2)for(let x=-.8;x<=.81;x+=.2){ray.setFromCamera(new THREE.Vector2(x,y),camera);const h=ray.intersectObjects([...roots.values()],true).find(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return true;});let id='background';if(h){for(let o=h.object;o;o=o.parent)if(o.name.startsWith('facility-')){id=o.name.slice(9);break;}}counts[id]=(counts[id]??0)+1;}return counts;};
 if(debug)host.inspectLayout=()=>{scene.updateMatrixWorld(true);return [...roots.entries()].map(([id,root])=>{const box=new THREE.Box3();root.traverseVisible(o=>{if(o.isMesh){o.geometry.computeBoundingBox();box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});return {id,min:box.min.toArray(),max:box.max.toArray()};});};
 if(debug)host.auditRoute=(steps=480)=>{if(roots.size!==facility.length)throw Error('wait for complete facility');const rows=[];const point=new THREE.Vector3();for(let i=0;i<=steps;i++){const p=i/steps;applyMotion(p);scene.updateMatrixWorld(true);point.set(...cameraPose(p,mobile).position);rows.push({p,position:point.toArray(),...audit.measure(roots.values(),point)});}draw(last);return rows;};
 function lost(e){e.preventDefault();onLost();}
 function disposeCollected(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}
 function dispose(){if(disposed)return;disposed=true;typography?.dispose();delete host.dataset.surfaceTitle;delete host.dataset.surfaceReadable;host.parentElement?.style.removeProperty('--scene-sign-alpha');cancelAnimationFrame(frame);delete host.auditRoute;delete host.inspectLayout;delete host.inspectSpatialFrame;renderer.domElement.removeEventListener('webglcontextlost',lost);disposeCollected();audit?.dispose();for(const p of effects?.passes??[])p.dispose?.();effects?.dispose();ktx.dispose();pmrem.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();}
 if(typographyMode!=='html')typography=createDiegeticTypography(scene,typographyMode,()=>{if(!disposed)draw(last);},spatialEnabled?spatialPose:cameraPose);host.dataset.typographyMode=typographyMode;
 renderer.domElement.id='three-scene';renderer.domElement.addEventListener('webglcontextlost',lost);host.insertBefore(renderer.domElement,host.querySelector('.veil'));return {resize,draw,dispose};
}
