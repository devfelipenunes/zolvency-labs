// Conservative bounding-sphere clearance for real glyph extents. The result
// is a sufficient nonintersection condition only for the sampled pair and pose;
// overlapping spheres do not prove actual mesh intersection.
export function fitClearance(poses,{gap=.008,minRatio=.68,weight=1}={}){
 const limits=poses.map(()=>1);
 for(let i=0;i<poses.length;i++)for(let j=i+1;j<poses.length;j++){
  const a=poses[i],b=poses[j],distance=Math.hypot(...a.position.map((v,k)=>v-b.position[k]));
  const total=a.radius*a.scale+b.radius*b.scale;if(total<=0)continue;
  const ratio=Math.max(minRatio,Math.min(1,(distance-gap)/total));
  limits[i]=Math.min(limits[i],ratio);limits[j]=Math.min(limits[j],ratio);
 }
 return poses.map((p,i)=>p.scale*(1-(1-limits[i])*weight));
}
export function clearanceReport(poses,gap=.008){
 let candidates=0,overlaps=0,minGap=Infinity;const pairs=[];
 for(let i=0;i<poses.length;i++)for(let j=i+1;j<poses.length;j++){
  const a=poses[i],b=poses[j];if(!a.inFrame||!b.inFrame)continue;
  const distance=Math.hypot(...a.position.map((v,k)=>v-b.position[k])),d=distance-a.radius*a.scale-b.radius*b.scale;
  candidates++;minGap=Math.min(minGap,d);if(d<gap){overlaps++;pairs.push({a:a.id,b:b.id,gap:d});}
 }
 return {candidates,overlaps,minGap:Number.isFinite(minGap)?minGap:null,pairs};
}
