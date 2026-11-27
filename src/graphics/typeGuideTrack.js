// Offline selection of sampled free-space guide points. Raycast evidence
// is a visibility proxy, not a continuous collision or physical mount proof.
export function selectGuideTrack(frames,{minClear=1}={}){
 if(!frames.length)return {track:[],cost:0};
 const layers=frames.map(f=>f.candidates.filter(c=>c.clearFraction>=minClear&&c.point.every(Number.isFinite)));
 if(layers.some(x=>!x.length))return {track:null,cost:null,missing:layers.flatMap((x,i)=>x.length?[]:[i])};
 const local=c=>Math.abs(c.y+.32)*1.5+Math.abs(c.x)*.8+Math.max(0,.65-c.depth)*2;
 const step=(a,b)=>Math.hypot(...a.point.map((v,k)=>v-b.point[k]))*.8+Math.abs(a.depth-b.depth)*4+Math.abs(a.y-b.y)*2+Math.abs(a.x-b.x)*2;
 let cost=layers[0].map(local),parents=[[]];for(let i=1;i<layers.length;i++){const prev=cost,links=[];cost=layers[i].map(b=>{let best=Infinity,jj=-1;for(const [j,a] of layers[i-1].entries()){const v=prev[j]+step(a,b)+local(b);if(v<best){best=v;jj=j;}}links.push(jj);return best;});parents.push(links);}
 let j=cost.indexOf(Math.min(...cost));const best=cost[j],track=[];for(let i=layers.length-1;i>=0;i--){track.push({p:frames[i].p,...layers[i][j]});j=parents[i][j];}return {track:track.reverse(),cost:best};
}
