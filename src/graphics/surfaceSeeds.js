// Coarse screen-ray samples identify candidate coplanar patches, never certified mounts.
// Keep identity, orientation, and coplanarity conservative; no hidden surface substitution.
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export function surfaceSeeds(hits,rows,cols,{planeTolerance=.025,minNormalDot=.98}={}){
 if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||cols<1||hits.length!==rows*cols)throw Error('invalid sample grid');
 const out=[];
 for(const [w,h] of [[9,5],[7,5],[7,3],[5,3]])for(let y=0;y+h<=rows;y++)for(let x=0;x+w<=cols;x++){
  const c=hits[(y+(h-1)/2)*cols+x+(w-1)/2];if(!c?.eligible)continue;
  let valid=true;for(let j=y;j<y+h&&valid;j++)for(let i=x;i<x+w;i++){
   const q=hits[j*cols+i];if(!q?.eligible||q.key!==c.key||dot(q.normal,c.normal)<minNormalDot||Math.abs(dot(sub(q.point,c.point),c.normal))>planeTolerance){valid=false;break;}
  }
  if(!valid)continue;
  const a=hits[y*cols+x],b=hits[(y+h-1)*cols+x+w-1];
  out.push({mesh:c.mesh,material:c.material,center:c.point,normal:c.normal,uv:[a.uv,b.uv],samples:w*h,grid:[x,y,w,h],facing:c.facing});
 }
 return out.sort((a,b)=>b.samples-a.samples||b.facing-a.facing||a.grid[1]-b.grid[1]||a.grid[0]-b.grid[0]).slice(0,20);
}
