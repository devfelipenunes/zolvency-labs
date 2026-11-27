// Isolated mobile A/B variants. Default preserves the manually approved preview.
export function mobileGpuBudget(name,enabled){
 if(!enabled)return {name:'control',scale:1,transmission:1};
 const profiles={control:[.75,.5],glass:[.75,.25],pixels:[.65,.5],combined:[.65,.25]};
 const selected=Object.hasOwn(profiles,name)?name:'control', [scale,transmission]=profiles[selected];
 return {name:selected,scale,transmission};
}
