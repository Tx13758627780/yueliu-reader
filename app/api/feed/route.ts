import {isLancetMetadata,fetchLancetMetadata} from '@/lib/journal-feed';
import {safeFetch,documentText} from '@/lib/remote';
export async function GET(req:Request){try{
 const raw=new URL(req.url).searchParams.get('url');if(!raw)throw new Error('请输入订阅地址');
 const u=new URL(raw);if(u.protocol==='http:')u.protocol='https:';
 if(isLancetMetadata(u))return Response.json({text:await fetchLancetMetadata(),url:u.href});
 const r=await safeFetch(u.href,{headers:{Accept:'application/rss+xml, application/atom+xml, application/feed+json, application/xml, text/xml, text/html','User-Agent':'YueliuReader/1.1'}});
 if(!r.ok)throw new Error(r.status===403?'网站拒绝读取订阅（HTTP 403），可能需要浏览器验证':r.status===404?'订阅地址不存在（HTTP 404），请确认不是过期的 RSS 链接':r.status===429?'网站暂时限制请求频率（HTTP 429），请稍后重试':`订阅源返回 HTTP ${r.status}`);
 return Response.json({text:await documentText(r),url:r.url||u.href});
 }catch(e){const message=e instanceof Error?e.message:'读取失败';return Response.json({error:/timeout|timed out/i.test(message)?'订阅网站响应超时，请稍后重试或确认地址仍有效':message},{status:400});}}
