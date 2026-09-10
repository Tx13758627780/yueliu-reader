'use client';
import {useEffect,useState} from 'react';
import {registerPlugin} from '@capacitor/core';
import {Progress} from '@/components/ui/progress';
import {isNewerVersion,type ClientRelease} from '@/lib/releases';

type UpdateStatus={phase:'idle'|'downloading'|'paused'|'downloaded'|'failed';version?:string;received?:number;total?:number;message?:string;canInstall?:boolean};
const updater=registerPlugin<{
 info():Promise<{version:string;versionCode:number;canInstall:boolean}>;
 status():Promise<UpdateStatus>;
 download(input:{version:string;url:string;size:number;sha256?:string}):Promise<{started:boolean}>;
 cancel():Promise<void>;
 install():Promise<{permissionRequired?:boolean;installerOpened?:boolean}>;
}>('YueliuUpdater');
export function AndroidUpdater({release}:{release:ClientRelease|null}){
 const [current,setCurrent]=useState(''),[state,setState]=useState<UpdateStatus>({phase:'idle'}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{let alive=true;void Promise.all([updater.info(),updater.status()]).then(([info,status])=>{if(alive){setCurrent(info.version);setState(status);}}).catch(e=>{if(alive)setError(e.message||'无法读取更新状态');});const resume=()=>void updater.status().then(s=>{if(alive)setState(s);}).catch(()=>{});window.addEventListener('focus',resume);document.addEventListener('visibilitychange',resume);return()=>{alive=false;window.removeEventListener('focus',resume);document.removeEventListener('visibilitychange',resume);};},[]);
 useEffect(()=>{if(!['downloading','paused'].includes(state.phase))return;let alive=true,running=false;const timer=setInterval(async()=>{if(running)return;running=true;try{const s=await updater.status();if(alive)setState(s);}catch(e){if(alive)setError((e as Error).message);}finally{running=false;}},1000);return()=>{alive=false;clearInterval(timer);};},[state.phase]);
 const file=release?.files.find(f=>f.kind==='android'),newer=!!release&&!!current&&isNewerVersion(release.version,current),downloading=['downloading','paused'].includes(state.phase),progress=state.total&&state.total>0?Math.min(100,Math.round((state.received||0)*100/state.total)):null;
 async function download(){if(!release||!file)return;setBusy(true);setError('');setMessage('');try{await updater.download({version:release.version,url:file.url,size:file.size,sha256:file.sha256});setState(await updater.status());}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function install(){setBusy(true);setError('');try{const result=await updater.install();setMessage(result.permissionRequired?'请开启“允许来自此来源的应用”，返回这里后点击“继续安装”。':'已打开系统安装界面，请确认更新。取消后可再次安装。');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="android-updater"><h3>应用内更新</h3><p>{current?`当前版本 ${current}`:'正在读取应用版本…'}{release?newer?` · 发现新版本 ${release.version}`:' · 暂无更高版本':''}</p>{newer&&release?.notes&&<details><summary>查看更新说明</summary><p className="update-notes">{release.notes}</p></details>}
 {downloading&&<div role="status"><Progress value={progress}/><p>{state.phase==='paused'?state.message:`正在下载 ${state.version}：${progress===null?'准备中':progress+'%'}`}<br/>{((state.received||0)/1024/1024).toFixed(1)} MB{state.total&&state.total>0?` / ${(state.total/1024/1024).toFixed(1)} MB`:''}</p></div>}
 {state.phase==='downloaded'&&<p role="status">版本 {state.version} 已下载，点击安装前会校验文件和签名。</p>}
 {state.phase==='failed'&&<p role="alert">{state.message}</p>}
 <div className="offline-actions">{newer&&!downloading&&state.phase!=='downloaded'&&<button className="primary" disabled={busy||!file} onClick={()=>void download()}>{busy?'正在处理…':state.phase==='failed'?'重新下载':'下载并安装更新'}</button>}{state.phase==='downloaded'&&<button className="primary" disabled={busy} onClick={()=>void install()}>{busy?'正在校验…':'继续安装'}</button>}{state.phase!=='idle'&&<button className="subtle" disabled={busy} onClick={async()=>{setBusy(true);try{await updater.cancel();setState({phase:'idle'});setMessage('已清理更新下载');setError('');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>{downloading?'取消下载':'清理安装包'}</button>}</div>
 {message&&<p role="status">{message}</p>}{error&&<p className="ai-error" role="alert">{error}</p>}<small>下载由系统管理，关闭此窗口后仍会继续。安装需由你确认；签名不匹配时不会卸载原应用。建议更新前导出备份。</small></section>;
}
