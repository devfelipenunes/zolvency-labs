import * as THREE from 'three';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import {ramp} from './facilityCamera.js';
const definitions=[
 {name:'ORIGIN',root:'hangar',label:'ZOLVENCY',hold:.055,range:[0,.004,.08,.115],brand:true,hints:[[-.32,.23],[.05,.28],[.32,.23]]},
 {name:'BLOCKCHAIN',root:'servers',label:'BLOCKCHAIN',hold:.20,range:[.135,.17,.25,.29],hints:[[.43,.25],[-.43,.25],[.15,.45]]},
 {name:'STELLAR',root:'servers',label:'STELLAR',hold:.405,range:[.34,.38,.415,.445],hints:[[-.42,.26],[.42,.26],[0,.42]]},
 {name:'CRYPTOGRAPHY',root:'corridor',label:'CRYPTOGRAPHY',hold:.625,range:[.59,.615,.65,.68],hints:[[-.55,.25],[.55,.25],[0,.45]]},
 {name:'INTELLIGENCE',root:'bridge',label:'INTELLIGENCE',hold:.73,range:[.69,.715,.745,.755],hints:[[.38,.24],[-.38,.24],[0,.45]]},
 {name:'QUANTUM',root:'reactor-room',label:'QUANTUM',hold:.935,range:[.89,.91,.95,.965],hints:[[-.55,.22],[.55,.22],[-.3,.5]]},
 {name:'CONVERGENCE',root:'hangar',label:'ZOLVENCY',hold:.992,range:[.985,.99,1,1.01],brand:true,hints:[[-.32,.24],[.35,.24],[0,.4]]}
];
const vis=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const normal=h=>h.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize();
const V=a=>new THREE.Vector3(...a),up=new THREE.Vector3(0,1,0);
export function createSpatialBrand(scene,poseFor,onReady){
 let disposed=false,font=null,logo=null,aspect=0;const entries=new Map(),attempted=new Set(),ray=new THREE.Raycaster();
 const material=new THREE.MeshStandardMaterial({color:0x25da8d,metalness:.48,roughness:.32,emissive:0x0a5032,emissiveIntensity:.25});
 const letters=new THREE.MeshStandardMaterial({color:0xc4d6d5,metalness:.48,roughness:.42,emissive:0x152e2a,emissiveIntensity:.18});
 new FontLoader().loadAsync(import.meta.env.BASE_URL+'models/fonts/helvetiker_regular.typeface.json').then(f=>{if(!disposed){font=f;onReady();}}).catch(()=>{});
 new SVGLoader().loadAsync(import.meta.env.BASE_URL+'brand/zolvency.svg').then(data=>{if(disposed)return;logo=data.paths.flatMap(p=>SVGLoader.createShapes(p));onReady();}).catch(()=>{});
 function hit(origin,dir,objects,far=65){ray.set(origin,dir);ray.near=.002;ray.far=far;return ray.intersectObjects(objects,true).find(h=>vis(h.object)&&h.face);}
 function camAt(p,mobile,a){const pose=poseFor(p,mobile),cam=new THREE.PerspectiveCamera(pose.fov,a,.075,65);cam.position.copy(V(pose.position));cam.lookAt(V(pose.target));cam.updateProjectionMatrix();cam.updateMatrixWorld(true);return cam;}
 function surface(d,roots,mobile,a,ratio){
  const root=roots.get(d.root);if(!root||!root.visible)return null;const cam=camAt(d.hold,mobile,a),all=[...roots.values()],candidates=[];
  const hints=[...d.hints,...[-.66,-.42,-.18,.18,.42,.66].flatMap(x=>[-.15,.08,.3,.52].map(y=>[x,y]))];
  for(const [x,y] of hints){
   ray.setFromCamera(new THREE.Vector2(x,y),cam);ray.near=.1;ray.far=50;const h=ray.intersectObjects(all,true).find(h=>vis(h.object)&&h.face);if(!h)continue;
   let owner=h.object;while(owner&&owner!==root)owner=owner.parent;if(!owner)continue;
   const m=Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material;
   if(m?.transparent||/glass|door|light|glow|screen|crane|rotor/i.test(h.object.name+' '+m?.name))continue;
   const n=normal(h),facing=cam.position.clone().sub(h.point).normalize();if(n.dot(facing)<0)n.negate();if(Math.abs(n.y)>.22||n.dot(facing)<.48)continue;
   const right=up.clone().cross(n).normalize(),vertical=n.clone().cross(right);
   for(const width of [Math.min(d.brand?7:4,h.distance*a*.85),Math.min(d.brand?5:3,h.distance*a*.60),Math.min(d.brand?3.5:2,h.distance*a*.42),Math.min(1.6,h.distance*a*.27)]){
    if(width<.42)continue;const height=width/ratio,points=[h.point,...[-1,1].flatMap(i=>[-1,1].map(j=>h.point.clone().addScaledVector(right,i*width/2).addScaledVector(vertical,j*height/2)))];
    if(points.some(p=>{const h2=hit(p.clone().addScaledVector(n,.07),n.clone().negate(),[h.object],.15);return !h2||h2.point.distanceTo(p)>.045||Math.abs(normal(h2).dot(n))<.93;}))continue;
    const projected=points.map(p=>p.clone().project(cam));if(projected.some(p=>Math.abs(p.x)>.95||Math.abs(p.y)>.92))continue;
    if(points.some(p=>{const v=p.clone().addScaledVector(n,.035).sub(cam.position),length=v.length();return !!hit(cam.position,v.normalize(),all,length-.045);}))continue;
    const span=Math.max(...projected.map(p=>p.x))-Math.min(...projected.map(p=>p.x));if(span<(d.brand?.28:.19))continue;
    candidates.push({point:h.point.clone(),normal:n,right,vertical,width,height,root,mesh:h.object.name,score:span*n.dot(facing)*(1+Math.abs(x)*.18),span});break;
   }
  }return candidates.sort((a,b)=>b.score-a.score)[0]??null;
 }
 function build(d,roots,mobile,a){
  if(d.brand?!logo:!font)return;const geom=d.brand?new THREE.ExtrudeGeometry(logo,{depth:8,bevelEnabled:false}):new TextGeometry(d.label,{font,size:1,depth:.045,curveSegments:3,bevelEnabled:false});
  if(d.brand)geom.scale(1,-1,1);geom.computeBoundingBox();const size=geom.boundingBox.getSize(new THREE.Vector3()),ratio=size.x/size.y;
  const patch=surface(d,roots,mobile,a,ratio);attempted.add(d.name);if(!patch){geom.dispose();return;}
  const c=geom.boundingBox.getCenter(new THREE.Vector3());geom.translate(-c.x,-c.y,-geom.boundingBox.min.z);geom.scale(patch.width/size.x,patch.height/size.y,d.brand?.004:patch.width/size.x);
  const mesh=new THREE.Mesh(geom,d.brand?material:letters);mesh.name='architectural-lettering-'+d.name;mesh.position.copy(patch.point).addScaledVector(patch.normal,.018);mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(patch.right,patch.vertical,patch.normal));mesh.castShadow=true;mesh.receiveShadow=true;mesh.visible=false;scene.add(mesh);entries.set(d.name,{d,mesh,patch});
 }
 function clear(){for(const {mesh} of entries.values()){mesh.removeFromParent();mesh.geometry.dispose();}entries.clear();attempted.clear();}
 function update(p,roots,mobile,a,mask){
  if(Math.abs(aspect-a)>.1){clear();aspect=a;}
  const current=definitions.find(d=>p>=d.range[0]&&p<=d.range[3]);if(current&&!attempted.has(current.name)&&roots.get(current.root)?.visible)build(current,roots,mobile,a);
  let active=null;for(const e of entries.values()){const [s,b,c,z]=e.d.range;const amount=(s===0?1:ramp(p,s,b))*(z>1?1:1-ramp(p,c,z));e.mesh.visible=amount>.05&&e.patch.root.visible&&mask<.98;if(e.mesh.visible)active=e;}
  return active?{name:active.d.name,anchor:active.patch.mesh,brand:active.d.brand??false,point:active.patch.point.toArray(),width:active.patch.width,span:active.patch.span}:null;
 }
 function openingPose(p,pose,mobile,a){
  const e=entries.get('ORIGIN');if(!e||p>.08)return pose;const t=1-ramp(p,0,.08),target=V(pose.target).lerp(e.patch.point,t),distance=V(pose.position).distanceTo(e.patch.point),fov=THREE.MathUtils.radToDeg(2*Math.atan(e.patch.width/(Math.max(.4,a)*distance*1.6)));return {...pose,target:target.toArray(),fov:THREE.MathUtils.lerp(pose.fov,THREE.MathUtils.clamp(fov,18,pose.fov),t)};
 }
 return {update,openingPose,dispose(){disposed=true;clear();material.dispose();letters.dispose();},diagnostics(){return [...entries.values()].map(e=>({name:e.d.name,anchor:e.patch.mesh,width:e.patch.width,span:e.patch.span,point:e.patch.point.toArray()}));}};
}
