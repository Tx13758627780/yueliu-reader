export type PublicInstance={url:string;location:string;maintainer:string};
export const INSTANCES_SOURCE='https://docs.rsshub.app/guide/instances';
// Documentation mirror snapshot captured 2026-09-07; never used as health results.
export const SNAPSHOT_SOURCE='https://rsshub-docs-mirror.github.io/guide/instances';
export const SNAPSHOT_DATE='2026-09-07';
export const INSTANCE_SNAPSHOT:PublicInstance[]=[
 ['rsshub.app','美国','DIYgod'],['rsshub.rssforever.com','阿联酋','Stille'],['hub.slarker.me','美国','Slarker'],['rsshub.pseudoyu.com','法国','pseudoyu'],['rsshub.rss.tips','美国','AboutRSS'],['rsshub.ktachibana.party','美国','KTachibanaM'],['rss.owo.nz','德国','Vincent Yang'],['rss.wudifeixue.com','加拿大','wudifeixue'],['rss.littlebaby.life','美国','yuanhong'],['rsshub.henry.wang','英国','HenryQW'],['holoxx.f5.si','日本','Vania'],['rsshub.umzzz.com','香港','nesay'],['rsshub.isrss.com','美国','isRSS'],['rsshub.email-once.com','香港','EmailOnce'],['rss.datuan.dev','越南','Tuấn Dev'],['rss.4040940.xyz','德国','TingyuShare'],['rsshub.cups.moe','美国','FunnyCups'],['rss.spriple.org','中国','Spriple'],['rsshub-balancer.virworks.moe','全球','chesha1']
].map(([host,location,maintainer])=>({url:'https://'+host,location,maintainer}));
const plain=(s:string)=>s.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim();
export function parseInstanceTables(html:string):PublicInstance[]{
 const found=new Map<string,PublicInstance>();
 for(const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const cells=[...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>m[1]);if(cells.length<3)continue;
  const href=cells[0].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];if(!href)continue;
  try{const u=new URL(href.replace(/&amp;/g,'&'));if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.port)continue;
   // Instance URL is the visible first-column host, not a maintainer/status link.
   if(!plain(cells[0]).includes(u.hostname))continue;
   const url=u.href.replace(/\/$/,'');found.set(url,{url,location:plain(cells[1]),maintainer:plain(cells[2])});
  }catch{}
 }
 return [...found.values()];
}
