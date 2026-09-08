export function notebookToken(req:Request){return req.headers.get('cookie')?.match(/(?:^|; )reader_notebook=([a-f0-9]{64})(?:;|$)/)?.[1];}
export function notebookCookie(token:string){return `reader_notebook=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=31536000`;}
export async function notebookOwner(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),x=>x.toString(16).padStart(2,'0')).join('');}
export async function identity(req:Request){const token=notebookToken(req)||Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');return {token,owner:await notebookOwner(token),headers:{'Cache-Control':'no-store','Set-Cookie':notebookCookie(token)}};}
export function sameOrigin(req:Request){if(req.headers.get('origin')!==new URL(req.url).origin)throw new Error('请在阅读器内保存笔记');}
