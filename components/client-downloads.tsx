'use client';
import {useEffect,useState} from 'react';
import {Monitor,Smartphone,Download,RefreshCw} from 'lucide-react';
import {fetchClientRelease,RELEASES_URL,type ClientRelease} from '@/lib/releases';
import {isNative} from '@/lib/api-client';
import client from '@/native/package.json';
import {AndroidUpdater} from '@/components/android-updater';

export function ClientDownloads(){
 const [release,setRelease]=useState<ClientRelease|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function check(signal?:AbortSignal){setBusy(true);setError('');try{setRelease(await fetchClientRelease(signal));}catch(e){if(!signal?.aborted)setError((e as Error).message);}finally{if(!signal?.aborted)setBusy(false);}}
 useEffect(()=>{if(!navigator.onLine){setError('联网后可检查安装包');return;}const controller=new AbortController();void check(controller.signal);return()=>controller.abort();},[]);
 const android=typeof window!=='undefined'&&!!(window as any).__YUELIU_ANDROID__;
 const names={setup:'Windows 安装版',portable:'Windows 便携版',android:'Android APK'};
 return <div className="offline-section"><div className="download-heading"><h3>安装阅流客户端</h3><button className="subtle" aria-label="检查客户端更新" disabled={busy} onClick={()=>void check()}><RefreshCw size={15} className={busy?'spin':''}/>检查更新</button></div><p>内置阅读和笔记页面，首次打开也能离线做笔记。{isNative()?`当前客户端 ${client.version}。`:''}</p>{release&&<><p role="status">可下载版本 {release.version}{release.preview?' · 测试版':''}{isNative()&&release.version===client.version?' · 与当前版本一致':''}</p><div className="client-downloads">{release.files.map(file=><a key={file.kind} href={file.url} target="_blank" rel="noreferrer">{file.kind==='android'?<Smartphone size={22}/>:<Monitor size={22}/>}<strong>{names[file.kind]}</strong><small>{file.kind==='android'?'Android 7.0 及以上':'Windows 10 / 11 · 64 位'} · {(file.size/1024/1024).toFixed(1)} MB</small><span><Download size={15}/>下载安装包</span></a>)}</div></>}{android&&<AndroidUpdater release={release}/>}{busy&&<p role="status">正在检查可下载版本…</p>}{error&&<p role="status">{error}</p>}{!busy&&!error&&!release&&<p>安装包尚在准备，可稍后重新检查。</p>}<a className="hub-doc" href={release?.url||RELEASES_URL} target="_blank" rel="noreferrer">查看下载页面与更新说明 ↗</a><small>Windows 暂无发布者签名；Android 为测试 APK。更新前先导出备份；若 Android 提示签名冲突，请保留备份后再卸载旧版。</small><small>iPhone / iPad：用 Safari 打开网页版，点「分享 → 添加到主屏幕」。</small></div>;
}
