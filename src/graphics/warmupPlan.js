// Diagnostic-only plans never change the production preparation contract.
export const fullWarmHolds=Object.freeze([.055,.205,.405,.485,.51,.535,.625,.73,.79,.81,.83,.935,.952,.965,.978,.992]);
export const diagnosticHolds=Object.freeze([.055,.205,.405,.625,.73,.935,.992]);
export function selectWarmHolds({diagnostics=false,benchmark=false,mode='full'}={}){
 return diagnostics&&benchmark&&mode==='targeted'?[...diagnosticHolds]:[...fullWarmHolds];
}
