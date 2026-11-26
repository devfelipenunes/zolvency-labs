import {windows,clamp} from './facilityCamera.js';
import prepared from './generatedPacing.json' with {type:'json'};
import {reviewPose} from './visualReview.js';
import {stabilizedPose} from './editorialCamera.js';
import {directedCut} from './cinematicCut.js';
import {redistributeReading} from './readingPacing.js';
import {editorialEditions} from '../editorialStory.js';
const length=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const direction=pose=>{const d=pose.target.map((x,i)=>x-pose.position[i]),n=Math.hypot(...d);return d.map(x=>x/Math.max(n,1e-9));};
export function angularDistance(a,b){const x=direction(a),y=direction(b);return Math.acos(Math.max(-1,Math.min(1,x.reduce((s,v,i)=>s+v*y[i],0))))*180/Math.PI;}
export function createPacing({mobile=false,samples=1600,poseFor=(p)=>directedCut(p,mobile,null,(p,m)=>stabilizedPose(p,m,(q,n)=>reviewPose(q,n,true,'aisle','opposite',true,'brand-hero')))}={}){
 const chapters=[];
 for(let i=0;i<windows.length-1;i++){
  const lo=windows[i],hi=windows[i+1],poses=Array.from({length:samples+1},(_,j)=>poseFor(lo+(hi-lo)*j/samples));
  const cost=[];
  for(let j=1;j<=samples;j++){
   const a=poses[j-1],b=poses[j],covered=a.mask>=.98||b.mask>=.98;
   // Hide teleportation from the cost model only when fully masked. Optical zoom remains weighted.
   cost.push(covered?0:length(a.pose.position,b.pose.position)/3+angularDistance(a.pose,b.pose)/45+Math.abs(a.pose.fov-b.pose.fov)/35);
  }
  // A positive reading floor and local smoothing prevent starving stationary holds.
  const total=cost.reduce((s,v)=>s+v,0),floor=Math.max(.75,total*.60)/samples;
  const weights=cost.map((v,j)=>Math.max(v,((cost[j-1]??v)+2*v+(cost[j+1]??v))/4)+floor);
  const cumulative=[0];for(const w of weights)cumulative.push(cumulative.at(-1)+w);
  const sum=cumulative.at(-1),curve=cumulative.map(v=>v/sum);
  const vh=Math.max(i===6?1.65:1.6,Math.min(i===4?5.5:4.5,sum*.55));
  chapters.push({lo,hi,curve,vh,cost:total});
 }
 return pacingFromChapters(chapters);
}
export function pacingFromChapters(chapters){
 function progress(index,local){
  const c=chapters[index],x=clamp(local);if(x===0)return c.lo;if(x===1)return c.hi;
  let a=0,b=c.curve.length-1;while(b-a>1){const m=(a+b)>>1;if(c.curve[m]<=x)a=m;else b=m;}
  const q=(a+(x-c.curve[a])/(c.curve[b]-c.curve[a]))/(c.curve.length-1);
  return c.lo+(c.hi-c.lo)*q;
 }
 function local(index,p){const c=chapters[index],x=clamp((p-c.lo)/(c.hi-c.lo))*(c.curve.length-1),j=Math.min(c.curve.length-2,Math.floor(x));return c.curve[j]+(c.curve[j+1]-c.curve[j])*(x-j);}
 return {chapters,progress,local};
}
export function pacedStoryProgress(scroll,starts,max,pacing){
 if(max<=0)return {progress:0,index:0};
 const y=scroll<=1?0:scroll>=max-1?max:Math.max(0,Math.min(max,scroll));
 let index=0;for(let i=1;i<starts.length;i++)if(y>=starts[i])index=i;
 const a=starts[index],b=starts[index+1]??max;
 return {index,progress:pacing.progress(index,b>a?clamp((y-a)/(b-a)):1)};
}

const pacingCache=new Map();
export function getPacing(mobile=false,edition='control'){edition=editorialEditions.includes(edition)?edition:'control';const key=(mobile?'mobile':'desktop')+':'+edition;if(!pacingCache.has(key)){const table=prepared[mobile?'mobile':'desktop'],base=Array.isArray(table)&&table.length===windows.length-1?table:createPacing({mobile}).chapters;pacingCache.set(key,pacingFromChapters(redistributeReading(base,edition)));}return pacingCache.get(key);}
