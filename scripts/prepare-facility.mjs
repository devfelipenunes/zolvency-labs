import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';

if(process.env.NODE_TLS_REJECT_UNAUTHORIZED==='0'){
 console.error('Unsafe TLS configuration: unset NODE_TLS_REJECT_UNAUTHORIZED. Certificate checks must remain enabled.');
 process.exit(1);
}
const env={...process.env};
const args=[];
if(process.allowedNodeEnvironmentFlags.has('--use-system-ca')){
 args.push('--use-system-ca');
}else if(process.platform==='linux'&&!env.NODE_EXTRA_CA_CERTS&&existsSync('/etc/ssl/certs/ca-certificates.crt')){
 // Older supported Node 22 builds: add the existing OS trust bundle only.
 env.NODE_EXTRA_CA_CERTS='/etc/ssl/certs/ca-certificates.crt';
}
if(process.argv.includes('--offline'))env.FACILITY_OFFLINE='1';
function run(file,flags=[]){
 const result=spawnSync(process.execPath,[...flags,file],{stdio:'inherit',env});
 if(result.error){console.error(result.error.message);process.exit(1);}
 if(result.status!==0)process.exit(result.status??1);
}
run('scripts/stage-facility.mjs',args);
run('scripts/stage-decoders.mjs');
