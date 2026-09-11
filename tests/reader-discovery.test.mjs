import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdirSync,readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
mkdirSync('.sites-runtime/discovery-tests',{recursive:true});
await build({entryPoints:['lib/discovery.ts','lib/feed-reader.ts'],outdir:'.sites-runtime/discovery-tests',bundle:true,platform:'node',format:'esm'});
const {buildDiscoveryRoute}=await import('../.sites-runtime/discovery-tests/discovery.js');
const {parseFeed}=await import('../.sites-runtime/discovery-tests/feed-reader.js');
globalThis.DOMParser=new JSDOM('').window.DOMParser;
const data=JSON.parse(readFileSync('lib/discovery-data.json','utf8'));
test('route parameters cannot inject a query or change the RSSHub host',()=>{
 const r={path:'/site/user/:name/:page?',params:[{key:'name',optional:false,default:''},{key:'page',optional:true,default:''}]};
 assert.throws(()=>buildDiscoveryRoute(r,{}),/请填写/);
 assert.equal(buildDiscoveryRoute(r,{name:'a/b?x=1#z'}),'/site/user/a%2Fb%3Fx%3D1%23z');
 assert.equal(buildDiscoveryRoute(r,{name:'alice'}),'/site/user/alice');
});
test('directory contains real configuration for major Folo platforms, with unique paths',()=>{
 assert.ok(data.platforms.length>1000);
 for(const key of ['bilibili','youtube','telegram','nature','github'])assert.ok(data.platforms.find(p=>p.key===key)?.routes.length,key);
 for(const p of data.platforms){assert.equal(new Set(p.routes.map(r=>r.path)).size,p.routes.length);for(const r of p.routes)assert.ok(r.path.startsWith('/'+p.key+'/'));}
});
test('Lancet Crossref response becomes clearly labeled metadata on an older server',()=>{
 const out=parseFeed(JSON.stringify({message:{items:[{DOI:'10.1016/test',title:['New research'],published:{'date-parts':[[2026,9,10]]},author:[{given:'A',family:'Smith'}]}]}}),'https://api.crossref.org/journals/0140-6736/works?sort=published&order=desc&rows=30');
 assert.equal(out.items.length,1);assert.equal(out.items[0].url,'https://doi.org/10.1016/test');assert.match(out.items[0].body,/非全文/);assert.match(out.feed.name,/Crossref/);
 assert.throws(()=>parseFeed('{"message":{"items":[]}}','https://example.com/feed'),/有效的 JSON Feed/);
});

test('TSX route imports remain configurable without executing upstream handlers',async()=>{
 const {mkdtempSync,writeFileSync}=await import('node:fs');const {resolve,join}=await import('node:path');const {spawnSync}=await import('node:child_process');
 const root=mkdtempSync(resolve('.sites-runtime/discovery-fixture-'));mkdirSync(join(root,'lib'));mkdirSync(join(root,'routes/site'),{recursive:true});
 writeFileSync(join(root,'folo.json'),JSON.stringify([{key:'site',name:'Example',host:'example.com',categories:['other']} ]));
 writeFileSync(join(root,'routes/site/index.tsx'),`throw new Error('Must not execute');export const route={name:'Posts',path:'/user/:id/:lang?',parameters:{id:'User ID',lang:{default:'en'}},handler:()=> <div/>};`);
 writeFileSync(join(root,'routes/site/fake.test.tsx'),`export const route={name:'Test only',path:'/fake'};`);
 const result=spawnSync(process.execPath,[resolve('scripts/import-discovery.mjs'),join(root,'folo.json'),join(root,'routes')],{cwd:root,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);const out=JSON.parse(readFileSync(join(root,'lib/discovery-data.json'),'utf8'));
 assert.equal(out.platforms[0].routes.length,1);assert.equal(buildDiscoveryRoute(out.platforms[0].routes[0],{id:'alice'}),'/site/user/alice/en');
});

test('specialty journals keep their own titles and reject unregistered Crossref feeds',()=>{
 const body=JSON.stringify({message:{items:[{DOI:'10.1016/example',title:['Oncology study']} ]}});
 const result=parseFeed(body,'https://api.crossref.org/journals/1470-2045/works?sort=published&order=desc&rows=30');
 assert.match(result.feed.name,/The Lancet Oncology/);
 assert.match(result.items[0].body,/非全文/);
 for(const url of ['https://api.crossref.org/journals/0000-0000/works','https://api.crossref.org.example.com/journals/1470-2045/works','https://user@api.crossref.org/journals/1470-2045/works'])assert.throws(()=>parseFeed(body,url),/有效的 JSON Feed/);
});
