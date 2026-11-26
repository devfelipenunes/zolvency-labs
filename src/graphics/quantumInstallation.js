import * as THREE from 'three';
// Work on verified decoded mesh components; keep attributes and UVs untouched.
export function weldedComponents(mesh){
 const g=mesh.geometry,a=g.attributes.position,index=g.index,n=index?.count??a.count,parents=Array.from({length:a.count},(_,i)=>i),points=[],keys=new Map(),v=new THREE.Vector3();
 function find(i){while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;}
 function join(i,j){const x=find(i),y=find(j);if(x!==y)parents[y]=x;}
 for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld);points.push(v.clone());const key=v.toArray().map(x=>Math.round(x*10000)).join(':');if(keys.has(key))join(i,keys.get(key));else keys.set(key,i);}
 const id=i=>index?index.getX(i):i;
 for(let i=0;i+2<n;i+=3){join(id(i),id(i+1));join(id(i),id(i+2));}
 const groups=new Map();
 for(let i=0;i+2<n;i+=3){const tri=[id(i),id(i+1),id(i+2)],r=find(tri[0]);if(!groups.has(r))groups.set(r,{box:new THREE.Box3(),indices:[]});const q=groups.get(r);q.indices.push(...tri);for(const j of tri)q.box.expandByPoint(points[j]);}
 return [...groups.values()];
}
function trim(mesh,groups,remove){const discarded=groups.filter(remove);if(!discarded.length)return {removed:0,triangles:0};const drop=new Set(discarded),keep=groups.filter(g=>!drop.has(g)).flatMap(g=>g.indices);const geom=mesh.geometry.clone();geom.clearGroups();geom.setIndex(keep);geom.computeBoundingBox();geom.computeBoundingSphere();mesh.geometry=geom;if(!keep.length)mesh.visible=false;return {removed:discarded.length,triangles:discarded.reduce((n,g)=>n+g.indices.length/3,0)};}
export function adaptReactor(holder){
 holder.updateWorldMatrix(true,true);const rows=[];
 holder.traverse(o=>{if(!o.isMesh||!/^reactor_hall/.test(o.name))return;const groups=weldedComponents(o);const remove=g=>{const b=g.box,central=b.min.x>=26.49&&b.max.x<=33.51&&b.min.z>=-3.51&&b.max.z<=3.51;
 // Preserve floor plinth below .8 and the measured overhead cap y=11.5..12.9.
 return central&&b.max.y>.81&&b.min.y<11.49;};rows.push({node:o.name,...trim(o,groups,remove)});});
 const removed=rows.reduce((n,r)=>n+r.removed,0);if(removed<50)throw Error('Unexpected reactor geometry; central components not identified');return {removed,rows};
}
export function fitCryostat(holder){
 holder.updateWorldMatrix(true,true);const rows=[];
 holder.traverse(o=>{if(!o.isMesh)return;const groups=weldedComponents(o),remove=g=>{const t=g.indices.length/3;return t===664||t===3370;};rows.push({node:o.name,...trim(o,groups,remove)});});
 const count=rows.reduce((n,r)=>n+r.removed,0);if(count!==2)throw Error('Cryostat support geometry did not match audited components');
 // Determine visible mesh bounds from retained indexed triangles, not unused vertices.
 const box=new THREE.Box3(),v=new THREE.Vector3();holder.traverseVisible(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position,i=o.geometry.index;for(let j=0;j<(i?.count??a.count);j++)box.expandByPoint(v.fromBufferAttribute(a,i?i.getX(j):j).applyMatrix4(o.matrixWorld));});
 const shift=11.36-box.max.y;holder.position.y+=shift;holder.updateWorldMatrix(true,true);
 // Short engineered-looking flange that meets the retained overhead cap at 11.5m.
 // This is artistic mounting geometry, not a claim of load-bearing certification.
 const flange=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.18,32),new THREE.MeshStandardMaterial({color:0x77858b,metalness:.85,roughness:.32}));flange.name='cryostat-upper-flange';holder.add(flange);flange.position.copy(holder.worldToLocal(new THREE.Vector3(30,11.43,0)));flange.castShadow=true;flange.receiveShadow=true;
 return {removed:count,rows,bottom:box.min.y+shift,top:11.36,mountTop:11.52};
}
