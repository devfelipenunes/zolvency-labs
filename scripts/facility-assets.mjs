import {readFile,writeFile,mkdir,rename,rm} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';

const hosts=new Set(['tevy.dev','grab3d.com','dl.polyhaven.org']);
const retryStatus=new Set([408,429,500,502,503,504]);
const certificateCodes=new Set(['SELF_SIGNED_CERT_IN_CHAIN','DEPTH_ZERO_SELF_SIGNED_CERT','UNABLE_TO_VERIFY_LEAF_SIGNATURE','UNABLE_TO_GET_ISSUER_CERT_LOCALLY','CERT_HAS_EXPIRED','CERT_NOT_YET_VALID','ERR_TLS_CERT_ALTNAME_INVALID']);
const hash=b=>createHash('sha256').update(b).digest('hex');
const valid=(b,f)=>b.length===f.bytes&&hash(b)===f.sha256;

export function validateAssets(assets){
 const names=new Set();
 for(const f of assets){
  if(typeof f.file!=='string'||!f.file.split('/').every(s=>/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(s)))throw Error('Invalid asset path: '+f.file);
  if(names.has(f.file))throw Error('Duplicate asset: '+f.file);names.add(f.file);
  if(!Number.isSafeInteger(f.bytes)||f.bytes<=0||!/^[0-9a-f]{64}$/.test(f.sha256))throw Error('Invalid asset lock: '+f.file);
  const u=new URL(f.url);
  if(u.protocol!=='https:'||!hosts.has(u.hostname)||u.username||u.password||u.port)throw Error('Unexpected source: '+f.file);
 }
}
export function networkError(e){
 const code=e?.cause?.code??e?.code??'';
 return {code,tls:certificateCodes.has(code)||String(code).startsWith('ERR_TLS_CERT_')};
}
async function readVerified(file,f){
 try{const b=await readFile(file);return valid(b,f)?b:null;}
 catch(e){if(e.code==='ENOENT')return null;throw e;}
}
async function atomicWrite(file,b){
 await mkdir(path.dirname(file),{recursive:true});
 const temp=file+'.'+randomUUID()+'.tmp';
 try{await writeFile(temp,b,{flag:'wx'});await rename(temp,file);}
 finally{await rm(temp,{force:true});}
}
async function download(f,{fetchImpl,attempts,timeout,sleep,published}){
 const url=published?new URL(f.file.split('/').map(encodeURIComponent).join('/'),'https://zolvency-labs.vercel.app/models/facility/'):new URL(f.url);
 let last;
 for(let i=0;i<attempts;i++){
  try{
   const response=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(timeout)});
   if(!response.ok){await response.body?.cancel();const e=Error('HTTP '+response.status);e.permanent=!retryStatus.has(response.status);throw e;}
   const chunks=[];let n=0;
   for await(const chunk of response.body){n+=chunk.length;if(n>f.bytes){const e=Error('oversized source');e.permanent=true;throw e;}chunks.push(Buffer.from(chunk));}
   const b=Buffer.concat(chunks,n);
   if(!valid(b,f)){const e=Error('source length or SHA-256 differs from lock');e.permanent=true;throw e;}
   return b;
  }catch(e){last=e;if(e.permanent||networkError(e).tls)throw e;if(i+1<attempts)await sleep(1000*(i+1));}
 }
 throw last;
}
export async function stageAssets(assets,{dir='public/models',cacheDir='.cache/facility',vendorDir=null,offline=false,published=false,fetchImpl=globalThis.fetch,attempts=3,timeout=45000,concurrency=4,sleep=ms=>new Promise(r=>setTimeout(r,ms)),log=console.log}={}){
 validateAssets(assets);
 if(process.env.NODE_TLS_REJECT_UNAUTHORIZED==='0')throw Error('Unsafe TLS configuration: unset NODE_TLS_REJECT_UNAUTHORIZED before staging.');
 const counts={local:0,cache:0,vendor:0,downloaded:0};const failures=[];let next=0;
 async function stage(f){
  const dest=path.join(dir,'facility',f.file),cached=path.join(cacheDir,f.sha256);
  let b=await readVerified(dest,f);
  if(b){counts.local++;if(!await readVerified(cached,f))await atomicWrite(cached,b);return;}
  b=await readVerified(cached,f);
  if(b){await atomicWrite(dest,b);counts.cache++;return;}
  if(vendorDir){
   b=await readVerified(path.join(vendorDir,f.file),f);
   if(b){await atomicWrite(cached,b);await atomicWrite(dest,b);counts.vendor++;return;}
  }
  if(offline)throw Error('missing verified local/cache/bundled bytes (offline mode)');
  b=await download(f,{fetchImpl,attempts,timeout,sleep,published});
  await atomicWrite(cached,b);await atomicWrite(dest,b);counts.downloaded++;
  log('Downloaded and verified: '+f.file);
 }
 async function worker(){
  while(next<assets.length){
   const f=assets[next++];
   try{await stage(f);}
   catch(e){const {code,tls}=networkError(e);failures.push({file:f.file,host:published?'zolvency-labs.vercel.app':new URL(f.url).hostname,code,tls,message:e.message});}
  }
 }
 await Promise.all(Array.from({length:Math.min(Math.max(1,concurrency),assets.length)},worker));
 if(failures.length){
  const details=failures.map(f=>f.file+' ('+f.host+'): '+f.message+(f.code?' ['+f.code+']':'')).join('\n');
  const guidance=failures.some(f=>f.tls)?'\nTLS certificate validation failed. Use the OS-approved corporate root or NODE_EXTRA_CA_CERTS pointing to an IT-approved PEM; contact IT if the root is not trusted. Never disable TLS validation.':'';
  throw Error('Facility staging incomplete; verified files retained.\n'+details+guidance);
 }
 await atomicWrite(path.join(dir,'manifest.json'),JSON.stringify({version:'0.17',assets},null,2));
 return {...counts,total:assets.length,bytes:assets.reduce((sum,f)=>sum+f.bytes,0)};
}
