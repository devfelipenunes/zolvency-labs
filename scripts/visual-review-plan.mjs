export const viewports={desktop:{width:1280,height:720},mobile:{width:390,height:844}};
export const holds=[.055,.205,.405,.625,.73,.935,.992];
export const scrollTargets={forward:[0,.055,.115,.205,.31,.405,.49,.625,.73,.84,.935,.97,.992,1],reverse:[.992,.935,.73,.625,.405,.205,.055,0]};
export const reviewCases=[
 {name:'legacy',group:'plates',params:'art=legacy&plate=1',poses:holds},
 {name:'default-plate',group:'plates',params:'plate=1',poses:holds},
 ...['devices','diagonal','opposite'].map(angle=>({name:'stellar-'+angle,group:'variants',params:'stellar='+angle+'&plate=1',poses:[.405]})),
 ...['split','clear','smoke','reflection'].map(glass=>({name:'glass-'+glass,group:'variants',params:'glass='+glass+'&plate=1',poses:[.205,.405]})),
 {name:'world',group:'narrative',params:'',poses:[.005,.025,.055,.075,.105,.145,.17,.185,.205,.24,.31,.365,.405,.425,.625,.73,.935,.992]},
 {name:'public-scroll',group:'motion',params:'',motion:true},
 ...['default','no-ao','no-bloom','neither'].map(effect=>({name:'effects-'+effect,group:'effects',params:'effects='+effect+'&plate=1',poses:[.055,.405,.935],desktopOnly:true}))
];
