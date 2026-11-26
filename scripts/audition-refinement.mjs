import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir='artifacts/refinement-audition';
await mkdir(dir,{recursive:true});
const tevy='https://tevy.dev/models/';
const entries=[
 ['hangar-low.glb',tevy+'scifi-hangar/v2/lod2.glb',tevy+'scifi-hangar'],
 ['server-room-low.glb',tevy+'server-room/v1/lod2.glb',tevy+'server-room'],
 ['straight-low.glb',tevy+'scifi-corridor-straight/v1/lod2.glb',tevy+'scifi-corridor-straight'],
 ['bridge-low.glb',tevy+'scifi-bridge-room/v2/lod2.glb',tevy+'scifi-bridge-room'],
 ['corridor-door-low.glb',tevy+'scifi-corridor-door/v1/lod2.glb',tevy+'scifi-corridor-door'],
 ['button-panel.glb',tevy+'button-panel/v1/lod1.glb',tevy+'button-panel'],
 ['cable.glb',tevy+'wall-cable-bundle-short/v1/lod1.glb',tevy+'wall-cable-bundle-short'],
 ['hangar.hdr','https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/hangar_interior_1k.hdr','https://polyhaven.com/a/hangar_interior']
];
const result=[];
for(const [file,url,source] of entries){try{
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status);
 let n=0,parts=[];for await(const x of r.body){n+=x.length;if(n>6_000_000)throw Error('asset too large');parts.push(Buffer.from(x));}const b=Buffer.concat(parts);
 let nodes=[],triangles=0;
 if(file.endsWith('.glb')){if(b.readUInt32LE(0)!==0x46546c67||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length)throw Error('invalid GLB');const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));if([...(g.buffers??[]),...(g.images??[])].some(o=>o.uri&&!o.uri.startsWith('data:')))throw Error('external URI');nodes=(g.nodes??[]).map(o=>o.name??'');triangles=(g.meshes??[]).flatMap(m=>m.primitives).reduce((s,p)=>s+((p.mode??4)===4?(g.accessors[p.indices??p.attributes.POSITION]?.count??0)/3:0),0);}
 else if(!b.subarray(0,16).toString().startsWith('#?RADIANCE')&&!b.subarray(0,16).toString().startsWith('#?RGBE'))throw Error('not HDR');
 const record={file,url,source,license:'CC0-1.0',bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),nodes,triangles};result.push(record);await writeFile(dir+'/'+file,b);console.log(JSON.stringify(record));
 }catch(e){result.push({file,url,source,error:String(e)});console.warn(file,String(e));}}
await writeFile(dir+'/manifest.json',JSON.stringify(result,null,2));
if(result.some(r=>r.error))process.exitCode=1;
