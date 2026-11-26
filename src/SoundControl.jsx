import React,{useEffect,useRef,useState} from 'react';
// Opt-in synthesized, low-volume room tone. No autoplay, remote sound file or required interaction.
export function SoundControl({locked=false}){
 const [enabled,setEnabled]=useState(false),audio=useRef(null);
 const supported=typeof window!=='undefined'&&!!(window.AudioContext||window.webkitAudioContext);
 useEffect(()=>{const visibility=()=>{const a=audio.current;if(!a)return;if(document.hidden||!a.enabled)a.context.suspend().catch(()=>{});else a.context.resume().catch(()=>{});};document.addEventListener('visibilitychange',visibility);return()=>{document.removeEventListener('visibilitychange',visibility);audio.current?.context.close().catch(()=>{});audio.current=null;};},[]);
 async function toggle(){try{let a=audio.current;if(!a){const Audio=window.AudioContext||window.webkitAudioContext,context=new Audio(),gain=context.createGain(),filter=context.createBiquadFilter();gain.gain.value=.012;filter.type='lowpass';filter.frequency.value=180;gain.connect(filter);filter.connect(context.destination);for(const [freq,amp] of [[52,.55],[78,.23],[105,.09]]){const osc=context.createOscillator(),level=context.createGain();osc.frequency.value=freq;osc.type='sine';level.gain.value=amp;osc.connect(level);level.connect(gain);osc.start();}a={context,enabled:false};audio.current=a;}a.enabled=!a.enabled;if(a.enabled)await a.context.resume();else await a.context.suspend();setEnabled(a.enabled);}catch{setEnabled(false);if(audio.current)audio.current.enabled=false;}}
 return supported?<button type="button" className="sound-control" disabled={locked} onClick={toggle} aria-pressed={enabled} aria-label={enabled?'Mute ambient sound':'Enable ambient sound'}>SOUND {enabled?'ON':'OFF'}</button>:null;
}
