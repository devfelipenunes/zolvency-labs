import * as THREE from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import {stations,wrapWords,readability,titleReadability} from './typographyDirection.js';
import {cameraPose,ramp} from './facilityCamera.js';
import {chapters} from '../story.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const UP=V(0,1,0);
const visible=o=>{for(let n=o;n;n=n.parent)if(!n.visible)return false;return true;};
const stable=o=>{for(let n=o;n;n=n.parent)if(/(^|[_-])(door|rotor|crane|blast)([_-]|$)/i.test(n.name))return false;return true;};
const matOf=h=>Array.isArray(h.object.material)?h.object.material[h.face?.materialIndex??0]:h.object.material;
const normalOf=h=>h.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize();
const looksGlass=h=>/glass|window/i.test((matOf(h)?.name??'')+' '+h.object.name);
const isSupport=h=>h.face&&stable(h.object)&&!(/light|glow|emissive|led|holo/i.test(matOf(h)?.name??''));
const corners=(center,right,up,w,h)=>[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,y])=>center.clone().addScaledVector(right,x*w/2).addScaledVector(up,y*h/2));
function cameraAt(p,mobile,aspect,poseFn){
 const a=poseFn(p,mobile),cam=new THREE.PerspectiveCamera(a.fov,aspect,.075,65);
 cam.position.set(...a.position);cam.lookAt(...a.target);cam.updateMatrixWorld(true);cam.updateProjectionMatrix();return cam;
}
function pixelBox(points,camera,w,h){
 const a=points.map(p=>p.clone().project(camera));
 return {inside:a.every(p=>Math.abs(p.x)<.95&&Math.abs(p.y)<.91&&Math.abs(p.z)<1),width:(Math.max(...a.map(p=>p.x))-Math.min(...a.map(p=>p.x)))*w/2,height:(Math.max(...a.map(p=>p.y))-Math.min(...a.map(p=>p.y)))*h/2};
}
export function createDiegeticTypography(scene,mode,onReady,poseFn=cameraPose){
 const group=new THREE.Group();group.name='surface-editorial-signage';scene.add(group);
 const ray=new THREE.Raycaster(),entries=new Map(),diag=new Map();let font=null,disposed=false,lastSignature='',lastCheck=-1,lastResult={name:'',anchor:'',readable:false,alpha:0},builtAspect=0;
 // Local, versioned font staged from the pinned npm package. Failure leaves printed titles.
 new FontLoader().loadAsync(import.meta.env.BASE_URL+'models/fonts/helvetiker_regular.typeface.json').then(f=>{if(!disposed){font=f;lastSignature='';onReady?.();}}).catch(()=>{});
 function hit(origin,dir,roots,far=65){ray.set(origin,dir);ray.near=.001;ray.far=far;return ray.intersectObjects(roots,true).find(h=>visible(h.object));}
 function screenHit(cam,x,y,roots){ray.setFromCamera(new THREE.Vector2(x,y),cam);ray.near=.1;ray.far=35;return ray.intersectObjects(roots,true).find(h=>visible(h.object));}
 function supports(patch){
  const {point,normal,right,up,width,height,mesh}=patch;
  // Check the full rectangle against the same actual mesh, not merely its AABB.
  for(const pt of [point,...corners(point,right,up,width,height),...[-.5,0,.5].flatMap(x=>[-.5,.5].map(y=>point.clone().addScaledVector(right,x*width).addScaledVector(up,y*height)))]){
   const h=hit(pt.clone().addScaledVector(normal,.055),normal.clone().negate(),[mesh],.12);
   if(!h||h.object!==mesh||h.point.distanceTo(pt)>.035||Math.abs(normalOf(h).dot(normal))<.93)return false;
  }
  return true;
 }
 function find(station,roots,mobile,aspect,viewW,viewH){
  const cam=cameraAt(station.hold,mobile,aspect,poseFn),all=[...roots.values()],preferred=[station.root,...(station.name==='CRYPTOGRAPHY'?['portal']:station.name==='INTELLIGENCE'?['portal']:station.name==='QUANTUM'?['cleanroom-airlock']:[])].map(id=>roots.get(id)).filter(Boolean),options=[];
  if(!preferred.length)return null;
  const hints=[...station.hints,...[-.72,-.48,-.24,0,.24,.48,.72].flatMap(x=>[-.4,-.15,.1,.35,.58].map(y=>[x,y]))];
  for(const [x,y] of hints){
   const h=screenHit(cam,x,y,all);if(!h||!isSupport(h))continue;
   let parent=h.object;while(parent&&!preferred.includes(parent))parent=parent.parent;if(!parent)continue;
   const n=normalOf(h),toward=cam.position.clone().sub(h.point).normalize();if(n.dot(toward)<0)n.negate();if(n.dot(toward)<.48||Math.abs(n.y)>.35)continue;
   const right=UP.clone().cross(n).normalize(),up=n.clone().cross(right).normalize();
   const nominal=Math.min(5.2,Math.max(.40,h.distance*1.02*aspect*.8));
   for(const factor of [1,.82,.65,.5,.35,.24]){
    const width=nominal*factor,height=width/2.15,patch={point:h.point.clone(),normal:n,right,up,width,height,mesh:h.object};
    const pts=corners(patch.point,right,up,width,height),box=pixelBox(pts,cam,viewW,viewH);
    if(!box.inside||box.width<(mobile?135:175)||!supports(patch))continue;
    // Discard a patch before ranking if any corner is hidden by foreground geometry at its reading pose.
    if([patch.point,...pts].some(q=>{const v=q.clone().addScaledVector(n,.014).sub(cam.position),dist=v.length();return !!hit(cam.position,v.normalize(),all,Math.max(.001,dist-.035));}))continue;
    const style=mode==='panel'?'display':mode==='projection'?'projection':station.style;
    const name=(matOf(h)?.name??'')+' '+h.object.name;
    const match=style==='glass'?looksGlass(h):style==='display'?/screen|panel|console|rack/i.test(name):/wall|panel|bay|frame/i.test(name);
    options.push({...patch,style,score:box.width*(match?1.3:1)*n.dot(toward),name:h.object.name,material:matOf(h)?.name??''});break;
   }
  }
  return options.sort((a,b)=>b.score-a.score)[0]??null;
 }
 function renderSign(station,patch,chapter){
  const c=document.createElement('canvas');c.width=1536;c.height=714;const ctx=c.getContext('2d');
  const style=patch.style,solid=['display','plate'].includes(style);
  if(solid){ctx.fillStyle='#102328';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle=station.accent;ctx.lineWidth=3;ctx.strokeRect(8,8,c.width-16,c.height-16);}
  ctx.fillStyle=station.accent;ctx.font='500 35px monospace';ctx.fillText(station.sector,46,61);ctx.fillRect(46,85,132,4);
  const raised=style==='raised'&&font;
  ctx.font='600 108px Arial, sans-serif';const lines=wrapWords(chapter.title,s=>ctx.measureText(s).width,1444);ctx.fillStyle=style==='projection'?'#c2f7e5':'#f1f3ec';
  ctx.shadowColor=style==='projection'?'#52c8a8':'#061015';ctx.shadowBlur=solid?0:style==='projection'?18:7;
  if(!raised)lines.forEach((s,i)=>ctx.fillText(s,46,197+i*115));
  const titleCanvas=document.createElement('canvas');titleCanvas.width=c.width;titleCanvas.height=c.height;const tc=titleCanvas.getContext('2d');if(solid){tc.fillStyle='#102328';tc.fillRect(0,0,c.width,c.height);tc.strokeStyle=station.accent;tc.lineWidth=3;tc.strokeRect(8,8,c.width-16,c.height-16);}tc.fillStyle=station.accent;tc.font='500 48px monospace';tc.fillText(station.sector,46,76);tc.fillRect(46,102,132,4);let compact=174;let compactLines=[];do{tc.font='600 '+compact+'px Arial, sans-serif';compactLines=wrapWords(chapter.title,s=>tc.measureText(s).width,1444);if(compactLines.length<=3)break;compact-=8;}while(compact>100);if(!raised){tc.fillStyle='#f1f3ec';tc.shadowColor='#061015';tc.shadowBlur=7;compactLines.forEach((s,i)=>tc.fillText(s,46,132+compact+i*(compact+9)));}
  const titleTexture=new THREE.CanvasTexture(titleCanvas);titleTexture.colorSpace=THREE.SRGBColorSpace;titleTexture.anisotropy=4;
  const bodyTop=197+(lines.length-1)*115+74;
  let bodySize=52,body=[];
  do{ctx.font='500 '+bodySize+'px Arial, sans-serif';body=wrapWords(chapter.body,s=>ctx.measureText(s).width,1444);if(bodyTop+body.length*(bodySize+12)<=690)break;bodySize-=2;}while(bodySize>=30);
  ctx.fillStyle='#e0ede8';body.forEach((s,i)=>ctx.fillText(s,46,bodyTop+i*(bodySize+12)));ctx.shadowBlur=0;
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,depthTest:true,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(patch.width,patch.height),material);
  const anchor=new THREE.Group();anchor.name='sign-'+station.name;anchor.position.copy(patch.point).addScaledVector(patch.normal,.012);
  anchor.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(patch.right,patch.up,patch.normal));anchor.add(plane);
  const letters=[];
  if(raised){
   const m=new THREE.MeshStandardMaterial({color:0xe4eee7,metalness:.28,roughness:.48,emissive:0x93bba4,emissiveIntensity:.25,transparent:true,opacity:0});
   for(const [i,line] of lines.entries()){
    const g=new TextGeometry(line,{font,size:1,depth:.028,curveSegments:4,bevelEnabled:false});g.computeBoundingBox();const size=g.boundingBox.getSize(V());const scale=Math.min(patch.width*.94/size.x,patch.height*.15/size.y);g.translate(-g.boundingBox.min.x,-g.boundingBox.min.y,0);g.scale(scale,scale,scale);
    const mesh=new THREE.Mesh(g,m);mesh.position.set(-patch.width/2+patch.width*46/1536,patch.height/2-patch.height*(197+i*115)/714,.008);anchor.add(mesh);letters.push(mesh);
   }
  }
  group.add(anchor);anchor.visible=false;return {anchor,plane,material,texture,titleTexture,letters,patch,station,titlePx:108/714,compactPx:(raised?108:compact)/714,bodyPx:bodySize/714};
 }
 function clear(){for(const e of entries.values()){e.anchor.removeFromParent();e.plane.geometry.dispose();e.material.dispose();e.texture.dispose();e.titleTexture.dispose();for(const l of e.letters)l.geometry.dispose();e.letters[0]?.material.dispose();}entries.clear();diag.clear();}
 function rebuild(roots,mobile,camera,w,h){
  const signature=[...roots.keys()].sort().join(',')+'|'+mobile+'|'+Boolean(font)+'|'+w+'x'+h;
  if(signature===lastSignature&&Math.abs(camera.aspect-builtAspect)<.08)return;
  lastSignature=signature;builtAspect=camera.aspect;clear();
  for(const [i,s] of stations.entries()){const p=find(s,roots,mobile,camera.aspect,w,h);if(p){entries.set(s.name,renderSign(s,p,chapters[i]));diag.set(s.name,{mesh:p.name,material:p.material,style:p.style,position:p.point.toArray(),normal:p.normal.toArray(),size:[p.width,p.height],extruded:!!(p.style==='raised'&&font)});}else diag.set(s.name,{reason:'no verified visible support'});}
  scene.updateMatrixWorld(true);lastCheck=-1;
 }
 return {
  update(progress,camera,roots,mobile,w,h){
   if(disposed)return lastResult;
   rebuild(roots,mobile,camera,w,h);
   if(Math.abs(lastCheck-progress)<.0015&&lastCheck>=0)return lastResult;
   lastCheck=progress;let result={name:'',anchor:'',readable:false,alpha:0};const all=[...roots.values()];
   for(const e of entries.values()){
    const [a,b,c,d]=e.station.range,alpha=ramp(progress,a,b)*(1-ramp(progress,c,d));e.anchor.visible=false;
    if(alpha<.03)continue;
    const p=e.patch,pts=corners(e.anchor.position,p.right,p.up,p.width,p.height),box=pixelBox(pts,camera,w,h);
    let clear=box.inside;
    if(clear)for(const q of [e.anchor.position,...pts]){
     const dir=q.clone().sub(camera.position),dist=dir.length();if(hit(camera.position,dir.normalize(),all,Math.max(.001,dist-.025))){clear=false;break;}
    }
    const legibility={...box,clear,titlePx:box.height*e.titlePx,bodyPx:box.height*e.bodyPx};
    const readable=readability(legibility),titleOk=titleReadability({...legibility,titlePx:box.height*e.compactPx,mobile});
    e.anchor.visible=titleOk;e.material.opacity=alpha;for(const l of e.letters)l.material.opacity=alpha;
    const selected=readable?e.texture:e.titleTexture;if(e.material.map!==selected){e.material.map=selected;e.material.needsUpdate=true;}
    if(e.anchor.visible)result={name:e.station.name,anchor:p.name,style:p.style,readable,alpha,projected:box,extruded:e.letters.length>0};
   }
   lastResult=result;return result;
  },
  diagnostics(){return Object.fromEntries(diag);},
  dispose(){disposed=true;clear();group.removeFromParent();}
 };
}
