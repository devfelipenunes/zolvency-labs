// Time-driven traveling impulse in the existing stable world reading plane.
// No perpetual group hover; fixed anchor, small individual directional motion.
// null time is the deterministic static benchmark / reduced-motion control.
export const aliveSignatures=Object.freeze([
 {period:2.8,amp:.021,skew:1},{period:2.1,amp:.024,skew:1},{period:2.6,amp:.020,skew:1},
 {period:1.9,amp:.017,skew:-1},{period:2.3,amp:.023,skew:1},{period:3.1,amp:.020,skew:-1},{period:3.4,amp:.015,skew:1}
]);
export function livingImpulse(act,i,n,seconds,role='headline'){
 if(!Number.isFinite(seconds))return [0,0,0,0,0,0];
 const s=aliveSignatures[act]??aliveSignatures[0],rank=n>1?i/(n-1):0,p=2*Math.PI*(seconds/s.period-s.skew*rank*.85);
 const strength=role==='body'?.26:1,a=s.amp*strength;
 return [a*.62*Math.sin(p),a*.40*Math.sin(p-.6),a*.30*Math.cos(p),0,0,0];
}
export function ambientBlend(phase){if(phase.kind==='hold')return 1;const t=phase.kind==='enter'?phase.u:1-phase.u;return Math.max(0,Math.min(1,t))**2;}
