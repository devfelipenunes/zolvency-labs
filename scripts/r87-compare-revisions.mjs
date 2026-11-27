// Compare matched browser reports and timing artifacts without claiming hardware FPS.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const metricNames=['cpuFrameMs','cpuSubmitMs','gpuMs','drawCalls','triangles','pixelRatio'];
export function compareRevisions(base,next,basePerf,nextPerf){
 if(base.width!==next.width)throw Error('viewport mismatch');
 const index=r=>new Map(r.rows.map(({a})=>[a.p,a]));
 const a=index(base),b=index(next),matched=[...a.keys()].filter(p=>b.has(p));
 const missing=[...a.keys()].filter(p=>!b.has(p)),extra=[...b.keys()].filter(p=>!a.has(p));
 const failures=r=>(r.failures?.length??0)+(r.captureFailures?.length??0);
 const holds=matched.filter(p=>a.get(p).motion?.handoff?.kind==='hold'&&b.get(p).motion?.handoff?.kind==='hold');
 const sizes=holds.map(p=>{const read=r=>Object.fromEntries((r.meshes??[]).filter(m=>['headline','body'].includes(m.role)).map(m=>[m.role,Math.min(...m.lineHeights)]));return {p,baseline:read(a.get(p)),candidate:read(b.get(p))};});
 const metrics={};for(const name of metricNames){const x=basePerf?.summary?.metrics?.[name]?.p95,y=nextPerf?.summary?.metrics?.[name]?.p95;if(Number.isFinite(x)&&Number.isFinite(y))metrics[name]={baseline:x,candidate:y,delta:y-x,percent:x===0?null:100*(y-x)/x};}
 return {width:base.width,matched:matched.length,missing,extra,baselineFailures:failures(base),candidateFailures:failures(next),sizes,metrics,comparisonComplete:missing.length===0&&extra.length===0&&matched.length>0,limitation:'Software-renderer timing is not physical-device FPS. Visual quality and collision-free motion require separate review.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [base,next,basePerf,nextPerf,out]=process.argv.slice(2);if(!nextPerf)throw Error('usage: node scripts/r87-compare-revisions.mjs base-report.json candidate-report.json base-performance.json candidate-performance.json [output.json]');
 const files=await Promise.all([base,next,basePerf,nextPerf].map(async p=>JSON.parse(await readFile(p,'utf8'))));const json=JSON.stringify(compareRevisions(...files),null,2);if(out)await writeFile(out,json);else console.log(json);
}
