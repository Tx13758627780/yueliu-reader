'use client';
import {useEffect,useState} from 'react';
import {safeMarkup} from '@/lib/article-client';
export function ArticleBody({html,text,url}:{html?:string;text:string;url:string}){
 const [clean,setClean]=useState<{input:string;html:string}|null>(null);
 useEffect(()=>{setClean(html?{input:html,html:safeMarkup(html,url)}:null);},[html,url]);
 if(html&&clean?.input===html)return <div className="prose rich-prose" onErrorCapture={event=>{const img=event.target;if(!(img instanceof HTMLImageElement))return;if(img.dataset.retried){img.alt=img.alt||'图片加载失败';return;}img.dataset.retried='1';img.src='/api/image?url='+encodeURIComponent(img.src);}} dangerouslySetInnerHTML={{__html:clean.html}}/>;
 return <div className="prose">{text?text.split(/\n\n+/).map((p,i)=><p key={i}>{p}</p>):<p>订阅源未提供正文，可以尝试获取原网页内容。</p>}</div>;
}
