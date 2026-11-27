import * as THREE from 'three';
import {matchGlyphs} from './glyphMatching.js';
import {bezier,smooth5} from './r67/motion-physics.js';
import {windows} from './facilityCamera.js';
import {glyphHolds} from './glyphChoreography.js';
import {corridorWeight,corridorSlot,cinematicDepth,cinematicSlot} from './transitionCorridor.js';
import {motionFamilies,trainOrder,waveTiming,trainSlot} from './guidedWave.js';
import {fitClearance,clearanceReport} from './glyphClearance.js';
import {createPalette,attachPalette} from './r67/gpu-benchmark.js';
export const transitionWindows=Object.freeze(glyphHolds.slice(0,-1).map((hold,i)=>Object.freeze({index:i,start:hold+(windows[i+1]-hold)*.42,end:windows[i+1]+(glyphHolds[i+1]-windows[i+1])*.82,boundary:windows[i+1]})));
export const transitionStart=transitionWindows[1].start;
export const transitionEnd=transitionWindows[1].end;
// One merged opaque title mesh persists through the boundary. Actual rest glyph
// vertices, pivots, anchor transforms and materials; no substitute billboard.
export function createContinuousTitle(source,target,scene,index=1,{corridor=false,poseAt=null,audit=false,clearance=false,gpuBridge=false,cinematic=false,guidedWave=false}={}){
 const {start:transitionStart,end:transitionEnd}=transitionWindows[index];
 const A=source.headline.userData.glyphRig.restData(),B=target.headline.userData.glyphRig.restData();
 const list=(d,p)=>d.glyphs.map((g,i)=>({id:p+i,char:g.char,x:g.center.x,index:i}));
 const a=list(A,'a'),b=list(B,'b'),match=matchGlyphs(a,b),aa=new Map(a.map(g=>[g.id,g])),bb=new Map(b.map(g=>[g.id,g]));
 const items=[...match.matches.map(m=>({id:'keep:'+m.from,char:m.char,from:aa.get(m.from).index,to:bb.get(m.to).index,kind:'keep'})),...match.depart.map(id=>({id:'depart:'+id,char:aa.get(id).char,from:aa.get(id).index,to:null,kind:'depart'})),...match.arrive.map(id=>({id:'arrive:'+id,char:bb.get(id).char,from:null,to:bb.get(id).index,kind:'arrive'}))];
 const order=trainOrder(items);let count=0;for(const item of items){const data=item.from===null?B:A,g=data.glyphs[item.from??item.to];item.start=count;item.count=g.count;item.data=data;item.glyph=g;let radius=0;for(let k=g.start*3;k<(g.start+g.count)*3;k+=3)radius=Math.max(radius,Math.hypot(data.positions[k]-g.center.x,data.positions[k+1]-g.center.y,data.positions[k+2]-g.center.z));item.radius=radius;count+=g.count;}
 const positions=new Float32Array(count*3),normals=new Float32Array(count*3);const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3).setUsage(THREE.DynamicDrawUsage));
 const material=source.headline.material.clone();material.onBeforeCompile=()=>{};material.customProgramCacheKey=()=> 'r68-continuous-title-cpu';material.transparent=false;material.depthWrite=true;material.opacity=1;
 const palette=gpuBridge?createPalette(items.length):null;if(palette){const glyphIndex=new Float32Array(count);for(const [i,item] of items.entries()){const d=item.data,g=item.glyph;let j=item.start*3;for(let k=g.start*3;k<(g.start+g.count)*3;k+=3,j+=3){positions[j]=d.positions[k]-g.center.x;positions[j+1]=d.positions[k+1]-g.center.y;positions[j+2]=d.positions[k+2]-g.center.z;normals[j]=d.normals[k];normals[j+1]=d.normals[k+1];normals[j+2]=d.normals[k+2];}glyphIndex.fill(i,item.start,item.start+item.count);}geometry.setAttribute('glyphIndex',new THREE.BufferAttribute(glyphIndex,1));geometry.attributes.position.setUsage(THREE.StaticDrawUsage);geometry.attributes.normal.setUsage(THREE.StaticDrawUsage);attachPalette(material,palette);}
 const mesh=new THREE.Mesh(geometry,material);mesh.name='continuous-title-'+index;mesh.frustumCulled=false;mesh.visible=false;scene.add(mesh);
 const v=new THREE.Vector3(),normal=new THREE.Vector3(),rot=new THREE.Quaternion(),spin=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),right=new THREE.Vector3(),point=new THREE.Vector3();let last=[],report=null,lastDepth=null;const transform=new THREE.Matrix4(),uniformScale=new THREE.Vector3(),railCam=new THREE.PerspectiveCamera(),railForward=new THREE.Vector3(),railRight=new THREE.Vector3(),railUp=new THREE.Vector3(),railPoint=new THREE.Vector3(),routePoint=new THREE.Vector3(),routeRotation=new THREE.Quaternion();
 function restWorld(entry,data,index){const g=data.glyphs[index],a=entry.architectureAnchor;return g.center.clone().add(entry.headline.userData.rest).multiplyScalar(a.scale).applyQuaternion(a.rotation).add(a.point);}
 function update(p,mask,camera,blocked=null){
  const sa=source.architectureAnchor,ta=target.architectureAnchor;if(!sa||!ta||p<transitionStart||p>transitionEnd||mask>=.98){mesh.visible=false;last=[];report=null;lastDepth=null;return false;}
  const u=Math.max(0,Math.min(1,(p-transitionStart)/(transitionEnd-transitionStart))),q=smooth5(u),arc=Math.sin(Math.PI*q),weight=corridor&&poseAt&&camera?corridorWeight(u):0;last=[];
  let hh=0,hw=0,routeScale=0;lastDepth=null;if(weight>0){const pose=poseAt(p),depth=cinematic?cinematicDepth(index,u):.55;lastDepth=depth;railCam.position.fromArray(pose.position);railCam.lookAt(...pose.target);railCam.fov=pose.fov;railCam.aspect=camera.aspect;railCam.updateMatrixWorld(true);railCam.getWorldDirection(railForward);railRight.set(1,0,0).applyQuaternion(railCam.quaternion);railUp.set(0,1,0).applyQuaternion(railCam.quaternion);hh=depth*Math.tan(pose.fov*Math.PI/360);hw=hh*camera.aspect;railPoint.copy(railCam.position).addScaledVector(railForward,depth).addScaledVector(railUp,-.40*hh);routeScale=Math.min(hw*.26/.138,hh*.20/.138);}
  const poses=[];for(const [i,item] of items.entries()){
   let start=item.from===null?null:restWorld(source,A,item.from),end=item.to===null?null:restWorld(target,B,item.to);
   if(!start){right.set(1,0,0).applyQuaternion(sa.rotation);start=sa.point.clone().addScaledVector(right,Math.max(3,sa.depth*3));}
   if(!end){right.set(1,0,0).applyQuaternion(ta.rotation);end=ta.point.clone().addScaledVector(right,-Math.max(3,ta.depth*3));}
   const timing=guidedWave?waveTiming(u,order[item.id].rank,order[item.id].count):q;const lane=(i%2?1:-1)*(.15+.05*(i%4)),c1=start.clone().lerp(end,.33),c2=start.clone().lerp(end,.67);c1.y+=lane;c2.y+=lane;c1.z-=.35;c2.z-=.35;
   point.fromArray(bezier(start.toArray(),c1.toArray(),c2.toArray(),end.toArray(),timing));rot.copy(sa.rotation).slerp(ta.rotation,timing);spin.setFromAxisAngle(up,arc*(i%2?1:-1)*.45);rot.multiply(spin);
   let scale=sa.scale+(ta.scale-sa.scale)*timing;const d=item.data,g=item.glyph;let j=item.start*3;
   if(weight>0){const authored=guidedWave?trainSlot(order[item.id],u,index):null,slot=authored?authored.position:(cinematic?cinematicSlot:corridorSlot)(i,items.length,u,index);routePoint.copy(railPoint).addScaledVector(railRight,slot[0]*hw).addScaledVector(railUp,slot[1]*hh).addScaledVector(railForward,slot[2]*hh);if(!guidedWave&&item.kind==='depart')routePoint.addScaledVector(railRight,-3.0*hw*smooth5((u-.48)/.25));if(!guidedWave&&item.kind==='arrive')routePoint.addScaledVector(railRight,3.0*hw*smooth5((.52-u)/.25));point.lerp(routePoint,weight);routeRotation.copy(railCam.quaternion).multiply(spin);if(authored)routeRotation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),authored.roll));rot.slerp(routeRotation,weight);scale+=(routeScale*(authored?.scaleFactor??1)-scale)*weight;}
   poses.push({id:item.id,position:point.toArray(),rotation:rot.toArray(),scale,radius:item.radius});
  }
  const scales=clearance&&weight>0?fitClearance(poses,{weight,minRatio:.68}):poses.map(p=>p.scale);
  for(const [i,item] of items.entries()){
   const d=item.data,g=item.glyph,pose=poses[i],scale=scales[i];point.fromArray(pose.position);rot.fromArray(pose.rotation);
   if(palette){transform.compose(point,rot,uniformScale.setScalar(scale));palette.set(i,transform);}
   else{let j=item.start*3;for(let k=g.start*3;k<(g.start+g.count)*3;k+=3,j+=3){v.fromArray(d.positions,k).sub(g.center).multiplyScalar(scale).applyQuaternion(rot).add(point).toArray(positions,j);normal.fromArray(d.normals,k).applyQuaternion(rot).toArray(normals,j);}}
   const projected=camera?point.clone().project(camera):null,inFrame=projected?Math.abs(projected.x)<1&&Math.abs(projected.y)<1&&Math.abs(projected.z)<1:null;
   let vertexSamples=0,vertexClear=0;if(audit&&blocked&&inFrame){for(let sample=0;sample<9;sample++){const k=(g.start+Math.floor(sample*g.count/9))*3;v.fromArray(d.positions,k).sub(g.center).multiplyScalar(scale).applyQuaternion(rot).add(point);const p=v.clone().project(camera);vertexSamples++;if(Math.abs(p.x)<1&&Math.abs(p.y)<1&&Math.abs(p.z)<1&&!blocked(v))vertexClear++;}}
   last.push({id:item.id,char:item.char,kind:item.kind,from:item.from,to:item.to,position:pose.position,scale,radius:item.radius,opacity:1,inFrame,clear:audit&&inFrame&&blocked?!blocked(point):null,vertexSamples,vertexClear});
  }
  report=audit?clearanceReport(last):null;
  if(palette)palette.commit();else{geometry.attributes.position.needsUpdate=true;geometry.attributes.normal.needsUpdate=true;}mesh.visible=true;return true;
 }
 return {mesh,update,diagnostics:()=>({index,source:source.card.livingId,target:target.card.livingId,active:mesh.visible,routeDepth:lastDepth,formation:guidedWave?motionFamilies[index]:cinematic?['magnetic','chain','docking','lock','signal','orbital'][index]:'grid',backend:palette?'gpu':'cpu',paletteBytes:palette?.data.byteLength??0,clearance:report,matchedSurfaceClear:last.filter(x=>x.kind==='keep'&&x.vertexSamples>0&&x.vertexClear/x.vertexSamples>=.60).length,inFrame:last.filter(x=>x.inFrame===true).length,matchedInFrame:last.filter(x=>x.kind==='keep'&&x.inFrame===true).length,matchedClear:last.filter(x=>x.kind==='keep'&&x.clear===true).length,matched:match.matches.length,depart:match.depart.length,arrive:match.arrive.length,triangles:count/3,items:last}),dispose(){mesh.removeFromParent();palette?.dispose();geometry.dispose();material.dispose();}};
}
