// Station-specific art direction. All positions are projected onto actual decoded surfaces.
export const stations=[
 {name:'ORIGIN',root:'hangar',hold:.055,range:[0,.035,.08,.112],style:'raised',sector:'01 / ZOLVENCY LABS',hints:[[-.48,.25],[-.32,.30],[.25,.35]],accent:'#c0e8ce'},
 {name:'BLOCKCHAIN',root:'servers',hold:.20,range:[.135,.17,.24,.275],style:'glass',sector:'02 / DISTRIBUTED INFRASTRUCTURE',hints:[[-.35,.18],[.05,.18],[.45,.10]],accent:'#a2e1c3'},
 {name:'STELLAR',root:'servers',hold:.405,range:[.365,.39,.415,.44],style:'display',sector:'03 / FINANCIAL INFRASTRUCTURE',hints:[[.05,.15],[-.45,.16],[.42,.15]],accent:'#b2dcca'},
 {name:'CRYPTOGRAPHY',root:'corridor',hold:.602,range:[.565,.59,.625,.645],style:'stencil',sector:'04 / VERIFICATION',hints:[[.40,.17],[-.40,.17],[.0,.35]],accent:'#c0e8ce'},
 {name:'INTELLIGENCE',root:'bridge',hold:.72,range:[.69,.705,.73,.75],style:'display',sector:'05 / OPERATIONS',hints:[[.34,.15],[-.38,.15],[0,.30]],accent:'#a6d7ef'},
 {name:'QUANTUM',root:'hangar',hold:.935,range:[.89,.92,.945,.95],style:'plate',sector:'06 / QUANTUM RESEARCH',hints:[[-.48,.12],[.48,.12],[-.30,.35]],accent:'#dfc991'},
 {name:'CONVERGENCE',root:'hangar',hold:.992,range:[.962,.985,1,1.01],style:'raised',sector:'07 / INDEPENDENT BY DESIGN',hints:[[-.32,.30],[.34,.30],[0,.25]],accent:'#c0e8ce'}
];
export const modes=['signage','surface','panel','projection','html'];
export function typeMode(value){return modes.includes(value)?value:'signage';}
export function wrapWords(text,measure,limit){
 const lines=[];let line='';
 for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(line&&measure(next)>limit){lines.push(line);line=word;}else line=next;}
 if(line)lines.push(line);return lines;
}
export function titleReadability({width,height,titlePx,inside,clear,mobile=false}){
 return Boolean(inside&&clear&&width>=(mobile?135:180)&&height>=80&&titlePx>=(mobile?20:22));
}
export function readability(data){return titleReadability(data)&&data.bodyPx>=14;}

