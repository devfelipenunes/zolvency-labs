import * as THREE from 'three';
import {directedNarrative} from './directedNarrative.js';
// Original logo is independent.
// One immutable world transform per chapter; camera used once to discover a surface,
// never parented to the live camera. Failed support/readability checks keep HTML.
export const worldTypeSpecs=Object.freeze([
 {name:'ORIGIN',hold:.055,root:'hangar',screen:[-.25,-.48],span:.40,min:1.5,max:5.8},
 {name:'BLOCKCHAIN',hold:.205,root:'servers',screen:[-.45,.12],span:.43,min:.35,max:1.8},
 {name:'STELLAR',hold:.405,root:'servers',screen:[.42,.05],span:.43,min:.35,max:1.8},
 {name:'CRYPTOGRAPHY',hold:.625,root:'portal',screen:[-.34,-.02],span:.40,min:.35,max:1.7},
 {name:'INTELLIGENCE',hold:.73,root:'bridge',screen:[.42,-.22],span:.40,min:.40,max:2.0},
 {name:'QUANTUM',hold:.935,root:'reactor-room',screen:[.53,-.15],span:.44,min:.8,max:5.8},
 {name:'CONVERGENCE',hold:.992,root:'hangar',screen:[0,-.34],span:.45,min:1.5,max:6.0}
].map(Object.freeze));
export const TEX_WIDTH=1024,TEX_HEIGHT=512;
const up=new THREE.Vector3(0,1,0),V=(...v)=>new THREE.Vector3(...v);
const allowed=h=>{const m=Array.isArray(h.object.material)?h.object.material[h.face?.materialIndex??0]:h.object.material;for(let n=h.object;n;n=n.parent)if(!n.visible)return false;return !!h.face&&m&&(m.transmission??0)<.05&&!(m.transparent&&m.opacity<.9)&&!/glass|led|glow|screen|light/i.test(h.object.name+' '+m.name);};
const opaque=h=>{for(let n=h.object;n;n=n.parent)if(!n.visible)return false;const m=Array.isArray(h.object.material)?h.object.material[h.face?.materialIndex??0]:h.object.material;return !!m&&!(m.transparent&&m.opacity<.15&&(m.transmission??0)<.05);};
function cameraFor(rail,p,mobile,aspect){const pose=rail(p,mobile),c=new THREE.PerspectiveCamera(pose.fov,aspect,.075,65);c.position.set(...pose.position);c.lookAt(...pose.target);c.updateMatrixWorld(true);return c;}
function lines(ctx,text,width){const rows=[];let row='';for(const word of text.split(/\s+/)){const next=row?row+' '+word:word;if(row&&ctx.measureText(next).width>width){rows.push(row);row=word;}else row=next;}if(row)rows.push(row);return rows;}
function atlas(chapter,index){
 const canvas=document.createElement('canvas');canvas.width=TEX_WIDTH;canvas.height=TEX_HEIGHT;const ctx=canvas.getContext('2d');if(!ctx)throw Error('2D text raster unavailable');
 const centered=index===0||index===6;ctx.textAlign=centered?'center':'left';ctx.textBaseline='top';const x=centered?512:48;
 ctx.font='600 36px Arial, sans-serif';ctx.fillStyle='#9ce4cd';ctx.fillText(String(index+1).padStart(2,'0')+' / '+chapter.name,x,38);
 let size=90,ts=[];while(size>=46){ctx.font='600 '+size+'px Arial, sans-serif';ts=lines(ctx,chapter.title,928);if(ts.length<=2)break;size-=4;}
 let y=104;ctx.fillStyle='#edf1e9';for(const line of ts){ctx.fillText(line,x,y);y+=size*1.07;}y+=24;
 let bs=44,body=[];while(bs>=24){ctx.font=bs+'px Arial, sans-serif';body=lines(ctx,chapter.body,928);if(y+body.length*bs*1.25<=485)break;bs-=2;}
 ctx.fillStyle='#d3e3db';for(const line of body){ctx.fillText(line,x,y);y+=bs*1.25;}
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=2;return {tex,titleLines:ts,bodyLines:body,bodyPixels:bs,overflow:y>488};
}
function frameMetrics(camera,center,right,vertical,w,h,roots,ray){
 let inFrame=0,clear=0,total=0;const ndcs=[];
 for(const x of [-.46,0,.46])for(const y of [-.44,0,.44]){
  const q=center.clone().addScaledVector(right,w*x).addScaledVector(vertical,h*y),n=q.clone().project(camera),d=q.clone().sub(camera.position),dist=d.length();total++;ndcs.push(n);
  if(n.z>=-1&&n.z<=1&&Math.abs(n.x)<.94&&Math.abs(n.y)<.92){inFrame++;ray.set(camera.position,d.normalize());ray.near=.075;ray.far=Math.max(.076,dist-.03);if(!ray.intersectObjects(roots,true).some(opaque))clear++;}
 }
 const ys=ndcs.map(n=>n.y),xs=ndcs.map(n=>n.x);return {inFrame:inFrame/total,clear:clear/total,spanX:(Math.max(...xs)-Math.min(...xs))/2,spanY:(Math.max(...ys)-Math.min(...ys))/2};
}
// Conservative projected font-height proxy at the calibrated viewport; not a glyph-contrast claim.
export const bodyHeightProxy=(metrics,bodyPixels,height=720)=>metrics.spanY*height*bodyPixels/(TEX_HEIGHT*.88);
function anchor(spec,camera,root,roots,ray,bodyPixels,diagnostics){
 if(!root){diagnostics.missingRoot=true;return null;}const candidates=[];const [x,y]=spec.screen;
 for(const dx of [0,-.12,.12,-.24,.24,-.36,.36])for(const dy of [0,-.16,.16,-.32,.32]){
  const ndc=new THREE.Vector2(THREE.MathUtils.clamp(x+dx,-.78,.78),THREE.MathUtils.clamp(y+dy,-.68,.68));
  ray.setFromCamera(ndc,camera);ray.near=.10;ray.far=50;const hits=ray.intersectObject(root,true).filter(allowed);diagnostics.rays++;diagnostics.allowedHits+=hits.length;
  for(const hit of hits.slice(0,3)){diagnostics.consideredHits++;
   const n=hit.face.normal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld));
   if(Math.abs(n.y)>.25){diagnostics.rejectedSlope++;continue;}if(n.dot(camera.position.clone().sub(hit.point))<0)n.negate();
   n.normalize();const right=up.clone().cross(n).normalize(),vertical=n.clone().cross(right).normalize(),center=hit.point.clone().addScaledVector(n,.027);
   const facing=n.dot(camera.position.clone().sub(center).normalize());if(facing<.54){diagnostics.rejectedFacing++;continue;}
   const distance=camera.position.distanceTo(center),desired=THREE.MathUtils.clamp(2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)*camera.aspect*spec.span,spec.min,spec.max);
   for(const w of [desired,desired*.9,desired*.8,desired*.7,desired*.6]){
    if(w<spec.min*.7){diagnostics.rejectedWidth++;continue;}
    diagnostics.footprints++;const h=w/2;let support=0;
    // Each sample must hit the same near-coplanar opaque architectural support.
    for(const u of [-.45,0,.45])for(const v of [-.42,0,.42]){
     const q=center.clone().addScaledVector(right,u*w).addScaledVector(vertical,v*h).addScaledVector(n,.09);
     ray.set(q,n.clone().negate());ray.near=0;ray.far=.18;
     const contact=ray.intersectObject(root,true).find(allowed);if(contact){const sn=contact.face.normal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(contact.object.matrixWorld));if(Math.abs(sn.dot(n))>.96&&Math.abs(contact.point.clone().sub(center).dot(n))<.065)support++;}
    }
    diagnostics.supportHistogram[support]++;if(support>diagnostics.bestSupport){diagnostics.bestSupport=support;diagnostics.bestSupportMesh=hit.object.name;diagnostics.bestSupportWidth=w;}
    if(support<9){diagnostics.rejectedSupport++;continue;}
    const m=frameMetrics(camera,center,right,vertical,w,h,roots,ray);
    if(m.inFrame<1){diagnostics.rejectedFrame++;continue;}if(m.clear<1){diagnostics.rejectedOcclusion++;continue;}if(m.spanX<.24||bodyHeightProxy(m,bodyPixels)<16){diagnostics.rejectedReadability++;continue;}diagnostics.accepted++;
    candidates.push({center,right,vertical,normal:n,width:w,height:h,mesh:hit.object.name,metrics:m,facing,support: support/9,score:m.spanX*2+facing*.4-Math.hypot(dx,dy)*1.25});
   }
  }
 }
 return candidates.sort((a,b)=>b.score-a.score)[0]??null;
}
// Fixed free-space alternative, referenced to the first actual hit. Never camera-parented.
function spatialAnchor(spec,camera,roots,ray,bodyPixels){
 const candidates=[],direction=camera.getWorldDirection(V()),right=V(1,0,0).applyQuaternion(camera.quaternion),vertical=V(0,1,0).applyQuaternion(camera.quaternion),normal=direction.clone().negate(),[x,y]=spec.screen;
 for(const dx of [0,-.18,.18,-.34,.34])for(const dy of [0,-.18,.18]){
  const ndc=new THREE.Vector2(THREE.MathUtils.clamp(x+dx,-.52,.52),THREE.MathUtils.clamp(y+dy,-.48,.48));
  ray.setFromCamera(ndc,camera);ray.near=.1;ray.far=50;const hit=ray.intersectObjects(roots,true).find(opaque);
  if(!hit)continue;const dist=hit.point.clone().sub(camera.position).dot(direction),sight=ray.ray.direction.clone();
  if(dist<.4)continue;
  for(const ratio of [.88,.72,.56,.42]){
   const depth=dist*ratio;if(depth<.30)continue;
   const center=camera.position.clone().addScaledVector(sight,depth/Math.max(.1,sight.dot(direction)));
   const w=THREE.MathUtils.clamp(2*depth*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)*camera.aspect*spec.span,spec.min*.4,spec.max),h=w/2;
   const metrics=frameMetrics(camera,center,right,vertical,w,h,roots,ray);
   if(metrics.inFrame<1||metrics.clear<1||metrics.spanX<.24||bodyHeightProxy(metrics,bodyPixels)<16)continue;
   candidates.push({center,right,vertical,normal,width:w,height:h,mesh:hit.object.name,metrics,facing:1,support:0,kind:'spatial-free-plane',score:metrics.spanX*2+ratio*.6-Math.hypot(dx,dy)*1.25});
  }
 }
 return candidates.sort((a,b)=>b.score-a.score)[0]??null;
}
export function createWorldType(scene,chapters,mode='flat'){
 const entries=[],ray=new THREE.Raycaster();let prepared=false,suppress=false;
 function prepare({roots,rail,applySet}){
  if(prepared)return;prepared=true;
  for(let i=0;i<worldTypeSpecs.length;i++){
   const spec=worldTypeSpecs[i];applySet(spec.hold);scene.updateMatrixWorld(true);const activeRoots=[...roots.values()].filter(o=>o.visible);
   const r=atlas(chapters[i],i);
   if(r.overflow){r.tex.dispose();entries.push({spec,reason:'atlas-overflow'});continue;}
   const cam=cameraFor(rail,spec.hold,false,16/9);const anchorAudit={rays:0,allowedHits:0,consideredHits:0,rejectedSlope:0,rejectedFacing:0,rejectedWidth:0,footprints:0,supportHistogram:Array(10).fill(0),bestSupport:0,bestSupportMesh:null,bestSupportWidth:null,rejectedSupport:0,rejectedFrame:0,rejectedOcclusion:0,rejectedReadability:0,accepted:0};let a=anchor(spec,cam,roots.get(spec.root),activeRoots,ray,r.bodyPixels,anchorAudit);if(a)a.kind='surface-mounted';else a=spatialAnchor(spec,cam,activeRoots,ray,r.bodyPixels);
   if(!a){r.tex.dispose();entries.push({spec,anchorAudit,reason:'no-readable-supported-or-fixed-plane'});continue;}
   const material=mode==='lit'?new THREE.MeshStandardMaterial({map:r.tex,emissiveMap:r.tex,emissive:0xffffff,emissiveIntensity:.65,roughness:.65,metalness:0,alphaTest:.25,transparent:true,depthWrite:true}):new THREE.MeshBasicMaterial({map:r.tex,alphaTest:.25,transparent:true,depthWrite:true,toneMapped:false});
   const mesh=new THREE.Mesh(new THREE.PlaneGeometry(a.width,a.height),material);
   mesh.name='world-type-'+spec.name;mesh.position.copy(a.center);mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(a.right,a.vertical??up,a.normal));mesh.visible=false;scene.add(mesh);
   const mobile=frameMetrics(cameraFor(rail,spec.hold,true,390/844),a.center,a.right,a.vertical??up,a.width,a.height,activeRoots,ray);
   entries.push({spec,a,mesh,...r,mobile,anchorAudit,reason:a.kind});
  }
  applySet(0);scene.updateMatrixWorld(true);
 }
 function update(p,mobile,aspect,mask){
  const b=directedNarrative(p,mask),e=entries[b.index];let active=!!e?.mesh;
  // The portrait camera is independently composed. No invisible/reflowed world text;
  // keep HTML until a dedicated portrait plane has been verified.
  if(mobile||aspect<1.55||aspect>1.95)active=false;
  for(const x of entries)if(x.mesh){x.mesh.visible=active&&!suppress&&x===e&&b.alpha>.02;x.mesh.material.opacity=b.alpha;}
  return {active,name:e?.spec.name??'',reason:active?e.reason:mobile?'portrait-fallback':e?.reason??'unprepared'};
 }
 return {prepare,update,suppressInk(value){suppress=!!value;},textures:()=>entries.filter(e=>e.tex).map(e=>e.tex),report:()=>entries.map(e=>({name:e.spec.name,root:e.spec.root,reason:e.reason,anchorAudit:e.anchorAudit,anchor:e.a?.center.toArray(),normal:e.a?.normal.toArray(),width:e.a?.width,height:e.a?.height,support:e.a?.support,kind:e.a?.kind,hold:e.a?.metrics,mobile:e.mobile,bodyPixels:e.bodyPixels,estimatedBodyHeightPx:e.a?bodyHeightProxy(e.a.metrics,e.bodyPixels):null,mesh:e.a?.mesh,textureBytes:e.tex?TEX_WIDTH*TEX_HEIGHT*4:0})),dispose(){for(const e of entries)if(e.mesh){e.mesh.removeFromParent();e.mesh.geometry.dispose();e.mesh.material.dispose();/* textures owned by facility registry after prepare */}entries.length=0;}};
}
