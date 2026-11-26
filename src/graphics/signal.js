// Visual metaphor: no real protocol activity. Scroll is the deterministic clock.
export const signalPaths=paths=>paths.filter(p=>p.kind==='accent'&&p.points.length>1);
export function signalPoint(path,progress,index=0){
 const t=((progress*6+index*.17)%1+1)%1,s=t*(path.points.length-1),i=Math.min(path.points.length-2,Math.floor(s)),u=s-i;
 return path.points[i].map((v,k)=>v+(path.points[i+1][k]-v)*u);
}
