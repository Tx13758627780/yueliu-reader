export function remoteUrl(raw: string) {
 const u = new URL(raw);
 const h = u.hostname.toLowerCase();
 if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443') || !h.includes('.') || /^[\d.]+$/.test(h) || h.includes(':') || /(^|\.)(localhost|local|internal|test|invalid)$/.test(h)) throw new Error('请使用公开网站的 HTTPS 地址');
 return u;
}
export async function safeFetch(raw:string, init:RequestInit = {}) {
 let u=remoteUrl(raw);const signal=init.signal??AbortSignal.timeout(90000);
 for(let i=0;i<4;i++) {
  const r=await fetch(u,{...init,redirect:'manual',signal});
  if(r.status>=300 && r.status<400) {if(init.method==='POST') throw new Error('API 地址发生重定向，请填写最终地址'); u=remoteUrl(new URL(r.headers.get('location')||'',u).href);continue;}
  return r;
 }
 throw new Error('重定向次数过多');
}
export async function limitedText(r:Response,max=4000000){
 const reader=r.body?.getReader();if(!reader)return ''; let n=0,result='';const decoder=new TextDecoder();
 while(true){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>max){await reader.cancel();throw new Error('响应内容过大');}result+=decoder.decode(value,{stream:true});}return result+decoder.decode();
}
