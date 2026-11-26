import * as THREE from 'three';
import {ramp} from './facilityCamera.js';
import {noirPose,noirGrade} from './noirDirection.js';
import {artAim} from './artDirection.js';
export const glassTreatments={
 split:{roughness:.045,tint:0xdce9e9,env:.14},
 clear:{roughness:.025,tint:0xffffff,env:.55},
 smoke:{roughness:.065,tint:0xe5f5f3,env:.38},
 reflection:{roughness:.035,tint:0xf5ffff,env:.15}
};
export function originalFinish(m){return {color:m.color?.clone(),roughness:m.roughness,emissive:m.emissive?.clone(),emissiveIntensity:m.emissiveIntensity,envMapIntensity:m.envMapIntensity};}
export function finishMaterial(m,original,id,variant='split',floorVariant='default'){
 const name=m.name??'';
 if(id==='servers'&&/glass/i.test(name)){
  const g=glassTreatments[variant]??glassTreatments.clear;
  m.color?.copy(original.color).multiply(new THREE.Color(g.tint));
  m.roughness=g.roughness;m.envMapIntensity=g.env;
  if(variant==='split'){
   const rack=/rack/i.test(name);
   m.color?.copy(original.color).multiply(new THREE.Color(rack?0xf2faf8:0xdce9e9));
   m.roughness=rack?.035:.055;m.envMapIntensity=rack?.28:.10;
   // Direct area-light reflection is independent of environment intensity.
   if('specularIntensity' in m)m.specularIntensity=rack?.48:.12;
   if('clearcoat' in m)m.clearcoat=0;
  }
  // Retain original transmission, thickness, IOR, texture maps and attenuation.
  return 'server-glass';
 }
 if(id==='hangar'&&/floor/i.test(name)){if(original.color)m.color?.copy(original.color);if(floorVariant==='original'){m.roughness=original.roughness??m.roughness;}else{if(original.color)m.color?.multiply(new THREE.Color(floorVariant==='matte'?0x566568:0x687a7a));m.roughness=Math.max(floorVariant==='matte'?.88:.65,m.roughness??0);}}
 else if(/ceiling_light/i.test(name)){
  m.color?.setHex(0x657d86);m.emissive?.setHex(0x90b0ba);m.emissiveIntensity=id==='corridor'||id==='portal'||id==='corridor-extension'?.075:id==='servers'?.12:.24;
 }else if(id==='servers'&&/led/i.test(name)){
  m.emissive?.setHex(/amber/i.test(name)?0xffb35a:/blue/i.test(name)?0x80caff:0x69d5ab);m.emissiveIntensity=1.8;
 }else if(id==='bridge'&&/screen/i.test(name)){m.emissiveIntensity=.95;
 }else if(id==='servers'&&!/glass|light|led|glow|screen/i.test(name)){
  if(original.color)m.color?.copy(original.color).multiply(new THREE.Color(/floor|ceiling|wall/i.test(name)?0xa2b6b7:0xd0e1e0));
  m.roughness=original.roughness??.4;
 }else if(id==='bridge'||id==='reactor-room'){
  if(original.color&&!/light|glow|screen|led|glass/i.test(name))m.color?.copy(original.color).multiply(new THREE.Color(0xb7c7c8));
 }
 return null;
}
// Lift subject exposure locally rather than raising all rooms at once.
export function reviewGrade(look,p,lightVariant='default'){
 const base=noirGrade(look),rack=ramp(p,.105,.17)*(1-ramp(p,.415,.49)),ops=ramp(p,.68,.715)*(1-ramp(p,.74,.81)),quantum=ramp(p,.84,.90)*(1-ramp(p,.95,.97));
 return {...base,fill:look.fill*(.39+.20*rack+.10*ops),key:look.key*.47,head:look.head*(.24+.08*rack+.18*ops+(lightVariant==='ops-focus'?.10*ops:0)),hall:look.hall*.40*(1-(lightVariant==='ops-focus'?.18*ops:0)),env:look.env*(.43+.10*rack+.12*quantum),exposure:look.exposure*(.80-.025*rack+.025*ops),fog:base.fog};
}
export const visualShots=[
 {name:'ORIGIN',a:0,b:.035,c:.08,z:.115,hold:.055,aim:[-3.7,3.8,-8],fov:53},
 {name:'BLOCKCHAIN',a:.145,b:.17,c:.24,z:.28,hold:.205,aim:[5.65,1.48,3.95],fov:63},
 {name:'STELLAR',a:.365,b:.39,c:.415,z:.445,hold:.405,aim:[6.05,1.35,5.4],fov:46},
 {name:'CRYPTOGRAPHY',a:.59,b:.615,c:.65,z:.68,hold:.625,aim:[-5.5,1.35,-1.55],fov:52},
 {name:'INTELLIGENCE',a:.705,b:.715,c:.74,z:.755,hold:.73,aim:[-3.9,1.7,-13.4],fov:54},
 {name:'QUANTUM',a:.865,b:.91,c:.95,z:.95,hold:.935,aim:[30,8.75,0],fov:66},
 {name:'CONVERGENCE',a:.985,b:.99,c:1,z:1,hold:.992,aim:[5.4,4.8,9.5],fov:56}
];
// Retime only the existing door/aisle path, keeping chapter progress separate from spatial travel.
const travelKeys=[[.115,.115],[.145,.28],[.17,.39],[.24,.39],[.31,.39],[.365,.40],[.415,.415],[.445,.445]];
export function serverTravel(p){if(p<=.115||p>=.445)return p;const i=travelKeys.findIndex((k,i)=>i<travelKeys.length-1&&p<=travelKeys[i+1][0]);const [a,x]=travelKeys[i],[b,y]=travelKeys[i+1];return x+(y-x)*ramp(p,a,b);}
export function reviewPose(p,mobile=false,reactor=true,route='aisle',angle='devices',art=true,composition='default'){
 const travel=route==='facade'?p:serverTravel(p);const base=noirPose(travel,mobile,reactor),slide=route==='facade'?0:.58*ramp(p,.255,.365)*(1-ramp(p,.415,.445));const pose={...base,position:[base.position[0]-slide,base.position[1],base.position[2]],target:[base.target[0]-slide,base.target[1],base.target[2]-0]};const s=visualShots.find(s=>p>=s.a&&p<=s.z);if(!s||(!reactor&&s.name==='QUANTUM'))return pose;
 const w=(s.a===0?1:ramp(p,s.a,s.b))*(s.c===s.z?1:1-ramp(p,s.c,s.z));
 const aim=route==='facade'&&s.name==='BLOCKCHAIN'?[6.35,1.65,5]:(art?artAim(s.name,mobile,angle,composition):null)??s.aim;
 const blend=art&&s.name==='STELLAR'?1:.90;
 const lens=s.name==='ORIGIN'&&composition==='close'?42:s.fov;
 return {...pose,target:pose.target.map((x,i)=>x+(aim[i]-x)*w*blend),fov:pose.fov+(lens+(mobile?9:0)-pose.fov)*w*.8};
}
