import * as THREE from 'three';
// Preserve original front-wall triangles and materials, cutting only the real
// corridor throat. Clip in world space while interpolating original local attributes.
function split(poly,axis,edge,keepLess){
 const inside=v=>keepLess?v.world[axis]<=edge:v.world[axis]>=edge;
 const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ia=inside(a),ib=inside(b);if(ia)out.push(a);if(ia!==ib){const t=(edge-a.world[axis])/(b.world[axis]-a.world[axis]);const values={};for(const k of Object.keys(a.values))values[k]=a.values[k].map((v,j)=>v+(b.values[k][j]-v)*t);out.push({world:a.world.map((v,j)=>v+(b.world[j]-v)*t),values});}}return out;
}
export function cutAperture(mesh,rect){
 const g=mesh.geometry,position=g.attributes.position;if(!position)return null;
 const keys=Object.keys(g.attributes).filter(k=>!['skinIndex','skinWeight'].includes(k));if(g.morphAttributes.position?.length||mesh.isSkinnedMesh)return null;
 const arrays=Object.fromEntries(keys.map(k=>[k,[]])),sourceGroups=g.groups.length?g.groups:[{start:0,count:g.index?.count??position.count,materialIndex:0}],next=new THREE.BufferGeometry();
 const v=new THREE.Vector3();let changed=0;
 function vertex(index){const values={};for(const k of keys){const a=g.attributes[k];values[k]=Array.from({length:a.itemSize},(_,j)=>a.getComponent(index,j));}v.fromBufferAttribute(position,index).applyMatrix4(mesh.matrixWorld);return {values,world:v.toArray()};}
 function emit(poly){if(poly.length<3)return;for(let i=1;i<poly.length-1;i++)for(const v of [poly[0],poly[i],poly[i+1]])for(const k of keys)arrays[k].push(...v.values[k]);}
 for(const group of sourceGroups){const start=arrays.position.length/3;for(let i=group.start;i+2<group.start+group.count;i+=3){const p=[i,i+1,i+2].map(j=>vertex(g.index?g.index.getX(j):j));if(!p.some(v=>v.world[0]>rect.left&&v.world[0]<rect.right&&v.world[1]>rect.bottom&&v.world[1]<rect.top)&& (p.every(v=>v.world[0]<=rect.left)||p.every(v=>v.world[0]>=rect.right)||p.every(v=>v.world[1]<=rect.bottom)||p.every(v=>v.world[1]>=rect.top))){emit(p);continue;}
 const left=split(p,0,rect.left,true),right=split(p,0,rect.right,false),middle=split(split(p,0,rect.left,false),0,rect.right,true);emit(left);emit(right);emit(split(middle,1,rect.bottom,true));emit(split(middle,1,rect.top,false));changed++;}
 next.addGroup(start,arrays.position.length/3-start,group.materialIndex);}
 for(const k of keys)next.setAttribute(k,new THREE.Float32BufferAttribute(arrays[k],g.attributes[k].itemSize));next.computeBoundingBox();next.computeBoundingSphere();return {geometry:next,changed};
}
