import { useEffect,useState } from 'react';
import { storyProgress } from './graphics/camera.js';
export function useScrollStory(story){
 const [state,setState]=useState(()=>({progress:0,index:0,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}));
 useEffect(()=>{
 const media=matchMedia('(prefers-reduced-motion: reduce)');let frame=0;
 function read(){frame=0;const y=scrollY,sections=[...story.current.querySelectorAll('section')],starts=sections.map((s,i)=>i===0?0:s.getBoundingClientRect().top+y);const next={...storyProgress(y,starts,document.documentElement.scrollHeight-innerHeight),reduced:media.matches};setState(s=>s.progress===next.progress&&s.index===next.index&&s.reduced===next.reduced?s:next);}
 function schedule(){if(!frame)frame=requestAnimationFrame(read);}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});media.addEventListener('change',schedule);const observer=new ResizeObserver(schedule);observer.observe(story.current);read();
 return ()=>{cancelAnimationFrame(frame);observer.disconnect();removeEventListener('scroll',schedule);removeEventListener('resize',schedule);media.removeEventListener('change',schedule);};
 },[story]);return state;
}
