// Release evidence gate: deliberately separate automated evidence from human approval.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export const approvedQuery='/?living-type=kinetic&type-formation=ribbon&type-layout=directed&type-visibility=continuous&type-choreography=scene-presence&type-spatial=control';
export const holds=Object.freeze([.055,.205,.405,.625,.73,.935,.992]);
export function checkEvidence(baseline,candidate){
 const blockers=[];
 if(baseline?.width!==candidate?.width||![320,390,1280].includes(candidate?.width))blockers.push('viewport mismatch');
 const a=baseline?.rows??[],b=candidate?.rows??[];
 if(a.length!==197||b.length!==197||a.some((r,i)=>r.a?.p!==b[i]?.a?.p))blockers.push('incomplete or unmatched 197-pose coverage');
 for(const report of [baseline,candidate])if(!Array.isArray(report?.failures)||report.failures.length||!Array.isArray(report?.captureFailures)||report.captureFailures.length)blockers.push('browser or capture failures/missing evidence');
 for(const p of holds){
  const row=b.find(r=>r.a?.p===p)?.a;
  for(const role of ['headline','body']){
   const mesh=row?.meshes?.find(m=>m.role===role),min=role==='headline'?24:candidate.width===320?14:15;
   if(!mesh?.inside||!(mesh.visibilityEstimate>=.75)||!mesh.lineHeights?.length||!mesh.lineHeights.every(h=>Number.isFinite(h)&&h>=min))blockers.push('reading failure '+p+' '+role);
  }
 }
 if(b.some(r=>JSON.stringify(r.a)!==JSON.stringify(r.b)))blockers.push('non-deterministic pose');
 return {width:candidate?.width,poses:b.length,automatedPass:blockers.length===0,blockers,releaseApproved:false,manualGates:['physical iPhone Safari scroll and GPU performance','visual approval of candidate versus approved A','desktop and native touch CI complete','explicit production authorization']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [base,next]=process.argv.slice(2);
 if(!next)throw Error('usage: node scripts/r93-release-gate.mjs base-report.json candidate-report.json');
 const result=checkEvidence(...await Promise.all([base,next].map(async path=>JSON.parse(await readFile(path,'utf8')))));
 console.log(JSON.stringify(result,null,2));if(!result.automatedPass)process.exitCode=1;
}
