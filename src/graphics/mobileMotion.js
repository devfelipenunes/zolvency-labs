// Single RAF owner for ordinary mobile camera motion. Native scroll remains unchanged.
const cuts=[.51,.81,.965];
export function createMobileMotion(initial=0,{tau=100,maxRate=.75,maxStep=.045}={}){
 let value=initial,target=initial,last=null;
 return {set(p,{snap=false}={}){if(!Number.isFinite(p))return;target=Math.max(0,Math.min(1,p));if(snap){value=target;last=null;}},
 step(now){const dt=last===null?16.7:Math.max(0,Math.min(200,now-last));last=now;const delta=target-value;
 if(!delta)return value;
 const step=Math.abs(delta)<.00008?Math.abs(delta):Math.min(Math.abs(delta)*(1-Math.exp(-dt/tau)),maxRate*dt/1000,maxStep);
 const next=value+Math.sign(delta)*step;
 const crossed=cuts.filter(c=>next>value?c>value&&c<=next:c<value&&c>=next);
 value=crossed.length?(next>value?crossed[0]:crossed.at(-1)):step===Math.abs(delta)?target:next;
 return value;},
 get pending(){return value!==target;},get value(){return value;},get target(){return target;},resetClock(){last=null;}};
}
