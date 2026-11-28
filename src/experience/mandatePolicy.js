// Educational model, not a wallet, signature verifier or on-chain execution.
export function checkMandate({amount,limit,permission}){
 if(!Number.isFinite(amount)||amount<=0||!Number.isFinite(limit)||limit<0)return {allowed:false,reason:'Enter a positive amount and valid limit.'};
 if(permission!==true)return {allowed:false,reason:'Permission is not granted.'};
 if(amount>limit)return {allowed:false,reason:'Amount exceeds the authorized limit.'};
 return {allowed:true,reason:'The request satisfies the illustrative policy.'};
}
