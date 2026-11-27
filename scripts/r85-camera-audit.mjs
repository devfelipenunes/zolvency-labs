// Offline camera audit of real browser pose captures. Progress is not time.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const norm=v=>Math.hypot(...v),sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(a,b)/(norm(a)*norm(b)||1))))*180/Math.PI;
export function auditCamera(report){
 const samples=[...new Map(report.rows.map(({a})=>[a.p,a])).values()].sort((a,b)=>a.p-b.p).map(a=>({...a,pose:typeof a.pose==='string'?JSON.parse(a.pose):a.pose}));
 const edges=[];let prev=null;
 for(let i=1;i<samples.length;i++){
  const a=samples[i-1],b=samples[i],dp=b.p-a.p;
  if(dp<1e-5||Math.max(a.mask,b.mask)>=.65||a.motion?.handoff?.index!==b.motion?.handoff?.index){prev=null;continue;}
  const velocity=sub(b.pose.position,a.pose.position).map(x=>x/dp);
  const rotation=angle(sub(a.pose.target,a.pose.position),sub(b.pose.target,b.pose.position))/dp;
  const edge={from:a.p,to:b.p,dp,speed:norm(velocity),turnDegreesPerProgress:rotation,fovChangePerProgress:Math.abs(b.pose.fov-a.pose.fov)/dp,acceleration:prev?norm(sub(velocity,prev.velocity))/((dp+prev.dp)/2):null};
  edges.push(edge);prev={dp,velocity};
 }
 return {width:report.width,sampleCount:samples.length,edgeCount:edges.length,units:'world units or degrees per normalized progress; not seconds',hotspots:[...edges].sort((a,b)=>(b.acceleration??0)-(a.acceleration??0)).slice(0,12),edges};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [input,output]=process.argv.slice(2);if(!input)throw Error('usage: node scripts/r85-camera-audit.mjs report.json [output.json]');
 const result=auditCamera(JSON.parse(await readFile(input,'utf8'))),json=JSON.stringify(result,null,2);if(output)await writeFile(output,json);else console.log(json);
}
