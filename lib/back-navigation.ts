type Handler=()=>boolean;
export function createBackStack(){
 let sequence=0;
 const layers=new Map<number,{priority:number;handle:Handler}>();
 return {
  register(handle:Handler,priority=0){const id=++sequence;layers.set(id,{handle,priority});return()=>{layers.delete(id);};},
  back(): 'handled'|'root'|'loading'{
   if(!layers.size)return 'loading';
   for(const [,layer] of [...layers].sort((a,b)=>b[1].priority-a[1].priority||b[0]-a[0]))if(layer.handle())return 'handled';
   return 'root';
  },
 };
}
export const androidBackStack=createBackStack();
