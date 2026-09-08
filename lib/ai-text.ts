export function translationChunks(text:string,limit=3000){
 const chunks:string[]=[];let rest=text;
 while(rest.length>limit){let end=rest.lastIndexOf('\n',limit);if(end<limit/2){const stops=[...rest.slice(0,limit).matchAll(/[。！？.!?](?:\s|$)/g)];end=stops.length?(stops[stops.length-1].index||0)+stops[stops.length-1][0].length:0;if(end<limit/2){const space=rest.lastIndexOf(' ',limit-1);end=space>=limit/2?space+1:limit;}}if(end===limit&&/[\uD800-\uDBFF]/.test(rest[end-1]))end--;chunks.push(rest.slice(0,end));rest=rest.slice(end);}
 if(rest)chunks.push(rest);return chunks;
}
export function completionText(data:any){
 const choice=data?.choices?.[0];const content=choice?.message?.content;
 const text=typeof content==='string'?content:Array.isArray(content)?content.filter(x=>x?.type==='text'&&typeof x.text==='string').map(x=>x.text).join('\n'):'';
 if(!text.trim())throw new Error(choice?.message?.refusal||'模型未返回正文，可能仅返回了推理内容；请更换模型后重试');
 if(choice?.finish_reason==='length')throw new Error('模型输出达到长度限制，请更换支持更长输出的模型后重试');
 return text;
}
export function questionContent(content:string,question:string,quote=''){
 return `${quote?'用户选中的原文：\n<quoted_text>\n'+quote.slice(0,2000)+'\n</quoted_text>\n\n':''}<article_context>\n${content.slice(0,60000)}\n</article_context>\n\n用户问题：${question.slice(0,2000)}`;
}
