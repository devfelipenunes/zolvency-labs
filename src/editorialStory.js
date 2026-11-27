// Candidate editorial spine. No claim of launched products or partnerships.
export const editorialChapters=[
 {name:'ORIGIN',label:'Independent technology company',title:'Building beyond the known.',body:'We build blockchain solutions and explore the next generation of verifiable digital systems.'},
 {name:'BLOCKCHAIN',label:'Core focus',title:'Infrastructure built on trust.',body:'Smart contracts, digital assets and systems built for independent verification.'},
 {name:'STELLAR',label:'Financial infrastructure',title:'Engineering the future of finance.',body:'Programmable finance on Stellar: payments, tokenized assets and authorization.'},
 {name:'CRYPTOGRAPHY',label:'Privacy and verification',title:'Trust through mathematics.',body:'Signatures, commitments and zero-knowledge proofs for privacy and verification.'},
 {name:'INTELLIGENCE',label:'Research direction',title:'Intelligence with accountability.',body:'Exploring autonomous agents with explicit permissions and verifiable policies.'},
 {name:'QUANTUM',label:'Research direction',title:'Exploring new computational frontiers.',body:'Exploring quantum computation and, separately, post-quantum cryptography.'},
 {name:'CONVERGENCE',label:'Zolvency Labs',title:'The next frontier starts here.',body:'Starting with blockchain. Exploring what independent engineering can make possible.'}
];
export const editorialExperience=search=>new URLSearchParams(search).get('experience')==='editorial';

// One authored source for all experimental HTML and spatial copy. Legacy control remains intact.
const labels=["Independent technology company","Blockchain","Stellar","Cryptography","AI / research","Quantum / research","Zolvency Labs"];
const scripts={
  "manifesto": [
    [
      "Building beyond the known.",
      "We build blockchain systems for verifiable digital finance."
    ],
    [
      "Trust must be verifiable.",
      "Smart contracts and digital assets designed for independent verification."
    ],
    [
      "Value in motion.",
      "Building on Stellar for payments, tokenized assets and programmable authorization."
    ],
    [
      "Prove more. Reveal less.",
      "Exploring zero-knowledge proofs and cryptographic commitments to verify claims while protecting data."
    ],
    [
      "Autonomy needs boundaries.",
      "Exploring AI agents with explicit permissions and verifiable policies."
    ],
    [
      "Beyond classical limits.",
      "Exploring quantum computing and, separately, post-quantum cryptography."
    ],
    [
      "Independent by design.",
      "Blockchain is where we begin. Independent engineering is how we move forward."
    ]
  ],
  "precision": [
    [
      "Built to be verified.",
      "Independent engineering for blockchain and programmable finance."
    ],
    [
      "Verification comes first.",
      "Building smart contracts and digital asset infrastructure that can be independently checked."
    ],
    [
      "Programmable value.",
      "Developing on Stellar for payments, tokenization and on-chain authorization."
    ],
    [
      "Privacy with proof.",
      "Exploring signatures, commitments and zero-knowledge proofs for privacy and verification."
    ],
    [
      "Explicit control.",
      "Exploring AI agents with constrained permissions and policies that can be verified."
    ],
    [
      "A different computation.",
      "Researching quantum computing and post-quantum cryptography as distinct fields."
    ],
    [
      "Engineering on our terms.",
      "Our work starts with blockchain. Our research explores what follows."
    ]
  ],
  "exploration": [
    [
      "Beyond the expected.",
      "Building with blockchain. Exploring what comes next."
    ],
    [
      "Make trust tangible.",
      "Building systems whose transactions and rules can be independently verified."
    ],
    [
      "Move value differently.",
      "Exploring programmable finance on Stellar, from payments to tokenized assets."
    ],
    [
      "Keep what matters private.",
      "Exploring zero-knowledge proofs to verify claims without revealing unnecessary information."
    ],
    [
      "Give autonomy direction.",
      "Exploring AI agents governed by explicit permissions and verifiable policies."
    ],
    [
      "Think beyond the classical.",
      "Exploring quantum computation and, separately, post-quantum security."
    ],
    [
      "The work continues.",
      "Independent engineering begins with blockchain and extends into new computational possibilities."
    ]
  ]
};
export const editorialEditions=Object.freeze(['control',...Object.keys(scripts)]);
export function getEditorialEdition(search=''){const q=new URLSearchParams(search),edition=q.get('copy');return editorialExperience(search)&&editorialEditions.includes(edition)?edition:'control';}
export function getEditorialChapters(edition='control'){const rows=Object.hasOwn(scripts,edition)?scripts[edition]:null;return rows?editorialChapters.map((c,i)=>({...c,label:labels[i],title:rows[i][0],body:rows[i][1]})):editorialChapters;}
export function getCopyStyle(search=''){const q=new URLSearchParams(search),style=q.get('copy-style'),edition=getEditorialEdition(search);return edition==='control'?'control':['manifesto','precision','exploration'].includes(style)?style:edition;}
