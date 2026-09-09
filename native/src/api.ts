import * as feed from '../../app/api/feed/route';
import * as article from '../../app/api/article/route';
import * as image from '../../app/api/image/route';
import * as ai from '../../app/api/ai/route';
import * as translate from '../../app/api/translate/route';
import * as bilibili from '../../app/api/bilibili/route';
import * as instances from '../../app/api/rsshub/instances/route';
import * as probe from '../../app/api/rsshub/probe/route';
import {documentText} from '../../lib/remote';
import {checkFeed} from '../../lib/feed-check';
const routes:Record<string,any>={'/api/feed':feed,'/api/article':article,'/api/image':image,'/api/ai':ai,'/api/translate':translate,'/api/bilibili':bilibili,'/api/rsshub/instances':instances,'/api/rsshub/probe':probe};
function local(raw:string){try{const u=new URL(raw);return u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)&&u.port==='1200'&&!u.username&&!u.password;}catch{return false;}}
export async function request(input:{url:string;method:string;body?:string}){
 try{if(typeof input.url!=='string'||input.url.length>12000||input.body&&input.body.length>200000)throw new Error('请求过大');const url=new URL(input.url,'https://local.yueliu.invalid'),route=routes[url.pathname];if(url.origin!=='https://local.yueliu.invalid'||!route||!['GET','POST'].includes(input.method)||typeof route[input.method]!=='function')throw new Error('不支持的本机请求');
 let response:Response|undefined;
 const args=input.body?JSON.parse(input.body):{},raw=url.searchParams.get('url')||'';
 if(url.pathname==='/api/feed'&&local(raw)){const r=await fetch(raw,{redirect:'error',signal:AbortSignal.timeout(25000)});if(!r.ok)throw new Error(`本机 RSSHub 返回 HTTP ${r.status}`);response=Response.json({text:await documentText(r),url:raw});}
 if(url.pathname==='/api/rsshub/probe'&&local(args.instance)){const started=Date.now(),base=new URL(args.instance),target=new URL(base.href.replace(/\/$/,'')+String(args.route));if(target.origin!==base.origin)throw new Error('无效路由');const r=await fetch(target,{redirect:'error',signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('路由返回 HTTP '+r.status);response=Response.json({ok:true,...checkFeed(await documentText(r)),ms:Date.now()-started,checkedAt:new Date().toISOString()});}
 response??=await route[input.method](new Request(url,{method:input.method,...(input.body?{body:input.body,headers:{'Content-Type':'application/json'}}:{})}));
 return {status:response!.status,headers:Object.fromEntries(response!.headers),body:Buffer.from(await response!.arrayBuffer()).toString('base64')};
 }catch(e){return {status:400,headers:{'Content-Type':'application/json'},body:Buffer.from(JSON.stringify({error:(e as Error).message})).toString('base64')};}
}
