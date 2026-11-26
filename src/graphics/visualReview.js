import * as THREE from 'three';
import {ramp} from './facilityCamera.js';
import {noirPose,noirGrade} from './noirDirection.js';
export const glassTreatments={
 clear:{roughness:.025,tint:0xffffff,env:.55},
 smoke:{roughness:.065,tint:0xe5f5f3,env:.38},
 reflection:{roughness:.035,tint:0xf5ffff,env:.15}
};
export function originalFinish(m){return {color:m.color?.clone(),roughness:m.roughness,emissive:m.emissive?.clone(),emissiveIntensity:m.emissiveIntensity,envMapIntensity:m.envMapIntensity};}
export function finishMaterial(m,original,id,variant='clear'){
 const name=m.name??'';
 if(id==='servers'&&/glass/i.test(name)){
  const g=glassTreatments[variant]??glassTreatments.clear;
  m.color?.copy(original.color).multiply(new THREE.Color(g.tint));
  m.roughness=g.roughness;m.envMapIntensity=g.env;
  // Retain original transmission, thickness, IOR, texture maps and attenuation.
  return 'server-glass';
 }
 if(/ceiling_light/i.test(name)){
  m.color?.setHex(0x657d86);m.emissive?.setHex(0x90b0ba);m.emissiveIntensity=.30;
 }else if(id==='servers'&&!/glass|light|led|glow|screen/i.test(name)){
  if(original.color)m.color?.copy(original.color).multiply(new THREE.Color(0xd0e1e0));
  m.roughness=original.roughness??.4;
 }else if(id==='bridge'||id==='reactor-room'){
  if(original.color&&!/light|glow|screen|led|glass/i.test(name))m.color?.copy(original.color).multiply(new THREE.Color(0xb7c7c8));
 }
 return null;
}
// Lift subject exposure locally rather than raising all rooms at once.
export function reviewGrade(look,p){
 const base=noirGrade(look),rack=ramp(p,.105,.17)*(1-ramp(p,.415,.49)),ops=ramp(p,.68,.715)*(1-ramp(p,.74,.81)),quantum=ramp(p,.84,.90)*(1-ramp(p,.95,.97));
 return {...base,fill:look.fill*(.39+.20*rack+.10*ops),key:look.key*.47,head:look.head*(.25+.32*rack+.14*ops),hall:look.hall*.40,env:look.env*(.43+.23*rack+.12*quantum),exposure:look.exposure*(.80+.06*rack+.025*ops),fog:base.fog};
}
export const visualShots=[
 {name:'ORIGIN',a:0,b:.035,c:.08,z:.115,hold:.055,aim:[-1.8,2.8,-8],fov:58},
 {name:'BLOCKCHAIN',a:.145,b:.17,c:.24,z:.28,hold:.205,aim:[5.5,1.65,5.1],fov:52},
 {name:'STELLAR',a:.365,b:.39,c:.415,z:.445,hold:.405,aim:[3.55,1.65,4.66],fov:56},
 {name:'CRYPTOGRAPHY',a:.59,b:.615,c:.65,z:.68,hold:.625,aim:[-5.5,1.60,-1.55],fov:57},
 {name:'INTELLIGENCE',a:.705,b:.715,c:.74,z:.755,hold:.73,aim:[-5.5,1.95,-11.7],fov:57},
 {name:'QUANTUM',a:.865,b:.91,c:.95,z:.95,hold:.935,aim:[30,8.75,0],fov:66},
 {name:'CONVERGENCE',a:.985,b:.99,c:1,z:1,hold:.992,aim:[-1,4.0,8],fov:65}
];
export function reviewPose(p,mobile=false,reactor=true){
 const pose=noirPose(p,mobile,reactor),s=visualShots.find(s=>p>=s.a&&p<=s.z);if(!s||(!reactor&&s.name==='QUANTUM'))return pose;
 const w=(s.a===0?1:ramp(p,s.a,s.b))*(s.c===s.z?1:1-ramp(p,s.c,s.z));
 return {...pose,target:pose.target.map((x,i)=>x+(s.aim[i]-x)*w*.78),fov:pose.fov+(s.fov+(mobile?9:0)-pose.fov)*w*.8};
}
