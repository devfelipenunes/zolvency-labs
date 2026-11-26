import * as THREE from 'three';
// Diagnostic exact projected triangle intersections; independent of shader,
// material side and custom raycast, no changes to the render scene.
export function floorProbe(root,x,z,{min=-.4,max=.4}={}){
 if(!root)return null;
 root.updateWorldMatrix(true,true);let best=null;
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),e=new THREE.Vector3(),f=new THREE.Vector3(),n=new THREE.Vector3();
 root.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh)return;
  const g=o.geometry,p=g?.attributes.position;if(!p)return;const ix=g.index,count=ix?.count??p.count;
  for(let i=0;i+2<count;i+=3){
   a.fromBufferAttribute(p,ix?ix.getX(i):i).applyMatrix4(o.matrixWorld);
   b.fromBufferAttribute(p,ix?ix.getX(i+1):i+1).applyMatrix4(o.matrixWorld);
   c.fromBufferAttribute(p,ix?ix.getX(i+2):i+2).applyMatrix4(o.matrixWorld);
   if(x<Math.min(a.x,b.x,c.x)-1e-7||x>Math.max(a.x,b.x,c.x)+1e-7||z<Math.min(a.z,b.z,c.z)-1e-7||z>Math.max(a.z,b.z,c.z)+1e-7)continue;
   e.subVectors(b,a);f.subVectors(c,a);n.crossVectors(e,f);const length=n.length(),den=e.x*f.z-e.z*f.x;
   if(length<1e-10||n.y/length<.85||Math.abs(den)<1e-10)continue;
   const u=((x-a.x)*f.z-(z-a.z)*f.x)/den,v=(e.x*(z-a.z)-e.z*(x-a.x))/den;
   if(u< -1e-7||v< -1e-7||u+v>1+1e-7)continue;
   const y=a.y+u*e.y+v*f.y;if(y<min||y>max)continue;
   if(!best||y>best.y)best={x,z,y,node:o.name,normalY:n.y/length};
  }
 });return best;
}
