import {ramp} from './facilityCamera.js';
// Deliberately bounded local fills. Keep the quantum and opening looks unchanged.
export const lightEnvelope=(p,a,b,c,d)=>ramp(p,a,b)*(1-ramp(p,c,d));
export function subjectLighting(p,mobile=false,variant='local'){
 const rack=lightEnvelope(p,.105,.175,.42,.49),security=lightEnvelope(p,.52,.59,.64,.68),ops=lightEnvelope(p,.68,.715,.74,.81),final=ramp(p,.97,.99),mobileLift=mobile?1.25:1,opsFill=variant==='ops-balanced'?0:ops;
 return {rack,security,ops,final,fill:1+mobileLift*(.16*rack+.20*security+.23*opsFill),head:1+mobileLift*(.22*rack+.30*security+.25*ops),hall:1-.16*final,exposure:1+.025*rack+.035*security+.035*opsFill,env:1-.10*final};
}
export function subjectPractical(name,p,mobile=false){
 const g=subjectLighting(p,mobile),m=mobile?1.2:1;
 if(name==='server-front')return 1+.25*g.rack*m;
 if(name==='server-overhead')return 1+.22*g.rack*m;
 if(name==='security-threshold')return 1+.35*g.security*m;
 if(name==='operations-ceiling')return 1+.45*g.ops*m;
 return 1;
}
