import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {stageAssets,validateAssets,networkError} from '../scripts/facility-assets.mjs';
const entry=(file,body)=>({file,url:'https://tevy.dev/'+file,bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')});
const fixture=async t=>{const root=await mkdtemp(path.join(tmpdir(),'facility-test-'));t.after(()=>rm(root,{recursive:true,force:true}));return {dir:path.join(root,'public'),cacheDir:path.join(root,'cache'),log:()=>{},sleep:async()=>{}};};
const dest=(o,f)=>path.join(o.dir,'facility',f.file);
test('cold fetch, warm local and offline cache restore without network',async t=>{
 const o=await fixture(t),f=entry('rack.glb','rack');let calls=0;
 const fetchImpl=async(u,opts)=>{calls++;assert.equal(u.protocol,'https:');assert.equal(opts.redirect,'error');return new Response('rack');};
 assert.equal((await stageAssets([f],{...o,fetchImpl})).downloaded,1);assert.equal(calls,1);
 const noFetch=async()=>{throw Error('unexpected network');};
 assert.equal((await stageAssets([f],{...o,fetchImpl:noFetch})).local,1);
 await rm(o.dir,{recursive:true});assert.equal((await stageAssets([f],{...o,offline:true,fetchImpl:noFetch})).cache,1);
 assert.equal(await readFile(dest(o,f),'utf8'),'rack');
 await writeFile(dest(o,f),'evil');assert.equal((await stageAssets([f],{...o,offline:true,fetchImpl:noFetch})).cache,1);
 assert.equal(await readFile(dest(o,f),'utf8'),'rack');
});
test('TLS error fails fast, preserves valid local files and manifest',async t=>{
 const o=await fixture(t),a=entry('a.glb','good'),b=entry('b.glb','next');
 await stageAssets([a],{...o,fetchImpl:async()=>new Response('good')});
 const manifest=await readFile(path.join(o.dir,'manifest.json'),'utf8');let calls=0;
 const tls=Object.assign(Error('fetch failed'),{cause:{code:'SELF_SIGNED_CERT_IN_CHAIN'}});
 await assert.rejects(stageAssets([a,b],{...o,fetchImpl:async()=>{calls++;throw tls;}}),/SELF_SIGNED_CERT_IN_CHAIN.*\nTLS certificate validation failed/s);
 assert.equal(calls,1);assert.equal(await readFile(dest(o,a),'utf8'),'good');assert.equal(await readFile(path.join(o.dir,'manifest.json'),'utf8'),manifest);
 assert.equal((await stageAssets([a,b],{...o,fetchImpl:async()=>new Response('next')})).downloaded,1);
});
test('reject altered and oversized payloads without writing them',async t=>{
 const o=await fixture(t),a=entry('a.glb','good');let calls=0;
 await assert.rejects(stageAssets([a],{...o,fetchImpl:async()=>{calls++;return new Response('evil');}}),/SHA-256/);
 assert.equal(calls,1);await assert.rejects(readFile(dest(o,a)),{code:'ENOENT'});
 await assert.rejects(stageAssets([a],{...o,fetchImpl:async()=>new Response('oversized')}),/oversized/);
 await assert.rejects(readFile(path.join(o.dir,'manifest.json')),{code:'ENOENT'});
 await assert.rejects(stageAssets([a],{...o,offline:true,fetchImpl:async()=>assert.fail('network')}),/offline mode/);
});
test('retry transient HTTP errors and never retry permanent HTTP errors',async t=>{
 const o=await fixture(t),f=entry('a.glb','good');let calls=0;
 const res=await stageAssets([f],{...o,fetchImpl:async()=>++calls===1?new Response(null,{status:503}):new Response('good')});
 assert.equal(res.downloaded,1);assert.equal(calls,2);
 const b=entry('b.glb','other');calls=0;await assert.rejects(stageAssets([b],{...o,fetchImpl:async()=>{calls++;return new Response(null,{status:404});}}),/HTTP 404/);assert.equal(calls,1);
});
test('validate locks and reject unsafe paths or unsupported sources before writes',()=>{
 const a=entry('room.glb','good');assert.doesNotThrow(()=>validateAssets([a]));
 for(const patch of [{file:'../room'},{file:'/room'},{file:'a\\b'},{url:'http://tevy.dev/a'},{url:'https://elsewhere.test/a'},{url:'https://name:password@tevy.dev/a'},{sha256:'bad'},{bytes:0}])assert.throws(()=>validateAssets([{...a,...patch}]));
 assert.throws(()=>validateAssets([a,a]),/Duplicate/);
 assert.equal(networkError({cause:{code:'SELF_SIGNED_CERT_IN_CHAIN'}}).tls,true);
});
test('successful partial downloads are retained even when another file fails',async t=>{
 const o=await fixture(t),a=entry('a.glb','good'),b=entry('b.glb','next');
 await assert.rejects(stageAssets([a,b],{...o,fetchImpl:async u=>u.pathname.endsWith('a.glb')?new Response('good'):new Response(null,{status:404})}),/b.glb/);
 assert.equal(await readFile(dest(o,a),'utf8'),'good');
 assert.equal((await stageAssets([a,b],{...o,fetchImpl:async u=>{assert.ok(u.pathname.endsWith('b.glb'));return new Response('next');}})).local,1);
 assert.ok((await readdir(o.cacheDir)).every(x=>/^[0-9a-f]{64}$/.test(x)));
});

test('published recovery uses fixed HTTPS mirror but preserves the upstream lock and offline cache',async t=>{
 const o=await fixture(t),f=entry('rack.glb','good');let calls=0;
 const res=await stageAssets([f],{...o,published:true,fetchImpl:async(url,options)=>{calls++;assert.equal(url.href,'https://zolvency-labs.vercel.app/models/facility/rack.glb');assert.equal(options.redirect,'error');return new Response('good');}});
 assert.equal(res.downloaded,1);assert.equal(calls,1);
 const manifest=JSON.parse(await readFile(path.join(o.dir,'manifest.json'),'utf8'));assert.equal(manifest.assets[0].url,f.url);
 await rm(o.dir,{recursive:true});assert.equal((await stageAssets([f],{...o,offline:true,fetchImpl:async()=>assert.fail('unexpected network')})).cache,1);
});
test('published recovery rejects wrong bytes and retains TLS verification',async t=>{
 const o=await fixture(t),f=entry('rack.glb','good');
 await assert.rejects(stageAssets([f],{...o,published:true,fetchImpl:async()=>new Response('evil')}),/SHA-256/);
 await assert.rejects(readFile(dest(o,f)),{code:'ENOENT'});
 await assert.rejects(stageAssets([f],{...o,published:true,fetchImpl:async()=>{throw Object.assign(Error('fetch failed'),{cause:{code:'SELF_SIGNED_CERT_IN_CHAIN'}});}}),/zolvency-labs.vercel.app.*SELF_SIGNED_CERT_IN_CHAIN/s);
});

test('fresh checkout restores bundled models without any network, even with empty cache',async t=>{
 const o=await fixture(t),f=entry('rack.glb','verified');const vendorDir=path.join(o.dir,'../vendor');
 await mkdir(vendorDir,{recursive:true});await writeFile(path.join(vendorDir,f.file),'verified');
 const noFetch=async()=>assert.fail('unexpected network');
 let result=await stageAssets([f],{...o,vendorDir,offline:true,fetchImpl:noFetch});
 assert.equal(result.vendor,1);assert.equal(result.downloaded,0);assert.equal(await readFile(dest(o,f),'utf8'),'verified');
 await rm(o.dir,{recursive:true});await rm(o.cacheDir,{recursive:true});
 result=await stageAssets([f],{...o,vendorDir,offline:true,fetchImpl:noFetch});assert.equal(result.vendor,1);
 await rm(o.dir,{recursive:true});await rm(o.cacheDir,{recursive:true});await writeFile(path.join(vendorDir,f.file),'corrupt!');
 await assert.rejects(stageAssets([f],{...o,vendorDir,offline:true,fetchImpl:noFetch}),/missing verified local\/cache\/bundled bytes/);
 await assert.rejects(readFile(dest(o,f)),{code:'ENOENT'});
});
