import {localAll,localGet,localPut,localClear} from './local-store';
import {isNative} from './api-client';
export type StoredNote={id:string;article:string;note:any;audio?:Blob;dirty:boolean;deleted?:boolean;revision:string};
let initialized:Promise<void>|undefined,syncing:Promise<void>|undefined;
function signal(){if(typeof window!=='undefined')window.dispatchEvent(new Event('yueliu-notes-updated'));}
async function initialize(){if(!initialized)initialized=(async()=>{const r=await fetch('/api/notebook',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('暂时无法同步笔记本');const {owner}=await r.json(),prior=await localGet<string>('meta','notebook-owner');if(prior&&owner&&prior!==owner){if((await localAll<StoredNote>('notes')).some(n=>n.dirty))throw new Error('笔记本身份已更改。本机有未同步笔记，请先导出备份，再恢复原笔记本。');await localClear('notes');}if(owner)await localPut('meta','notebook-owner',owner);})().catch(e=>{initialized=undefined;throw e;});return initialized;}
export async function syncNotes(){if(isNative()||!navigator.onLine)return;if(syncing)return syncing;syncing=(async()=>{await initialize();for(const row of await localAll<StoredNote>('notes')){if(!row.dirty)continue;let r:Response;if(row.deleted)r=await fetch('/api/notes?id='+encodeURIComponent(row.id),{method:'DELETE'});else{const f=new FormData();f.set('note',JSON.stringify(row.note));if(row.audio)f.set('audio',row.audio,'recording');r=await fetch('/api/notes',{method:'POST',body:f});}if(!r.ok){const d=await r.json();throw new Error(d.error||'同步失败');}const current=await localGet<StoredNote>('notes',row.id);if(current?.revision===row.revision)await localPut('notes',row.id,{...current,dirty:false});}await localPut('meta','notes-sync-error','');signal();})().catch(async e=>{await localPut('meta','notes-sync-error',(e as Error).message);signal();throw e;}).finally(()=>{syncing=undefined;});return syncing;}
export async function notesFetch(url:string,options?:RequestInit):Promise<Response>{
 const u=new URL(url,location.href),method=options?.method||'GET';
 if(u.pathname==='/api/notebook'){
  if(isNative())return Response.json({error:'离线客户端通过「离线与客户端」导入 / 导出备份迁移笔记。'},{status:400});
  if(method==='POST'){await syncNotes();const r=await fetch(url,options);if(r.ok){await localClear('notes');await localPut('meta','notebook-owner','');initialized=undefined;await initialize();signal();}return r;}
  await initialize();return fetch(url,{cache:'no-store',...options});
 }
 if(method==='POST'){
  const f=options?.body as FormData,note=JSON.parse(String(f.get('note'))),old=await localGet<StoredNote>('notes',note.id),file=f.get('audio');
  const audio=file instanceof Blob&&file.size?file:old?.audio;
  if(audio&&audio.size>12000000)return Response.json({error:'录音请小于 12 MB'},{status:400});
  note.updated=Date.now();note.hasAudio=!!audio||note.hasAudio;
  await localPut('notes',note.id,{id:note.id,article:note.article,note,audio,dirty:true,revision:crypto.randomUUID()});signal();void syncNotes().catch(()=>{});return Response.json({ok:true,local:true});
 }
 if(method==='DELETE'){const id=u.searchParams.get('id')!,old=await localGet<StoredNote>('notes',id);await localPut('notes',id,{...old,id,deleted:true,dirty:true,revision:crypto.randomUUID()});signal();void syncNotes().catch(()=>{});return Response.json({ok:true,local:true});}
 const audio=u.searchParams.get('audio');if(audio){const row=await localGet<StoredNote>('notes',audio);if(row?.audio)return new Response(row.audio);if(isNative()||!navigator.onLine)return new Response('此录音尚未下载',{status:404});await initialize();const r=await fetch(url);if(r.ok&&row){const blob=await r.clone().blob();await localPut('notes',audio,{...row,audio:blob});}return r;}
 const article=u.searchParams.get('article'),all=u.searchParams.has('all');
 if(!isNative()&&navigator.onLine){try{await syncNotes();const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('云端笔记暂时无法读取');const d=await r.json();const ids=new Set(d.notes.map((n:any)=>n.id));for(const note of d.notes){const old=await localGet<StoredNote>('notes',note.id);if(!old?.dirty)await localPut('notes',note.id,{...old,id:note.id,article:note.article,note,dirty:false,deleted:false,revision:crypto.randomUUID()});}for(const old of await localAll<StoredNote>('notes'))if(!old.dirty&&!old.deleted&&(all||old.article===article)&&!ids.has(old.id))await localPut('notes',old.id,{...old,deleted:true});}catch(e){await localPut('meta','notes-sync-error',(e as Error).message);}}
 const rows=await localAll<StoredNote>('notes');return Response.json({notes:rows.filter(n=>!n.deleted&&(all||n.article===article)).map(n=>({...n.note,hasAudio:!!n.audio||n.note.hasAudio})),local:true});
}
