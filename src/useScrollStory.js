import {useEffect,useRef,useState} from 'react';
import {storyProgress} from './graphics/facilityCamera.js';
import {facilityProgress,spatialFacilityProgress} from './experience/facilityRange.js';
import {boundaryKey} from './graphics/boundaryKey.js';
import {composedRailMode} from './graphics/composedRail.js';
export function useScrollStory(story,{editorial=false,edition='control',nativeMotion=false,onProgress,localRange=false,spatialEntry=false,coalesceState=false,threshold=false}={}){
 const progressRef=useRef(0);
 const [state,setState]=useState(()=>({progress:0,index:0,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}));
 useEffect(()=>{
 const media=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,starts=[],max=0,facilityEnd=0,pacing=null,dirty=true,immediate=true,pacingModule=null,closed=false;
 function measure(){
  const sections=[...story.current.querySelectorAll('section')],mobile=innerWidth<720;
  if(editorial&&!media.matches&&pacingModule){
   if(!pacing||pacing.mobile!==mobile){pacing=pacingModule.getPacing(mobile,edition,composedRailMode(location.search));pacing.mobile=mobile;}
   for(let i=0;i<sections.length;i++)sections[i].style.setProperty('--pace-height',(pacing.chapters[i].vh+(i===6?1:0))*100+'svh');
  }else{for(const s of sections)s.style.removeProperty('--pace-height');}
  starts=sections.map((s,i)=>!localRange&&i===0?0:s.getBoundingClientRect().top+scrollY);facilityEnd=story.current.getBoundingClientRect().bottom+scrollY;max=document.documentElement.scrollHeight-innerHeight;dirty=false;
 }
 function read(){frame=0;if(dirty)measure();const y=scrollY,next={...(localRange?(spatialEntry&&!media.matches?spatialFacilityProgress:facilityProgress)(y,starts,facilityEnd,innerHeight,threshold):editorial&&!media.matches&&pacing?pacingModule.pacedStoryProgress(y,starts,max,pacing):storyProgress(y,starts,max)),reduced:media.matches};progressRef.current=next.progress;if(editorial||nativeMotion){onProgress?.current?.(next,immediate);immediate=false;}if(editorial||localRange&&nativeMotion&&coalesceState){setState(s=>s.index===next.index&&s.reduced===next.reduced&&(!localRange||(s.progress<=.02)===(next.progress<=.02))?s:next);}else setState(s=>s.progress===next.progress&&s.index===next.index&&s.reduced===next.reduced?s:next);}
 function schedule(){if(!frame)frame=requestAnimationFrame(read);}
 function resize(){dirty=true;schedule();}
 function key(e){if(localRange)return;const boundary=boundaryKey(e,document.activeElement,!!document.querySelector('.experience-loader'));if(boundary===null)return;e.preventDefault();immediate=true;window.scrollTo({top:boundary===0?0:Math.max(0,document.documentElement.scrollHeight-innerHeight),behavior:'instant'});schedule();}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize,{passive:true});addEventListener('keydown',key);media.addEventListener('change',resize);const observer=new ResizeObserver(resize);observer.observe(story.current);if(localRange&&story.current.parentElement?.parentElement)observer.observe(story.current.parentElement.parentElement);read();if(editorial)import('./graphics/cameraPacing.js').then(m=>{if(!closed){pacingModule=m;dirty=true;schedule();}}).catch(e=>console.warn('Pacing unavailable',e));
 return ()=>{closed=true;cancelAnimationFrame(frame);observer.disconnect();removeEventListener('scroll',schedule);removeEventListener('resize',resize);removeEventListener('keydown',key);media.removeEventListener('change',resize);};
 },[story,editorial,edition,nativeMotion,onProgress,localRange,spatialEntry,coalesceState,threshold]);return {...state,progressRef};
}
