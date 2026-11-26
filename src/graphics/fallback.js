import { cameraPose,viewBasis,dot,sub } from './camera.js';
import { makeWorld } from './world.js';
export function createFallback(canvas){
 const ctx=canvas.getContext('2d');if(!ctx)return {resize(){},draw(){},dispose(){}};
 const world=makeWorld(),host=canvas.parentElement;
 function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
 function draw(p){
 const w=innerWidth,h=innerHeight,pose=cameraPose(p,w<720),basis=viewBasis(pose),f=h/(2*Math.tan(pose.fov*Math.PI/360));ctx.clearRect(0,0,w,h);
 function project(v){const rel=sub(v,pose.position),z=dot(rel,basis.forward);if(z<.25)return null;return [w/2+dot(rel,basis.right)*f/z,h/2-dot(rel,basis.up)*f/z,z];}
 const segments=[];
 for(const path of world)for(let i=1;i<path.points.length;i++){const a=project(path.points[i-1]),b=project(path.points[i]);if(!a||!b)continue;const depth=(a[2]+b[2])/2;segments.push({a,b,depth,kind:path.kind,width:Math.min(70,Math.max(.5,2*path.radius*f/depth))});}
 segments.sort((a,b)=>b.depth-a.depth);
 ctx.lineCap='round';for(const s of segments){const fade=Math.max(.14,1-s.depth/60);ctx.strokeStyle=s.kind==='accent'?'rgba(143,203,172,'+fade+')':'rgba(164,180,180,'+fade*.65+')';ctx.lineWidth=s.width;ctx.beginPath();ctx.moveTo(s.a[0],s.a[1]);ctx.lineTo(s.b[0],s.b[1]);ctx.stroke();}
 host.dataset.pose=JSON.stringify(pose);host.dataset.progress=String(p);delete host.dataset.geometries;delete host.dataset.drawCalls;
 }
 return {resize,draw,dispose(){ctx.clearRect(0,0,innerWidth,innerHeight)}};
}
