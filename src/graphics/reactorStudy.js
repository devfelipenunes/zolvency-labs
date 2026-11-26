import * as THREE from 'three';
import {ramp} from './facilityCamera.js';
import {extendedPose} from './extendedInteriors.js';
export const reactorCenter=[30,0,0];
// Study the original enclosed room on a separate set; never place its core in the main hangar.
export function reactorStudyPose(p,mobile=false){
 if(p<.865||p>.95)return extendedPose(p,mobile);
 const t=ramp(p,.865,.935),position=[35.6-.7*t,2.1+4.6*t,5.8-.4*t];
 return {position,target:[30,5.6,0],fov:mobile?68:55};
}
// Group actual decoded mesh triangles by welded position, without altering source geometry.
// Bounds are world-space. Central components are candidates only, not auto-deleted.
export function inspectReactor(root){
 root.updateWorldMatrix(true,true);const result=[];
 root.traverse(o=>{
  if(!o.isMesh||!o.geometry?.attributes.position)return;
  const a=o.geometry.attributes.position,index=o.geometry.index,n=index?.count??a.count;
  const points=[],parent=[],keys=new Map(),v=new THREE.Vector3();
  function find(i){while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;}
  function join(i,j){const x=find(i),y=find(j);if(x!==y)parent[y]=x;}
  for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);points.push(v.clone());parent.push(i);const key=v.toArray().map(x=>Math.round(x*10000)).join(':');if(keys.has(key))join(i,keys.get(key));else keys.set(key,i);}
  const ids=i=>index?index.getX(i):i;
  for(let i=0;i+2<n;i+=3){join(ids(i),ids(i+1));join(ids(i),ids(i+2));}
  const groups=new Map();
  for(let i=0;i+2<n;i+=3){const tri=[ids(i),ids(i+1),ids(i+2)],r=find(tri[0]);let g=groups.get(r);if(!g){g={box:new THREE.Box3(),triangles:0};groups.set(r,g);}g.triangles++;for(const k of tri)g.box.expandByPoint(points[k]);}
  const components=[...groups.values()].map(g=>({triangles:g.triangles,min:g.box.min.toArray(),max:g.box.max.toArray(),centralCandidate:g.box.min.x>=reactorCenter[0]-3.5&&g.box.max.x<=reactorCenter[0]+3.5&&g.box.min.z>=-3.5&&g.box.max.z<=3.5})).sort((a,b)=>b.triangles-a.triangles);
  result.push({node:o.name,material:o.material?.name??'',triangles:n/3,components});
 });return result;
}
