import * as THREE from 'three';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import {ramp} from './facilityCamera.js';
// Editorial titles occupy a virtual stage in world space, not a wall or a camera-attached HUD.
export const cues=[
 {name:'ORIGIN',label:'ZOLVENCY',hold:.035,range:[0,.001,.061,.112],x:0,y:.19,span:.72,brand:true},
 {name:'BLOCKCHAIN',label:'BLOCKCHAIN',hold:.205,range:[.14,.175,.246,.29],x:-.25,y:.31,span:.46},
 {name:'STELLAR',label:'STELLAR',hold:.405,range:[.365,.39,.415,.445],x:.23,y:.31,span:.44},
 {name:'CRYPTOGRAPHY',label:'CRYPTOGRAPHY',hold:.625,range:[.59,.61,.646,.68],x:-.12,y:.33,span:.52},
 {name:'INTELLIGENCE',label:'INTELLIGENCE',hold:.73,range:[.695,.714,.745,.755],x:.16,y:.32,span:.5},
 {name:'QUANTUM',label:'QUANTUM',hold:.935,range:[.89,.915,.95,.965],x:-.26,y:.27,span:.36},
 {name:'CONVERGENCE',label:'ZOLVENCY',hold:.992,range:[.985,.99,1,1.01],x:0,y:.23,span:.65,brand:true}
];
const visible=o=>{for(let n=o;n;n=n.parent)if(!n.visible)return false;return true;};
const v=a=>new THREE.Vector3(...a);
export function cueEnvelope(d,p){const [s,a,b,z]=d.range;return (s===0?1:ramp(p,s,a))*(z>1?1:1-ramp(p,b,z));}
export function createKineticTitles(scene,rail,onReady){
 let logo=null,font=null,disposed=false,aspect=0;const entries=new Map(),attempted=new Set(),ray=new THREE.Raycaster();
 new FontLoader().loadAsync(import.meta.env.BASE_URL+'models/fonts/helvetiker_regular.typeface.json').then(f=>{if(!disposed){font=f;onReady();}}).catch(()=>{});
 new SVGLoader().loadAsync(import.meta.env.BASE_URL+'brand/zolvency.svg').then(data=>{if(!disposed){logo=data.paths.flatMap(p=>SVGLoader.createShapes(p));onReady();}}).catch(()=>{});
 function cameraAt(d,mobile,a){const p=rail(d.hold,mobile),c=new THREE.PerspectiveCamera(p.fov,a,.075,65);c.position.copy(v(p.position));c.lookAt(v(p.target));c.updateProjectionMatrix();c.updateMatrixWorld(true);return c;}
 function blocked(cam,point,roots){const dir=point.clone().sub(cam.position),len=dir.length();ray.set(cam.position,dir.normalize());ray.near=.08;ray.far=Math.max(.081,len-.12);return ray.intersectObjects(roots,true).some(h=>visible(h.object)&&!h.object.material?.transparent);}
 function build(d,roots,mobile,a){
  if(d.brand?!logo:!font)return;
  const geom=d.brand?new THREE.ExtrudeGeometry(logo,{depth:16,bevelEnabled:false}):new TextGeometry(d.label,{font,size:1,depth:.09,curveSegments:5,bevelEnabled:false});
  if(d.brand)geom.scale(1,-1,1);geom.computeBoundingBox();const size=geom.boundingBox.getSize(new THREE.Vector3()),center=geom.boundingBox.getCenter(new THREE.Vector3());geom.translate(-center.x,-center.y,-center.z);
  const cam=cameraAt(d,mobile,a),all=[...roots.values()],dir=new THREE.Vector3();cam.getWorldDirection(dir);const right=new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,1);let patch=null;
  for(const distance of [d.brand?3.8:2.6,1.8,1.1,.65]){
   const halfH=distance*Math.tan(THREE.MathUtils.degToRad(cam.fov/2)),halfW=halfH*a;
   const width=Math.min(2*halfW*d.span,2*halfH*.24*(size.x/size.y)),height=width*size.y/size.x;
   const point=cam.position.clone().addScaledVector(dir,distance).addScaledVector(right,d.x*halfW).addScaledVector(up,d.y*halfH);
   const corners=[point,...[-1,1].flatMap(i=>[-1,1].map(j=>point.clone().addScaledVector(right,i*width/2).addScaledVector(up,j*height/2)))];
   if(corners.some(q=>blocked(cam,q,all)))continue;
   patch={point,right,up,dir,width,distance};break;
  }
  attempted.add(d.name);if(!patch){geom.dispose();return;}
  geom.scale(patch.width/size.x,patch.width/size.x,d.brand?patch.width*.015/size.z:patch.width*.035/size.z);
  const material=new THREE.MeshStandardMaterial({color:d.brand?0x25da8d:0xc7e5df,metalness:d.brand?.56:.25,roughness:.38,emissive:d.brand?0x167448:0x426761,emissiveIntensity:d.brand?.85:.64,transparent:true,opacity:0,depthWrite:false});
  const mesh=new THREE.Mesh(geom,material);mesh.name='kinetic-'+d.name;mesh.quaternion.copy(cam.quaternion);mesh.visible=false;scene.add(mesh);entries.set(d.name,{d,mesh,patch,rotation:cam.quaternion.clone()});
 }
 function clear(){for(const {mesh} of entries.values()){mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();}entries.clear();attempted.clear();}
 function update(p,roots,mobile,a,mask,ambient=0){
  if(Math.abs(a-aspect)>.1){clear();aspect=a;}
  const current=cues.find(d=>p>=d.range[0]&&p<=d.range[3]);
  if(current&&!attempted.has(current.name)&&roots.size>=1)build(current,roots,mobile,a);
  let active=null;for(const e of entries.values()){
   const {d,mesh,patch}=e,[s,b,c,z]=d.range,t=ramp(p,s,z),alpha=cueEnvelope(d,p)*(1-mask);
   mesh.visible=alpha>.025;mesh.material.opacity=alpha;
   const reveal=d.name==='ORIGIN'?ramp(p,0,.10):t;
   mesh.position.copy(patch.point).addScaledVector(patch.right,(d.name==='ORIGIN'?-1:1)*(reveal-.35)*patch.width*.19).addScaledVector(patch.up,(1-alpha)*patch.width*.10);
   mesh.quaternion.copy(e.rotation).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),(reveal-.5)*.28));
   mesh.scale.setScalar(d.name==='ORIGIN'?1.24-.44*reveal:.92+.08*alpha);
   if(mesh.visible)active=e;
  }
  return active?{name:active.d.name,anchor:'world-space',brand:!!active.d.brand,point:active.mesh.position.toArray(),width:active.patch.width,span:active.d.span}:null;
 }
 function openingPose(p,pose){const e=entries.get('ORIGIN');if(!e||p>.075)return pose;const t=1-ramp(p,0,.075);return {...pose,target:v(pose.target).lerp(e.patch.point,t*.85).toArray(),fov:pose.fov*(1-.15*t)};}
 return {update,openingPose,dispose(){disposed=true;clear();},diagnostics(){return [...entries.values()].map(e=>({name:e.d.name,anchor:'world-space',width:e.patch.width,span:e.d.span,point:e.patch.point.toArray()}));}};
}
