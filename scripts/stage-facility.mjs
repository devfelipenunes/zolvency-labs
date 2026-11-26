// Stage reviewed external sources; retain verified local/cache bytes between runs.
import {readFile} from 'node:fs/promises';
import {stageAssets} from './facility-assets.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const interiors=await read('assets/interior-lock.json'),composition=await read('assets/composition-lock.json'),external=(await read('assets/external-lock.json')).assets;
const take=(rows,names)=>rows.filter(r=>names.includes(r.name)).flatMap(r=>r.files);
const refinement=await read('assets/refinement-lock.json');
const spatial=await read('assets/spatial-transition-lock.json');
const selected=[...spatial,...refinement,...take(interiors,['hangar','straight','bridge']),...take(composition,['server-room','corridor-door','reactor-room']),...external.filter(r=>['quantum-computer'].includes(r.name)).map(r=>({file:r.name+'.glb',url:r.url,bytes:r.bytes,sha256:r.sha256}))];
const source=process.env.FACILITY_SOURCE??'bundled';
if(!['bundled','upstream','published'].includes(source))throw Error('FACILITY_SOURCE must be bundled, upstream or published');
const result=await stageAssets(selected,{vendorDir:'assets/vendor/facility',published:source==='published',offline:source==='bundled'||process.env.FACILITY_OFFLINE==='1'||process.argv.includes('--offline')});
console.log('Facility:',result.total,'verified files,',result.bytes,'bytes; local:',result.local,'cache:',result.cache,'bundled:',result.vendor,'downloaded:',result.downloaded);
