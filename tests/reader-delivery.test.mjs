import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {build} from 'esbuild';
import {indexedDB} from 'fake-indexeddb';
const dir=path.resolve('.sites-runtime/delivery-tests');fs.mkdirSync(dir,{recursive:true});
await build({stdin:{contents:"export * from './lib/local-store';export * from './lib/offline';export * from './lib/releases';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:dir+'/subject.mjs',logLevel:'silent'});
const m=await import(dir+'/subject.mjs');globalThis.indexedDB=indexedDB;globalThis.window=new EventTarget();
const backup=data=>new File([JSON.stringify({format:'yueliu-backup',version:1,notes:[],...data})],'backup.json');
const note=(updated,text='备份')=>({id:crypto.randomUUID(),article:'https://example.com/a',kind:'text',text,quote:'片段',strokes:[],updated});

test('failed multi-store import rolls back both note and reader writes',async()=>{
 await m.localPut('meta','reader-data',{original:true});
 await assert.rejects(m.localWriteBatch([{store:'notes',key:'partial',value:{text:'must not survive'}},{store:'meta',key:'reader-data',value:{invalid:()=>{}}}]));
 assert.equal(await m.localGet('notes','partial'),undefined);
 assert.deepEqual(await m.localGet('meta','reader-data'),{original:true});
 await m.localClear('meta');
});
test('backup migration retains newer local notes and restores audio, articles and translations',async()=>{
 const newer=note(200,'本机较新'),restored=note(100);
 await m.localPut('notes',newer.id,{id:newer.id,note:newer,article:newer.article});
 const count=await m.importBackup(backup({notes:[{note:{...newer,updated:100,text:'旧版'}},{note:restored,audio:'data:audio/mp4;base64,dm9pY2U='}],reader:{feeds:[],articles:[{id:'article',title:'文章',body:'正文',source:'订阅',url:restored.article}]},outputs:{outputs:{'article:translate':'译文'},answer:{}}}));
 assert.equal(count,1);assert.equal((await m.localGet('notes',newer.id)).note.text,'本机较新');
 assert.equal(await (await m.localGet('notes',restored.id)).audio.text(),'voice');
 assert.equal((await m.localGet('meta','reader-data')).articles[0].body,'正文');
 assert.equal((await m.localGet('meta','ai-outputs')).outputs['article:translate'],'译文');
 const bad=note(300);
 await assert.rejects(m.importBackup(backup({notes:[{note:bad}],reader:{feeds:[],articles:[{}]}})));
 assert.equal(await m.localGet('notes',bad.id),undefined);
 await m.localClear('meta');await m.localClear('notes');
});
test('only complete releases with matching repository download URLs become install buttons',()=>{
 const version='0.2.1',tag='v'+version;
 const release={tag_name:tag,prerelease:true,published_at:'2026-09-09',assets:[`Yueliu-Reader-${version}-x64-setup.exe`,`Yueliu-Reader-${version}-x64-portable.exe`,`Yueliu-Reader-${version}-android.apk`].map(name=>({name,state:'uploaded',size:123,browser_download_url:`https://github.com/${m.REPOSITORY}/releases/download/${tag}/${name}`}))};
 assert.equal(m.selectClientRelease([release]).files.length,3);
 assert.equal(m.selectClientRelease([{...release,draft:true}]),null);
 assert.equal(m.selectClientRelease([{...release,assets:release.assets.slice(1)}]),null);
 assert.equal(m.selectClientRelease([{...release,assets:release.assets.map(a=>({...a,browser_download_url:'https://evil.example/app.exe'}))}]),null);
 assert.equal(m.selectClientRelease({message:'API limit'}),null);
});
function worker({network,cache}){
 const events={};const self={YUELIU_BUILD:'test',location:{origin:'https://reader.test'},addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(fs.readFileSync('public/sw.js','utf8'),{self,importScripts:()=>{},URL,Response,AbortSignal,fetch:network,caches:{open:async()=>({match:async()=>cache})}});
 return (path='/')=>{let response;events.fetch({request:{method:'GET',url:'https://reader.test'+path,mode:'navigate'},respondWith:r=>response=r});return response;};
}
test('offline navigation serves cached page, handles an evicted cache and keeps API responses separate',async()=>{
 const offline=async()=>{throw new Error('offline');};
 assert.equal(await (await worker({network:offline,cache:new Response('offline reader')})()).text(),'offline reader');
 assert.equal((await worker({network:offline})()).status,503);
 assert.equal(worker({network:offline,cache:new Response('must not replace API')})('/api/notes'),undefined);
});
test('temporary server failures fall back to offline shell while access errors stay intact',async()=>{
 assert.equal(await (await worker({network:async()=>new Response('down',{status:503}),cache:new Response('reader')})()).text(),'reader');
 assert.equal((await worker({network:async()=>new Response('denied',{status:403}),cache:new Response('reader')})()).status,403);
});
