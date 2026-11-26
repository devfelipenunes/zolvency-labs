import {ramp} from './facilityCamera.js';
export const composedTracks=[
 {name:'stellar',start:.35,enter:.37,hold:.405,end:.415,keys:[
 [[7.14,1.85,4.66],[2.8,1.55,4.66],65],[[6.15,1.65,4.66],[3.7,1.5,4.55],60],[[4.85,1.55,4.66],[3.5,1.55,3.95],55],[[3.7,1.75,4.66],[3.38,1.52,4.03],68]]},
 {name:'office',start:.705,enter:.718,hold:.73,end:.755,approach:[
 [[-5.5,1.8,-8.15],[-5.5,1.6,-10.2],64],
 [[-6.4,1.8,-8.15],[-6.4,1.65,-11.5],64],
 [[-6.4,1.75,-13.96],[-5.5,1.55,-12.9],66]
 ],keys:[
 [[-5.5,1.65,-13.96],[-5.5,1.55,-13],66],[[-6.38,1.78,-13.7],[-5.45,1.45,-12.1],60],[[-6.68,2.05,-12.65],[-5.1,1.3,-11],55],[[-6.05,2.15,-11.75],[-5.28,1.44,-10.96],66]]},
 {name:'quantum',start:.875,enter:.90,hold:.935,end:.95,keys:[
 [[34.9,6.7,5.4],[30,8.8,0],65.8],[[33.8,6.1,4.5],[30,8.2,0],62],[[31.9,5.5,4.2],[30,7.8,0],61],[[30,4.8,4.8],[29.55,7,0],70]]}
];
const lerp=(a,b,k)=>a+(b-a)*k;
const mix=(a,b,k)=>({position:a.position.map((v,i)=>lerp(v,b.position[i],k)),target:a.target.map((v,i)=>lerp(v,b.target[i],k)),fov:lerp(a.fov,b.fov,k)});
const pose=k=>({position:k[0].slice(),target:k[1].slice(),fov:k[2]});
export function composedRailMode(search=''){const q=new URLSearchParams(search);return q.get('experience')==='editorial'&&q.get('direction')==='staged'&&q.get('rail')==='composed'&&!['space','route','look','art','stellar','composition'].some(k=>q.has(k))?'composed':'control';}
export function composedPose(p,mobile,rail){
 const original=rail(p,mobile);if(mobile)return original;
 const track=composedTracks.find(s=>p>=s.start&&p<=s.end);if(!track)return original;
 if(p<track.enter){
  if(!track.approach)return mix(original,pose(track.keys[0]),ramp(p,track.start,track.enter));
  const nodes=[rail(track.start,mobile),...track.approach.map(pose),pose(track.keys[0])],u=(p-track.start)/(track.enter-track.start)*(nodes.length-1),i=Math.min(nodes.length-2,Math.floor(u)),t=u-i;
  return mix(nodes[i],nodes[i+1],t*t*(3-2*t));
 }
 if(p>=track.hold)return pose(track.keys.at(-1));
 const u=Math.min(3,Math.max(0,(p-track.enter)/(track.hold-track.enter)*3)),i=Math.min(2,Math.floor(u)),t=u-i;
 return mix(pose(track.keys[i]),pose(track.keys[i+1]),t*t*(3-2*t));
}
