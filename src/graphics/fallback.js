import { cameraPose,viewBasis,dot,sub } from './camera.js';
import { makeScene } from './world.js';
export function createFallback(canvas){
 const ctx=canvas.getContext('2d');if(!ctx)return {resize(){},draw(){},dispose(){}};
 const world=makeScene(),host=canvas.parentElement;
 const color={accent:[165,224,184],metal:[106,140,146],porcelain:[208,215,205]};
 function resize(){const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
 function draw(p){
 const w=innerWidth,h=innerHeight,pose=cameraPose(p,w<720),basis=viewBasis(pose),f=h/(2*Math.tan(pose.fov*Math.PI/360));ctx.clearRect(0,0,w,h);
 function project(v){const rel=sub(v,pose.position),z=dot(rel,basis.forward);if(z<.25||z>150)return null;return [w/2+dot(rel,basis.right)*f/z,h/2-dot(rel,basis.up)*f/z,z];}
 const commands=[];
 for(const path of world.paths)for(let i=1;i<path.points.length;i++){const a=project(path.points[i-1]),b=project(path.points[i]);if(!a||!b)continue;const depth=(a[2]+b[2])/2;commands.push({type:'line',a,b,depth,kind:path.kind,width:Math.min(60,Math.max(.5,2*path.radius*f/depth))});}
 for(const o of world.objects){
  if(o.shape==='sphere'){const q=project(o.position);if(q)commands.push({type:'dot',q,depth:q[2],kind:o.kind,radius:Math.max(.5,o.radius*f/q[2])});continue;}
  const corners=Array.from({length:8},(_,i)=>project(o.position.map((v,k)=>v+((i>>k)&1?1:-1)*o.size[k]/2)));
  for(const [i,face] of [[0,[0,1,3,2]],[1,[4,5,7,6]],[2,[0,1,5,4]],[3,[2,3,7,6]],[4,[0,2,6,4]],[5,[1,3,7,5]]]){const q=face.map(j=>corners[j]);if(q.some(v=>!v))continue;commands.push({type:'face',q,depth:q.reduce((n,v)=>n+v[2],0)/4,kind:o.kind,shade:[.65,.84,.6,1,.76,.9][i]});}
 }
 commands.sort((a,b)=>b.depth-a.depth);
 ctx.lineCap='round';for(const c of commands){const fade=Math.max(.05,1-c.depth/145),rgb=color[c.kind]||color.metal;const shade=c.shade??1;const rgba='rgba('+rgb.map(v=>Math.round(v*shade)).join(',')+','+(fade*(c.type==='line'?.82:.96))+')';ctx.beginPath();if(c.type==='line'){ctx.strokeStyle=rgba;ctx.lineWidth=c.width;ctx.moveTo(c.a[0],c.a[1]);ctx.lineTo(c.b[0],c.b[1]);ctx.stroke();}else if(c.type==='dot'){ctx.fillStyle=rgba;ctx.arc(c.q[0],c.q[1],c.radius,0,Math.PI*2);ctx.fill();}else{ctx.fillStyle=rgba;c.q.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(205,230,215,'+(fade*.23)+')';ctx.lineWidth=.7;ctx.stroke();}}
 host.dataset.pose=JSON.stringify(pose);host.dataset.progress=String(p);for(const key of ['geometries','drawCalls','gpuGeometries','triangles','submitMs'])delete host.dataset[key];
 }
 return {resize,draw,dispose(){ctx.clearRect(0,0,innerWidth,innerHeight)}};
}
