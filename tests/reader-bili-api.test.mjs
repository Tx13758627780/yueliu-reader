import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir='.sites-runtime/bili-api-tests';mkdirSync(dir,{recursive:true});
await build({entryPoints:['lib/bili-api.ts','lib/bili-content.ts','lib/api-client.ts','lib/bili-client.ts'],outdir:dir,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {handleBilibili}=await import('../'+dir+'/bili-api.js');
const {fetchBiliContent,biliContentId}=await import('../'+dir+'/bili-content.js');
const {apiFetch}=await import('../'+dir+'/api-client.js');
const {wbiQuery,biliDynamicFeed}=await import('../'+dir+'/bili-client.js');

test('portable WBI digest remains compatible with the original MD5 protocol',()=>{
 const signed=wbiQuery({a:'中文',z:'test'},'a'.repeat(32),'a'.repeat(32),1700000000);
 const [query,digest]=signed.split('&w_rid=');
 assert.equal(digest,createHash('md5').update(query+'a'.repeat(32)).digest('hex'));
});
test('dynamic feed preserves Opus text, images, video IDs and stable deduplication',()=>{
 const row={id_str:'123',modules:{module_author:{name:'Alice',pub_ts:1700000000},module_dynamic:{major:{opus:{summary:{text:'<script>bad</script>hello'},pics:[{url:'https://i.example/a.jpg'},{url:'javascript:alert(1)'}]}}}}};
 const video={id_str:'124',modules:{module_dynamic:{major:{archive:{bvid:'BV123abc',title:'Video',cover:'https://i.example/v.jpg'}}}}};
 const feed=biliDynamicFeed({items:[row,row,video]},'1','https://reader.example/feed');
 assert.equal(feed.items.length,2);assert.equal(feed.items[0].id,'123');
 assert.match(feed.items[0].content_html,/a.jpg/);assert.doesNotMatch(feed.items[0].content_html,/<script>|javascript:/);
 assert.equal(feed.items[1]._yueliu.bvid,'BV123abc');
});
test('space dynamics use BiliPai space endpoint and never substitute the global feed',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 globalThis.fetch=async raw=>{const u=new URL(raw);assert.equal(u.pathname,'/x/polymer/web-dynamic/v1/feed/space');assert.equal(u.searchParams.get('host_mid'),'123');return Response.json({code:0,data:{items:[]}});};
 const r=await handleBilibili(new Request('https://reader.example/api/bilibili?mode=feed&uid=123&kind=dynamic'));
 assert.equal(r.status,200);assert.deepEqual((await r.json()).items,[]);
});
test('public video and article details use exact BiliPai endpoints and reject lookalike hosts',async t=>{
 assert.equal(biliContentId('https://www.bilibili.com.attacker.example/read/cv1'),null);
 assert.equal(biliContentId('https://attacker@www.bilibili.com/read/cv1'),null);
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 globalThis.fetch=async raw=>{const u=new URL(raw);if(u.pathname==='/x/web-interface/view'){assert.equal(u.searchParams.get('aid'),'123');return Response.json({code:0,data:{bvid:'BV123abc',title:'A < B',desc:'Intro',owner:{name:'Alice'},pages:[{part:'One'},{part:'Two'}]}});}assert.equal(u.pathname,'/x/article/view');assert.equal(u.searchParams.get('id'),'99');return Response.json({code:0,data:{title:'Article',content:'<p>Public body</p>'}});};
 const video=await fetchBiliContent('https://www.bilibili.com/video/av123',AbortSignal.timeout(1000));
 assert.equal(video.url,'https://www.bilibili.com/video/BV123abc');assert.match(video.html,/A &lt; B/);assert.match(video.html,/非字幕/);
 assert.match((await fetchBiliContent('https://www.bilibili.com/read/cv99',AbortSignal.timeout(1000))).html,/Public body/);
});
test('Android runs the new Bili API locally instead of calling the old reader service',async t=>{
 const oldFetch=globalThis.fetch,oldWindow=globalThis.window;
 t.after(()=>{globalThis.fetch=oldFetch;if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;});
 globalThis.window={__YUELIU_NATIVE__:true};let called=0;
 globalThis.fetch=async raw=>{called++;assert.equal(new URL(raw).origin,'https://api.bilibili.com');return Response.json({code:0,data:{list:[]}});};
 const r=await apiFetch('/api/bilibili?mode=ranking');assert.equal(r.status,200);assert.equal(called,1);
});
