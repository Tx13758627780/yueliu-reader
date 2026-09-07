import {safeFetch,limitedText,remoteUrl} from '@/lib/remote';
import {rsshubUrl} from '@/lib/rsshub';
import {checkFeed} from '@/lib/feed-check';
export async function POST(req:Request){const start=Date.now();try{
 const raw=await req.text();if(raw.length>5000)throw new Error('检测参数过长');const {instance,route}=JSON.parse(raw);
 if(typeof instance!=='string'||typeof route!=='string')throw new Error('缺少实例或测试路由');const target=rsshubUrl(instance,route);remoteUrl(target);
 const r=await safeFetch(target,{signal:AbortSignal.timeout(12000),headers:{Accept:'application/rss+xml,application/atom+xml,application/feed+json,application/xml,text/xml','Cache-Control':'no-cache'}});
 if(!r.ok)throw new Error(r.status===403?'HTTP 403 · 拒绝访问':r.status===429?'HTTP 429 · 请求限流':r.status===404?'HTTP 404 · 不支持此路由':`HTTP ${r.status}`);
 const feed=checkFeed(await limitedText(r,3000000));return Response.json({ok:true,status:feed.count?'ok':'empty',...feed,ms:Date.now()-start,checkedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
 }catch(e){const message=e instanceof Error?e.message:'连接失败';return Response.json({ok:false,status:'error',error:/timeout|aborted|timed out/i.test(message)?'12 秒内未完成 · 超时':message,ms:Date.now()-start,checkedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});}}
