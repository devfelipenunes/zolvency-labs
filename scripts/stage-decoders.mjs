import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('public/models/basis',{recursive:true});
for(const f of ['basis_transcoder.js','basis_transcoder.wasm'])await copyFile('node_modules/three/examples/jsm/libs/basis/'+f,'public/models/basis/'+f);
