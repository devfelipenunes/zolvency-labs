import React, { useEffect, useRef, useState } from 'react';
import { chapters } from './story.js';
import { useScrollStory } from './useScrollStory.js';
import { createFallback } from './graphics/fallback.js';

function Stage({ progress, reduced }) {
  const host = useRef(null), fallback = useRef(null), engine = useRef(null);
  const latest = useRef({progress,reduced});
  const [mode,setMode] = useState('canvas');
  useEffect(() => { latest.current={progress,reduced}; engine.current?.draw(reduced ? 0 : progress); }, [progress,reduced]);
  useEffect(() => {
    const node=host.current, canvas=fallback.current;
    const flat=createFallback(canvas);
    let active=true, gl=null, current=flat;
    function redraw(){ const p=latest.current;current.resize();current.draw(p.reduced?0:p.progress); }
    engine.current=current;canvas.hidden=false;setMode('canvas');
    function restore(){ if(!active)return;gl?.dispose();gl=null;current=flat;engine.current=flat;canvas.hidden=false;setMode('canvas');redraw(); }
    redraw();window.addEventListener('resize',redraw,{passive:true});
    if(!latest.current.reduced && new URLSearchParams(location.search).get('renderer')!=='canvas') import('./graphics/threeScene.js').then(({createThreeScene}) => {
      if(!active || latest.current.reduced)return;
      try{gl=createThreeScene(node,restore);current=gl;engine.current=gl;redraw();canvas.hidden=true;setMode('three');}
      catch(error){console.warn('WebGL unavailable; using Canvas2D',error);restore();}
    }).catch(error=>{if(active)console.warn('Graphics module unavailable',error);});
    return () => {active=false;window.removeEventListener('resize',redraw);gl?.dispose();flat.dispose();engine.current=null;};
  },[reduced]);
  return <div id="stage" ref={host} data-renderer={mode} aria-hidden="true"><canvas ref={fallback} id="fallback"/><div className="veil"/></div>;
}
function Brand(){return <header className="brand"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M4 22C11 22 18 5 28 5M4 27C12 27 20 10 28 10M4 17C10 17 16 0 26 0" stroke="currentColor" strokeWidth="1.5"/></svg>ZOLVENCY<span>LABS</span></header>}
export default function App(){
  const story=useRef(null);
  const {progress,index,reduced}=useScrollStory(story);
  return <><Stage progress={progress} reduced={reduced}/><Brand/><div className="edition" aria-hidden="true">TECHNOLOGICAL CONVERGENCE / 01</div>
  <main id="story" ref={story}>{chapters.map((c,i)=>{const Heading=i===0?'h1':'h2';return <section className="chapter" data-name={c.name} key={c.name}><div className="copy"><div className="eyebrow">{String(i+1).padStart(2,'0')} / {c.label}</div><Heading>{c.title}</Heading><p>{c.body}</p>{i===2&&<div className="micro-label">BLOCKS / COMMITMENTS / SHARED STATE</div>}{i===4&&<div className="micro-label">AGENTS / AUTHORIZATION / VERIFICATION</div>}{i===5&&<div className="micro-label">QUANTUM COMPUTING ≠ POST-QUANTUM CRYPTOGRAPHY</div>}{i===0&&<span className="tag">SCROLL TO EXPLORE ↓</span>}{i===chapters.length-1&&<div className="endnote">ZOLVENCY LABS / EXPERIMENTAL PREVIEW / 0.10</div>}</div></section>})}</main>
  <div className="track" aria-hidden="true"><span>{String(index+1).padStart(2,'0')} / {chapters[index].name}</span><i><b style={{width:(progress*100)+'%'}}/></i><span>{String(Math.round(progress*100)).padStart(3,'0')}%</span></div></>;
}
