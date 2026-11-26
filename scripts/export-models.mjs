import { mkdir,writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { modelParts,catalog,palette } from '../src/graphics/models.js';
import { bakedModel,geometries,materials } from '../src/graphics/meshFactory.js';
// GLTFExporter uses the browser FileReader interface; Node supplies Blob and ArrayBuffer.
globalThis.FileReader=class{
 readAsArrayBuffer(blob){blob.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();}).catch(e=>this.onerror?.(e));}
 readAsDataURL(blob){blob.arrayBuffer().then(v=>{this.result='data:'+blob.type+';base64,'+Buffer.from(v).toString('base64');this.onloadend?.();}).catch(e=>this.onerror?.(e));}
};
await mkdir('public/models',{recursive:true});
const geo=geometries(),mats=materials();
const manifest=[];
for(const [name,make] of Object.entries(modelParts).filter(([n])=>['ledger','processor','cryostat'].includes(n))){
 const root=bakedModel(make(),geo,mats);root.name=name;
 const scene=new THREE.Scene();scene.add(root);
 const bytes=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true});
 const data=Buffer.from(bytes);if(data.readUInt32LE(0)!==0x46546c67)throw Error('Invalid GLB '+name);
 await writeFile('public/models/'+name+'.glb',data);
 let triangles=0;root.traverse(o=>{if(o.geometry)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
 manifest.push({name,file:name+'.glb',bytes:data.length,triangles,source:'Original Zolvency Labs procedural blueprint; no external asset'});
 root.traverse(o=>o.geometry?.dispose());
}
await mkdir('artifacts/authoring',{recursive:true});await writeFile('artifacts/authoring/catalog.json',JSON.stringify({palette,entries:catalog(),heroes:Object.fromEntries(Object.entries(modelParts).map(([k,v])=>[k,v()]))}));
await writeFile('public/models/manifest.json',JSON.stringify(manifest,null,2));
Object.values(geo).forEach(g=>g.dispose());Object.values(mats).forEach(m=>m.dispose());
console.log('Generated GLB models:',JSON.stringify(manifest));
