let initialized:Promise<void>|undefined;
export async function notesFetch(url:string,options?:RequestInit){if(!initialized)initialized=fetch('/api/notebook',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('无法打开笔记本，请重试');}).catch(e=>{initialized=undefined;throw e;});await initialized;return fetch(url,{cache:'no-store',...options});}
