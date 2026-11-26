// Pin the exact reviewed publisher bytes. Never fetch from a visitor's browser.
import {mkdir,writeFile,readFile,copyFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const lock=JSON.parse(await readFile(new URL('../assets/external-lock.json',import.meta.url),'utf8'));
const root='artifacts/asset-audition',stage=process.argv.includes('--stage'),dest='public/models/external';
await mkdir(root,{recursive:true});
if(stage){await rm(dest,{recursive:true,force:true});await mkdir(dest,{recursive:true});}
const report=[];
for(const a of lock.assets){
 try{
 const response=await fetch(a.url,{signal:AbortSignal.timeout(30000),redirect:'error'});
 if(!response.ok)throw Error('HTTP '+response.status);
 const reader=response.body.getReader();let total=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>a.bytes){await reader.cancel();throw Error('asset exceeds pinned size');}chunks.push(Buffer.from(value));}
 const bytes=Buffer.concat(chunks),sha256=createHash('sha256').update(bytes).digest('hex');
 if(bytes.length!==a.bytes||sha256!==a.sha256)throw Error('asset differs from reviewed lock; manual review required');
 if(bytes.length<20||bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length)throw Error('invalid GLB envelope');
 const len=bytes.readUInt32LE(12);if(bytes.readUInt32LE(16)!==0x4e4f534a||len>bytes.length-20)throw Error('invalid JSON chunk');
 const gltf=JSON.parse(bytes.subarray(20,20+len).toString('utf8'));
 for(const item of [...(gltf.images??[]),...(gltf.buffers??[])])if(item.uri&&!item.uri.startsWith('data:'))throw Error('external resource reference');
 const nodes=(gltf.nodes??[]).map(n=>n.name??null);
 if(!a.nodes.every(n=>nodes.includes(n)))throw Error('missing expected articulation');
 const triangleCount=(gltf.meshes??[]).flatMap(m=>m.primitives).reduce((n,p)=>{if((p.mode??4)!==4)throw Error('unexpected primitive mode');return n+(gltf.accessors[p.indices??p.attributes.POSITION].count/3);},0);
 if(triangleCount!==a.triangles)throw Error('unexpected triangle count '+triangleCount);
 await writeFile(root+'/'+a.name+'.glb',bytes);
 report.push({...a,license:lock.license,sha256,nodes,animations:(gltf.animations??[]).map(x=>x.name??null),extensions:gltf.extensionsUsed??[],triangleCount});
 }catch(e){report.push({name:a.name,source:a.source,error:String(e)});}
}
await writeFile(root+'/manifest.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report.map(({nodes,...r})=>({...r,nodeCount:nodes?.length}))));
if(report.some(r=>r.error)){console.error('External asset lock validation failed');process.exitCode=1;}
else if(stage){for(const a of lock.assets)await copyFile(root+'/'+a.name+'.glb',dest+'/'+a.name+'.glb');await copyFile(root+'/manifest.json',dest+'/manifest.json');}
