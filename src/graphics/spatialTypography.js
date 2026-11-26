import * as THREE from 'three';
import {cameraPose,ramp} from './facilityCamera.js';
import {chapters} from '../story.js';
// One stationary sign per scene. This is an opt-in typography experiment,
// not new architectural geometry. HTML remains the accessible source of truth.
export const signWindows=[[.015,.035,.08,.105],[.135,.17,.24,.275],[.37,.39,.415,.44],[.55,.59,.61,.645],[.69,.705,.73,.75],[.90,.92,.945,.95],[.965,.985,1,1.001]];
function wrap(ctx,text,max){
 const lines=[];let line='';
 for(const word of text.split(' ')){const candidate=line?line+' '+word:word;if(line&&ctx.measureText(candidate).width>max){lines.push(line);line=word;}else line=candidate;}
 if(line)lines.push(line);return lines;
}
export function createSpatialTypography(scene,mobile=false){
 const group=new THREE.Group();group.name='spatial-editorial-type';scene.add(group);
 const ray=new THREE.Raycaster(),direction=new THREE.Vector3(),world=new THREE.Vector3(),projected=new THREE.Vector3();
 const entries=chapters.map((chapter,i)=>{
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d');
  ctx.font='24px monospace';ctx.fillStyle='#a2e1c3';ctx.fillText('0'+(i+1)+' / '+chapter.name,40,62);
  ctx.fillRect(40,82,125,3);ctx.font='600 88px Arial, sans-serif';ctx.fillStyle='#f1f3ec';
  const lines=wrap(ctx,chapter.title,944);lines.forEach((line,j)=>ctx.fillText(line,40,185+j*104));
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,depthTest:true,toneMapped:false,side:THREE.FrontSide});
  const geometry=new THREE.PlaneGeometry(mobile?1.15:2.1,mobile?.575:1.05);
  const sign=new THREE.Mesh(geometry,material);const p=cameraPose(signWindows[i][1],mobile);
  const eye=new THREE.Vector3(...p.position),forward=new THREE.Vector3(...p.target).sub(eye).normalize();
  const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
  sign.position.copy(eye).addScaledVector(forward,2.15).addScaledVector(right,mobile?0:-.70);sign.position.y+=mobile?.38:.30;
  sign.lookAt(eye);sign.visible=false;group.add(sign);return {sign,material,geometry,texture,chapter};
 });
 return {
  update(p,camera,roots){
   let shown='';
   for(let i=0;i<entries.length;i++){
    const {sign,material,chapter}=entries[i];const [a,b,c,d]=signWindows[i];
    const opacity=ramp(p,a,b)*(1-ramp(p,c,d));sign.visible=opacity>.01;material.opacity=opacity;
    if(!sign.visible)continue;
    // Conservative center and side visibility: fall back to HTML if occluded.
    let clear=true;
    for(const x of [-.32,0,.32]){
     world.set(x,0,0).applyMatrix4(sign.matrixWorld);projected.copy(world).project(camera);
     if(Math.abs(projected.x)>.90||Math.abs(projected.y)>.88||Math.abs(projected.z)>1){clear=false;break;}
     direction.copy(world).sub(camera.position);const dist=direction.length();ray.set(camera.position,direction.normalize());ray.far=Math.max(0,dist-.02);
     if(ray.intersectObjects([...roots],true).some(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return true;})){clear=false;break;}
    }
    if(!clear){sign.visible=false;continue;}if(opacity>.80)shown=chapter.name;
   }
   return shown;
  },
  dispose(){scene.remove(group);for(const e of entries){e.geometry.dispose();e.material.dispose();e.texture.dispose();}}
 };
}
