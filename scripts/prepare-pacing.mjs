import {createPacing} from '../src/graphics/cameraPacing.js';
import {readFile,writeFile} from 'node:fs/promises';
const path=new URL('../src/graphics/generatedPacing.json',import.meta.url);
const next={desktop:createPacing({mobile:false}).chapters,mobile:createPacing({mobile:true}).chapters};
let previous;try{previous=JSON.parse(await readFile(path,'utf8'));}catch{}
const equivalent=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>['lo','hi','vh','cost'].every(k=>Math.abs(v[k]-b[i][k])<1e-10)&&v.curve.length===b[i].curve.length&&v.curve.every((x,j)=>Math.abs(x-b[i].curve[j])<1e-10));
if(!equivalent(previous?.desktop,next.desktop)||!equivalent(previous?.mobile,next.mobile)){await writeFile(path,JSON.stringify(next)+'\n');console.log('Regenerated pacing tables after authored route change');}else console.log('Verified committed pacing tables; no source changes');
