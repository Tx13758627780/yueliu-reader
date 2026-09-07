import {safeFetch,limitedText} from '@/lib/remote';
import {parseInstanceTables,INSTANCE_SNAPSHOT,INSTANCES_SOURCE,SNAPSHOT_SOURCE,SNAPSHOT_DATE} from '@/lib/rsshub-instances';
export async function GET(){
 const sources=[INSTANCES_SOURCE,'https://docs.rsshub.app/zh/guide/instances'];
 const results=await Promise.allSettled(sources.map(async source=>{const r=await safeFetch(source,{signal:AbortSignal.timeout(10000),headers:{Accept:'text/html','Cache-Control':'no-cache'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);const instances=parseInstanceTables(await limitedText(r,2500000));if(!instances.length)throw new Error('文档未返回可识别的实例表格');return {instances,source};}));
 const success=results.find(r=>r.status==='fulfilled');
 if(success?.status==='fulfilled')return Response.json({...success.value,fresh:true,fetchedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
 return Response.json({instances:INSTANCE_SNAPSHOT,source:SNAPSHOT_SOURCE,fresh:false,snapshotDate:SNAPSHOT_DATE,fetchedAt:new Date().toISOString(),warning:'官网名单暂时无法更新，使用文档镜像快照；下面的可用性仍会逐个实时检测。'},{headers:{'Cache-Control':'no-store'}});
}
