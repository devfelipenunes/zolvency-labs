import {mkdir,writeFile,readFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const dir='artifacts/interior-audition',stage=process.argv.includes('--stage');
const lock=stage?JSON.parse(await readFile('assets/interior-lock.json','utf8')):null;
await mkdir(dir,{recursive:true});
const candidates=[
 ['straight','https://tevy.dev/models/scifi-corridor-straight/v1/lod1.glb','https://tevy.dev/models/scifi-corridor-straight'],
 ['corner','https://tevy.dev/models/scifi-corridor-corner/v1/lod1.glb','https://tevy.dev/models/scifi-corridor-corner'],
 ['junction','https://tevy.dev/models/scifi-corridor-t-junction/v1/lod1.glb','https://tevy.dev/models/scifi-corridor-t-junction'],
 ['bridge','https://tevy.dev/models/scifi-bridge-room/v2/lod1.glb','https://tevy.dev/models/scifi-bridge-room'],
 ['hangar','https://tevy.dev/models/scifi-hangar/v2/lod1.glb','https://tevy.dev/models/scifi-hangar'],
 ['control-room','https://tevy.dev/models/control-room/v1/lod1.glb','https://tevy.dev/models/control-room']
];
const allowed=new Set(['tevy.dev','grab3d.com','api.polyhaven.com','dl.polyhaven.org','cdn.polyhaven.com']);
const hash=b=>createHash('sha256').update(b).digest('hex');
async function download(url,limit=12_000_000){const u=new URL(url);if(u.protocol!=='https:'||!allowed.has(u.hostname))throw Error('unapproved host');const res=await fetch(url,{redirect:'error',headers:{'User-Agent':'ZolvencyLabsAssetAudition/1.0'},signal:AbortSignal.timeout(30000)});if(!res.ok)throw Error('HTTP '+res.status);const reader=res.body.getReader(),chunks=[];let n=0;while(true){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>limit){await reader.cancel();throw Error('size exceeds budget');}chunks.push(Buffer.from(value));}return Buffer.concat(chunks);}
function describe(g){return {extensions:g.extensionsUsed??[],required:g.extensionsRequired??[],nodes:(g.nodes??[]).map(n=>({name:n.name??'',mesh:n.mesh,translation:n.translation,scale:n.scale,rotation:n.rotation,children:n.children})),materials:(g.materials??[]).map(m=>m.name??''),meshes:(g.meshes??[]).map(m=>m.name??''),triangles:(g.meshes??[]).flatMap(m=>m.primitives).reduce((n,p)=>n+((p.mode??4)===4?(g.accessors[p.indices??p.attributes.POSITION]?.count??0)/3:0),0)};}
const report=[];
async function save(name,b,url){const file=path.join(dir,name);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,b);return {file:name,url,bytes:b.length,sha256:hash(b)}}
for(const [name,url,source] of candidates){try{const b=await download(url);if(b.length<20||b.readUInt32LE(0)!==0x46546c67||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length||b.readUInt32LE(16)!==0x4e4f534a)throw Error('bad GLB');const length=b.readUInt32LE(12);if(length>b.length-20)throw Error('bad JSON chunk');const g=JSON.parse(b.subarray(20,20+length));for(const o of [...(g.images??[]),...(g.buffers??[])])if(o.uri&&!o.uri.startsWith('data:'))throw Error('external reference');report.push({name,source,license:'CC0-1.0',files:[await save(name+'.glb',b,url)],...describe(g)});}catch(e){report.push({name,source,error:String(e)});}}
await writeFile(dir+'/manifest.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.map(({nodes,meshes,materials,...r})=>({...r,nodeCount:nodes?.length,nodeNames:nodes?.map(n=>n.name).slice(0,100),materials}))));
if(report.some(r=>r.error))process.exitCode=1;
if(stage){if(process.exitCode)throw Error('acquisition failed');for(const r of report){const expected=lock.find(e=>e.name===r.name);if(!expected||JSON.stringify(r.files)!==JSON.stringify(expected.files))throw Error('Asset differs from review '+r.name);}for(const r of report)for(const f of r.files){const dest='public/models/interiors/'+f.file;await mkdir(path.dirname(dest),{recursive:true});await copyFile(dir+'/'+f.file,dest);}}
