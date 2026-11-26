import {ramp,windows} from './facilityCamera.js';
import {reactorStudyPose} from './reactorStudy.js';
import {extendedPose} from './extendedInteriors.js';

// Keep the collision-tested camera positions; compose the shot with its lens and target.
export function noirPose(p,mobile=false,reactor=true){
 const pose=reactor?reactorStudyPose(p,mobile):extendedPose(p,mobile);
 if(p>=.865&&p<=.95&&reactor){
  const t=ramp(p,.865,.915);
  return {...pose,target:[30.35,5.8+3.05*t,0],fov:mobile?74:65};
 }
 if(p<=.115){
  const t=1-ramp(p,.08,.115);
  return {...pose,target:[pose.target[0]-2.2*t,pose.target[1]+.2*t,pose.target[2]],fov:pose.fov-3*t};
 }
 const focus=[{a:.145,b:.17,c:.24,z:.28,target:[5.65,2.05,6.0]},{a:.365,b:.39,c:.415,z:.445,target:[3.7,1.85,4.4]},{a:.59,b:.615,c:.65,z:.68,target:[-5.5,1.75,-1.55]},{a:.705,b:.715,c:.74,z:.755,target:[-4.8,1.8,-11.7]}].find(s=>p>=s.a&&p<=s.z);if(focus){const t=ramp(p,focus.a,focus.b)*(1-ramp(p,focus.c,focus.z))*.42;return {...pose,target:pose.target.map((x,i)=>x+(focus.target[i]-x)*t)};}return pose;
}
export function editorialMotion(p){
 const i=Math.max(0,windows.findLastIndex((v,j)=>j<windows.length-1&&p>=v)),a=windows[i],b=windows[i+1],local=Math.max(0,Math.min(1,(p-a)/(b-a)));
 const enter=ramp(local,0,.24),exit=i===6?0:ramp(local,.84,1);
 return {chapter:i,local,enter,exit,drift:(i%2?1:-1)*(1-enter)*16,depth:1-.025*(1-enter)};
}
export function noirGrade(look){
 return {...look,fill:look.fill*.30,key:look.key*.38,head:look.head*.35,hall:look.hall*.34,env:look.env*.30,exposure:look.exposure*.71,fog:look.fog*1.15};
}
export function drawingRatio({device=1,mobile=false,scale=1,benchmark=false,high=false}){
 const cap=mobile?(high?2:1.65):(high?2:1.8);
 return Math.min(device,cap)*scale*(benchmark?.70:1);
}
