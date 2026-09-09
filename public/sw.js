importScripts('/offline/sw-version.js');
const SHELL='yueliu-shell-'+self.YUELIU_BUILD,MEDIA='yueliu-media-v1';
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(SHELL);const r=await fetch('/offline/assets.json',{cache:'no-store'});if(!r.ok)throw new Error('离线文件未生成');const files=await r.json();await cache.addAll(files);})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('yueliu-shell-')&&key!==SHELL)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{const req=event.request,u=new URL(req.url);if(req.method!=='GET'||u.origin!==self.location.origin)return;
 if(req.mode==='navigate'){event.respondWith((async()=>{try{return await fetch(req,{signal:AbortSignal.timeout(4000)});}catch{return (await caches.open(SHELL)).match('/offline/index.html')||Response.error();}})());return;}
 if(u.pathname.startsWith('/offline/')||u.pathname.startsWith('/assets/'))event.respondWith((async()=>{const cache=await caches.open(SHELL),hit=await cache.match(req);if(hit)return hit;const r=await fetch(req);if(r.ok)await cache.put(req,r.clone());return r;})());
 else if(u.pathname==='/api/image')event.respondWith((async()=>{const cache=await caches.open(MEDIA),hit=await cache.match(req);if(hit)return hit;const r=await fetch(req);if(r.ok)await cache.put(req,r.clone());return r;})());
});
