import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir='artifacts/opportunity-audition';
await mkdir(dir,{recursive:true});
const {candidates}=JSON.parse(await readFile('assets/opportunity-catalog.json','utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
async function download(url,max=12_000_000){
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(45000),headers:{'User-Agent':'ZolvencyLabsAssetAudit/1.0 (public CC0 asset research)'}});
 if(!r.ok)throw Error('HTTP '+r.status);
 let size=0,parts=[];for await(const x of r.body){size+=x.length;if(size>max)throw Error('download exceeds cap');parts.push(Buffer.from(x));}
 return Buffer.concat(parts);
}
function inspectGLB(b){
 if(b.length<20||b.readUInt32LE(0)!==0x46546c67||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length||b.readUInt32LE(16)!==0x4e4f534a)throw Error('invalid GLB');
 const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 if([...(g.buffers??[]),...(g.images??[])].some(x=>x.uri&&!x.uri.startsWith('data:')))throw Error('external dependencies');
 const prim=(g.meshes??[]).flatMap(m=>m.primitives);
 return {triangles:prim.reduce((n,p)=>n+((p.mode??4)===4?(g.accessors[p.indices??p.attributes.POSITION]?.count??0)/3:0),0),nodes:(g.nodes??[]).map(x=>({name:x.name,translation:x.translation,rotation:x.rotation,scale:x.scale,mesh:x.mesh})),extensions:g.extensionsUsed??[],images:(g.images??[]).map(x=>({mime:x.mimeType,bytes:g.bufferViews?.[x.bufferView]?.byteLength??null})),materials:(g.materials??[]).map(x=>x.name),positionBounds:prim.map(p=>{const a=g.accessors[p.attributes.POSITION];return {min:a.min,max:a.max,normalized:a.normalized??false,componentType:a.componentType}})};
}
const report=[];
for(const c of candidates){
 const row={...c,downloads:{}};report.push(row);
 for(const [key,ext] of [['preview',c.preview?.includes('.webp')?'webp':'png'],['lod1','glb'],['lod2','glb'],['metadata','json']]){
  if(!c[key])continue;
  try{const b=await download(c[key]);const file=c.id+'-'+key+'.'+ext;
   if(ext==='webp'&&(b.subarray(0,4).toString()!=='RIFF'||b.subarray(8,12).toString()!=='WEBP'))throw Error('invalid WebP');
   if(ext==='png'&&b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('invalid PNG');
   if(ext==='json')JSON.parse(b);
   const metadata=ext==='glb'?inspectGLB(b):{};
   await writeFile(dir+'/'+file,b);row.downloads[key]={file,bytes:b.length,sha256:hash(b),...metadata};
  }catch(e){row.downloads[key]={error:String(e)};console.warn(c.id,key,String(e));}
 }
 console.log(c.id,JSON.stringify(Object.fromEntries(Object.entries(row.downloads).map(([k,v])=>[k,v.error??{bytes:v.bytes,triangles:v.triangles}]))));
}
await writeFile(dir+'/manifest.json',JSON.stringify(report,null,2));
const attempted=report.flatMap(x=>Object.values(x.downloads));
console.log('downloads',attempted.filter(x=>!x.error).length,'/',attempted.length);
if(attempted.some(x=>x.error))process.exitCode=1;
