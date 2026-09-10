'use client';
import {useEffect,useRef,useState} from 'react';
import {Download,Wifi,WifiOff,RefreshCw} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {ClientDownloads} from '@/components/client-downloads';
import {localAll,localGet} from '@/lib/local-store';
import {syncNotes,type StoredNote} from '@/lib/notes-client';
import {isNative,serviceBase} from '@/lib/api-client';
import {exportBackup,importBackup,downloadFile} from '@/lib/offline';
import {toast} from 'sonner';

type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export function OfflineSettings(){
 const [open,setOpen]=useState(false),[online,setOnline]=useState(true),[status,setStatus]=useState(''),[pending,setPending]=useState(0),[native,setNative]=useState(false),[service,setService]=useState(''),[busy,setBusy]=useState(false),[install,setInstall]=useState<InstallPrompt|null>(null),[error,setError]=useState(''),[ready,setReady]=useState(false),[waiting,setWaiting]=useState<ServiceWorker|null>(null),[checking,setChecking]=useState(false);
 const registration=useRef<ServiceWorkerRegistration|null>(null),updating=useRef(false);
 async function state(){try{setPending((await localAll<StoredNote>('notes')).filter(n=>n.dirty).length);setError(await localGet<string>('meta','notes-sync-error')||'');}catch{setError('本机存储暂不可用，请检查浏览器存储设置');}}
 useEffect(()=>{
  const native=isNative();let alive=true;const cleanups:Array<()=>void>=[];
  setNative(native);setService(serviceBase());setOnline(navigator.onLine);
  const network=()=>{setOnline(navigator.onLine);if(navigator.onLine)void syncNotes().then(state).catch(()=>void state());};
  const installHandler=(e:Event)=>{e.preventDefault();setInstall(e as InstallPrompt);};
  const installed=()=>setInstall(null);
  const changed=()=>{if(updating.current)location.reload();};
  window.addEventListener('online',network);window.addEventListener('offline',network);
  window.addEventListener('yueliu-notes-updated',state);window.addEventListener('beforeinstallprompt',installHandler);window.addEventListener('appinstalled',installed);
  void state();
  if(!native&&'serviceWorker' in navigator){
   navigator.serviceWorker.addEventListener('controllerchange',changed);
   navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(reg=>{
    if(!alive)return;registration.current=reg;
    if(reg.active)setReady(true);setWaiting(reg.waiting);
    const watch=()=>{const worker=reg.installing;if(!worker)return;const change=()=>{if(!alive)return;if(worker.state==='installed'){if(reg.active)setWaiting(reg.waiting||worker);}if(worker.state==='redundant')setStatus('离线更新未完成，稍后可以重试');};worker.addEventListener('statechange',change);cleanups.push(()=>worker.removeEventListener('statechange',change));};
    reg.addEventListener('updatefound',watch);cleanups.push(()=>reg.removeEventListener('updatefound',watch));watch();
    void navigator.serviceWorker.ready.then(()=>{if(alive)setReady(true);});
   }).catch(()=>{if(alive)setStatus('离线页面准备失败，请联网后点击检查更新');});
  }
  const timer=setInterval(()=>{if(navigator.onLine)void syncNotes().then(state).catch(()=>void state());},60000);
  return()=>{alive=false;clearInterval(timer);cleanups.forEach(fn=>fn());window.removeEventListener('online',network);window.removeEventListener('offline',network);window.removeEventListener('yueliu-notes-updated',state);window.removeEventListener('beforeinstallprompt',installHandler);window.removeEventListener('appinstalled',installed);if('serviceWorker' in navigator)navigator.serviceWorker.removeEventListener('controllerchange',changed);};
 },[]);
 async function checkUpdate(){setChecking(true);try{const reg=registration.current||await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});registration.current=reg;await reg.update();setWaiting(reg.waiting);setStatus(reg.waiting?'新版离线页面已下载':reg.installing?'正在下载新版离线页面…':'已检查离线页面更新');}catch{setStatus('未能检查更新，请联网后重试');}finally{setChecking(false);}}
 return <><button className="settings-button" onClick={()=>{setOpen(true);void state();}}>{online?<Download size={17}/>:<WifiOff size={17}/>}离线与客户端{!online&&<span>离线中</span>}{waiting&&<span>有更新</span>}</button>
 <Dialog open={open} onOpenChange={setOpen}><DialogContent className="app-dialog offline-dialog"><DialogTitle>离线与客户端</DialogTitle><DialogDescription>已保存的文章、译文、笔记与画布支持离线使用。更新订阅、抓取全文、在线翻译和 AI 需要联网。</DialogDescription>
 <div className="offline-summary">{online?<Wifi size={22}/>:<WifiOff size={22}/>}<div><strong>{online?'当前已联网':'当前离线'}</strong><p>{native?'笔记保存在本机，可用备份迁移':pending?`${pending} 条笔记等待同步`:'没有待上传的本机修改'} · {native?'应用已内置':ready?'离线页面已准备':'正在准备离线页面'}</p></div></div>
 {!native&&<div className="offline-actions"><button className="subtle" disabled={busy||!online} onClick={async()=>{setBusy(true);try{await syncNotes();await state();setStatus('同步完成');}catch(e){setStatus((e as Error).message);}finally{setBusy(false);}}}><RefreshCw size={16}/>立即同步笔记</button>{typeof navigator!=='undefined'&&'serviceWorker' in navigator&&<button className="subtle" disabled={checking||!online} onClick={()=>void checkUpdate()}><RefreshCw size={16} className={checking?'spin':''}/>检查离线页面更新</button>}</div>}
 {error&&!native&&<p className="ai-error">{error}。本机副本仍然保留。</p>}
 {waiting&&!native&&<div className="offline-update"><strong>新版离线页面已下载</strong><p>请先保存正在编辑的笔记，然后重新打开。离线文章和本机笔记会保留。</p><button className="primary" disabled={busy} onClick={()=>{updating.current=true;setBusy(true);if(waiting.state==='activated')location.reload();else waiting.postMessage('ACTIVATE');}}>更新并重新打开</button></div>}
 {install&&<button className="primary" onClick={async()=>{try{await install.prompt();await install.userChoice;}catch{setStatus('请从浏览器菜单添加到主屏幕');}finally{setInstall(null);}}}>安装到这台设备</button>}
 <div className="offline-section"><h3>备份与迁移</h3><p>包含已保存文章、译文、文字、手写、已下载录音和自由笔记。API 密钥不会导出；文章图片需在目标设备重新下载。</p>
 <button className="primary" disabled={busy} onClick={async()=>{setBusy(true);try{const saved=await downloadFile(await exportBackup(),'yueliu-backup-'+new Date().toISOString().slice(0,10)+'.json');setStatus(saved?'备份已导出':'已取消导出');}catch(e){setStatus((e as Error).message);}finally{setBusy(false);}}}>导出离线备份</button>
 <label className="field">从网页版 / 其他客户端导入<input type="file" accept="application/json,.json" disabled={busy} onChange={async e=>{const input=e.currentTarget,file=input.files?.[0];if(!file)return;setBusy(true);try{const n=await importBackup(file);toast.success(`已导入 ${n} 条笔记，正在重新打开`);location.reload();}catch(err){setStatus((err as Error).message);}finally{setBusy(false);input.value='';}}}/></label><small>导入按 ID 合并，保留本机较新的笔记。Android 会打开系统文件保存窗口。</small></div>
 <ClientDownloads/>
 {native&&<label className="field">在线服务地址<input type="url" value={service} onChange={e=>setService(e.target.value)}/><small>Android 联网功能使用此服务，也可填写你部署的阅流 HTTPS 地址。Windows 使用内置服务。</small><button className="subtle" onClick={()=>{try{const u=new URL(service);if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error();localStorage.setItem('yueliu-service',u.origin);toast.success('在线服务已保存');}catch{toast.error('请填写 HTTPS 网站根地址');}}}>保存在线服务</button></label>}
 {status&&<p role="status">{status}</p>}<p className="privacy">在文章工具栏点「离线保存」下载正文图片和已有录音。音视频节目、登录后内容不会自动下载。</p></DialogContent></Dialog></>;
}
