import {ramp,windows} from './facilityCamera.js';
import {reactorStudyPose} from './reactorStudy.js';
import {extendedPose} from './extendedInteriors.js';

// Keep the collision-tested camera positions; compose the shot with its lens and target.
export function noirPose(p,mobile=false,reactor=true){
 const pose=reactor?reactorStudyPose(p,mobile):extendedPose(p,mobile);
 if(p>=.865&&p<=.95&&reactor){
  const t=ramp(p,.865,.915);
  return {...pose,target:[30,5.8+3.05*t,0],fov:mobile?74:65};
 }
 if(p<=.115){
  const t=1-ramp(p,.08,.115);
  return {...pose,target:[pose.target[0]-1.15*t,pose.target[1]+.2*t,pose.target[2]],fov:pose.fov-3*t};
 }
 return pose;
}
export function editorialMotion(p){
 const i=Math.max(0,windows.findLastIndex((v,j)=>j<windows.length-1&&p>=v)),a=windows[i],b=windows[i+1],local=Math.max(0,Math.min(1,(p-a)/(b-a)));
 const enter=ramp(local,0,.24),exit=i===6?0:ramp(local,.84,1);
 return {chapter:i,local,enter,exit,drift:(i%2?1:-1)*(1-enter)*16,depth:1-.025*(1-enter)};
}
export function noirGrade(look){
 return {...look,fill:look.fill*.48,key:look.key*.50,head:look.head*.52,hall:look.hall*.52,env:look.env*.53,exposure:look.exposure*.78,fog:look.fog*1.15};
}
export function drawingRatio({device=1,mobile=false,scale=1,benchmark=false,high=false}){
 const cap=mobile?(high?2:1.65):(high?2:1.8);
 return Math.min(device,cap)*scale*(benchmark?.70:1);
}
