import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import {glyphTransform} from './glyphChoreography.js';
import {choreograph} from './r67/motion-physics.js';
import {directedBodyTransform} from './directedTypeLayout.js';
import {livingImpulse,ambientBlend} from './aliveType.js';
import {cameraRibbonGlyph} from './orderedRibbon.js';
import {bakeGlyphContact,sampleGlyphContact} from './r67/glyph-contact.js';
import {createPalette,glyphMatrix,attachPalette} from './r67/gpu-benchmark.js';
// One dynamic geometry per role; each glyph has a contiguous vertex range.
// No draw call per letter. Immutable rest positions; only animate active card.
export function createGlyphRig({font,lines,size,x,y,step,depth,bevel,color,role,finish='control',curved=false,gpu=false,contact=false,directedBody=false,ribbon=false}){
 const gs=[],glyphs=[];let cursor=0;
 const advance=c=>(font.data.glyphs[c]?.ha??font.data.glyphs['?']?.ha??600)/font.data.resolution*size;
 for(const [lineIndex,line] of lines.entries()){
  let pen=x,prev='';for(const char of line){pen+=(font.data.kerning?.[prev+char]??0)/font.data.resolution*size;prev=char;
   if(char===' '){pen+=advance(char);continue;}
   const g=new TextGeometry(char,{font,size,depth:size*depth,curveSegments:2,bevelEnabled:bevel>0,bevelThickness:size*bevel,bevelSize:size*bevel,bevelSegments:1});
   if(!g.attributes.position.count){g.dispose();pen+=advance(char);continue;}
   g.translate(pen,y-lineIndex*step-size*.72,0);g.computeBoundingBox();const center=g.boundingBox.getCenter(new THREE.Vector3());
   glyphs.push({char,start:cursor,count:g.attributes.position.count,center,line:lineIndex,width:g.boundingBox.max.x-g.boundingBox.min.x});cursor+=g.attributes.position.count;gs.push(g);pen+=advance(char);
  }
 }
 const geometry=mergeGeometries(gs,false);for(const g of gs)g.dispose();if(!geometry)throw Error('glyph merge failed');
 const pos=geometry.attributes.position;pos.setUsage(THREE.DynamicDrawUsage);const rest=new Float32Array(pos.array);const normals=geometry.attributes.normal.array,colors=new Float32Array(normals.length),c=new THREE.Color(color);
 for(let i=0;i<normals.length;i+=3){const shade=Math.abs(normals[i+2])>.94?1:Math.abs(normals[i+2])>.15?.78:.44;colors[i]=c.r*shade;colors[i+1]=c.g*shade;colors[i+2]=c.b*shade;}
 geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeBoundingBox();
 const lit=finish!=='control',restNormals=lit?new Float32Array(normals):null;
 if(lit)geometry.attributes.normal.setUsage(THREE.DynamicDrawUsage);
 const material=lit?new THREE.MeshStandardMaterial({color:finish==='titanium'?0x899a98:finish==='green'?0x67bfa1:color,metalness:finish==='titanium'?.62:finish==='green'?.32:.06,roughness:finish==='titanium'?.38:.46,emissive:0x3b4642,emissiveIntensity:.32,depthTest:true,depthWrite:true}):new THREE.MeshBasicMaterial({vertexColors:true,depthTest:true,depthWrite:true,toneMapped:false});
 const palette=gpu?createPalette(glyphs.length):null;if(palette){const index=new Float32Array(pos.count);for(const [i,g] of glyphs.entries())index.fill(i,g.start,g.start+g.count);geometry.setAttribute('glyphIndex',new THREE.BufferAttribute(index,1));attachPalette(material,palette);pos.setUsage(THREE.StaticDrawUsage);geometry.attributes.normal.setUsage(THREE.StaticDrawUsage);}
 const mesh=new THREE.Mesh(geometry,material);mesh.name=role;mesh.frustumCulled=false;
 const baked=contact&&role==='headline'?bakeGlyphContact(glyphs):null;let key='',last=[],restored=true;const euler=new THREE.Euler(),rotation=new THREE.Matrix4();
 function update(act,phase,halfW,halfH,seconds=null){
  const live=Number.isFinite(seconds),next=phase.kind==='hold'&&!live?'hold':[act,phase.kind,phase.u,halfW,halfH,seconds].join(':');if(next===key)return;key=next;
  if(phase.kind==='hold'&&!live){
   if(!restored){if(palette){const identity=new THREE.Matrix4();for(let i=0;i<glyphs.length;i++)palette.set(i,identity);palette.commit();}else{pos.array.set(rest);pos.needsUpdate=true;if(lit){normals.set(restNormals);geometry.attributes.normal.needsUpdate=true;}}}restored=true;last=glyphs.map(g=>({char:g.char,translation:[0,0,0],rotation:[0,0,0]}));return;
  }
  restored=false;last=[];const a=pos.array;const offsets=baked&&act===1&&phase.kind==='enter'?sampleGlyphContact(baked,glyphs.length,phase.u):null;
  for(let i=0;i<glyphs.length;i++){
   const g=glyphs[i],v=ribbon&&role==='headline'?[0,0,0,0,0,0]:phase.kind==='hold'?[0,0,0,0,0,0]:directedBody&&role==='body'?directedBodyTransform(i,glyphs.length,phase):curved?choreograph(act,i,glyphs.length,phase.u,phase.kind==='exit',role):glyphTransform(act,i,glyphs.length,phase,role),pulse=ribbon?cameraRibbonGlyph(act,i,glyphs.length,seconds,role):livingImpulse(act,i,glyphs.length,seconds,role),blend=ribbon?1:ambientBlend(phase),tx=v[0]*halfW+(ribbon?0:offsets?.[i]??0)+pulse[0]*blend,ty=v[1]*halfH+pulse[1]*blend,tz=v[2]*halfH+pulse[2]*blend;if(ribbon){v[3]+=pulse[3];v[4]+=pulse[4];v[5]+=pulse[5];}
   rotation.makeRotationFromEuler(euler.set(v[3],v[4],v[5]));const m=rotation.elements,center=g.center;
   if(palette)palette.set(i,glyphMatrix(center,[tx,ty,tz],v.slice(3)));else for(let j=g.start*3,end=(g.start+g.count)*3;j<end;j+=3){const x=rest[j]-center.x,y=rest[j+1]-center.y,z=rest[j+2]-center.z;a[j]=m[0]*x+m[4]*y+m[8]*z+center.x+tx;a[j+1]=m[1]*x+m[5]*y+m[9]*z+center.y+ty;a[j+2]=m[2]*x+m[6]*y+m[10]*z+center.z+tz;if(lit){const nx=restNormals[j],ny=restNormals[j+1],nz=restNormals[j+2];normals[j]=m[0]*nx+m[4]*ny+m[8]*nz;normals[j+1]=m[1]*nx+m[5]*ny+m[9]*nz;normals[j+2]=m[2]*nx+m[6]*ny+m[10]*nz;}}
   last.push({char:g.char,translation:[tx,ty,tz],rotation:v.slice(3)});
  }
  if(palette)palette.commit();else{pos.needsUpdate=true;if(lit)geometry.attributes.normal.needsUpdate=true;}
 }
 function diagnosticGeometry(){if(!palette)return null;const points=new Float32Array(rest.length),v=new THREE.Vector3(),m=new THREE.Matrix4(),bounds=new THREE.Box3();for(const [i,g] of glyphs.entries()){m.fromArray(palette.data,i*16);for(let j=g.start*3;j<(g.start+g.count)*3;j+=3){v.fromArray(rest,j).applyMatrix4(m);v.toArray(points,j);bounds.expandByPoint(v);}}return {attribute:new THREE.BufferAttribute(points,3),bounds};}
 mesh.userData.glyphRig={update,diagnostics:()=>last,restData:()=>({glyphs,positions:rest,normals:restNormals??normals}),contactCount:baked?.contacts.length??0,diagnosticGeometry,dispose:()=>palette?.dispose(),backend:palette?'gpu':'cpu',font:font.data.familyName,weight:font.data.weight??null,paletteBytes:palette?.data.byteLength??0,restBounds:geometry.boundingBox.clone(),glyphCount:glyphs.length};return mesh;
}
