// Conservative reachability for facility-managed resources. Traverse hidden roots too.
// Include direct material maps and shader uniforms; unknown registered textures remain retained.
export function liveResources(scene){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 function scan(v,seen=new Set()){if(!v||typeof v!=='object'||seen.has(v))return;seen.add(v);if(v.isTexture){textures.add(v);return;}if(Array.isArray(v)){for(const x of v)scan(x,seen);return;}if(Object.getPrototypeOf(v)===Object.prototype){for(const x of Object.values(v))scan(x,seen);}}
 scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){materials.add(m);for(const v of Object.values(m)){if(v?.isTexture)textures.add(v);}scan(m.uniforms);}});
 for(const t of [scene.background,scene.environment])if(t?.isTexture)textures.add(t);
 return {geometries,materials,textures};
}
export function classifyResources(scene,registered){
 const live=liveResources(scene),result={};
 for(const key of ['geometries','materials','textures']){const all=registered[key];result[key]={registered:all.size,reachable:[...all].filter(x=>live[key].has(x)).length,unreferenced:[...all].filter(x=>!live[key].has(x)).length};}
 return {live,result};
}
// Only known retired geometry/material objects are disposed, never unreferenced
// textures: onBeforeCompile may reference a texture outside the material fields.
export function releaseRetired(scene,registered){
 const {live,result}=classifyResources(scene,registered);
 for(const key of ['geometries','materials'])for(const resource of registered[key])if(!live[key].has(resource)){resource.dispose();registered[key].delete(resource);}
 return result;
}
export function shadowSignature(bones){
 const rows=[];
 for(const b of bones){let node=b.o,visible=true;while(node){if(!node.visible){visible=false;break;}node=node.parent;}if(!visible)continue;
  let caster=false;b.o.traverseVisible(o=>{if(o.isMesh&&o.castShadow)caster=true;});if(!caster)continue;
  const o=b.o;rows.push([b.id,...o.position.toArray().map(x=>Math.round(x*40)),...o.quaternion.toArray().map(x=>Math.round(x*80))].join(':'));
 }
 return rows.join('|');
}
