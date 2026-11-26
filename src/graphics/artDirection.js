import {ramp,windows} from './facilityCamera.js';
// Art direction candidates are authored independently of the camera's travel.
// All coordinates are metres in the facility's existing world space.
export const referenceFrames=[
 {name:'ORIGIN',p:.055,subject:'hangar / physical wordmark',palette:'graphite / teal'},
 {name:'BLOCKCHAIN',p:.205,subject:'live server faces',palette:'steel / muted mint'},
 {name:'QUANTUM',p:.935,subject:'suspended cryostat',palette:'amber / petrol'}
];
export const brandSurfaces={
 ORIGIN:{x:-3.5,y:4.6,z:-14.8,normal:1,width:7.4},
 CONVERGENCE:{x:-4.0,y:4.9,z:13.7,normal:-1,width:6.6}
};
export const stellarAngles={
 previous:[6.05,1.35,5.4],
 devices:[7.15,1.65,5.35],
 diagonal:[6.75,1.75,5.35],
 opposite:[6.35,1.65,3.98]
};
export function artAim(name,mobile,variant='devices'){
 if(name==='ORIGIN')return [-3.5,4.4,-14.8];
 if(name==='CONVERGENCE')return [-4,4.6,13.7];
 if(name==='STELLAR')return stellarAngles[variant]??stellarAngles.devices;
 if(name==='INTELLIGENCE')return mobile?[-4.1,1.75,-13.7]:[-4.65,1.82,-13.7];
 return null;
}
export function artEnvelope(card,p){
 const i=Math.max(0,windows.findLastIndex((v,j)=>j<windows.length-1&&p>=v)),a=windows[i],b=windows[i+1],t=Math.max(0,Math.min(1,(p-a)/(b-a))),hold=(card.hold-a)/(b-a);
 // Preserve the established quantum composition. Elsewhere let copy arrive in beats.
 const end=i===6?1:1-ramp(t,Math.max(hold+.08,.72),Math.max(hold+.16,.9));
 const hero=i===0?1:ramp(t,.12,.25);
 const headline=ramp(t,Math.max(.03,hold-.22),Math.max(.06,hold-.07));
 const body=ramp(t,Math.max(.10,hold-.02),Math.min(.96,hold+.16));
 const cue=i===0?ramp(t,.15,.28):0;
 return {hero:hero*end,headline:headline*end,body:body*end,cue:cue*end};
}
