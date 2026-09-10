import {safeFetch,limitedText} from './remote';
export function isLancetMetadata(u:URL){return u.origin==='https://api.crossref.org'&&u.pathname==='/journals/0140-6736/works';}
export function lancetMetadataFeed(items:any[]){
 return {version:'https://jsonfeed.org/version/1.1',title:'《柳叶刀》The Lancet · Crossref 论文题录',home_page_url:'https://www.thelancet.com/journals/lancet/home',description:'Crossref 出版元数据，非期刊全文。',items:items.filter(x=>typeof x.DOI==='string'&&Array.isArray(x.title)&&x.title[0]).slice(0,30).map(x=>{
  const parts=(x.published||x['published-online']||x['published-print'])?.['date-parts']?.[0],date=parts&&parts.length>=1?`${parts[0]}-${String(parts[1]||1).padStart(2,'0')}-${String(parts[2]||1).padStart(2,'0')}T00:00:00Z`:undefined;
  const authors=(x.author||[]).map((a:any)=>[a.given,a.family].filter(Boolean).join(' ')).filter(Boolean).join('、');
  return {id:x.DOI,url:'https://doi.org/'+encodeURI(x.DOI),title:String(x.title[0]),content_text:`来源：Crossref 出版元数据（非全文）。\n\n${authors?'作者：'+authors+'\n\n':''}DOI：${x.DOI}\n\n本订阅提供论文题录。请通过 DOI 访问发布方页面；全文阅读范围取决于开放获取或订阅权限。`,...(date&&!isNaN(Date.parse(date))?{date_published:date}:{})};
 })};
}
export async function fetchLancetMetadata(){
 const r=await safeFetch('https://api.crossref.org/journals/0140-6736/works?sort=published&order=desc&rows=30',{signal:AbortSignal.timeout(20000),headers:{Accept:'application/json','User-Agent':'YueliuReader/1.2 (https://github.com/Tx13758627780/yueliu-reader)'}});
 if(!r.ok)throw new Error('Crossref 题录服务返回 HTTP '+r.status);
 const d=JSON.parse(await limitedText(r));if(!Array.isArray(d.message?.items))throw new Error('Crossref 没有返回有效的论文题录');return JSON.stringify(lancetMetadataFeed(d.message.items));
}
