import { TAU,N,S,clamp,pose,point,visible } from './geometry.js';
export function createFallback(canvas){const ctx=canvas.getContext('2d');
if(!ctx)return {resize(){},draw(){},dispose(){}};
function resize(){let dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
function draw(p){const w=innerWidth,h=innerHeight,m=w<720,o=pose(p);ctx.clearRect(0,0,w,h);const cx=w*(m?.51:.72),cy=h*(m?.32:.48),scale=Math.min(w*(m?.115:.105),h*(m?.11:.16));function proj(v){let k=8/(8-v[2]);return [cx+v[0]*scale*k,cy-v[1]*scale*k,k]}
let halo=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.min(w,h)*.65);halo.addColorStop(0,'rgba(88,132,124,.17)');halo.addColorStop(1,'rgba(3,8,11,0)');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
for(let j=N-1;j>=0;j--){let a=visible(j,p);if(a<=0)continue;let n=Math.floor(S*a),primary=j%7===0;ctx.beginPath();for(let k=0;k<=n;k++){let q=proj(point(j,k/S,o));k?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])}ctx.strokeStyle=primary?'rgba(198,236,219,.92)':('rgba('+(100+j*3)+','+(151+j*2)+','+(154+j*2)+','+(.27+j/N*.36)+')');ctx.lineWidth=primary?2.2:.85;ctx.shadowBlur=primary?11:0;ctx.shadowColor='#a6e1c7';ctx.stroke();if(primary&&n>0){let q=proj(point(j,n/S,o));ctx.beginPath();ctx.arc(q[0],q[1],2,0,TAU);ctx.fillStyle='#f1ffe8';ctx.fill()}}
ctx.shadowBlur=0;for(let k=0;k<5;k++){let a=p*TAU+k*TAU/5;let q=proj(point(k*5,.37+.25*Math.sin(a),o));ctx.fillStyle='#e6f9dfaa';ctx.fillRect(q[0]-1,q[1]-1,2,2)}
}
return {resize,draw,dispose(){ctx.clearRect(0,0,innerWidth,innerHeight)}};}
