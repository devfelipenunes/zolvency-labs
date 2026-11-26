import * as THREE from 'three';
// Text is mapped onto actual wall panels and depth-tested with the scene.
export function createSpatialPlates(plates,scene){
 const items=[];
 for(const p of plates){
  const c=document.createElement('canvas');c.width=1024;c.height=512;
  const ctx=c.getContext('2d');ctx.fillStyle='#18272c';ctx.fillRect(0,0,1024,512);
  ctx.strokeStyle='#637b7a';ctx.lineWidth=3;ctx.strokeRect(18,18,988,476);
  ctx.fillStyle='#97e7bb';ctx.fillRect(55,53,98,5);
  ctx.fillStyle='#adceca';ctx.font='24px monospace';ctx.textBaseline='top';ctx.fillText(p.sub,55,420,914);
  const lines=p.title.split('\n');ctx.fillStyle='#ecf4ed';ctx.font='bold 100px Arial';const fit=Math.min(100,Math.floor(100*914/Math.max(...lines.map(l=>ctx.measureText(l).width))));ctx.font='bold '+fit+'px Arial';
  lines.forEach((l,i)=>ctx.fillText(l,55,112+i*(fit+14),914));
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const holder=new THREE.Group();holder.name='architecture-plate-'+p.id;holder.position.set(...p.position);holder.rotation.y=p.yaw;
  const backingGeo=new THREE.BoxGeometry(p.width,p.height,.16),backingMat=new THREE.MeshStandardMaterial({color:0x23363b,metalness:.72,roughness:.36});
  const backing=new THREE.Mesh(backingGeo,backingMat);holder.add(backing);
  const faceGeo=new THREE.PlaneGeometry(p.width*.975,p.height*.955),faceMat=new THREE.MeshBasicMaterial({map:texture,toneMapped:false,side:THREE.FrontSide});
  const face=new THREE.Mesh(faceGeo,faceMat);face.position.z=.086;holder.add(face);scene.add(holder);
  items.push({p,holder,texture,backingGeo,backingMat,faceGeo,faceMat});
 }
 return {items,update(z,range){for(const i of items)i.holder.visible=Math.abs(i.p.position[2]-z)<range;},dispose(){for(const i of items){i.holder.removeFromParent();i.texture.dispose();i.backingGeo.dispose();i.backingMat.dispose();i.faceGeo.dispose();i.faceMat.dispose();}}};
}
