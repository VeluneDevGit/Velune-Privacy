import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(path){const exports={};new Function('exports',ts.transpile(fs.readFileSync(path,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(exports);return exports;}
const vault=load('lib/vault.ts'),{journeyProgress}=load('components/velune/journey-timing.ts');
test('vault round trip preserves data and authenticated metadata',async()=>{const bytes=new TextEncoder().encode('Velune private file');const encrypted=await vault.encryptFile(bytes,'notes.txt','text/plain','correct horse battery staple');const restored=await vault.decryptFile(encrypted,'correct horse battery staple');assert.deepEqual(new Uint8Array(restored.data),bytes);assert.equal(restored.name,'notes.txt');assert.equal(restored.type,'text/plain');});
test('vault rejects the wrong password',async()=>{const encrypted=await vault.encryptFile(new Uint8Array([1,2,3]),'a.bin','application/octet-stream','a sufficiently long password');await assert.rejects(vault.decryptFile(encrypted,'a different long password'));});
test('vault detects ciphertext tampering',async()=>{const encrypted=await vault.encryptFile(new Uint8Array([1,2,3]),'a.bin','application/octet-stream','a sufficiently long password');encrypted[encrypted.length-1]^=1;await assert.rejects(vault.decryptFile(encrypted,'a sufficiently long password'));});
test('vault rejects short passphrases and unsupported containers',async()=>{await assert.rejects(vault.encryptFile(new Uint8Array([1]),'a','text/plain','short'));await assert.rejects(vault.decryptFile(new Uint8Array(80),'a long enough passphrase'));});
test('each chapter retains a fully visible reading hold',()=>{for(let i=0;i<4;i++)for(let x=0;x<1.2;x+=.1)assert.equal(journeyProgress(i*2+x),i);});
test('scroll transitions stay continuous, monotonic and bounded',()=>{let previous=0;for(let x=0;x<10;x+=.01){const p=journeyProgress(x);assert(p>=previous-1e-8&&p<=3);assert(p-previous<.03);previous=p;}assert.equal(journeyProgress(-1),0);assert.equal(journeyProgress(7),3);});
