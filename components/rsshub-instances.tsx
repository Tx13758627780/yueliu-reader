'use client';
import {useEffect,useRef,useState} from 'react';
import {RefreshCw,Loader2,Check,Server,ExternalLink} from 'lucide-react';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {Switch} from '@/components/ui/switch';
import {Progress} from '@/components/ui/progress';
import {toast} from 'sonner';
import type {PublicInstance} from '@/lib/rsshub-instances';
type Row=PublicInstance&{status:'pending'|'testing'|'ok'|'empty'|'error';ms?:number;count?:number;error?:string;checkedAt?:string};
type Catalog={instances:PublicInstance[];source:string;fresh:boolean;snapshotDate?:string;fetchedAt:string;warning?:string};
export function RSSHubInstances({route,value,onChange}:{route:string;value:string;onChange:(v:string)=>void}){
 const [rows,setRows]=useState<Row[]>([]),[running,setRunning]=useState(false),[loadingList,setLoadingList]=useState(false),[testedRoute,setTestedRoute]=useState(''),[onlyGood,setOnlyGood]=useState(false),[note,setNote]=useState(''),[source,setSource]=useState('https://docs.rsshub.app/guide/instances'),[at,setAt]=useState('');
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const good=rows.filter(r=>r.status==='ok'||r.status==='empty').sort((a,b)=>(a.status==='ok'?0:1)-(b.status==='ok'?0:1)||(a.ms||0)-(b.ms||0));
 const completed=rows.filter(r=>!['pending','testing'].includes(r.status)).length;
 const mismatch=!!testedRoute&&testedRoute!==route;
 const currentResult=good.some(r=>r.url===value)?value:undefined;
 async function refresh(){
  if(running)return;if(!route.trim()){toast.error('请先填写要检测的订阅路由或公众号微信号');return;}
  controller.current?.abort();const ctl=new AbortController();controller.current=ctl;
  setRunning(true);setLoadingList(true);setRows([]);setNote('');setAt('');setTestedRoute(route);const capturedRoute=route;
  try{
   const response=await fetch('/api/rsshub/instances',{cache:'no-store',signal:ctl.signal});if(!response.ok)throw new Error('实例名单获取失败');let catalog:Catalog=await response.json();
   if(!Array.isArray(catalog.instances)||!catalog.instances.length)throw new Error('名单为空，请稍后重试');
   try{if(catalog.fresh)localStorage.setItem('yueliu-instance-catalog',JSON.stringify(catalog));else{const old:Catalog|null=JSON.parse(localStorage.getItem('yueliu-instance-catalog')||'null');if(old?.fresh&&old.instances?.length)catalog={...old,fresh:false,warning:'官网更新失败，使用此浏览器上次获取的名单；正在实时重测。'};}}catch{}
   setSource(catalog.source);setNote(catalog.fresh?'已从官网刷新名单':(catalog.warning||'使用已保存的名单')+' 名单日期：'+(catalog.snapshotDate||catalog.fetchedAt.slice(0,10)));setLoadingList(false);
   const list=catalog.instances;setRows(list.map(r=>({...r,status:'pending'})));let next=0;
   const change=(url:string,patch:Partial<Row>)=>setRows(prev=>prev.map(row=>row.url===url?{...row,...patch}:row));
   async function worker(){while(next<list.length&&!ctl.signal.aborted){const row=list[next++];change(row.url,{status:'testing'});try{
    const r=await fetch('/api/rsshub/probe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({instance:row.url,route:capturedRoute}),signal:ctl.signal});if(!r.ok)throw new Error(`检测服务 HTTP ${r.status}`);const d=await r.json();if(!ctl.signal.aborted)change(row.url,{status:d.ok?(d.count?'ok':'empty'):'error',ms:d.ms,count:d.count,error:d.error,checkedAt:d.checkedAt});
   }catch(e){if(!ctl.signal.aborted)change(row.url,{status:'error',error:(e as Error).message});}}}
   await Promise.all(Array.from({length:Math.min(4,list.length)},()=>worker()));
   if(!ctl.signal.aborted)setAt(new Date().toLocaleTimeString('zh-CN'));
  }catch(e){if(!ctl.signal.aborted){setNote((e as Error).message);toast.error((e as Error).message);}}
  finally{if(!ctl.signal.aborted){setRunning(false);setLoadingList(false);}}
 }
 return <section className="instance-panel"><div className="instance-heading"><h3><Server size={17}/>公共实例</h3><button className="instance-refresh" type="button" disabled={running||!route.trim()} onClick={refresh}>{running?<Loader2 size={15} className="spin"/>:<RefreshCw size={15}/>} {running?'正在检测…':'刷新并检测可用实例'}</button></div><p className="instance-caption">从文档名单发现实例，并实际请求当前路由。每个实例最多等待 12 秒，同时检测 4 个。</p><div className="instance-route">测试路由：<code>{route||'请先填写公众号微信号'}</code></div>
 {loadingList&&<p role="status" className="instance-note">正在更新官网实例名单…</p>}
 {note&&<p className="instance-note">{note}</p>}
 {!!rows.length&&<><div className="instance-count"><span>{completed} / {rows.length} 已检测 · {good.length} 个可订阅</span>{at&&<span>检测于 {at}</span>}</div>{running&&<Progress value={completed/rows.length*100} aria-label="实例检测进度"/>}{mismatch&&<p className="instance-warning">路由已更改。下面是 {testedRoute} 的结果，请重新检测后选择。</p>}
 <Select value={currentResult} disabled={!good.length||mismatch} onValueChange={v=>{onChange(v);toast.success('已选择 '+new URL(v).hostname);}}><SelectTrigger className="w-full"><SelectValue placeholder={running?'可用实例会陆续出现':'选择测试通过的实例'}/></SelectTrigger><SelectContent>{good.map(r=><SelectItem value={r.url} key={r.url}>{new URL(r.url).hostname} · {r.ms} ms{r.status==='empty'?' · 暂无文章':''}</SelectItem>)}</SelectContent></Select>
 <label className="instance-filter"><Switch checked={onlyGood} onCheckedChange={setOnlyGood}/><span>只看可订阅实例</span></label><div className="instance-results" aria-live="polite">{(onlyGood?good:rows).map(r=><div className={'instance-row '+r.status} key={r.url}><div><strong>{new URL(r.url).hostname}</strong><small>{r.location} · {r.maintainer}</small></div><span>{r.status==='testing'?<Loader2 className="spin" size={15}/>:r.status==='pending'?'等待检测':r.status==='ok'?`${r.ms} ms · ${r.count} 篇`:r.status==='empty'?`${r.ms} ms · 暂无文章`:r.error||'不可用'}</span>{(r.status==='ok'||r.status==='empty')&&<button type="button" disabled={mismatch} onClick={()=>onChange(r.url)}>{value===r.url?<Check size={15}/>: '使用'}</button>}</div>)}{onlyGood&&!good.length&&<p className="instance-note">{running?'还没有实例通过测试…':'没有实例通过本次路由测试。可以关闭筛选查看原因，或更换路由重试。'}</p>}</div></>}
 <a className="hub-doc" href={source} target="_blank" rel="noreferrer">查看名单来源 <ExternalLink size={13}/></a><p className="instance-caption">可用性仅对应这次检测的路由和时间。选择实例只影响新订阅；名单不包含仅能在 Folo 内使用的共享实例。</p></section>;
}
