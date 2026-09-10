import {Capacitor,registerPlugin} from '@capacitor/core';

const Files=registerPlugin<{saveText(input:{name:string;mime:string;text:string}):Promise<{saved:boolean}>}>('YueliuFiles');

export async function downloadFile(blob:Blob,name:string):Promise<boolean>{
 if(Capacitor.getPlatform()==='android'){
  if(blob.size>150000000)throw new Error('导出文件请小于 150 MB');
  return (await Files.saveText({name,mime:blob.type||'application/octet-stream',text:await blob.text()})).saved;
 }
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
 return true;
}
