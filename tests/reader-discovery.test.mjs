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
