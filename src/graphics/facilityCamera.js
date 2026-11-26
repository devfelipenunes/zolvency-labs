// Every shot is inside the same 20 x 30m hangar, including the inserted rooms.
export const windows=[0,.115,.31,.51,.65,.85,.95,1];
export const clamp=x=>Math.min(1,Math.max(0,x));
const ease=t=>t*t*(3-2*t);
const rad=x=>x*Math.PI/180;
// p, position in meters, yaw (0 = -Z), pitch, FOV. Explicit holds permit reading.
export const shots=[
 [0,[0,2,12.2],-5,7,68,'Arrival'],
 [.035,[0,2,10.6],-5,5,66,'Inside hangar'],
 [.08,[0,2,10.6],-5,5,66,'Introduction hold'],
 [.115,[1.1,1.9,9.7],26,1,61,'Blockchain approach'],
 [.17,[3.1,1.9,8.8],42,0,59,'Data infrastructure'],
 [.24,[3.1,1.9,8.8],42,0,59,'Blockchain hold'],
 [.28,[5.7,1.9,8.7],28,0,59,'Server frontage'],
 [.31,[7.72,1.85,8.25],0,0,57,'Stellar entrance'],
 [.345,[7.72,1.85,6.8],0,0,59,'Through glass door'],
 [.365,[7.72,1.85,5.25],-25,0,59,'Enter server room'],
 [.39,[7.72,1.85,4.66],-90,0,61,'Rack aisle'],
 [.415,[7.72,1.85,4.66],-90,0,61,'Financial infrastructure hold'],
 [.445,[7.72,1.85,5.45],-165,0,61,'Return through entrance'],
 [.475,[7.72,1.9,8.5],-180,0,62,'Exit server room'],
 [.51,[1.3,1.9,8.4],-95,0,64,'Cryptography approach'],
 [.55,[-2.5,1.9,6.2],-65,0,61,'Security wing'],
 [.59,[-5.5,1.8,4.65],0,0,60,'Portal approach'],
 [.625,[-5.5,1.8,2.5],0,0,58,'Corridor'],
 [.65,[-5.5,1.8,.2],0,0,59,'Authorized passage'],
 [.68,[-5.5,1.8,-2.3],0,0,60,'Door opens'],
 [.705,[-5.5,1.8,-3.25],0,0,61,'Intelligence room'],
 [.73,[-5.5,1.8,-3.25],0,0,61,'Intelligence hold'],
 [.755,[-5.5,1.8,-3.25],80,0,61,'Reveal side of operations'],
 [.78,[-5.5,1.8,-2.1],180,0,61,'Turn to central hall'],
 [.81,[-5.5,1.8,2.6],180,0,61,'Return through corridor'],
 [.835,[-5.5,1.8,4.7],180,0,62,'Exit into hall'],
 [.85,[-2.5,1.9,4.7],90,0,64,'Turn toward quantum'],
 [.865,[0,1.9,1.5],0,0,64,'Central aisle'],
 [.89,[0,1.9,-4],24,4,60,'Quantum approach'],
 [.92,[0,2,-7.2],67,7,57,'Cryostat'],
 [.95,[0,2,-7.2],67,7,57,'Quantum hold'],
 [.985,[0,2.4,-7.2],155,9,69,'Facility reveal'],
 [1,[0,2.4,-7.2],155,9,69,'Final hold']
];
// Shape-preserving C1 Hermite interpolation. Monotone per coordinate, no overshoot;
// duplicated values explicitly stop motion, unlike easing at every intermediate key.
const channels=shots.map(s=>[...s[1],s[2],s[3],s[4]]);
const times=shots.map(s=>s[0]);
const slopes=channels.map((v,i)=>v.map((x,k)=>{
 if(!i||i===channels.length-1)return 0;
 const h0=times[i]-times[i-1],h1=times[i+1]-times[i],a=(x-channels[i-1][k])/h0,b=(channels[i+1][k]-x)/h1;
 if(a*b<=0)return 0;return (3*(h0+h1))/((2*h1+h0)/a+(h1+2*h0)/b);
}));
export function cameraPose(progress,mobile=false){
 const p=clamp(Number.isFinite(progress)?progress:0);let i=times.findIndex((t,j)=>j<times.length-1&&p<=times[j+1]);if(i<0)i=times.length-2;
 const h=times[i+1]-times[i],t=(p-times[i])/h,u=t*t,v=u*t;
 const q=channels[i].map((a,k)=>(2*v-3*u+1)*a+(v-2*u+t)*h*slopes[i][k]+(-2*v+3*u)*channels[i+1][k]+(v-u)*h*slopes[i+1][k]);
 const position=q.slice(0,3),yaw=rad(q[3]),pitch=rad(q[4]+(mobile?4:0));
 const direction=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];
 return {position,target:position.map((x,k)=>x+direction[k]*5),fov:Math.min(79,q[5]+(mobile?10:0))};
}
export function storyProgress(scroll,starts,maxScroll){if(maxScroll<=0)return {progress:0,index:0};const y=scroll<=1?0:scroll>=maxScroll-1?maxScroll:Math.max(0,Math.min(maxScroll,scroll));const anchors=starts.map(s=>Math.max(0,Math.min(maxScroll,s)));let index=0;for(let i=1;i<anchors.length;i++)if(y>=anchors[i])index=i;const a=anchors[index],b=index===anchors.length-1?maxScroll:anchors[index+1],local=b>a?clamp((y-a)/(b-a)):1;return {index,progress:windows[index]+(windows[index+1]-windows[index])*local};}
export const ramp=(p,a,b)=>ease(clamp((p-a)/(b-a)));
export function facilityMotion(p){
 const [x,,z]=cameraPose(p).position,nearServer=(1-ramp(Math.abs(x-7.72),.8,1.6))*(1-ramp(z,8.25,9.2));
 const portal=(p>=.59&&p<=.845)?Math.max(ramp(p,.59,.65)*(1-ramp(p,.835,.85)),1-ramp(Math.abs(z+1.55),1.2,3.1)):0;
 return {blast:ramp(p,0,.085),serverDoor:Math.max(nearServer,ramp(p,.275,.31)*(1-ramp(p,.48,.505))),portal,crane:ramp(p,.10,.40),fans:ramp(p,.65,.79)*Math.PI*8,quantum:ramp(p,.85,.92),rack:ramp(p,.365,.39)*(1-ramp(p,.42,.445))};
}
