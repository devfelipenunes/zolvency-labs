import {ramp,windows} from './facilityCamera.js';
import {getEditorialChapters,getEditorialEdition} from '../editorialStory.js';
// Authored shot cards. Copy is deliberately short enough to be read as spatial geometry.
const controlShotCards=[
 {name:'ORIGIN',hold:.055,focus:'brand / industrial scale',intent:'establish independent technology company',hero:'ZOLVENCY',title:'Building beyond the known.',body:'Independent technology company.',x:-.18,y:.02,span:.66,brand:true},
 {name:'BLOCKCHAIN',hold:.205,focus:'server infrastructure',intent:'communicate core business',hero:'BLOCKCHAIN',title:'Verifiable infrastructure.',body:'Smart contracts and digital assets.',x:-.30,y:-.19,span:.57},
 {name:'STELLAR',hold:.405,focus:'rack aisle / compute',intent:'communicate financial infrastructure',hero:'STELLAR',title:'Infrastructure for finance.',body:'Payments and tokenized assets on Stellar.',x:.28,y:-.18,span:.55},
 {name:'CRYPTOGRAPHY',hold:.625,focus:'security threshold',intent:'communicate privacy and verification',hero:'CRYPTOGRAPHY',title:'Verify without revealing.',body:'Signatures, commitments and zero-knowledge proofs.',x:-.23,y:.22,span:.60},
 {name:'INTELLIGENCE',hold:.73,focus:'operations console',intent:'communicate future exploration',hero:'INTELLIGENCE',title:'Intelligence meets infrastructure.',body:'Exploring agents and verifiable policies.',x:.28,y:-.22,span:.60},
 {name:'QUANTUM',hold:.935,focus:'suspended cryostat',intent:'communicate future quantum research',hero:'QUANTUM',title:'Beyond classical boundaries.',body:'Exploring quantum computing and post-quantum security.',x:-.47,y:-.28,span:.43},
 {name:'CONVERGENCE',hold:.992,focus:'facility / wordmark',intent:'close with brand and primary focus',hero:'ZOLVENCY',title:'Building at the intersection.',body:'Blockchain first. Beyond the classical.',x:0,y:.10,span:.66,brand:true}
];
export function getShotCards(edition='control'){if(edition==='control')return controlShotCards;const copy=getEditorialChapters(edition);return controlShotCards.map((card,i)=>({...card,title:copy[i].title,body:copy[i].body}));}
export const shotCards=getShotCards(typeof location==='undefined'?'control':getEditorialEdition(location.search));
export function currentShot(p){const i=Math.max(0,windows.findLastIndex((v,j)=>j<windows.length-1&&p>=v));return {index:i,card:shotCards[i],local:Math.max(0,Math.min(1,(p-windows[i])/(windows[i+1]-windows[i])))};}
export function shotAnimation(p,mask=0){const {index,card,local}=currentShot(p),enter=index===0?1:ramp(local,0,.17),exit=index===6?1:1-ramp(local,.83,1);return {index,card,local,alpha:enter*exit*(1-mask),motion:enter,brandScale:index===0?1.12-.26*ramp(local,0,.65):1};}
export function shotLayout(card,mobile,local=1){if(mobile)return {x:0,y:card.name==='QUANTUM'?-.57:card.brand?-.20:-.35,span:.86};const x=card.name==='ORIGIN'?card.x*ramp(local,0,.65):card.x;return {x,y:card.y,span:card.span};}
