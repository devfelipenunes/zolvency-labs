import {ramp} from './facilityCamera.js';
export const studyModes=['brand-hero','final-hero','ops-hero','ops-clear','final-clean','composition-first'];
export const isStudy=(mode,name)=>mode==='composition-first'||mode===name;
export function studyAim(name,mobile,mode){
 if(name==='ORIGIN'&&isStudy(mode,'brand-hero'))return [-1.5,3.3,2];
 if(name==='CONVERGENCE'&&mode==='final-clean')return [-4,4.6,13.7];
 if(name==='CONVERGENCE'&&isStudy(mode,'final-hero'))return [-4,5.1,9.5];
 if(name==='INTELLIGENCE'&&mode==='ops-clear')return mobile?[-4.1,1.75,-13.4]:[-3.9,1.65,-13.4];
 if(name==='INTELLIGENCE'&&isStudy(mode,'ops-hero'))return mobile?[-4.1,1.7,-13.4]:[-3.9,1.65,-13.4];
 return null;
}
export function studyLens(name,mode,fallback){
 if(name==='ORIGIN'&&isStudy(mode,'brand-hero'))return 42;
 if(name==='CONVERGENCE'&&isStudy(mode,'final-hero'))return 42;
 if(name==='INTELLIGENCE'&&(isStudy(mode,'ops-hero')||mode==='ops-clear'))return 40;
 return fallback;
}
export function brandPlane(name,mobile,mode){
 if(name==='ORIGIN'&&isStudy(mode,'brand-hero'))return {point:[-1.5,4.2,2],widths:mobile?[3.6,3,2.5]:[5.2,4.6,3.6],mount:'free-space-hero'};
 if(name==='CONVERGENCE'&&isStudy(mode,'final-hero'))return {point:[-4,5.1,9.5],widths:mobile?[3.6,3,2.5]:[5.5,4.8,3.8],mount:'free-space-finale'};
 return null;
}
const envelope=(p,a,b,c,d)=>ramp(p,a,b)*(1-ramp(p,c,d));
export function subjectGrade(look,p,variant){
 if(variant!=='subject')return look;
 const origin=1-ramp(p,.075,.115),rack=envelope(p,.115,.175,.42,.49),security=envelope(p,.51,.59,.64,.68),ops=envelope(p,.68,.715,.74,.81),final=ramp(p,.97,.995);
 // No global exposure lift in Quantum. Brighten the opaque subject, not the rack glass.
 return {...look,fill:look.fill*(1+.20*origin+.18*rack+.16*ops+.12*final),head:look.head*(1+.25*rack+.12*ops),hall:look.hall*(1-.12*security-.16*final),exposure:look.exposure*(1+.05*origin+.06*rack+.07*ops),env:look.env};
}
export function craneProgress(p,enabled,original){return enabled?ramp(p,.025,.40):original;}
export function opsPracticalMultiplier(p,enabled){return enabled?1+.65*envelope(p,.68,.715,.74,.81):1;}
