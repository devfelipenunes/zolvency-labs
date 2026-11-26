// Existing opaque panel normal maps only. Preserve texture ownership, normal Y sign and material roughness.
export function applyPanelDetail(root,id,mode='normal'){
 if(!['normal','roughness'].includes(mode))return 0;
 if(!['hangar','bridge','portal'].includes(id))return 0;
 const seen=new Set();let count=0;
 root.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(!m||seen.has(m))continue;seen.add(m);
  if(!m.isMeshStandardMaterial||!/^scifi_panels_[12]$/.test(m.name??'')||!m.normalMap||!m.normalScale||m.transparent||(m.transmission??0)>0)continue;
  if(mode==='normal'){m.normalScale.multiplyScalar(1.2);count++;}
  else if(Number.isFinite(m.roughness)){const next=Math.max(.35,m.roughness-.12);if(next<m.roughness){m.roughness=next;count++;}}
 }});
 return count;
}
