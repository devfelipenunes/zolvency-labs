// R111 — network-only opening preparation. Never import Three or create a GL context here.
export const idleOpeningDelay=1200;
export function openingPrefetchAllowed({search='',hash='',reduced=false,reading=false,hidden=false,saveData=false,effectiveType='',scroll=0,viewport=0}={}){
 const q=new URLSearchParams(search);
 return q.get('hybrid')==='1'&&q.get('hybrid-perf')!=='control'&&q.get('hybrid-prefetch')!=='control'&&q.get('renderer')!=='canvas'&&!reduced&&!reading&&!hidden&&!saveData&&!['slow-2g','2g','3g'].includes(effectiveType)&&(!hash||['#top','#manifesto','#gateway'].includes(hash))&&scroll<viewport*.35;
}
let opening=null;
export function openingPrefetch(url,{fetcher=fetch}={}){
 if(opening?.url===url)return opening.promise;
 if(opening&&!opening.claimed)opening.controller.abort();
 const controller=new AbortController(),record={url,controller,claimed:false,promise:null};
 // The approved low-detail hangar is ~216 KB. Retain one buffer only.
 record.promise=fetcher(url,{signal:controller.signal,priority:'low',credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('Opening asset unavailable');return r.arrayBuffer();}).catch(()=>null);
 opening=record;return record.promise;
}
export function takeOpeningPrefetch(url){if(opening?.url!==url||opening.claimed)return null;const r=opening;r.claimed=true;return r.promise.finally(()=>{if(opening===r)opening=null;});}
export function cancelOpeningPrefetch(){if(opening&&!opening.claimed){opening.controller.abort();opening=null;}}

// Three small authored typefaces, fetched after the opening model. Retain at
// most 3 bounded JSON responses, consumed by FontLoader.parse; no decoder work.
export const openingFonts=Object.freeze(['helvetiker_regular.typeface.json','space-grotesk-400.typeface.json','space-grotesk-600.typeface.json']);
const fonts=new Map();
export function prefetchOpeningFont(url,{fetcher=fetch}={}){if(fonts.has(url))return fonts.get(url).promise;if(fonts.size>=3)return Promise.resolve(null);const controller=new AbortController(),record={controller,claimed:false,promise:null};record.promise=fetcher(url,{signal:controller.signal,priority:'low',credentials:'same-origin'}).then(async r=>{if(!r.ok)return null;const value=await r.text();return value.length<=524288?JSON.parse(value):null;}).catch(()=>null);fonts.set(url,record);return record.promise;}
export function takeOpeningFont(url){const r=fonts.get(url);if(!r||r.claimed)return null;r.claimed=true;return r.promise.finally(()=>{if(fonts.get(url)===r)fonts.delete(url);});}
export function cancelOpeningFonts(){for(const [url,r] of fonts){if(!r.claimed){r.controller.abort();fonts.delete(url);}}}
