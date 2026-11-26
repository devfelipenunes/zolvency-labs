import { useEffect, useState } from 'react';
import { clamp } from './graphics/geometry.js';
export function useScrollStory(story) {
 const [state,setState]=useState(()=>({progress:0,index:0,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}));
 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)');let frame=0;
  function read(){frame=0;const sections=[...story.current.querySelectorAll('section')],mid=innerHeight/2;let index=sections.findIndex(s=>s.getBoundingClientRect().bottom>mid);if(index<0)index=Math.max(0,sections.length-1);const progress=clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight));setState(s=>s.progress===progress&&s.index===index&&s.reduced===media.matches?s:{progress,index,reduced:media.matches});}
  function schedule(){if(!frame)frame=requestAnimationFrame(read)}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});media.addEventListener('change',schedule);
  const observer=new ResizeObserver(schedule);observer.observe(story.current);read();
  return ()=>{cancelAnimationFrame(frame);observer.disconnect();removeEventListener('scroll',schedule);removeEventListener('resize',schedule);media.removeEventListener('change',schedule)};
 },[story]);return state;
}
