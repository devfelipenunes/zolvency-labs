// Reallocate authored scroll distance, not elapsed time. No scroll lock or timers.
import {beats} from './directedNarrative.js';
import {getEditorialChapters} from '../editorialStory.js';
const clamp=n=>Math.max(0,Math.min(1,n));
export function localInChapter(c,p){const x=clamp((p-c.lo)/(c.hi-c.lo))*(c.curve.length-1),i=Math.min(c.curve.length-2,Math.floor(x));return c.curve[i]+(c.curve[i+1]-c.curve[i])*(x-i);}
export function readingDistance(c,index){return (localInChapter(c,beats[index][4])-localInChapter(c,beats[index][3]))*c.vh;}
export function readingTarget(copy){const words=(copy.title+' '+copy.body).trim().split(/\s+/).length;return Math.min(1.20,Math.max(.90,.82+.018*words));}
export function redistributeReading(chapters,edition){
 if(edition==='control')return chapters;
 const copy=getEditorialChapters(edition);
 return chapters.map((c,i)=>{
  const start=localInChapter(c,beats[i][3]),end=localInChapter(c,beats[i][4]),width=end-start;
  if(!(width>0))throw Error('Missing reading window '+i);
  const extra=Math.max(0,readingTarget(copy[i])-width*c.vh)+.003;
  const vh=c.vh+extra,curve=c.curve.map(u=>(u*c.vh+extra*clamp((u-start)/width))/vh);
  curve[0]=0;curve[curve.length-1]=1;
  return {...c,vh,curve,readingTarget:readingTarget(copy[i]),addedReadingVh:extra};
 });
}
