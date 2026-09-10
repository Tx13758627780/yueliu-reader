export const REPOSITORY='Tx13758627780/yueliu-reader';
export const RELEASES_URL=`https://github.com/${REPOSITORY}/releases`;
export type Installer={kind:'setup'|'portable'|'android';name:string;url:string;size:number};
export type ClientRelease={version:string;tag:string;url:string;published:string;preview:boolean;files:Installer[]};

export function selectClientRelease(data:unknown):ClientRelease|null{
 if(!Array.isArray(data))return null;
 for(const release of data){
  if(!release||release.draft||!/^v\d+\.\d+\.\d+$/.test(release.tag_name)||!Array.isArray(release.assets))continue;
  const version=release.tag_name.slice(1),files:Installer[]=[];
  for(const [kind,name] of [['setup',`Yueliu-Reader-${version}-x64-setup.exe`],['portable',`Yueliu-Reader-${version}-x64-portable.exe`],['android',`Yueliu-Reader-${version}-android.apk`]] as const){
   const asset=release.assets.find((a:any)=>a.name===name&&a.state==='uploaded'&&Number.isFinite(a.size)&&a.size>0);
   const url=`https://github.com/${REPOSITORY}/releases/download/${release.tag_name}/${name}`;
   if(asset?.browser_download_url===url)files.push({kind,name,url,size:asset.size});
  }
  if(files.length===3)return {version,tag:release.tag_name,url:`${RELEASES_URL}/tag/${release.tag_name}`,published:typeof release.published_at==='string'?release.published_at:'',preview:!!release.prerelease,files};
 }
 return null;
}

export async function fetchClientRelease(signal?:AbortSignal){
 const deadline=AbortSignal.timeout(12000);
 const r=await fetch(`https://api.github.com/repos/${REPOSITORY}/releases?per_page=10`,{headers:{Accept:'application/vnd.github+json'},signal:signal?AbortSignal.any([signal,deadline]):deadline});
 if(!r.ok)throw new Error(r.status===403||r.status===429?'检查频率受限，可直接打开下载页面':'暂时无法读取下载列表，可直接打开下载页面');
 return selectClientRelease(await r.json());
}
