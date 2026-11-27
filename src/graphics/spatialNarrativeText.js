import * as THREE from 'three';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {ramp,windows} from './facilityCamera.js';
import {backlogModes,backlogLayout,stagedCopy} from './backlogStudy.js';
import {brandPlane,isStudy,studyModes} from './compositionStudy.js';
import {brandSurfaces,artEnvelope} from './artDirection.js';
import {shotCards,shotAnimation,shotLayout} from './shotCards.js';
import {flowTypeEnvelope} from './flowTypeEnvelope.js';
import {livingCopy,selectedCopy} from './livingCopy.js';
import {motion as livingMotion} from './livingTypeMotion.js';
import {glyphPhase,glyphTransform} from './glyphChoreography.js';
import {createGlyphRig} from './glyphRig.js';
import {layoutCandidates,directedBodyPhase} from './directedTypeLayout.js';
import {createContinuousTitle,transitionWindows} from './continuousTitle.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
// All visible narrative text is triangulated, extruded glyph geometry, including body copy.
// One merged mesh per role keeps draw calls low. The editorial rig follows the shot,
// with controlled perspective, depth and rotation; it is not a physical wall sign.
export function createSpatialNarrativeText(scene,onReady,{rail=null,world=false,art=false,composition='default',brandOnly=false,reusePlacement=false,flow3d=false,livingType=false,glyphType=false,architectureType=false,selectedType=false,curvedType=false,spaceFont=false,gpuType=false,contactType=false,worldAll=false,continuousType=false,continuousAll=false,corridorType=false,auditCorridor=false,clearanceType=false,bridgeGpu=false,cinematicType=false,directedLayout=false,typeFinish='mineral',holdPose=null}={}){
 let font=null,titleFont=null,bodyFont=null,logo=null,disposed=false,aspect=0,active=null,layoutMobile=null,builds=0,placementResets=0;const entries=new Map(),ray=new THREE.Raycaster();let continuous=[];
 if(!brandOnly)new FontLoader().loadAsync(import.meta.env.BASE_URL+'models/fonts/helvetiker_regular.typeface.json').then(f=>{if(!disposed){font=f;onReady();}}).catch(()=>{});
 if(spaceFont)for(const weight of [400,600])new FontLoader().loadAsync(import.meta.env.BASE_URL+'models/fonts/space-grotesk-'+weight+'.typeface.json').then(f=>{if(!disposed){if(weight===600)titleFont=f;else bodyFont=f;onReady();}}).catch(()=>{if(!disposed){if(weight===600)titleFont=font;else bodyFont=font;onReady();}});
 new SVGLoader().loadAsync(import.meta.env.BASE_URL+'brand/zolvency.svg').then(d=>{if(!disposed){logo=d.paths.flatMap(p=>SVGLoader.createShapes(p));onReady();}}).catch(()=>{});
 function width(s,f=font){let x=0,prev='';for(const c of s){x+=((f.data.glyphs[c]?.ha??f.data.glyphs['?']?.ha??600)+(f.data.kerning?.[prev+c]??0))/f.data.resolution;prev=c;}return x;}
 function wrap(s,size,max=.98,f=font){const out=[];let line='';for(const word of s.split(' ')){const next=line?line+' '+word:word;if(line&&width(next,f)*size>max){out.push(line);line=word;}else line=next;}if(line)out.push(line);return out;}
 function lineGeo(text,size,x,y,align='left',depth=.045){
  const g=new TextGeometry(text,{font,size,depth:size*depth,curveSegments:2,bevelEnabled:false});g.computeBoundingBox();const b=g.boundingBox;g.translate(x-(align==='center'?(b.min.x+b.max.x)/2:b.min.x),y-b.max.y,0);return g;
 }
 function meshFor(gs,color,lit=false){
  const geometry=mergeGeometries(gs,false);for(const g of gs)g.dispose();if(!geometry)throw Error('glyph geometry merge failed');geometry.computeBoundingBox();
  const material=lit||world?new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:lit?.58:.85,metalness:lit?.25:.05,roughness:.44,transparent:true,depthWrite:false}):new THREE.MeshBasicMaterial({color,transparent:true,depthWrite:false,toneMapped:false});
  return new THREE.Mesh(geometry,material);
 }
 // Unified spatial title for mobile: actual extruded glyphs, one coordinated group.
 // The group follows the authored camera rail at a bounded depth, rather than
 // claiming an architectural wall attachment. Depth testing remains enabled.
 function flowMesh(gs,color){
  const geometry=mergeGeometries(gs,false);for(const g of gs)g.dispose();if(!geometry)throw Error('flow glyph merge failed');
  geometry.computeBoundingBox();const n=geometry.attributes.normal,colors=new Float32Array(n.count*3),c=new THREE.Color(color);
  for(let i=0;i<n.count;i++){const shade=Math.abs(n.getZ(i))>.8?1:.52;colors[i*3]=c.r*shade;colors[i*3+1]=c.g*shade;colors[i*3+2]=c.b*shade;}
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  return new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthTest:true,depthWrite:false,toneMapped:false}));
 }
 // Experimental bevelled word rig. Real glyph meshes, one body mesh and
 // independently animated title words. Shared deterministic camera progress;
 // no runtime physics, extra lights, timers or scroll interception.
 const cards=livingType?shotCards.map((card,i)=>({...card,title:livingCopy[i].title,body:(selectedType?selectedCopy:livingCopy)[i].body,livingId:livingCopy[i].id})):shotCards;
 function livingGeo(text,size,depth,bevel){
  const g=new TextGeometry(text,{font,size,depth:size*depth,curveSegments:3,bevelEnabled:bevel>0,bevelThickness:size*bevel,bevelSize:size*bevel,bevelSegments:1});g.computeBoundingBox();return g;
 }
 function buildLiving(card){
  if(!font||(card.brand&&!logo))return null;
  builds++;const group=new THREE.Group();group.name='living-type-'+card.livingId;group.visible=false;let cursor=0;
  const titleSize=.138,bodySize=.076,max=.99,titleLines=wrap(card.title,titleSize,max),bodyLines=wrap(card.body,bodySize,max);
  if(card.brand){const g=new THREE.ExtrudeGeometry(logo,{depth:12,bevelEnabled:false,curveSegments:2});g.scale(1,-1,1);g.computeBoundingBox();const b=g.boundingBox,sz=b.getSize(V());g.translate(-b.min.x,-b.max.y,-b.getCenter(V()).z);g.scale(.71/sz.x,.71/sz.x,.022/Math.max(.001,sz.z));g.translate(-.49,0,0);const mark=flowMesh([g],0x65d8aa);mark.name='hero';group.add(mark);cursor-=sz.y*.71/sz.x+.05;}
  const words=[];for(const line of titleLines){let x=-.49;for(const word of line.split(' ')){
    const g=livingGeo(word,titleSize,.10,.012),b=g.boundingBox.clone(),center=b.getCenter(V());g.translate(-center.x,-center.y,-center.z);
    const m=flowMesh([g],0xe6efea);m.name='headline';m.position.set(x+center.x-b.min.x,cursor+center.y-b.max.y,0);m.userData.word=word;group.add(m);words.push(m);x+=width(word+' ')*titleSize;
   }cursor-=titleSize*1.14;}
  cursor-=.027;const gs=[];for(const line of bodyLines){const g=livingGeo(line,bodySize,.07,0),b=g.boundingBox;g.translate(-.49-b.min.x,cursor-b.max.y,0);gs.push(g);cursor-=bodySize*1.30;}
  const body=flowMesh(gs,0xc2d9d1);body.name='body';group.add(body);
  group.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(group),center=box.getCenter(V()),size=box.getSize(V());
  for(const m of group.children){m.position.sub(center);m.userData.rest=m.position.clone();}
  scene.add(group);const e={card,group,titleLines,bodyLines,words,body,roles:[...new Set(group.children.map(m=>m.name))],height:size.y,width:size.x};entries.set(card.name,e);return e;
 }
 function buildGlyphs(card){
  if(!font||(spaceFont&&(!titleFont||!bodyFont))||(card.brand&&!logo))return null;
  builds++;const group=new THREE.Group();group.name='glyph-type-'+card.livingId;group.visible=false;let cursor=0;const titleSize=.138,bodySize=directedLayout?.060:selectedType?.053:.076;
  const tf=spaceFont?titleFont:font,bf=spaceFont?bodyFont:font;const titleLines=wrap(card.title,titleSize,.99,tf),bodyLines=wrap(card.body,bodySize,.99,bf);
  let mark=null;if(card.brand){const g=new THREE.ExtrudeGeometry(logo,{depth:12,bevelEnabled:false,curveSegments:2});g.scale(1,-1,1);g.computeBoundingBox();const b=g.boundingBox,sz=b.getSize(V());g.translate(-b.min.x,-b.max.y,-b.getCenter(V()).z);g.scale(.71/sz.x,.71/sz.x,.022/Math.max(.001,sz.z));g.translate(-.49,0,0);mark=flowMesh([g],0x65d8aa);mark.name='hero';mark.material.transparent=false;mark.material.depthWrite=true;group.add(mark);cursor-=sz.y*.71/sz.x+.05;}
  const headline=createGlyphRig({font:tf,lines:titleLines,size:titleSize,x:-.49,y:cursor,step:titleSize*1.14,depth:selectedType?.13:architectureType?.19:.13,bevel:selectedType?.012:architectureType?.022:.014,color:0xe6efea,role:'headline',finish:architectureType?typeFinish:'control',curved:curvedType,gpu:gpuType,contact:contactType});group.add(headline);
  cursor-=titleLines.length*titleSize*1.14+(selectedType?.044:.027);
  const body=createGlyphRig({font:bf,lines:bodyLines,size:bodySize,x:-.49,y:cursor,step:bodySize*1.30,depth:.08,bevel:0,color:0xc2d9d1,role:'body',finish:architectureType?'mineral':'control',curved:curvedType,gpu:gpuType,contact:contactType,directedBody:directedLayout});group.add(body);
  group.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(group),center=box.getCenter(V()),size=box.getSize(V());
  for(const m of group.children){m.position.sub(center);m.userData.rest=m.position.clone();}
  scene.add(group);const e={card,group,titleLines,bodyLines,headline,body,mark,roles:group.children.map(m=>m.name),height:size.y,width:size.x};entries.set(card.name,e);return e;
 }
 // Sample fixed free-space planes against actual visible facility geometry.
 function auditionArchitecture(e,mobile,a,roots){
  if(!holdPose||!roots?.size)return null;
  const pose=holdPose(e.card.hold,mobile),cam=new THREE.PerspectiveCamera(pose.fov,a,.075,65);
  cam.position.fromArray(pose.position);cam.lookAt(...pose.target);cam.updateMatrixWorld(true);
  const f=cam.getWorldDirection(V()),r=V(1,0,0).applyQuaternion(cam.quaternion),u=V(0,1,0).applyQuaternion(cam.quaternion);
  const all=[...roots.values()].filter(o=>o.visible);if(!all.length)return null;for(const root of all)root.updateMatrixWorld(true);
  const candidates=[];
  for(const layout of directedLayout?layoutCandidates(cards.indexOf(e.card)):[{x:0,y:-.46}])for(const depth of [2.4,1.8,1.35,1.0,.72]){
   const hh=depth*Math.tan(THREE.MathUtils.degToRad(cam.fov)/2),hw=hh*a;
   const scale=Math.min(2*hw*.88/Math.max(.001,e.width),2*hh*.35/Math.max(.001,e.height));
   const point=cam.position.clone().addScaledVector(f,depth).addScaledVector(r,layout.x*hw).addScaledVector(u,layout.y*hh);
   let clear=0,total=0;for(const x of [-.5,-.25,0,.25,.5])for(const y of [-.5,0,.5]){
    const q=point.clone().addScaledVector(r,x*e.width*scale).addScaledVector(u,y*e.height*scale);total++;if(!isBlocked(cam.position,q,all))clear++;
   }candidates.push({depth,point,rotation:cam.quaternion.clone(),scale,hw,hh,clear,total,layout});
  }
  e.architectureAudit=candidates.map(c=>({depth:c.depth,clear:c.clear,total:c.total,layout:c.layout}));
  return candidates.find(c=>c.clear===c.total)??null;
 }
 function updateGlyphFlow(p,camera,a,mask,mobile,roots){
  const phase=glyphPhase(p),card=cards[phase.index];for(const e of entries.values())e.group.visible=false;active=entries.get(card.name)??null;
  if(!active)return {ready:false,visible:false,shot:card.name,roles:[],alpha:0,copyVisible:false};
  const {group,headline,body,mark}=active,depth=.50;let halfH=depth*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),halfW=halfH*a;
  camera.updateMatrixWorld(true);const forward=camera.getWorldDirection(V()),up=V(0,1,0).applyQuaternion(camera.quaternion);
  let scale=Math.min(2*halfW*.88/Math.max(.001,active.width),2*halfH*.35/Math.max(.001,active.height));
  const audition=architectureType&&(worldAll||[1,2].includes(phase.index));
  if(audition&&phase.kind==='hold'&&Math.abs(p-card.hold)<.004&&active.architectureKey!==a.toFixed(3)+'|'+roots.size){
   active.architectureKey=a.toFixed(3)+'|'+roots.size;active.architectureAnchor=auditionArchitecture(active,mobile,a,roots);
  }
  const anchor=audition?active.architectureAnchor:null;
  if(anchor){group.position.copy(anchor.point);group.quaternion.copy(anchor.rotation);scale=anchor.scale;halfW=anchor.hw;halfH=anchor.hh;}
  else{group.position.copy(camera.position).addScaledVector(forward,depth).addScaledVector(up,-.46*halfH);group.quaternion.copy(camera.quaternion);}
  group.scale.setScalar(scale);group.visible=mask<.98;
  for(const m of [headline,body]){m.visible=group.visible;m.userData.glyphRig.update(phase.index,directedLayout&&m===body?directedBodyPhase(p,phase.index):phase,halfW/scale,halfH/scale);}
  if(mark){const v=glyphTransform(phase.index,0,1,phase);mark.position.copy(mark.userData.rest);
   // Origin logo is already present at opening; moves out with the other letters.
   if(phase.index!==0||phase.kind==='exit'){mark.position.x+=v[0]*halfW/scale;mark.position.y+=v[1]*halfH/scale;mark.position.z+=v[2]*halfH/scale;mark.rotation.y=v[4];}else mark.rotation.y=0;mark.visible=group.visible;}
  group.updateMatrixWorld(true);
  let currentBridge=null;const auditRoots=auditCorridor?[...roots.values()].filter(o=>o.visible):null;if(auditRoots)for(const root of auditRoots)root.updateMatrixWorld(true);const blocked=auditRoots?q=>isBlocked(camera.position,q,auditRoots):null;for(const bridge of continuous){if(bridge.update(p,mask,camera,blocked))currentBridge=bridge;}const bridging=!!currentBridge;if(bridging)headline.visible=false;
  return {ready:true,visible:group.visible,shot:card.name,roles:bridging?active.roles.filter(r=>r!=='headline').concat('continuous-title'):active.roles,alpha:group.visible?1:0,focus:card.focus,intent:card.intent,bodyLines:active.bodyLines.length,copyVisible:group.visible,transition:currentBridge?.diagnostics()??{active:false,index:null,items:[]},transitionCount:continuous.length,bodyPhase:directedLayout?directedBodyPhase(p,phase.index):phase};
 }
 function buildFlow(card,mobile){
  if(glyphType)return buildGlyphs(card);
  if(livingType)return buildLiving(card);
  if(!font||(card.brand&&!logo))return null;
  builds++;const group=new THREE.Group();group.name='flow-type-'+card.name;group.visible=false;let cursor=0;
  if(card.brand){const g=new THREE.ExtrudeGeometry(logo,{depth:12,bevelEnabled:false,curveSegments:2});g.scale(1,-1,1);g.computeBoundingBox();const b=g.boundingBox,sz=b.getSize(V());g.translate(-b.min.x,-b.max.y,-b.getCenter(V()).z);g.scale(.86/sz.x,.86/sz.x,.023/Math.max(.001,sz.z));g.translate(-.49,0,0);const mark=flowMesh([g],0x65d8aa);mark.name='hero';group.add(mark);cursor-=sz.y*.86/sz.x+.045;}
  const titleSize=.105,bodySize=.064,titleLines=wrap(card.title,titleSize,.98),titleGeos=[];
  for(const line of titleLines){titleGeos.push(lineGeo(line,titleSize,-.49,cursor,'left',.18));cursor-=titleSize*1.15;}
  const heading=flowMesh(titleGeos,0xe7f0ec);heading.name='headline';group.add(heading);cursor-=.023;
  const bodyLines=wrap(card.body,bodySize,.98),bodyGeos=[];for(const line of bodyLines){bodyGeos.push(lineGeo(line,bodySize,-.49,cursor,'left',.12));cursor-=bodySize*1.35;}
  const body=flowMesh(bodyGeos,0xc1d9d0);body.name='body';group.add(body);
  group.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(group),center=box.getCenter(V()),size=box.getSize(V());
  for(const m of group.children)m.position.sub(center);
  scene.add(group);const e={card,group,titleLines,bodyLines,roles:group.children.map(m=>m.name),height:size.y,width:size.x};entries.set(card.name,e);return e;
 }
 function prebuild(mobile){if(!flow3d)return;if(layoutMobile!==mobile){clear();layoutMobile=mobile;}for(const card of cards)if(!entries.has(card.name))buildFlow(card,mobile);if(continuousType&&!continuous.length&&entries.size===cards.length){for(const w of transitionWindows){if(continuousAll||w.index===1)continuous.push(createContinuousTitle(entries.get(cards[w.index].name),entries.get(cards[w.index+1].name),scene,w.index,{corridor:corridorType,poseAt:p=>holdPose(p,mobile),audit:auditCorridor,clearance:clearanceType,gpuBridge:bridgeGpu,cinematic:cinematicType}));}}}
 function updateFlow(p,camera,mobile,a,mask,roots){
  if(layoutMobile!==mobile||entries.size!==cards.length)prebuild(mobile);
  if(glyphType)return updateGlyphFlow(p,camera,a,mask,mobile,roots);
  const anim=flowTypeEnvelope(p,mask),card=cards[anim.index];for(const e of entries.values())e.group.visible=false;active=entries.get(card.name)??null;
  if(!active)return {ready:false,visible:false,shot:card.name,roles:[],alpha:0,copyVisible:false};
  const {group}=active,depth=.46+.06*(1-anim.enter),halfH=depth*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2),halfW=halfH*a;
  camera.updateMatrixWorld(true);const forward=camera.getWorldDirection(V()),right=V(1,0,0).applyQuaternion(camera.quaternion),up=V(0,1,0).applyQuaternion(camera.quaternion);
  const scale=Math.min(2*halfW*(livingType?.88:.84)/Math.max(.001,active.width),2*halfH*(livingType?.35:.28)/Math.max(.001,active.height));
  const y=-.54-anim.drift;group.position.copy(camera.position).addScaledVector(forward,depth).addScaledVector(right,0).addScaledVector(up,y*halfH);
  group.quaternion.copy(camera.quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(V(0,1,0),.11*(1-anim.enter)+.035));
  group.scale.setScalar(scale);group.visible=anim.alpha>.012;
  for(const m of group.children){m.visible=group.visible;m.material.opacity=anim.alpha;}
  if(livingType){
   const phase=Math.min(anim.enter,anim.exit),n=active.words.length;
   for(let i=0;i<n;i++){const m=active.words[i],v=livingMotion(card.livingId,i,n,phase);m.position.copy(m.userData.rest);m.position.x+=v[0]*.138;m.position.y+=v[1]*.138;m.position.z+=v[2]*.138;m.rotation.z=v[3];}
   const b=active.body,v=livingMotion(card.livingId,0,1,phase);b.position.copy(b.userData.rest);b.position.x+=v[0]*.035;b.position.y+=v[1]*.035;b.position.z+=v[2]*.035;b.material.opacity=anim.alpha*ramp(phase,.15,.70);b.visible=group.visible&&b.material.opacity>.012;
  }
  group.updateMatrixWorld(true);return {ready:true,visible:group.visible,shot:card.name,roles:active.roles,alpha:anim.alpha,focus:card.focus,intent:card.intent,bodyLines:active.bodyLines.length,copyVisible:group.visible};
 }
 function build(card,mobile){
  if((!brandOnly&&!font)||(card.brand&&!logo)||brandOnly&&!card.brand)return null;
  builds++;const group=new THREE.Group();group.name='narrative-'+card.name;group.visible=false;const align=card.brand?'center':'left',x=align==='center'?0:-.5;
  const hero=card.brand?new THREE.ExtrudeGeometry(logo,{depth:12,bevelEnabled:false}):new TextGeometry(card.hero,{font,size:1,depth:.07,curveSegments:4,bevelEnabled:false});
  if(card.brand)hero.scale(1,-1,1);hero.computeBoundingBox();const hs=hero.boundingBox.getSize(V()),hc=hero.boundingBox.getCenter(V()),hw=card.brand?.98:Math.min(.98,Math.max(.42,card.hero.length*.071));hero.translate(-hc.x,-hero.boundingBox.max.y,-hc.z);hero.scale(hw/hs.x,hw/hs.x,(art&&card.brand?.035:.012)/hs.z);hero.translate(align==='center'?0:x+hw/2,0,0);
  const heroMesh=meshFor([hero],card.brand?0x25da8d:0x9fe5d3,true);heroMesh.name='hero';group.add(heroMesh);
  if(brandOnly){scene.add(group);const e={card,group,titleLines:[],bodyLines:[],roles:['hero'],height:hs.y*hw/hs.x};entries.set(card.name,e);return e;}
  let cursor=-hs.y*hw/hs.x-.036;
  const titleSize=mobile?.072:.067,bodySize=mobile?.052:.046;
  const titleLines=wrap(card.title,titleSize),titleGeos=[];for(const line of titleLines){titleGeos.push(lineGeo(line,titleSize,x,cursor,align,.075));cursor-=titleSize*1.13;}
  const headline=meshFor(titleGeos,0xe3eeeb);headline.name='headline';group.add(headline);cursor-=.022;
  const bodyLines=wrap(card.body,bodySize),bodyGeos=[];for(const line of bodyLines){bodyGeos.push(lineGeo(line,bodySize,x,cursor,align,.035));cursor-=bodySize*1.34;}
  const body=meshFor(bodyGeos,0xb7ccc8);body.name='body';group.add(body);
  if(card.name==='ORIGIN'){cursor-=.018;const cue=meshFor([lineGeo('SCROLL TO EXPLORE',.035,0,cursor,'center',.04)],0x68d3ad);cue.name='cue';group.add(cue);cursor-=.047;}
  const box=new THREE.Box3().setFromObject(group);for(const m of group.children)m.position.y-=box.getCenter(V()).y;
  scene.add(group);const e={card,group,titleLines,bodyLines,roles:group.children.map(o=>o.name),height:box.getSize(V()).y};entries.set(card.name,e);return e;
 }
 function clear(){for(const bridge of continuous)bridge.dispose();continuous=[];for(const e of entries.values()){e.group.removeFromParent();for(const m of e.group.children){m.userData.glyphRig?.dispose?.();m.geometry.dispose();m.material.dispose();}}entries.clear();active=null;}

 // Layouts are fixed in the shot's world coordinates after the first successful placement.
 // Each role has a different depth and position. Only authored motion changes that transform.
 const layouts={
 ORIGIN:[[-.20,.25,.61,7.5],[-.28,-.28,.42,5.5],[-.28,-.59,.30,4.4],[0,-.80,.20,3.2]],
 BLOCKCHAIN:[[-.37,.45,.33,1.25],[-.37,-.03,.31,1.35],[-.37,-.55,.28,1.4]],
 STELLAR:[[-.35,.52,.31,1.20],[-.35,-.03,.29,1.25],[-.35,-.52,.26,1.35]],
 CRYPTOGRAPHY:[[0,.52,.60,3.3],[-.42,.03,.38,2.4],[.37,-.53,.39,2.8]],
 INTELLIGENCE:[[.37,.47,.38,3.5],[.39,-.12,.35,3.0],[.39,-.60,.29,3.3]],
 QUANTUM:[[-.61,.42,.27,3.8],[-.60,-.13,.30,4.1],[-.58,-.60,.32,3.6]],
 CONVERGENCE:[[.02,.36,.57,7.2],[.03,-.18,.37,5.2],[.03,-.58,.29,4.4]]
 };
 function isBlocked(origin,point,roots){
  const dir=point.clone().sub(origin),dist=dir.length();ray.set(origin,dir.normalize());ray.near=.08;ray.far=Math.max(.09,dist-.035);
  return ray.intersectObjects(roots,true).some(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;const m=Array.isArray(h.object.material)?h.object.material[h.face?.materialIndex??0]:h.object.material;return (m?.transmission??0)>.05||!m?.transparent||(m?.opacity??0)>.45;});
 }
 // Use the actual back/front wall, not the current camera plane, for a physical wordmark.
 function mountedBrand(e,mesh,cam,mobile,roots){
  const spec=brandSurfaces[e.card.name],hangar=roots.get('hangar');if(!spec||!hangar?.visible)return null;
  const b=mesh.geometry.boundingBox,center=b.getCenter(V()),size=b.getSize(V());
  const rotation=new THREE.Quaternion().setFromAxisAngle(V(0,1,0),spec.normal===1?0:Math.PI),all=[...roots.values()].filter(o=>o.visible);
  const right=V(1,0,0).applyQuaternion(rotation),up=V(0,1,0),direction=V(0,0,-spec.normal);
  for(const width of [spec.width,spec.width*.80,spec.width*.62]){
   const scale=width/size.x,hh=size.y*scale*.5;
   const support=[];
   for(const u of [-1,-.5,0,.5,1])for(const v of [-1,0,1]){
    ray.set(V(spec.x+u*width*.48,spec.y+v*hh,spec.z+spec.normal*2),direction);ray.near=.05;ray.far=4;
    const h=ray.intersectObject(hangar,true).find(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return Math.abs(h.face?.normal.clone().transformDirection(h.object.matrixWorld).z??0)>.75;});
    if(h)support.push(h.point.z);
   }
   if(support.length!==15||Math.max(...support)-Math.min(...support)>.17)continue;
   const z=(spec.normal>0?Math.max(...support):Math.min(...support))+spec.normal*(size.z*scale*.5+.045),point=V(spec.x,spec.y,z);
   const corners=[point,...[-1,-.5,0,.5,1].flatMap(u=>[-1,0,1].map(v=>point.clone().addScaledVector(right,u*width*.51).addScaledVector(up,v*hh*1.04)))];
   if(corners.some(q=>{const p=q.clone().project(cam);return Math.abs(p.x)>.94||Math.abs(p.y)>.90||Math.abs(p.z)>=1||isBlocked(cam.position,q,all);}))continue;
   return {point,rotation,scale,center,right,up,depth:point.distanceTo(cam.position),mount:'hangar-wall'};
  }
  return null;
 }
 // Audition the documented middle-distance brand plane; never claim wall support.
 function midBrand(mesh,cam,roots,spec=null){
  const b=mesh.geometry.boundingBox,center=b.getCenter(V()),size=b.getSize(V()),point=V(...(spec?.point??[-1.5,3.3,2]));
  const rotation=cam.quaternion.clone(),right=V(1,0,0).applyQuaternion(rotation),up=V(0,1,0).applyQuaternion(rotation);
  for(const width of (spec?.widths??[3.6,3.0,2.5])){
   const scale=width/size.x,hh=size.y*scale*.5;
   const corners=[point,...[-1,-.5,0,.5,1].flatMap(u=>[-1,0,1].map(v=>point.clone().addScaledVector(right,u*width*.52).addScaledVector(up,v*hh*1.04)))];
   if(corners.some(q=>{const p=q.clone().project(cam);return Math.abs(p.x)>.94||Math.abs(p.y)>.90||Math.abs(p.z)>=1||isBlocked(cam.position,q,roots);}))continue;
   return {point,rotation,scale,center,right,up,depth:point.distanceTo(cam.position),mount:spec?.mount??'free-space-mid'};
  }
  return null;
 }
 function placeWorld(e,mobile,a,roots){
  const pose=rail(e.card.hold,mobile),cam=new THREE.PerspectiveCamera(pose.fov,a,.075,65);
  cam.position.fromArray(pose.position);cam.lookAt(new THREE.Vector3(...pose.target));cam.updateProjectionMatrix();cam.updateMatrixWorld(true);
  const dir=V();cam.getWorldDirection(dir);const right=V().setFromMatrixColumn(cam.matrixWorld,0),up=V().setFromMatrixColumn(cam.matrixWorld,1),all=[...roots.values()].filter(o=>o.visible);
  const result=[];
  for(const [i,m] of e.group.children.entries()){
   const b=m.geometry.boundingBox,center=b.getCenter(V()),size=b.getSize(V());
   const chosenLayout=e.card.name==='INTELLIGENCE'&&composition==='ops-clear'?[[-.52,.73,.30,2.8],[-.52,-.55,.27,2.5],[-.52,-.78,.24,2.6]]:e.card.name==='INTELLIGENCE'&&isStudy(composition,'ops-hero')?[[-.45,.50,.32,2.8],[-.45,-.12,.30,2.5],[-.45,-.63,.28,2.6]]:e.card.name==='CONVERGENCE'&&isStudy(composition,'final-hero')?[[0,.42,.65,6.5],[0,-.08,.38,4.6],[0,-.43,.30,4.0]]:layouts[e.card.name];
   
   const mobileY=e.card.name==='INTELLIGENCE'&&composition==='ops-clear'?[.75,-.54,-.78,-.91]:e.card.name==='QUANTUM'?(['quantum-copy','selected','composition-first','brand-hero','final-hero','ops-hero','ops-clear','final-clean',...backlogModes].includes(composition)?[.75,-.50,-.71,-.91]:[.75,-.64,-.84,-.91]):[.35,-.18,-.59,-.84];
   const refined=backlogLayout(e.card.name,mobile,composition,chosenLayout,mobileY);const [rx,ry,rs,depth]=refined.layout[i];
   const x=mobile?0:rx,y=mobile?refined.mobileY[i]:ry,span=mobile?Math.min(.80,rs*1.8):rs;
   let anchor=null;if(art&&i===0&&e.card.brand){if(e.card.name==='ORIGIN'&&(['mid','close','selected'].includes(composition)||studyModes.includes(composition)))anchor=midBrand(m,cam,all);const candidate=brandPlane(e.card.name,mobile,composition);if(candidate)anchor=midBrand(m,cam,all,candidate)??anchor;if(!anchor)anchor=mountedBrand(e,m,cam,mobile,roots);}
   for(const d of [depth,depth*.76,depth*.55,depth*.36,.72,.48,.30]){
    if(anchor)break;
    const h=d*Math.tan(THREE.MathUtils.degToRad(cam.fov/2)),w=h*a;
    const scale=Math.min(2*w*span/Math.max(.001,size.x),h*(i===2?.48:.40)/Math.max(.001,size.y));
    const cx=THREE.MathUtils.clamp(x,-.94+size.x*scale/(2*w),.94-size.x*scale/(2*w));
    const cy=THREE.MathUtils.clamp(y,-.92+size.y*scale/(2*h),.92-size.y*scale/(2*h));
    const point=cam.position.clone().addScaledVector(dir,d).addScaledVector(right,cx*w).addScaledVector(up,cy*h);
    const corners=[point,...Array.from({length:13},(_,k)=>-1+k/6).flatMap(u=>[-1,-.5,0,.5,1].map(v=>point.clone().addScaledVector(right,u*size.x*scale*.53).addScaledVector(up,v*size.y*scale*.53)))];
    if(corners.some(q=>isBlocked(cam.position,q,all)))continue;
    const rotation=cam.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0,1,0),mobile?0:(i%2?-.09:.10)));
    anchor={point,rotation,scale,center,right:right.clone(),up:up.clone(),depth:d,mount:'free-space'};break;
   }
   if(!anchor)return false;result.push(anchor);
  }
  e.anchors=result;return true;
 }
 function refreshLayout(mobile,a){
  if(layoutMobile===mobile&&Math.abs(a-aspect)<=.1)return;
  if(reusePlacement&&layoutMobile===mobile){for(const e of entries.values()){e.anchors=null;e.attemptedSignature=null;e.group.visible=false;}active=null;placementResets++;}
  else clear();
  layoutMobile=mobile;aspect=a;
 }
 function requiresWorldUpdate(p,mobile,a,mask,roots){
  if(flow3d)return false;
  if(!world||!rail||layoutMobile!==mobile||Math.abs(a-aspect)>.1)return true;
  const card=shotAnimation(p,mask).card;if(brandOnly&&!card.brand)return false;
  const e=entries.get(card.name);if(e?.anchors||roots.size<8)return false;
  const signature=[...roots.entries()].filter(([,o])=>o.visible).map(([id])=>id).sort().join(',')+'|'+roots.size;
  return e?.attemptedSignature!==signature;
 }
 function updateWorld(p,camera,mobile,a,mask,roots){
  refreshLayout(mobile,a);const anim=shotAnimation(p,mask),card=anim.card;
  if(!entries.has(card.name))build(card,mobile);
  for(const e of entries.values())e.group.visible=false;active=entries.get(card.name)??null;
  if(brandOnly&&!card.brand)return {ready:true,visible:false,shot:card.name,roles:[],alpha:0};
  if(!active)return {ready:false,visible:false,shot:card.name};
  if(!active.anchors){if(roots.size<8)return {ready:false,visible:false,shot:card.name};const signature=[...roots.entries()].filter(([,o])=>o.visible).map(([id])=>id).sort().join(',')+'|'+roots.size;if(active.attemptedSignature===signature)return {ready:false,visible:false,shot:card.name};active.attemptedSignature=signature;if(!placeWorld(active,mobile,a,roots))return {ready:false,visible:false,shot:card.name};}
  const {group}=active;group.position.set(0,0,0);group.quaternion.identity();group.scale.setScalar(1);group.visible=anim.alpha>.02;
  const t=anim.local;
  for(const [i,m] of group.children.entries()){
   const anchor=active.anchors[i],hold=(card.hold-windows[anim.index])/(windows[anim.index+1]-windows[anim.index]);const delayed=card.name!=='QUANTUM'&&i===2;const enter=i===0?1:delayed?ramp(t,Math.max(.12,hold-.20),Math.max(.15,hold-.025)):ramp(t,i===1?.16:i===2?.32:.05,i===1?.34:i===2?.46:.18);const exit=anim.index===6?1:1-ramp(t,Math.max(hold+.025,i===0?.69:.74),Math.max(hold+.075,i===0?.86:.88));const arrival=card.name==='BLOCKCHAIN'?ramp(p,.165,.178):1;const roleAlpha=art&&card.name!=='QUANTUM'?stagedCopy(card,p,artEnvelope(card,p),composition==='backlog-copy')[m.name]:enter*exit;const alpha=anim.alpha*roleAlpha*arrival;
   m.visible=alpha>.025;m.material.opacity=alpha;
   // Put fully revealed lettering into the opaque pass so transmissive surfaces cannot erase it.
   const opaque=alpha>.995;if(m.material.transparent===opaque){m.material.transparent=!opaque;m.material.depthWrite=opaque;m.material.needsUpdate=true;}
   m.scale.setScalar(anchor.scale);m.quaternion.copy(anchor.rotation);
   m.position.copy(anchor.point).sub(anchor.center.clone().multiplyScalar(anchor.scale).applyQuaternion(anchor.rotation));
   if(anchor.mount!=='hangar-wall')m.position.addScaledVector(anchor.up,(1-alpha)*.055).addScaledVector(anchor.right,Math.sin(t*Math.PI)*.045*(i%2?1:-1));
  }
  group.updateMatrixWorld(true);
  return {ready:true,visible:group.visible,shot:card.name,roles:active.roles,alpha:anim.alpha,focus:card.focus,intent:card.intent,bodyLines:active.bodyLines.length,copyVisible:copyVisible(group)};
 }
 function update(p,camera,mobile,a,mask,roots){
  if(flow3d)return updateFlow(p,camera,mobile,a,mask,roots);
  if(world&&rail)return updateWorld(p,camera,mobile,a,mask,roots);
  refreshLayout(mobile,a);const anim=shotAnimation(p,mask),card=anim.card;
  if(!entries.has(card.name))build(card,mobile);
  for(const e of entries.values())e.group.visible=false;active=entries.get(card.name)??null;if(!active)return {ready:false,visible:false,shot:card.name};
  const {group}=active,layout=shotLayout(card,mobile,anim.local),f=V();camera.updateMatrixWorld(true);camera.getWorldDirection(f);
  const right=V().setFromMatrixColumn(camera.matrixWorld,0),up=V().setFromMatrixColumn(camera.matrixWorld,1);
  // Keep the foreground typography ahead of opaque scenery, while retaining depth test.
  let distance=.65;const halfH0=distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),halfW0=halfH0*a;
  let span=layout.span;const maxHeight=mobile?.66:.68;span=Math.min(span,maxHeight/(Math.max(.01,active.height)*a));
  const y=THREE.MathUtils.clamp(layout.y,-.94+span*a*active.height,.94-span*a*active.height),x=THREE.MathUtils.clamp(layout.x,-.94+span,.94-span);
  // Three sample rays across the title block. No visibility override / no render-on-top.
  const all=[...roots.values()].filter(o=>o.visible);
  for(const dx of [-span,0,span]){const pt=camera.position.clone().addScaledVector(f,distance).addScaledVector(right,(x+dx)*halfW0).addScaledVector(up,y*halfH0),dir=pt.sub(camera.position).normalize();ray.set(camera.position,dir);ray.near=.08;ray.far=distance+.05;const hit=ray.intersectObjects(all,true).find(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return !h.object.material?.transparent;});if(hit)distance=Math.min(distance,Math.max(.16,hit.distance*.72));}
  const h=distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),w=h*a,scale=2*w*span;
  group.position.copy(camera.position).addScaledVector(f,distance).addScaledVector(right,(x+(1-anim.motion)*(card.x<0?-.10:.10))*w).addScaledVector(up,(y+(1-anim.motion)*.055)*h);
  group.quaternion.copy(camera.quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(V(0,1,0),(1-anim.motion)*(card.x<0?-.25:.25)+Math.sin(anim.local*Math.PI)*.045));
  group.scale.setScalar(scale*anim.brandScale);group.visible=anim.alpha>.02;
  for(const [i,m] of group.children.entries()){const alpha=anim.alpha*(i===0?1:Math.min(1,Math.max(0,(anim.local+.08-i*.035)*8)));m.material.opacity=alpha;m.visible=alpha>.025;m.position.z=(2-i)*.006;}
  group.updateMatrixWorld(true);
  return {ready:true,visible:group.visible,shot:card.name,roles:active.roles,alpha:anim.alpha,focus:card.focus,intent:card.intent,span,bodyLines:active.bodyLines.length,copyVisible:copyVisible(group)};
 }
 function inspect(camera,roots){if(!active)return [];const {group,card,roles}=active;return group.children.filter(m=>m.visible&&group.visible).map(m=>{m.updateMatrixWorld(true);const rig=m.userData.glyphRig,diagnostic=rig?.diagnosticGeometry?.();if(rig&&!diagnostic)m.geometry.computeBoundingBox();const b=diagnostic?.bounds??m.geometry.boundingBox,points=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(V(x,y,z).applyMatrix4(m.matrixWorld).project(camera));const visibleRoots=roots?[...roots.values()].filter(o=>o.visible):[],attr=diagnostic?.attribute??m.geometry.attributes.position,samples=[];for(let j=0;j<Math.min(45,attr.count);j++){const k=Math.floor(j*attr.count/Math.min(45,attr.count));samples.push(V().fromBufferAttribute(attr,k).applyMatrix4(m.matrixWorld));}const clearSamples=samples.filter(q=>{const v=q.clone().project(camera);return Math.abs(v.x)<1&&Math.abs(v.y)<1&&Math.abs(v.z)<1&&!isBlocked(camera.position,q,visibleRoots);}).length;const lineHeights=[];if(rig?.restData){const d=rig.restData(),ranges=new Map();for(const g of d.glyphs){const range=ranges.get(g.line)??{min:Infinity,max:-Infinity};for(let k=g.start;k<g.start+g.count;k++){const y=V().fromBufferAttribute(attr,k).applyMatrix4(m.matrixWorld).project(camera).y;range.min=Math.min(range.min,y);range.max=Math.max(range.max,y);}ranges.set(g.line,range);}for(const r of ranges.values())lineHeights.push((r.max-r.min)*innerHeight/2);}
 return {lineHeights,contactCount:rig?.contactCount??0,backend:rig?.backend??'cpu',font:rig?.font??null,weight:rig?.weight??null,paletteBytes:rig?.paletteBytes??0,material:m.material.type,architecture:active.architectureAnchor?{point:active.architectureAnchor.point.toArray(),depth:active.architectureAnchor.depth,scale:active.architectureAnchor.scale,layout:active.architectureAnchor.layout}:null,anchorAudit:active.architectureAudit??[],glyphs:m.userData.glyphRig?.diagnostics()??null,glyphCount:m.userData.glyphRig?.glyphCount??0,word:m.userData.word??null,offset:m.userData.rest?m.position.clone().sub(m.userData.rest).toArray():null,rotation:m.rotation.z,projectedHeight:(Math.max(...points.map(q=>q.y))-Math.min(...points.map(q=>q.y)))*innerHeight/2,visibilityEstimate:samples.length?clearSamples/samples.length:0,sampleCount:samples.length,name:card.name,role:m.name,worldAnchor:active.anchors?.[group.children.indexOf(m)]?.point.toArray()??null,mount:active.anchors?.[group.children.indexOf(m)]?.mount??null,inside:points.every(q=>Math.abs(q.x)<1&&Math.abs(q.y)<1&&Math.abs(q.z)<1),span:(Math.max(...points.map(q=>q.x))-Math.min(...points.map(q=>q.x)))/2,opacity:m.material.opacity,triangles:(m.geometry.index?.count??m.geometry.attributes.position.count)/3};});}
 function copyVisible(group){return group.visible&&['headline','body'].every(role=>group.children.some(m=>m.name===role&&m.visible&&m.material.opacity>=.35));}
 function suppressCopy(){if(!active)return;for(const m of active.group.children)if(!active.card.brand||m.name!=='hero')m.visible=false;}
 return {update,inspect,prebuild,requiresWorldUpdate,suppressCopy,stats:()=>({builds,placementResets,entries:entries.size}),ready:()=>!!logo&&(brandOnly||!!font&&(!spaceFont||!!titleFont&&!!bodyFont)),dispose(){disposed=true;clear();},diagnostics(){return [...entries.values()].map(e=>({name:e.card.name,roles:e.roles,bodyLines:e.bodyLines,anchors:e.anchors?.map(a=>({point:a.point.toArray(),depth:a.depth,mount:a.mount}))??[],titleLines:e.titleLines,focus:e.card.focus,intent:e.card.intent}));}};
}
