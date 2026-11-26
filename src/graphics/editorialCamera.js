// Preserve collision-tested positions, FOV and every authored hold.
// The legacy target briefly passes close to the eye near .666 and .673.
// Interpolate unit look directions rather than moving a nearby world target.
export function stabilizedPose(p,mobile,rail){
 const pose=rail(p,mobile),a=.65,b=.68;
 if(p<=a||p>=b)return pose;
 const direction=q=>{const v=q.target.map((x,i)=>x-q.position[i]),n=Math.hypot(...v);return v.map(x=>x/Math.max(n,1e-9));};
 const start=direction(rail(a,mobile)),end=direction(rail(b,mobile)),x=(p-a)/(b-a),t=x*x*(3-2*x);
 const v=start.map((s,i)=>s+(end[i]-s)*t),n=Math.hypot(...v);
 if(n<1e-9)return pose;
 return {...pose,target:pose.position.map((s,i)=>s+v[i]*5/n)};
}
