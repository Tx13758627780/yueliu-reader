import {XMLParser,XMLValidator} from 'fast-xml-parser';
export function checkFeed(text:string):{count:number;kind:string}{
 const input=text.trim();
 if(input.startsWith('{')){const d=JSON.parse(input);if(!Array.isArray(d.items)||!String(d.version||'').startsWith('https://jsonfeed.org/version/'))throw new Error('返回 JSON，但不是 JSON Feed');return {count:d.items.length,kind:'JSON Feed'};}
 if(/<!DOCTYPE|<!ENTITY/i.test(input))throw new Error('返回了网页或不支持的 XML 文档');
 if(XMLValidator.validate(input)!==true)throw new Error('响应不是有效 XML，可能是验证页面');
 const d=new XMLParser({ignoreAttributes:true,removeNSPrefix:true,processEntities:false}).parse(input);
 const count=(x:unknown)=>x===undefined?0:Array.isArray(x)?x.length:1;
 if(d.rss?.channel!==undefined)return {count:count(d.rss.channel.item),kind:'RSS'};
 if(d.feed!==undefined)return {count:count(d.feed.entry),kind:'Atom'};
 if(d.RDF?.channel!==undefined)return {count:count(d.RDF.item),kind:'RSS 1.0'};
 throw new Error('返回内容不是订阅源，可能是首页或浏览器验证页面');
}
