import fs from 'node:fs';import assert from 'node:assert/strict';import path from 'node:path';
for(const route of ['','terminal/','workspace/','agent/','vault/','docs/'])assert(fs.existsSync('app/'+route+'page.tsx'),'Missing route '+route);
for(const asset of ['docs/assets/velune-banner.png','public/assets/velune-folded-fragments.glb','public/assets/velune-mark.svg'])assert(fs.statSync(asset).size>0,'Missing asset '+asset);
const model=fs.readFileSync('public/assets/velune-folded-fragments.glb');assert.equal(model.toString('ascii',0,4),'glTF');assert.equal(model.readUInt32LE(4),2);assert.equal(model.readUInt32LE(8),model.length);
const contracts=fs.readFileSync('lib/contracts.ts','utf8');for(const address of ['0xEC5266c9e44631e1ba22FD6377C38130c1F3B738','0xBB0C7F576B7bdAa8f2a119cb295076aCD0C9013f','0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168'])assert(contracts.includes(address),'Missing supplied contract');
const readme=fs.readFileSync('README.md','utf8');for(const match of readme.matchAll(/(?:href|src)="([^"#]+)"/g)){const target=match[1];if(!/^(https?:|mailto:)/.test(target))assert(fs.existsSync(path.resolve(target)),'Broken README link '+target);}
console.log('Routes, GLB integrity, supplied addresses, brand assets and local README links passed.');
