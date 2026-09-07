import {Readability} from '@mozilla/readability';
import DOMPurify from 'dompurify';
export function safeMarkup(html:string,base:string){
 const clean=DOMPurify.sanitize(html,{ALLOWED_TAGS:['p','br','div','section','span','h1','h2','h3','h4','h5','h6','strong','b','em','i','u','s','blockquote','pre','code','ul','ol','li','a','img','figure','figcaption','table','thead','tbody','tr','td','th','hr','sup','sub'],ALLOWED_ATTR:['href','src','data-src','data-original','data-lazy-src','data-srcset','srcset','alt','title','colspan','rowspan']});
 const d=new DOMParser().parseFromString(clean,'text/html');
 d.querySelectorAll('a,img').forEach(el=>{const attr=el.tagName==='IMG'?'src':'href';const raw=el.getAttribute('data-src')||el.getAttribute('data-original')||el.getAttribute('data-lazy-src')||(el.getAttribute('data-srcset')||el.getAttribute('srcset')||'').split(',')[0].trim().split(/\s+/)[0]||el.getAttribute(attr);['data-src','data-original','data-lazy-src','srcset','data-srcset'].forEach(a=>el.removeAttribute(a));try{if(!raw)throw 0;const u=new URL(raw,base);if(!/^https?:$/.test(u.protocol))throw 0;el.setAttribute(attr,u.href);if(attr==='href'){el.setAttribute('target','_blank');el.setAttribute('rel','noreferrer noopener');}else{el.setAttribute('loading','lazy');el.setAttribute('referrerpolicy','no-referrer');}}catch{el.removeAttribute(attr);}});
 return d.body.innerHTML;
}
function textOf(html:string){const d=new DOMParser().parseFromString(html,'text/html');d.querySelectorAll('p,div,br,li,h1,h2,h3,h4,blockquote,pre,figure,tr').forEach(x=>x.prepend('\n\n'));return (d.body.textContent||'').replace(/\n\s*\n/g,'\n\n').trim();}
export function extractArticle(html:string,url:string):{text:string;html:string}{
 const d=new DOMParser().parseFromString(html,'text/html');
 d.querySelectorAll('script,style,noscript,iframe,nav,footer,header,aside,form,button,[hidden],[aria-hidden="true"]').forEach(x=>x.remove());
 let body='';const host=new URL(url).hostname;
 const specific=host==='sspai.com'||host.endsWith('.sspai.com')?d.querySelector('.article__main__content'):host==='mp.weixin.qq.com'?d.querySelector('#js_content'):null;
 if(specific&&(specific.textContent?.trim().length||0)>80){body=specific.innerHTML;}
 else{const base=d.createElement('base');base.href=url;d.head.prepend(base);const article=new Readability(d,{charThreshold:100,maxElemsToParse:35000}).parse();body=article?.content||'';}
 if(!body)throw new Error('未找到公开正文。网页可能需要登录、付费、浏览器验证，或通过脚本加载。');
 const sanitized=safeMarkup(body,url),text=textOf(sanitized);
 if(text.length<80)throw new Error('网页可读取的内容过少，已保留 RSS 内容');
 return {text,html:sanitized};
}
export function discoverFeeds(html:string,base:string):{url:string;title:string}[]{
 const d=new DOMParser().parseFromString(html,'text/html');
 const links=Array.from(d.querySelectorAll('link[href]')).filter(x=>/application\/(rss\+xml|atom\+xml|feed\+json)/i.test(x.getAttribute('type')||''));
 const seen=new Set<string>();return links.flatMap(x=>{try{const u=new URL(x.getAttribute('href')!,base);if(u.protocol==='http:')u.protocol='https:';if(u.protocol!=='https:'||seen.has(u.href))return [];seen.add(u.href);return [{url:u.href,title:x.getAttribute('title')||u.href}];}catch{return [];}});
}

export function websiteItems(html:string,base:string,selector:string){
 const d=new DOMParser().parseFromString(html,'text/html');
 let nodes:NodeListOf<Element>;try{nodes=d.querySelectorAll(selector);}catch{throw new Error('文章链接选择器格式不正确');}
 const seen=new Set<string>();return Array.from(nodes).flatMap(node=>{const a=node.matches('a[href]')?node:node.querySelector('a[href]');if(!a)return [];try{const u=new URL(a.getAttribute('href')||'',base);u.hash='';const title=(a.textContent||a.getAttribute('title')||'').trim();if(!/^https?:$/.test(u.protocol)||!title||seen.has(u.href))return [];seen.add(u.href);return [{url:u.href,title}];}catch{return [];}}).slice(0,100);
}
