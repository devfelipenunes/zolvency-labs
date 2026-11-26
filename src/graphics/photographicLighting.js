import * as THREE from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {ramp} from './facilityCamera.js';
// Authored practical-light positions in world meters. Keep shadows motivated by the set.
export const looks=[
 {p:.055,fill:.40,key:.72,head:1.2,hall:.82,env:.46,exposure:1.12,fog:.010,accent:0xb8d8ef},
 {p:.205,fill:.32,key:.30,head:1.8,hall:.36,env:.43,exposure:1.08,fog:.017,accent:0xa3ddc8},
 {p:.405,fill:.29,key:.24,head:1.6,hall:.24,env:.40,exposure:1.10,fog:.020,accent:0xb7e2df},
 {p:.615,fill:.31,key:.19,head:1.4,hall:.18,env:.36,exposure:1.10,fog:.025,accent:0xb3c9e1},
 {p:.72,fill:.34,key:.27,head:1.5,hall:.23,env:.44,exposure:1.08,fog:.020,accent:0xc5dbed},
 {p:.935,fill:.31,key:.32,head:1.1,hall:.18,env:.51,exposure:1.13,fog:.015,accent:0xffdc9f},
 {p:.992,fill:.45,key:.78,head:1.2,hall:.74,env:.50,exposure:1.10,fog:.009,accent:0xc0e8ce}
];
export function photographicLook(p){
 const i=Math.max(0,looks.findLastIndex(l=>p>=l.p)),a=looks[i],b=looks[Math.min(i+1,looks.length-1)],t=a===b?0:ramp(p,a.p,b.p);
 const result={};for(const k of ['fill','key','head','hall','env','exposure','fog'])result[k]=a[k]+(b[k]-a[k])*t;
 result.accent=new THREE.Color(a.accent).lerp(new THREE.Color(b.accent),t);return result;
}
const practicals=[
 {name:'hangar-overhead',color:0xc9dcea,power:3.3,w:7,h:2,pos:[0,7.1,1],aim:[0,0,1],center:.045,width:.19},
 {name:'hangar-rim',color:0xf3d8b2,power:2.0,w:4,h:2,pos:[-7,6,-9],aim:[0,2,-5],center:.985,width:.14},
 {name:'server-overhead',color:0xd4f2e9,power:4.8,w:3.5,h:.9,pos:[5.5,2.9,5.2],aim:[5.5,.6,5.2],center:.34,width:.23},
 {name:'server-front',color:0xd6e3eb,power:3.2,w:2,h:2.2,pos:[3.8,2.4,8.4],aim:[5.4,1.5,5.5],center:.20,width:.16},
 {name:'security-threshold',color:0xc5d7f2,power:4.5,w:1.6,h:.5,pos:[-5.5,2.65,1.8],aim:[-5.5,.2,1.2],center:.61,width:.13},
 {name:'operations-ceiling',color:0xd9e7ef,power:5,w:3.4,h:1.2,pos:[-5.5,2.65,-6],aim:[-5.5,.8,-6],center:.72,width:.12},
 {name:'quantum-key',color:0xffe1b0,power:6,w:2.8,h:4,pos:[2.2,4.5,-6.7],aim:[4.7,2.8,-8.6],center:.935,width:.12},
 {name:'quantum-rim',color:0xb1d6f2,power:5,w:2,h:3,pos:[7.4,4.7,-10],aim:[4.7,2.8,-8.6],center:.935,width:.12}
];
// Reuse a fixed number of light slots. A zero-intensity RectAreaLight still
// contributes a loop iteration to WebGL's generated material shader.
export function activePracticals(p){
 return practicals.flatMap(s=>{const d=Math.abs(p-s.center);const intensity=d>=s.width?0:s.power*(1-ramp(d,0,s.width));return intensity>0?[{s,intensity}]:[];});
}
const edges=[0,1,...practicals.flatMap(s=>[Math.max(0,s.center-s.width),Math.min(1,s.center+s.width)])].sort((a,b)=>a-b);
export const practicalSlots=Math.max(...edges.map(p=>activePracticals(p).length),...edges.slice(1).map((p,i)=>activePracticals((p+edges[i])/2).length));
export function createPhotography(scene,{pooled=true,extended=false,noir=false,reactor=false,review=false}={}){
 RectAreaLightUniformsLib.init();
 const lights=Array.from({length:pooled?practicalSlots:practicals.length},(_,i)=>{const l=new THREE.RectAreaLight(0xffffff,0,1,1);l.name='practical-slot-'+i;scene.add(l);return {l,s:null};});
 const rim=new THREE.SpotLight(0xe9c28c,0,12,Math.PI/5,.65,2);rim.position.set(7.3,6.7,-10);rim.target.position.set(4.7,2.4,-8.6);if(reactor){rim.position.set(25.5,12,-4);rim.target.position.set(30,9,0);}scene.add(rim,rim.target);
 function configure(slot,s,intensity){const {l}=slot;if(slot.s!==s){l.color.setHex(s.color);l.width=s.w;l.height=s.h;const dz=extended&&s.name==='operations-ceiling'?-4.72:0;if(reactor&&s.name.startsWith('quantum-')){const isKey=s.name==='quantum-key';l.position.set(isKey?34.5:25.5,isKey?10:11,isKey?3.8:-3.8);l.lookAt(30,9,0);if(noir)l.color.setHex(isKey?0xffc98a:0x6cc8d4);}else{l.position.set(s.pos[0],s.pos[1],s.pos[2]+dz);l.lookAt(s.aim[0],s.aim[1],s.aim[2]+dz);}slot.s=s;}l.intensity=intensity*(noir?(s.name.startsWith('quantum-')?.84:review&&s.name.startsWith('server-')?1.30:review&&s.name==='operations-ceiling'?1.05:.68):1);}
 return {slots:lights.length,update(p){
  if(pooled){const active=activePracticals(p);for(const [i,slot] of lights.entries()){const a=active[i];if(a)configure(slot,a.s,a.intensity);else slot.l.intensity=0;}}
  else for(const [i,slot] of lights.entries()){const s=practicals[i],d=Math.abs(p-s.center);configure(slot,s,s.power*(1-ramp(d,0,s.width)));}
  rim.intensity=(noir?35:55)*(1-ramp(Math.abs(p-.935),.02,.12));return photographicLook(p);
 },dispose(){for(const {l} of lights)l.removeFromParent();rim.removeFromParent();rim.target.removeFromParent();}};
}
