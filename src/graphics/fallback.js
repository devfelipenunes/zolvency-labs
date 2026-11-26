import {cameraPose,viewBasis,dot,sub} from './camera.js';
import {makeScene,objectTransform} from './world.js';
export function createFallback(canvas){
 const ctx=canvas.getContext('2d'),world=makeScene(),host=canvas.parentElement;
 const color={accent:[169,231,199],titanium:[206,215,215],gold:[190,165,112],dark:[70,91,100]};
 function resize(){if(!ctx)return;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
 function draw(p){const pose=cameraPose(p,innerWidth<720);host.dataset.pose=JSON.stringify(pose);host.dataset.progress=String(p);for(const key of ['geometries','drawCalls','gpuGeometries','triangles','submitMs','assets'])delete host.dataset[key];if(!ctx)return;
 const w=innerWidth,h=innerHeight,basis=viewBasis(pose),f=h/(2*Math.tan(pose.fov*Math.PI/360));ctx.clearRect(0,0,w,h);
 function project(v){const rel=sub(v,pose.position),z=dot(rel,basis.forward);if(z<.25||z>85)return null;return [w/2+dot(rel,basis.right)*f/z,h/2-dot(rel,basis.up)*f/z,z];}
 const commands=[];for(const path of world.paths){if(Math.abs(path.points[0][2]-pose.position[2])>65)continue;for(let i=1;i<path.points.length;i++){const a=project(path.points[i-1]),b=project(path.points[i]);if(a&&b)commands.push({type:'line',a,b,depth:(a[2]+b[2])/2,kind:path.kind,width:Math.min(55,Math.max(.6,2*path.radius*f/((a[2]+b[2])/2)))});}}
 for(const o of world.objects){if(Math.abs(o.position[2]-pose.position[2])>55)continue;const pos=objectTransform(o,p).position;
 if(o.shape==='sphere'){const q=project(pos);if(q)commands.push({type:'dot',q,depth:q[2],kind:o.kind,radius:Math.max(.6,o.size[0]*f/(2*q[2]))});continue;}
 const corners=Array.from({length:8},(_,i)=>project(pos.map((v,k)=>v+((i>>k)&1?1:-1)*o.size[k]/2)));
 if(o.shape==='torus'||o.shape==='cylinder'){const q=project(pos);if(q){const radius=o.size[0]*.5*f/q[2];commands.push({type:'ring',q,depth:q[2],kind:o.kind,radius,width:Math.max(.9,o.size[1]*f/q[2])});}continue;}
 for(const [i,face] of [[0,[0,1,3,2]],[1,[4,5,7,6]],[2,[0,1,5,4]],[3,[2,3,7,6]],[4,[0,2,6,4]],[5,[1,3,7,5]]]){const q=face.map(j=>corners[j]);if(q.some(v=>!v))continue;commands.push({type:'face',q,depth:q.reduce((n,v)=>n+v[2],0)/4,kind:o.kind,shade:[.62,.78,.6,1,.76,.9][i]});}}
 commands.sort((a,b)=>b.depth-a.depth);ctx.lineCap='round';
 for(const c of commands){const fade=Math.max(.07,1-c.depth/85),rgb=color[c.kind]||color.titanium,rgba='rgba('+rgb.map(v=>Math.round(v*(c.shade??1))).join(',')+','+fade*.9+')';ctx.beginPath();if(c.type==='line'){ctx.strokeStyle=rgba;ctx.lineWidth=c.width;ctx.moveTo(c.a[0],c.a[1]);ctx.lineTo(c.b[0],c.b[1]);ctx.stroke();}else if(c.type==='dot'){ctx.fillStyle=rgba;ctx.arc(c.q[0],c.q[1],c.radius,0,Math.PI*2);ctx.fill();}else if(c.type==='ring'){ctx.strokeStyle=rgba;ctx.lineWidth=Math.min(30,c.width);ctx.ellipse(c.q[0],c.q[1],Math.max(.1,c.radius),Math.max(.1,c.radius*.34),0,0,Math.PI*2);ctx.stroke();}else{ctx.fillStyle=rgba;c.q.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fill();}}
 }
 return {resize,draw,dispose(){ctx?.clearRect(0,0,innerWidth,innerHeight)}};
}
