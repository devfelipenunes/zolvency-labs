import * as THREE from 'three';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {shotCards,shotAnimation,shotLayout} from './shotCards.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
// All visible narrative text is triangulated, extruded glyph geometry, including body copy.
// One merged mesh per role keeps draw calls low. The editorial rig follows the shot,
// with controlled perspective, depth and rotation; it is not a physical wall sign.
export function createSpatialNarrativeText(scene,onReady){
 let font=null,logo=null,disposed=false,aspect=0,active=null;const entries=new Map(),ray=new THREE.Raycaster();
 new FontLoader().loadAsync(import.meta.env.BASE_URL+'models/fonts/helvetiker_regular.typeface.json').then(f=>{if(!disposed){font=f;onReady();}}).catch(()=>{});
 new SVGLoader().loadAsync(import.meta.env.BASE_URL+'brand/zolvency.svg').then(d=>{if(!disposed){logo=d.paths.flatMap(p=>SVGLoader.createShapes(p));onReady();}}).catch(()=>{});
 function width(s){let x=0;for(const c of s)x+=(font.data.glyphs[c]?.ha??font.data.glyphs['?']?.ha??600)/font.data.resolution;return x;}
 function wrap(s,size,max=.98){const out=[];let line='';for(const word of s.split(' ')){const next=line?line+' '+word:word;if(line&&width(next)*size>max){out.push(line);line=word;}else line=next;}if(line)out.push(line);return out;}
 function lineGeo(text,size,x,y,align='left',depth=.045){
  const g=new TextGeometry(text,{font,size,depth:size*depth,curveSegments:2,bevelEnabled:false});g.computeBoundingBox();const b=g.boundingBox;g.translate(x-(align==='center'?(b.min.x+b.max.x)/2:b.min.x),y-b.max.y,0);return g;
 }
 function meshFor(gs,color,lit=false){
  const geometry=mergeGeometries(gs,false);for(const g of gs)g.dispose();if(!geometry)throw Error('glyph geometry merge failed');geometry.computeBoundingBox();
  const material=lit?new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.58,metalness:.25,roughness:.44,transparent:true,depthWrite:false}):new THREE.MeshBasicMaterial({color,transparent:true,depthWrite:false,toneMapped:false});
  return new THREE.Mesh(geometry,material);
 }
 function build(card,mobile){
  if(!font||(card.brand&&!logo))return null;
  const group=new THREE.Group();group.name='narrative-'+card.name;group.visible=false;const align=card.brand?'center':'left',x=align==='center'?0:-.5;
  const hero=card.brand?new THREE.ExtrudeGeometry(logo,{depth:12,bevelEnabled:false}):new TextGeometry(card.hero,{font,size:1,depth:.07,curveSegments:4,bevelEnabled:false});
  if(card.brand)hero.scale(1,-1,1);hero.computeBoundingBox();const hs=hero.boundingBox.getSize(V()),hc=hero.boundingBox.getCenter(V()),hw=card.brand?.98:Math.min(.98,Math.max(.42,card.hero.length*.071));hero.translate(-hc.x,-hero.boundingBox.max.y,-hc.z);hero.scale(hw/hs.x,hw/hs.x,.012/hs.z);hero.translate(align==='center'?0:x+hw/2,0,0);
  const heroMesh=meshFor([hero],card.brand?0x25da8d:0x9fe5d3,true);heroMesh.name='hero';group.add(heroMesh);
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
 function clear(){for(const e of entries.values()){e.group.removeFromParent();for(const m of e.group.children){m.geometry.dispose();m.material.dispose();}}entries.clear();active=null;}
 function update(p,camera,mobile,a,mask,roots){
  if(Math.abs(a-aspect)>.1){clear();aspect=a;}const anim=shotAnimation(p,mask),card=anim.card;
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
  return {ready:true,visible:group.visible,shot:card.name,roles:active.roles,alpha:anim.alpha,focus:card.focus,intent:card.intent,span,bodyLines:active.bodyLines.length};
 }
 function inspect(camera){if(!active)return [];const {group,card,roles}=active;return group.children.filter(m=>m.visible&&group.visible).map(m=>{m.updateMatrixWorld(true);const b=m.geometry.boundingBox,points=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(V(x,y,z).applyMatrix4(m.matrixWorld).project(camera));return {name:card.name,role:m.name,inside:points.every(q=>Math.abs(q.x)<1&&Math.abs(q.y)<1&&Math.abs(q.z)<1),span:(Math.max(...points.map(q=>q.x))-Math.min(...points.map(q=>q.x)))/2,opacity:m.material.opacity,triangles:(m.geometry.index?.count??m.geometry.attributes.position.count)/3};});}
 return {update,inspect,ready:()=>!!font&&!!logo,dispose(){disposed=true;clear();},diagnostics(){return [...entries.values()].map(e=>({name:e.card.name,roles:e.roles,bodyLines:e.bodyLines,titleLines:e.titleLines,focus:e.card.focus,intent:e.card.intent}));}};
}
