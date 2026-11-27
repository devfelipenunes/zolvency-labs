import {bakeChain,correctEndpoint} from './motion-physics.js';
// Bakes interval contacts using actual measured glyph bounding widths. Separate
// line chains; bounded displacement envelope returns to exact layout.
// This is proxy collision, not convex outline / facility contact.
export function bakeGlyphContact(glyphs){
 const lines=new Map();for(const [i,g] of glyphs.entries()){const group=lines.get(g.line)??[];group.push({i,width:Math.max(.001,g.width)});lines.set(g.line,group);}
 const tracks=[],contacts=[];for(const group of lines.values()){
  if(group.length<2)continue;
  const mean=group.reduce((s,g)=>s+g.width,0)/group.length,widths=group.map(g=>g.width/mean);
  const baked=bakeChain(widths,{restitution:.15,damping:.5,seconds:3}),initial=baked.frames[0],relative=baked.frames.map(row=>row.map((x,j)=>(x-initial[j])*mean));
  const corrected=correctEndpoint(relative,group.map(()=>0));tracks.push({indices:group.map(x=>x.i),frames:corrected,mean});
  contacts.push(...baked.contacts.map(c=>({...c,i:group[c.i].i})));
 }
 return {tracks,contacts};
}
export function sampleGlyphContact(baked,n,u){const out=Array(n).fill(0);u=Math.max(0,Math.min(1,u));if(u===0||u===1)return out;const envelope=Math.sin(Math.PI*u)**2;for(const track of baked.tracks){const t=u*(track.frames.length-1),i=Math.floor(t),f=t-i;const a=track.frames[i],b=track.frames[Math.min(i+1,track.frames.length-1)];for(const [j,k] of track.indices.entries())out[k]=Math.max(-track.mean*.15,Math.min(track.mean*.15,(a[j]+(b[j]-a[j])*f)*envelope));}return out;}
