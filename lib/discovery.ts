export type DiscoveryParam={key:string;optional:boolean;label:string;default:string;options:{value:string;label:string}[]};
export type DiscoveryRoute={name:string;path:string;example?:string;params:DiscoveryParam[];requirements:string[];source:string};
export const discoveryCategories:Record<string,string>={'social-media':'社交平台','traditional-media':'新闻媒体','new-media':'新媒体','programming':'编程开发','program-update':'软件更新','journal':'学术期刊','multimedia':'音频视频','picture':'摄影图片','design':'设计','game':'游戏','bbs':'论坛社区','blog':'博客','finance':'财经','government':'政府机构','forecast':'天气预报','shopping':'购物优惠','study':'学习','live':'直播','other':'其他','university':'高校'};
export function buildDiscoveryRoute(route:DiscoveryRoute,values:Record<string,string>){
 let missingOptional=false;
 const segments=route.path.split('/').map(segment=>{
  if(!segment.startsWith(':'))return segment;
  const key=segment.slice(1).replace(/\?$/,''),param=route.params.find(p=>p.key===key),value=(values[key]??param?.default??'').trim();
  if(!value){if(!param?.optional)throw new Error('请填写 '+(param?.label||key));missingOptional=true;return '';}
  if(missingOptional)throw new Error('请先填写前面的可选参数，或留空后面的参数');
  if(value.length>1000)throw new Error('参数过长');return encodeURIComponent(value);
 });
 return segments.join('/').replace(/\/+$/,'');
}
