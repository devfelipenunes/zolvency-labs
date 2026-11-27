// Offline audition only. No experimental package in production dependencies.
import generate from 'msdf-bmfont-xml';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
const dir='public/models/type-audition',font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
await mkdir(dir,{recursive:true});await copyFile(font,dir+'/font.ttf');
const text='Engineering the future of finance.\nPayments, tokenized assets and authorization.';
for(const type of ['sdf','msdf']){
 const result=await new Promise((resolve,reject)=>generate(font,{outputType:'json',filename:type,charset:[...new Set(text.replace(/\n/g,''))].join(''),fontSize:48,textureSize:[512,512],texturePadding:3,distanceRange:4,fieldType:type},(error,textures,font)=>error?reject(error):resolve({textures,font})));
 if(result.textures.length!==1)throw Error('expected one atlas per method');
 await writeFile(dir+'/'+type+'.png',result.textures[0].texture);
 await writeFile(dir+'/'+type+'.json',typeof result.font.data==='string'?result.font.data:JSON.stringify(result.font.data));
}
