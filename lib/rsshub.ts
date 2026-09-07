export function rsshubUrl(instance:string,route:string):string{
 const base=new URL(instance.trim());if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw new Error('RSSHub 实例请填写 HTTPS 地址，不要包含密钥或查询参数');
 let path=route.trim().replace(/^rsshub:\/\//i,'/');if(!path.startsWith('/'))path='/'+path;
 if(path==='/'||path.startsWith('//')||path.includes('\\')||/^\/https?:/i.test(path))throw new Error('请输入 RSSHub 路由，例如 /sspai/index');
 const u=new URL(base.href.replace(/\/$/,'')+path);if(u.origin!==base.origin)throw new Error('无效的 RSSHub 路由');return u.href;
}
