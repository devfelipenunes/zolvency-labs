export const viewports={desktop:{width:1280,height:720},mobile:{width:390,height:844}};
export const holds=[.055,.205,.405,.625,.73,.935,.992];
export const scrollTargets={forward:[0,.055,.115,.205,.31,.405,.49,.625,.73,.84,.935,.97,.992,1],reverse:[.992,.935,.73,.625,.405,.205,.055,0]};
export const reviewCases=[
 {name:'legacy',group:'plates',params:'art=legacy&plate=1',poses:holds},
 {name:'default-plate',group:'plates',params:'plate=1',poses:holds},
 {name:'original-opening',group:'narrative',params:'composition=default',poses:[.025,.055,.075]},
 ...['devices','diagonal','opposite'].map(angle=>({name:'stellar-'+angle,group:'variants',params:'stellar='+angle+'&plate=1',poses:[.405]})),
 ...['split','clear','smoke','reflection'].map(glass=>({name:'glass-'+glass,group:'variants',params:'glass='+glass+'&plate=1',poses:[.205,.405]})),
 ...['mid','close'].map(composition=>({name:'opening-'+composition,group:'narrative',params:'composition='+composition,poses:[.025,.055,.075]})),
 {name:'final-high',group:'narrative',params:'composition=final-high',poses:[.985,.992,1]},
 {name:'quantum-copy',group:'narrative',params:'composition=quantum-copy',poses:[.91,.935,.949],mobileOnly:true},
 {name:'world',group:'narrative',params:'',poses:[.005,.025,.055,.075,.105,.145,.17,.185,.205,.24,.31,.365,.405,.425,.625,.73,.91,.935,.949,.992]},
 ...['original','matte','geometry-matte'].map(floor=>({name:'floor-'+floor,group:'variants',params:'floor='+floor+'&plate=1',poses:[.055,.992]})),
 {name:'ops-focus',group:'variants',params:'light=ops-focus&plate=1',poses:[.73]},
 {name:'composition-control',group:'composition',params:'composition=selected',poses:[.025,.055,.075,.205,.405,.625,.73,.935,.985,.992,1]},
 {name:'composition-brand',group:'composition',params:'composition=brand-hero',poses:[.005,.025,.055,.075,.105]},
 {name:'composition-final',group:'composition',params:'composition=final-hero&floor=geometry-matte',poses:[.985,.992,1]},
 {name:'composition-ops',group:'composition',params:'composition=ops-hero&light=subject',poses:[.705,.715,.73,.74,.755]},
 {name:'composition-light',group:'composition',params:'light=subject&plate=1',poses:holds},
 {name:'composition-ops-clear',group:'composition',params:'composition=ops-clear&light=subject',poses:[.705,.715,.73,.74,.755]},
 {name:'composition-final-clean',group:'composition',params:'composition=final-clean&floor=geometry-matte',poses:[.985,.992,1]},
 {name:'composition-combined',group:'composition',params:'composition=composition-first&light=subject&floor=geometry-matte&motion=crane',poses:[.025,.055,.075,.205,.405,.625,.73,.935,.985,.992,1]},
 {name:'responsive-default',group:'responsive',params:'',poses:[.025,.055,.075,.205,.405,.625,.715,.73,.74,.91,.935,.949,.992]},
 {name:'responsive-ops-clear',group:'responsive',params:'composition=ops-clear&light=subject',poses:[.715,.73,.74]},
 {name:'backlog-control',group:'backlog',params:'composition=brand-hero',poses:[.055,.205,.405,.625,.715,.73,.74,.935,.985,.992,1]},
 {name:'backlog-final-copy',group:'backlog',params:'composition=final-copy',poses:[.985,.992,1]},
 {name:'backlog-ops-copy',group:'backlog',params:'composition=ops-copy&light=subject',poses:[.705,.715,.73,.74,.755]},
 {name:'backlog-staged-copy',group:'backlog',params:'composition=backlog-copy',poses:[.025,.055,.17,.185,.205,.365,.385,.405,.625,.715,.73,.935,.985,.992]},
 {name:'public-scroll',group:'motion',params:'',motion:true},
 ...['default','no-ao','no-bloom','neither'].map(effect=>({name:'effects-'+effect,group:'effects',params:'effects='+effect+'&plate=1',poses:[.055,.405,.935],desktopOnly:true}))
];
