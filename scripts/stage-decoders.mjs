import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('public/models/basis',{recursive:true});
for(const f of ['basis_transcoder.js','basis_transcoder.wasm'])await copyFile('node_modules/three/examples/jsm/libs/basis/'+f,'public/models/basis/'+f);

// Stage the optional typeface and its original license, no remote runtime requests.
{const fs=await import('node:fs/promises');const source='node_modules/three/examples/fonts/';try{await fs.mkdir('public/models/fonts',{recursive:true});await fs.copyFile(source+'LICENSE','public/models/fonts/LICENSE');await fs.copyFile(source+'helvetiker_regular.typeface.json','public/models/fonts/helvetiker_regular.typeface.json');}catch(e){console.warn('Raised typeface unavailable; printed surface typography remains supported',e.message);}}
