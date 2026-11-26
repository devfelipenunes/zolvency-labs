import React,{useEffect,useRef,useState} from 'react';
import packageInfo from '../package.json';
import {SoundControl} from './SoundControl.jsx';
import {chapters as legacyChapters} from './story.js';
import {editorialChapters,editorialExperience} from './editorialStory.js';
const editorial=editorialExperience(location.search),chapters=editorial?editorialChapters:legacyChapters;
import {useScrollStory} from './useScrollStory.js';
import {smoothProgress} from './graphics/scrollSmoothing.js';
import {createFallback} from './graphics/fallback.js';
const sides=chapters.map(()=> 'center');
const query=new URLSearchParams(location.search),gated=editorial&&query.get('direction')==='staged'&&query.get('renderer')!=='canvas';
const initialLoading=()=>gated&&!matchMedia('(prefers-reduced-motion: reduce)').matches?{phase:'assets',done:0,total:1}:null;
function LoadingScreen({status}){if(!status||status.phase==='ready')return null;const {phase,done,total}=status;const percent=phase==='assets'?Math.round(65*done/Math.max(1,total)):phase==='environment'?65+Math.round(10*done):phase==='warming'?75+Math.round(25*done/Math.max(1,total)):0;const label={assets:'Loading facility',environment:'Preparing environment',warming:'Preparing cinematic sequence',error:'3D experience unavailable'}[phase];function flat(){const url=new URL(location.href);url.searchParams.set('renderer','canvas');location.assign(url);}
return <div className="experience-loader" data-phase={phase} role="dialog" aria-modal="true" aria-label="Preparing Zolvency Labs"><div className="experience-loader-inner"><img src={import.meta.env.BASE_URL+'brand/zolvency.svg'} alt="Zolvency"/><div className="loader-kicker">INDEPENDENT TECHNOLOGY COMPANY</div><div role="status" aria-live="polite">{label}</div>{phase!=='error'&&<><progress aria-label="Experience preparation" value={percent} max="100"/><div className="loader-count">{String(percent).padStart(2,'0')}% · {done}/{total}</div></>}<button type="button" onClick={flat}>{phase==='error'?'Continue in 2D':'Use lightweight version'}</button>{phase==='error'&&<button type="button" onClick={()=>location.reload()}>Retry 3D</button>}</div></div>;}

function Stage({progress,reduced,side,controller,onLoading}){
 const host=useRef(null),fallback=useRef(null),engine=useRef(null),latest=useRef({progress,reduced});
 const [mode,setMode]=useState('canvas');const shown=useRef(0);
 useEffect(()=>{if(editorial){latest.current.reduced=reduced;return;}latest.current={progress,reduced};const target=reduced?0:progress;const debug=new URLSearchParams(location.search).has('diagnostics');if(reduced||debug||Math.abs(target-shown.current)>.12){shown.current=target;engine.current?.draw(target);return;}
 let frame=0,previous=performance.now();function step(now){shown.current=smoothProgress(shown.current,target,now-previous);previous=now;engine.current?.draw(shown.current);if(shown.current!==target)frame=requestAnimationFrame(step);}frame=requestAnimationFrame(step);return()=>cancelAnimationFrame(frame);},[progress,reduced]);
 useEffect(()=>{if(!editorial)return;controller.current=(next,snap)=>{latest.current=next;const p=next.reduced?0:next.progress;shown.current=p;host.current.dataset.targetProgress=String(p);host.current.parentElement?.style.setProperty('--native-progress',String(p));engine.current?.draw(p,{snap});};return()=>{controller.current=null;};},[controller]);
 useEffect(()=>{
 const node=host.current,canvas=fallback.current,flat=createFallback(canvas);
 let active=true,gl=null,current=flat;
 function redraw(){const p=latest.current;current.resize();current.draw(p.reduced?0:shown.current,{snap:true});}
 engine.current=flat;canvas.hidden=false;setMode('canvas');
 function restore(){if(!active)return;if(gated&&!latest.current.reduced)onLoading({phase:'error',done:0,total:1});gl?.dispose();gl=null;current=flat;engine.current=flat;canvas.hidden=false;setMode('canvas');redraw();}
 redraw();if(gated)onLoading(latest.current.reduced?null:{phase:'assets',done:0,total:1});addEventListener('resize',redraw,{passive:true});
 if(!latest.current.reduced&&new URLSearchParams(location.search).get('renderer')!=='canvas')import('./graphics/threeScene.js').then(async({createThreeScene})=>{
 if(!active||latest.current.reduced)return;
 try{const next=await createThreeScene(node,restore);if(!active){next.dispose();return;}gl=next;if(gated){let timer;try{await Promise.race([next.prepare(status=>{if(active&&gl===next&&status.phase!=='ready')onLoading(status);}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Preparation deadline exceeded')),100000);})]);}finally{clearTimeout(timer);}if(!active||gl!==next){next.dispose();return;}}current=gl;engine.current=gl;redraw();canvas.hidden=true;setMode('three');if(gated)onLoading({phase:'ready',done:1,total:1});}
 catch(e){if(active){console.warn('WebGL/model unavailable; using Canvas2D',e);restore();}}
 }).catch(e=>{if(active){console.warn('Graphics unavailable',e);restore();}});
 return()=>{active=false;removeEventListener('resize',redraw);gl?.dispose();flat.dispose();engine.current=null;};
 },[reduced]);
 return <div id="stage" data-renderer={mode} data-target-progress={editorial?undefined:reduced?0:progress} data-experience={editorial?'editorial':'legacy'} data-side={side} ref={host} aria-hidden="true"><canvas ref={fallback}/><div className="veil"/></div>;
}
function Brand(){return <header className="brand"><img src={import.meta.env.BASE_URL+'brand/zolvency.svg'} alt="Zolvency" width="1707" height="210"/></header>}
export default function App(){const story=useRef(null),controller=useRef(null);const [loading,setLoading]=useState(initialLoading);const {progress,index,reduced}=useScrollStory(story,{editorial,onProgress:controller});const locked=!!loading&&loading.phase!=='ready';useEffect(()=>{if(!locked)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';const block=e=>{if(!e.target.closest?.('.experience-loader')&&['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))e.preventDefault();};document.addEventListener('keydown',block,{capture:true});return()=>{document.body.style.overflow=old;document.removeEventListener('keydown',block,{capture:true});};},[locked]);return <><Stage progress={progress} reduced={reduced} side={sides[index]} controller={controller} onLoading={setLoading}/><Brand/>{(import.meta.env.DEV||new URLSearchParams(location.search).has('version'))&&<span className="build-version" aria-label={`Site version ${packageInfo.version}`}>v{packageInfo.version}</span>}<SoundControl/><main id="story" ref={story} inert={locked?true:undefined}>{chapters.map((c,i)=>{const Heading=i===0?'h1':'h2';return <section className="chapter" data-name={c.name} data-active={i===index} data-side={sides[i]} key={c.name}><div className="copy"><div className="eyebrow">{String(i+1).padStart(2,'0')} / {c.label}</div><Heading aria-label={c.title}>{c.title.split(' ').map((word,j)=><React.Fragment key={j}><span className="kinetic-word" aria-hidden="true" style={{'--word-index':j}}><span>{word}</span></span>{j<c.title.split(' ').length-1?' ':''}</React.Fragment>)}</Heading><p>{c.body}</p>{i===0&&<span className="tag">SCROLL TO EXPLORE ↓</span>}{i===6&&<div className="endnote">{editorial?'INDEPENDENT BY DESIGN':'ZOLVENCY LABS / EXPERIMENTAL CONCEPT FACILITY'}</div>}</div></section>})}</main><div className="track" aria-hidden="true"><span>{String(index+1).padStart(2,'0')} / {chapters[index].name}</span><i><b style={{width:editorial?'calc(var(--native-progress,0) * 100%)':(progress*100)+'%'}}/></i><span>{editorial?'':String(Math.round(progress*100)).padStart(3,'0')+'%'}</span></div><LoadingScreen status={loading}/></>}
