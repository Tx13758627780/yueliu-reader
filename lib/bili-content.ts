// Public read-only endpoint contracts checked against BiliPai ApiClient.kt.
import {biliRequest} from './bili-client';

const escape=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function biliContentId(raw:string){
 try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port||!['www.bilibili.com','bilibili.com','m.bilibili.com'].includes(u.hostname))return null;
 const video=u.pathname.match(/^\/video\/(BV[A-Za-z0-9]+|av[1-9]\d*)(?:\/|$)/),article=u.pathname.match(/^\/read\/cv([1-9]\d*)(?:\/|$)/);
 return video?{kind:'video' as const,id:video[1]}:article?{kind:'article' as const,id:article[1]}:null;}catch{return null;}
}
export async function fetchBiliContent(raw:string,signal:AbortSignal){
 const ref=biliContentId(raw);if(!ref)throw new Error('无效 B 站内容地址');
 const data=await biliRequest(ref.kind==='video'?'/x/web-interface/view':'/x/article/view',ref.kind==='video'?(ref.id.startsWith('av')?{aid:ref.id.slice(2)}:{bvid:ref.id}):{id:ref.id},false,signal);
 if(!data||typeof data.title!=='string')throw new Error('B 站没有返回内容详情');
 let body:string,url:string;
 if(ref.kind==='video'){
  if(!/^BV[A-Za-z0-9]+$/.test(data.bvid||''))throw new Error('B 站没有返回有效视频标识');
  url='https://www.bilibili.com/video/'+data.bvid;
  const desc=Array.isArray(data.desc_v2)?data.desc_v2.map((x:{raw_text?:string})=>x.raw_text||'').join(''):String(data.desc||'');
  const cover=typeof data.pic==='string'&&data.pic.startsWith('https://')?`<img src="${escape(data.pic)}" alt="${escape(data.title)}">`:'';
  const pages=Array.isArray(data.pages)?data.pages.slice(0,100):[];
  body=`${cover}<p>UP 主：${escape(data.owner?.name||'')}</p><p>${escape(desc).replace(/\n/g,'<br>')}</p>${pages.length>1?'<h2>视频分集</h2><ol>'+pages.map((p:{part?:string})=>'<li>'+escape(p.part)+'</li>').join('')+'</ol>':''}<p>以上为视频简介，并非字幕或完整视频转写。</p>`;
 }else{
  url='https://www.bilibili.com/read/cv'+ref.id;
  if(typeof data.content!=='string'||!data.content.trim())throw new Error('B 站未开放专栏正文，请在原网站阅读');
  // The shared article extractor sanitizes this publisher HTML before display.
  body=data.content;
 }
 return {url,html:`<!doctype html><html><head><title>${escape(data.title)}</title></head><body><article><h1>${escape(data.title)}</h1>${body}</article></body></html>`};
}
