import {createPacing} from '../src/graphics/cameraPacing.js';
import {writeFile} from 'node:fs/promises';
// The committed empty fallback allows plain node --test and the generator itself
// to work from a fresh checkout. predev/prebuild replaces it with exact tables.
const desktop=createPacing({mobile:false}).chapters,mobile=createPacing({mobile:true}).chapters;
await writeFile(new URL('../src/graphics/generatedPacing.json',import.meta.url),JSON.stringify({desktop,mobile})+'\n');
console.log('Prepared exact desktop/mobile pacing tables',desktop.length,mobile.length);
