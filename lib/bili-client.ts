// SPDX-License-Identifier: GPL-3.0-only
// WBI signing adapted from BiliPai, Copyright (c) YangY and BiliPai contributors.
// WBI protocol and endpoint flow verified against BiliPai (see THIRD_PARTY.md).
import {md5} from '@noble/hashes/legacy.js';
import {bytesToHex} from '@noble/hashes/utils.js';
import {limitedText} from './remote';
const mix=[46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52];
export function wbiQuery(input:Record<string,string>,img:string,sub:string,seconds=Math.floor(Date.now()/1000)){
 const key=mix.map(i=>(img+sub)[i]||'').join('').slice(0,32);if(key.length!==32)throw new Error('B 站签名密钥缺失');
 const data={...input,wts:String(seconds)};const query=Object.keys(data).sort().map(k=>encodeURIComponent(k)+'='+encodeURIComponent(data[k as keyof typeof data].replace(/[!'()*]/g,''))).join('&');
 return query+'&w_rid='+bytesToHex(md5(new TextEncoder().encode(query+key)));
}
const base='https://api.bilibili.com';
const headers={'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',Accept:'application/json',Referer:'https://www.bilibili.com/'};
export class BiliError extends Error{constructor(message:string,public code:number|string,public stage:string){super(message);}}
type Visitor={cookie:string;img:string;sub:string;expires:number};
let cached:Visitor|null=null;
async function json(path:string,query:string,cookie:string,signal:AbortSignal,search=false){const url=base+path+(query?'?'+query:'');const r=await fetch(url,{redirect:'error',headers:{...headers,...(search?{Origin:'https://search.bilibili.com',Referer:'https://search.bilibili.com/'}:{}),...(cookie?{Cookie:cookie}:{})},signal});if(!r.ok)throw new BiliError(`B 站返回 HTTP ${r.status}`,r.status,path);let d:any;try{d=JSON.parse(await limitedText(r,3000000));}catch{throw new BiliError('B 站返回验证页面，请稍后重试',r.status,path);}return d;}
async function session(signal:AbortSignal):Promise<Visitor>{if(cached&&cached.expires>Date.now())return cached;return (async()=>{let cookie='';const spi=await json('/x/frontend/finger/spi','',cookie,signal);if(spi.code!==0)throw new BiliError('B 站访客会话初始化失败',spi.code,'session');cookie=[['buvid3',spi.data?.b_3],['buvid4',spi.data?.b_4]].filter(([,v])=>typeof v==='string'&&/^[A-Za-z0-9_-]+$/.test(v)).map(([k,v])=>k+'='+v).join('; ');if(!cookie)throw new BiliError('B 站没有返回访客会话',spi.code,'session');const nav=await json('/x/web-interface/nav','',cookie,signal);const key=(v:unknown)=>typeof v==='string'?v.split('/').pop()?.split('.')[0]||'':'';const img=key(nav.data?.wbi_img?.img_url),sub=key(nav.data?.wbi_img?.sub_url);if(!/^[a-f\d]{32}$/i.test(img)||!/^[a-f\d]{32}$/i.test(sub))throw new BiliError('无法读取 B 站签名参数',nav.code,'nav');cached={cookie,img,sub,expires:Date.now()+3600000};return cached;})();}
export function clearBiliSession(){cached=null;}
export async function biliRequest(path:string,params:Record<string,string>,signed:boolean,signal:AbortSignal){
 if(!signed){const data=await json(path,new URLSearchParams(params).toString(),cached?.cookie||'',signal);if(data.code!==0)throw new BiliError(`B 站查询失败（${data.code}）：${String(data.message||'请求受限').slice(0,120)}`,data.code,path);return data.data;}
 for(let attempt=0;attempt<2;attempt++){const s=await session(signal);const q=signed?wbiQuery(params,s.img,s.sub):new URLSearchParams(params).toString();const data=await json(path,q,s.cookie,signal,path.includes('/search/'));if(data.code===0)return data.data;if(signed&&data.code===-403&&attempt===0){clearBiliSession();continue;}throw new BiliError(`B 站查询失败（${data.code}）：${String(data.message||'请求受限').slice(0,120)}`,data.code,path);}throw new Error('B 站签名验证失败');
}
const clean=(x:unknown)=>String(x||'').replace(/<[^>]*>/g,'');const escape=(x:unknown)=>clean(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
export function biliJsonFeed(data:any,uid:string,kind:string,url:string){const list=kind==='article'?data?.articles:data?.list?.vlist;if(!Array.isArray(list))throw new Error('B 站投稿响应缺少列表');const items=list.map((x:any)=>{const article=kind==='article',id=article?'cv'+x.id:x.bvid;if(!(article?/^cv\d+$/:/^BV[A-Za-z0-9]+$/).test(id||''))return null;const page=article?'https://www.bilibili.com/read/'+id:'https://www.bilibili.com/video/'+id;const image=article?x.image_urls?.[0]:x.pic;const img=typeof image==='string'?(image.startsWith('//')?'https:'+image:image):'';const desc=clean(article?x.summary:x.description);const name=clean(x.author?.name||x.author)||'UP '+uid;return {id,url:page,title:clean(x.title),content_html:`${img.startsWith('https://')?'<p><img src="'+escape(img)+'" alt="'+escape(x.title)+'"></p>':''}<p>${escape(desc)}</p>`,summary:desc,authors:[{name}],...(Number(x.created||x.publish_time)>0?{date_published:new Date(Number(x.created||x.publish_time)*1000).toISOString()}:{}),_yueliu:{type:article?'article':'video',bvid:article?undefined:id,cover:img,duration:x.length}};}).filter(Boolean);return {version:'https://jsonfeed.org/version/1.1',title:(items[0]?.authors[0]?.name||'UP '+uid)+(kind==='article'?' · 图文':' · 视频'),home_page_url:'https://space.bilibili.com/'+uid,feed_url:url,items};}

export function biliDynamicFeed(data:any,uid:string,url:string){
 if(!Array.isArray(data?.items))throw new Error('B 站动态响应缺少列表');
 const seen=new Set<string>();
 const image=(raw:unknown)=>{if(typeof raw!=='string')return '';try{const u=new URL(raw.startsWith('//')?'https:'+raw:raw);return u.protocol==='https:'?u.href:'';}catch{return '';}};
 const items=data.items.slice(0,100).flatMap((x:any)=>{
  const id=String(x.id_str||'');if(!/^\d+$/.test(id)||seen.has(id))return [];seen.add(id);
  const m=x.modules||{},d=m.module_dynamic||{},major=d.major||{},v=major.archive,a=major.article,o=major.opus;
  const desc=clean(d.desc?.text||o?.summary?.text||v?.desc||a?.desc||''),title=clean(v?.title||a?.title||o?.title||desc.slice(0,100)||'UP 动态');
  const bvid=/^BV[A-Za-z0-9]+$/.test(v?.bvid||'')?v.bvid:undefined;
  const page=bvid?'https://www.bilibili.com/video/'+bvid:/^\d+$/.test(String(a?.id||''))?'https://www.bilibili.com/read/cv'+a.id:'https://t.bilibili.com/'+id;
  const pictures=(o?.pics||major.draw?.items||[]).slice(0,12).map((p:any)=>image(p.url||p.src)).filter(Boolean);
  const cover=image(v?.cover||a?.covers?.[0])||pictures[0];
  const stamp=Number(m.module_author?.pub_ts),date=Number.isFinite(stamp)&&stamp>0&&stamp<8640000000000?new Date(stamp*1000).toISOString():undefined;
  return [{id,url:page,title,content_html:'<p>'+escape(desc)+'</p>'+[...new Set([cover,...pictures].filter(Boolean))].map(src=>'<p><img src="'+escape(src)+'" alt=""></p>').join(''),authors:[{name:clean(m.module_author?.name)||'UP '+uid}],...(date?{date_published:date}:{}),_yueliu:{type:bvid?'video':'article',bvid,cover}}];
 });
 return {version:'https://jsonfeed.org/version/1.1',title:(items[0]?.authors[0].name||'UP '+uid)+' · 动态',home_page_url:'https://space.bilibili.com/'+uid,feed_url:url,items};
}
