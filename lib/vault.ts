const enc=new TextEncoder();
const dec=new TextDecoder();
async function deriveKey(password:string,salt:Uint8Array){const material=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:salt as BufferSource,iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
export async function encryptFile(data:Uint8Array,name:string,type:string,password:string){
 if(data.length>20*1024*1024)throw Error('Maximum file size is 20 MB.');
 if(password.length<12)throw Error('Use a passphrase of at least 12 characters.');
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const meta=enc.encode(JSON.stringify({name,type}));const payload=new Uint8Array(4+meta.length+data.length);
 new DataView(payload.buffer).setUint32(0,meta.length);payload.set(meta,4);payload.set(data,4+meta.length);
 const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await deriveKey(password,salt),payload));
 const out=new Uint8Array(32+encrypted.length);out.set(enc.encode('VLN1'));out.set(salt,4);out.set(iv,20);out.set(encrypted,32);return out;
}
export async function decryptFile(raw:Uint8Array,password:string){
 if(raw.length>21*1024*1024)throw Error('Encrypted file is too large.');
 if(dec.decode(raw.slice(0,4))!=='VLN1'||raw.length<49)throw Error('This is not a supported Velune file.');
 const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:raw.slice(20,32)},await deriveKey(password,raw.slice(4,20)),raw.slice(32));
 const len=new DataView(clear).getUint32(0);if(len>clear.byteLength-4||len>10000)throw Error('Invalid encrypted file.');
 const meta=JSON.parse(dec.decode(clear.slice(4,4+len)));if(typeof meta.name!=='string'||typeof meta.type!=='string')throw Error('Invalid encrypted file metadata.');
 return {data:clear.slice(4+len),name:meta.name.replace(/[\\/]/g,'_'),type:meta.type};
}
