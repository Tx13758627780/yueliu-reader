import {safeFetch,limitedText} from '@/lib/remote';
export async function GET(req:Request){
 try{
  const url=new URL(req.url).searchParams.get('url');if(!url)throw new Error('缺少文章地址');
  const u=new URL(url);if(u.protocol==='http:')u.protocol='https:';
  const r=await safeFetch(u.href,{headers:{Accept:'text/html,application/xhtml+xml','User-Agent':'YueliuReader/1.1'}});
  if(!r.ok)throw new Error(r.status===403?'原网站拒绝自动读取，请在原网站阅读':r.status===401?'原文需要登录，请在原网站阅读':`原网页返回 HTTP ${r.status}`);
  if(!/html/i.test(r.headers.get('content-type')||''))throw new Error('该链接不是网页正文，可能是 PDF 或下载文件');
  return Response.json({html:await limitedText(r),url:r.url||u.href},{headers:{'Cache-Control':'no-store'}});
 }catch(e){const message=e instanceof Error?e.message:'提取失败';return Response.json({error:/timeout|timed out/i.test(message)?'原网站响应超时，可稍后重试':message},{status:400});}
}
