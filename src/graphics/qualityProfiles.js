export const qualityProfiles={
 economy:{scale:.75,ao:false,bloom:false,shadow:512,msaa:0,smaa:false},
 balanced:{scale:1,ao:true,bloom:true,shadow:1024,msaa:0,smaa:true},
 cinematic:{scale:1,ao:true,bloom:true,shadow:1024,msaa:2,smaa:true}
};
export function qualityProfile(name,mobile){return qualityProfiles[name]??qualityProfiles[mobile?'economy':'balanced'];}
