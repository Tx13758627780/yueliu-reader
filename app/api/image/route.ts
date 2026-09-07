import {safeFetch} from '@/lib/remote';
export async function GET(req:Request){try{
 const raw=new URL(req.url).searchParams.get('url');if(!raw)throw new Error('缺少图片地址');const u=new URL(raw);if(u.protocol==='http:')u.protocol='https:';
 const r=await safeFetch(u.href,{signal:AbortSignal.timeout(15000),headers:{Accept:'image/avif,image/webp,image/*','User-Agent':'YueliuReader/1.2'}});
 if(!r.ok)throw new Error(`图片源返回 HTTP ${r.status}`);const type=(r.headers.get('content-type')||'').split(';')[0].trim();
 if(!/^image\/(jpeg|png|gif|webp|avif|bmp|x-icon|vnd.microsoft.icon)$/.test(type))throw new Error('图片源未返回支持的图片');
 const reader=r.body?.getReader();if(!reader)throw new Error('图片为空');const chunks:Uint8Array[]=[];let length=0;
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>8000000){await reader.cancel();throw new Error('图片超过 8MB');}chunks.push(value);}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return new Response(bytes,{headers:{'Content-Type':type,'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'图片加载失败'},{status:400});}}
