export type BiliCreator={uid:string;name:string;description:string;fans?:number;video?:string;videoUrl?:string;rank?:number};
export const biliStarters:BiliCreator[]=[{uid:'946974',name:'影视飓风',description:'影像与拍摄'},{uid:'163637592',name:'老师好我叫何同学',description:'数码与创意'},{uid:'517327498',name:'罗翔说刑法',description:'法律与人文'}];
export function biliUid(raw:string){const input=raw.trim();if(/^[1-9]\d{0,17}$/.test(input))return input;try{const u=new URL(input);if(u.hostname!=='space.bilibili.com')return '';return u.pathname.match(/^\/([1-9]\d{0,17})(?:\/|$)/)?.[1]||'';}catch{return '';}}
const text=(s:unknown)=>String(s||'').replace(/<[^>]*>/g,'').trim();
export function biliCreators(data:any,mode:string):BiliCreator[]{
 const source=mode==='search'?data?.result:data?.list;if(!Array.isArray(source))return [];const seen=new Set<string>();return source.flatMap((x:any,index:number)=>{const uid=String(mode==='search'?x.mid:x.owner?.mid||'');if(!/^[1-9]\d{0,17}$/.test(uid)||seen.has(uid))return [];seen.add(uid);return [{uid,name:text(mode==='search'?x.uname:x.owner?.name)||'UP '+uid,description:text(mode==='search'?x.usign:x.tname),...(mode==='search'&&Number.isFinite(Number(x.fans))?{fans:Number(x.fans)}:{}),...(mode!=='search'?{video:text(x.title),videoUrl:/^BV[A-Za-z0-9]+$/.test(x.bvid||'')?'https://www.bilibili.com/video/'+x.bvid:undefined,rank:index+1}:{})}];}).slice(0,30);
}
