// Download only in isolated CI, never from a visitor's browser or production build.
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='artifacts/asset-audition';
await mkdir(root,{recursive:true});
const candidates=['graphics-card','server-rack','quantum-computer'];
const report=[];
for(const name of candidates){
 const source='https://grab3d.com/models/electronics/'+name+'/',url='https://grab3d.com/dl/'+name+'/'+name+'-light.glb';
 try{
 const response=await fetch(url,{signal:AbortSignal.timeout(30000),redirect:'follow'});
 if(!response.ok)throw Error('HTTP '+response.status);
 if(new URL(response.url).hostname!=='grab3d.com')throw Error('unexpected download host');
 const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>5_000_000||bytes.length<20||bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length)throw Error('invalid GLB envelope');
 const len=bytes.readUInt32LE(12);if(bytes.readUInt32LE(16)!==0x4e4f534a||len>bytes.length-20)throw Error('invalid JSON chunk');
 const gltf=JSON.parse(bytes.subarray(20,20+len).toString('utf8'));
 for(const item of [...(gltf.images??[]),...(gltf.buffers??[])])if(item.uri&&!item.uri.startsWith('data:'))throw Error('external resource reference');
 await writeFile(root+'/'+name+'.glb',bytes);
 report.push({name,source,url,license:'CC0 1.0 per publisher',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),nodes:(gltf.nodes??[]).map(x=>x.name??null),animations:(gltf.animations??[]).map(x=>x.name??null),extensions:gltf.extensionsUsed??[]});
 }catch(e){report.push({name,source,url,error:String(e)});}
}
await writeFile(root+'/manifest.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report.map(({nodes,...r})=>({...r,nodeCount:nodes?.length,articulatedNodes:nodes?.filter(n=>/fan|rotor|door/i.test(n??''))}))));
if(report.some(r=>r.error))process.exitCode=1;
