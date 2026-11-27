// Build-time atlas staging; use pinned tested converter and no runtime network.
// Existing staged assets allow offline reuse; generated metadata and OFL retained.
import {existsSync,readFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const dir='public/models/fonts',rev='5026800714d07231937d92eb4cceabf06e05d74e';
const files=['space-grotesk-400.typeface.json','space-grotesk-600.typeface.json','OFL.txt'];
const ready=()=>files.every(n=>existsSync(dir+'/'+n))&&files.slice(0,2).every(n=>JSON.parse(readFileSync(dir+'/'+n)).sourceRevision===rev);
if(!ready()){
 if(process.env.FACILITY_OFFLINE==='1')throw Error('Space Grotesk atlas not staged; run npm run type:prepare online once');
 const venv='.cache/r68-font-venv',python=process.platform==='win32'?venv+'/Scripts/python.exe':venv+'/bin/python';
 const run=(cmd,args)=>{const r=spawnSync(cmd,args,{stdio:'inherit'});if(r.error||r.status!==0)throw Error('font staging failed: '+cmd+' '+args.join(' '));};
 if(!existsSync(python)){run(process.platform==='win32'?'python':'python3',['-m','venv',venv]);run(python,['-m','pip','install','fonttools==4.55.3']);}
 run(python,['scripts/r67-font-art.py']);mkdirSync(dir,{recursive:true});for(const n of files)copyFileSync('artifacts/r67-font/'+n,dir+'/'+n);
 if(!ready())throw Error('atlas validation failed');
}
