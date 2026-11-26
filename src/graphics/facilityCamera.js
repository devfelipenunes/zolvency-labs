// Every shot is inside the same 20 x 30m hangar, including the inserted rooms.
export const windows=[0,.115,.31,.51,.65,.79,.92,1];
export const clamp=x=>Math.min(1,Math.max(0,x));
const ease=t=>t*t*(3-2*t);
const rad=x=>x*Math.PI/180;
// p, position in meters, yaw (0 = -Z), pitch, FOV. Explicit holds permit reading.
export const shots=[
 [0,[0,2.0,12.2],-5,7,68,'Arrival'],
 [.035,[0,2,10.6],-5,5,66,'Inside hangar'],
 [.08,[0,2,10.6],-5,5,66,'Introduction hold'],
 [.115,[1.1,1.9,9.7],32,2,60,'Blockchain approach'],
 [.17,[3.1,1.9,8.5],43,1,57,'Data infrastructure'],
 [.24,[3.1,1.9,8.5],43,1,57,'Blockchain hold'],
 [.28,[5.6,1.9,8.7],12,0,56,'Server frontage'],
 [.31,[7.23,1.85,8.25],0,0,57,'Stellar entrance'],
 [.35,[7.23,1.85,7.75],-10,-1,58,'Server room threshold'],
 [.41,[7.23,1.85,7.75],-10,-1,58,'Financial infrastructure hold'],
 [.45,[5.4,1.9,8.6],-75,0,61,'Return to hall'],
 [.51,[1.3,1.9,7.8],-95,0,64,'Cryptography approach'],
 [.55,[-2.5,1.9,6.2],-65,0,61,'Security wing'],
 [.59,[-5.5,1.8,4.65],0,0,60,'Portal approach'],
 [.625,[-5.5,1.8,2.5],0,0,58,'Corridor'],
 [.65,[-5.5,1.8,.2],0,0,59,'Authorized passage'],
 [.68,[-5.5,1.8,-2.3],0,0,60,'Door opens'],
 [.715,[-5.5,1.8,-3.25],0,0,61,'Intelligence room'],
 [.74,[-5.5,1.8,-3.25],0,0,61,'Intelligence hold'],
 [.765,[-5.5,1.8,-3.25],180,0,61,'Return turn'],
 [.79,[-5.5,1.8,1.0],180,0,61,'Return through corridor'],
 [.815,[-5.5,1.8,4.7],180,0,62,'Exit into hall'],
 [.84,[-2.5,1.9,4.7],90,0,64,'Turn toward quantum'],
 [.86,[0,1.9,1.5],0,0,64,'Central aisle'],
 [.89,[0,1.9,-4.0],24,4,60,'Quantum approach'],
 [.92,[0,2.0,-7.2],67,7,57,'Cryostat'],
 [.95,[0,2.0,-7.2],67,7,57,'Quantum hold'],
 [.985,[0,2.4,-7.2],155,9,69,'Facility reveal'],
 [1,[0,2.4,-7.2],155,9,69,'Final hold']
];
export function cameraPose(progress,mobile=false){
 const p=clamp(Number.isFinite(progress)?progress:0);let i=shots.findIndex((k,j)=>j<shots.length-1&&p<=shots[j+1][0]);if(i<0)i=shots.length-2;
 const a=shots[i],b=shots[i+1],t=ease((p-a[0])/(b[0]-a[0])),mix=(x,y)=>x+(y-x)*t;
 const position=a[1].map((x,k)=>mix(x,b[1][k]));const yaw=rad(mix(a[2],b[2])),pitch=rad(mix(a[3],b[3])+(mobile?4:0));
 const direction=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];
 return {position,target:position.map((v,k)=>v+direction[k]*5),fov:Math.min(79,mix(a[4],b[4])+(mobile?10:0))};
}
export function storyProgress(scroll,starts,maxScroll){if(maxScroll<=0)return {progress:0,index:0};const y=scroll<=1?0:scroll>=maxScroll-1?maxScroll:Math.max(0,Math.min(maxScroll,scroll));const anchors=starts.map(s=>Math.max(0,Math.min(maxScroll,s)));let index=0;for(let i=1;i<anchors.length;i++)if(y>=anchors[i])index=i;const a=anchors[index],b=index===anchors.length-1?maxScroll:anchors[index+1],local=b>a?clamp((y-a)/(b-a)):1;return {index,progress:windows[index]+(windows[index+1]-windows[index])*local};}
export const ramp=(p,a,b)=>ease(clamp((p-a)/(b-a)));
export function facilityMotion(p){return {blast:ramp(p,0,.085),serverDoor:ramp(p,.28,.35)*(1-ramp(p,.41,.48)),portal:ramp(p,.59,.655)*(1-ramp(p,.81,.84)),crane:ramp(p,.10,.40),fans:ramp(p,.65,.79)*Math.PI*8,quantum:ramp(p,.85,.92)};}
