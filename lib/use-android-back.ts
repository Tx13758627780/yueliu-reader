'use client';
import {useEffect,useRef} from 'react';
import {androidBackStack} from './back-navigation';

export function useAndroidBack(enabled:boolean,handler:()=>boolean,priority=0){
 const current=useRef(handler);current.current=handler;
 useEffect(()=>{
  if(!enabled||!(window as any).__YUELIU_ANDROID__)return;
  return androidBackStack.register(()=>current.current(),priority);
 },[enabled,priority]);
}
