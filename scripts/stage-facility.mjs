// Stage only reviewed external source files, never the old authored world.
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const interiors=await read('assets/interior-lock.json'),composition=await read('assets/composition-lock.json'),external=(await read('assets/external-lock.json')).assets;
const take=(rows,names)=>rows.filter(r=>names.includes(r.name)).flatMap(r=>r.files);
const refinement=await read('assets/refinement-lock.json');
const spatial=await read('assets/spatial-transition-lock.json');
const selected=[...spatial,...refinement,...take(interiors,['hangar','straight','bridge']),...take(composition,['server-room','corridor-door']),...external.filter(r=>['quantum-computer'].includes(r.name)).map(r=>({file:r.name+'.glb',url:r.url,bytes:r.bytes,sha256:r.sha256}))];
const dir='public/models';await rm(dir,{recursive:true,force:true});await mkdir(dir+'/facility',{recursive:true});
async function stage(f){const u=new URL(f.url);if(u.protocol!=='https:'||!['tevy.dev','grab3d.com','dl.polyhaven.org'].includes(u.hostname))throw Error('unexpected source');const r=await fetch(u,{redirect:'error',signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error(f.file+' HTTP '+r.status);const chunks=[];let n=0;for await(const value of r.body){n+=value.length;if(n>f.bytes)throw Error('oversized '+f.file);chunks.push(Buffer.from(value));}const b=Buffer.concat(chunks);if(n!==f.bytes||createHash('sha256').update(b).digest('hex')!==f.sha256)throw Error('source changed: '+f.file);const dest=path.join(dir,'facility',f.file);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,b);}
await Promise.all(selected.map(stage));await writeFile(dir+'/manifest.json',JSON.stringify({version:'0.17',assets:selected},null,2));console.log('Facility:',selected.length,'verified files,',selected.reduce((s,f)=>s+f.bytes,0),'bytes');
