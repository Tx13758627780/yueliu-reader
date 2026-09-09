import type {ReaderReference} from './references';
export type BoardNode={id:string;x:number;y:number;w:number;h:number;text:string;ref?:ReaderReference};
export type BoardStroke={id:string;points:number[][];color:string;width:number};
export type BoardEdge={id:string;from:string;to:string;label:string};
export type Board={id:string;article:'@boards';kind:'board';title:string;width:number;height:number;paper:'blank'|'grid'|'dots'|'ruled';nodes:BoardNode[];lines:BoardStroke[];edges:BoardEdge[];updated:number};
export const boardSizes=[['a4','A4 竖向',794,1123],['landscape','A4 横向',1123,794],['large','大画布',4000,3000],['wide','超大画布',10000,7000]] as const;
export function makeBoard(size:string,title:string):Board{const spec=boardSizes.find(x=>x[0]===size)||boardSizes[0];return {id:crypto.randomUUID(),article:'@boards',kind:'board',title:title.trim()||'未命名自由笔记',width:spec[2],height:spec[3],paper:'dots',nodes:[],lines:[],edges:[],updated:Date.now()};}
export function validateBoard(b:any):asserts b is Board{
 const str=(v:any,n:number)=>typeof v==='string'&&v.length<=n,coord=(v:any,max:number)=>Number.isFinite(v)&&v>=0&&v<=max;
 if(!b||!/^[a-f0-9-]{36}$/.test(b.id)||b.article!=='@boards'||b.kind!=='board'||!str(b.title,200)||!coord(b.width,12000)||!coord(b.height,12000)||b.width<500||b.height<500||!['blank','grid','dots','ruled'].includes(b.paper)||!Array.isArray(b.nodes)||b.nodes.length>500||!Array.isArray(b.lines)||b.lines.length>3000||!Array.isArray(b.edges)||b.edges.length>1000)throw new Error('自由笔记格式或大小无效');
 const ids=new Set();for(const n of b.nodes){if(!str(n.id,80)||ids.has(n.id)||!coord(n.x,b.width)||!coord(n.y,b.height)||!coord(n.w,b.width)||!coord(n.h,b.height)||n.w<120||n.h<60||n.x+n.w>b.width||n.y+n.h>b.height||!str(n.text,20000))throw new Error('卡片格式无效');ids.add(n.id);if(n.ref&&(!['article','note','board','block'].includes(n.ref.kind)||!str(n.ref.id,5000)||!str(n.ref.label,500)||n.ref.article!==undefined&&!str(n.ref.article,5000)||n.ref.quote!==undefined&&!str(n.ref.quote,2000)||n.ref.block!==undefined&&!str(n.ref.block,80)))throw new Error('引用格式无效');}
 for(const l of b.lines)if(!str(l.id,80)||!/^#[a-f0-9]{6}$/i.test(l.color)||![2,4,7].includes(l.width)||!Array.isArray(l.points)||l.points.length>12000||l.points.some((p:any)=>!Array.isArray(p)||p.length!==2||!coord(p[0],b.width)||!coord(p[1],b.height)))throw new Error('手写线条格式无效');
 for(const e of b.edges)if(!str(e.id,80)||!ids.has(e.from)||!ids.has(e.to)||e.from===e.to||!str(e.label,500))throw new Error('连线格式无效');
 if(JSON.stringify(b).length>1500000)throw new Error('画布超过 1.5 MB，请拆分到新的自由笔记');
}
export function removeBoardNode(b:Board,id:string):Board{return {...b,nodes:b.nodes.filter(n=>n.id!==id),edges:b.edges.filter(e=>e.from!==id&&e.to!==id)};}
export function boundedNode(n:BoardNode,x:number,y:number,b:Board){return {...n,x:Math.max(0,Math.min(b.width-n.w,x)),y:Math.max(0,Math.min(b.height-n.h,y))};}

export function edgeEndpoints(a:BoardNode,b:BoardNode){const dx=b.x+b.w/2-a.x-a.w/2,dy=b.y+b.h/2-a.y-a.h/2;const clip=(w:number,h:number)=>Math.min(dx?w/2/Math.abs(dx):Infinity,dy?h/2/Math.abs(dy):Infinity,.49);const c1=clip(a.w,a.h),c2=clip(b.w,b.h);return [a.x+a.w/2+dx*c1,a.y+a.h/2+dy*c1,b.x+b.w/2-dx*c2,b.y+b.h/2-dy*c2];}
