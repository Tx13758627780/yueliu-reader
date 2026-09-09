'use client';
import {useEffect,useRef,useState} from 'react';
import {safeMarkup} from '@/lib/article-client';
import {cachedImage,cacheImage} from '@/lib/offline';
import {apiFetch} from '@/lib/api-client';
export function ArticleBody({html,text,url}:{html?:string;text:string;url:string}){
 const [clean,setClean]=useState<{input:string;html:string}|null>(null),root=useRef<HTMLDivElement>(null);
 useEffect(()=>{setClean(html?{input:html,html:safeMarkup(html,url)}:null);},[html,url]);
 useEffect(()=>{let alive=true;const objects:string[]=[];if(root.current)for(const img of root.current.querySelectorAll('img')){const raw=img.src;img.dataset.original=raw;void cachedImage(raw).then(async r=>{if(r){const object=URL.createObjectURL(await r.blob());if(alive){objects.push(object);img.src=object;}else URL.revokeObjectURL(object);}}).catch(()=>{});}return()=>{alive=false;objects.forEach(u=>URL.revokeObjectURL(u));};},[clean]);
 if(html&&clean?.input===html)return <div ref={root} className="prose rich-prose" onErrorCapture={async event=>{const img=event.target;if(!(img instanceof HTMLImageElement))return;if(img.dataset.retried){img.alt=img.alt||'图片未能读取；离线时请先下载图片';return;}img.dataset.retried='1';try{const raw=img.dataset.original||img.src,r=await apiFetch('/api/image?url='+encodeURIComponent(raw));if(!r.ok)throw new Error();await cacheImage(raw,r.clone());const object=URL.createObjectURL(await r.blob());img.onload=()=>URL.revokeObjectURL(object);img.src=object;}catch{img.alt=img.alt||'图片暂不可用';}}} dangerouslySetInnerHTML={{__html:clean.html}}/>;
 return <div className="prose">{text?text.split(/\n\n+/).map((p,i)=><p key={i}>{p}</p>):<p>订阅源未提供正文，可以尝试获取原网页内容。</p>}</div>;
}
