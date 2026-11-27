// Public, network-neutral copy for the opt-in typography study. Legacy scene IDs stay internal.
export const livingCopy=Object.freeze([
 {id:'origin',name:'ORIGIN',label:'Zolvency Labs',title:'Beyond the known.',body:'Engineering the next generation of digital infrastructure.'},
 {id:'blockchain',name:'BLOCKCHAIN',label:'Blockchain systems',title:'Trust by design.',body:'Building decentralized, verifiable and programmable systems.'},
 {id:'infrastructure',name:'INFRASTRUCTURE',label:'Financial infrastructure',title:'Built for scale.',body:'Infrastructure for digital assets, payments and institutional operations.'},
 {id:'cryptography',name:'CRYPTOGRAPHY',label:'Cryptography and privacy',title:'Verify without revealing.',body:'Privacy and security through advanced cryptographic systems.'},
 {id:'intelligence',name:'INTELLIGENCE',label:'Intelligent systems',title:'Intelligence in motion.',body:'Connecting artificial intelligence with autonomous digital systems.'},
 {id:'quantum',name:'QUANTUM',label:'Quantum research',title:'Beyond classical limits.',body:'Exploring the next frontier of computation and security.'},
 {id:'convergence',name:'CONVERGENCE',label:'Zolvency Labs',title:'Engineering what comes next.',body:'Where blockchain, cryptography and emerging technologies converge.'}
]);
export function livingTypeEnabled(search,width){const p=new URLSearchParams(search);return width<720&&p.get('living-type')==='1'&&!p.has('experience')&&!p.has('type')&&!p.has('space')&&!p.has('cut')&&p.get('mobile-guide')!=='control'&&p.get('mobile-type')!=='control';}
