import {ramp} from './facilityCamera.js';
import {currentShot} from './shotCards.js';
// Label, title, body, fully readable, exit starts, exit ends; authored in camera progress.
// Keep all seven existing texts and exact reading holds, independent of frame rate.
export const beats=[
 [0,.012,.024,.043,.083,.112],
 [.125,.142,.165,.193,.275,.31],
 [.315,.332,.355,.393,.413,.443],
 [.548,.565,.585,.613,.638,.65],
 [.681,.691,.705,.718,.744,.755],
 [.875,.885,.904,.923,.943,.95],
 [.978,.98,.983,.988,1,1]
];
export function directedNarrative(p,mask=0){
 const {index}=currentShot(p),[a,b,c,d,e,f]=beats[index];
 const exit=e===f?1:1-ramp(p,e,f),alpha=ramp(p,a,b)*exit*(1-Math.max(0,Math.min(1,mask)));
 return {index,alpha, label:ramp(p,a,b),title:ramp(p,b,c),body:ramp(p,c,d),cue:ramp(p,c,d)};
}
