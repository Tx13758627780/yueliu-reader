import {safeFetch,limitedText} from '@/lib/remote';
import {parseInstanceTables,parseInstanceSource,mergeInstances,COMMUNITY_INSTANCES,INSTANCE_SNAPSHOT,INSTANCES_SOURCE,INSTANCES_CODE_SOURCE,SNAPSHOT_SOURCE,SNAPSHOT_DATE} from '@/lib/rsshub-instances';
export async function GET(){
 const sources=[INSTANCES_SOURCE,'https://docs.rsshub.app/zh/guide/instances',INSTANCES_CODE_SOURCE];
 const results=await Promise.allSettled(sources.map(async source=>{const r=await safeFetch(source,{signal:AbortSignal.timeout(10000),headers:{Accept:source===INSTANCES_CODE_SOURCE?'text/plain':'text/html','Cache-Control':'no-cache'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);const text=await limitedText(r,2500000),instances=source===INSTANCES_CODE_SOURCE?parseInstanceSource(text):parseInstanceTables(text);if(!instances.length)throw new Error('名单格式暂时无法识别');return {instances,source};}));
 const success=results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]),community=COMMUNITY_INSTANCES.filter(r=>r.expires>=new Date().toISOString().slice(0,10));
 return Response.json({instances:mergeInstances([{url:'https://rsshub.app',location:'美国',maintainer:'DIYgod'}],...(success.length?success.map(s=>s.instances):[INSTANCE_SNAPSHOT]),community),source:success[0]?.source||SNAPSHOT_SOURCE,sources:[...success.map(r=>r.source),...community.map(r=>r.source)],fresh:!!success.length,snapshotDate:success.length?undefined:SNAPSHOT_DATE,fetchedAt:new Date().toISOString(),warning:success.length?undefined:'官网与源码暂时无法更新，使用已有快照；可用性仍逐个实时检测。'},{headers:{'Cache-Control':'no-store'}});
}
