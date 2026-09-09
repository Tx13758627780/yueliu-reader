'use client';
import {useEffect,useState} from 'react';
import {notesFetch} from '@/lib/notes-client';
export function NoteAudio({id}:{id:string}){const [url,setUrl]=useState(''),[error,setError]=useState('');useEffect(()=>{let alive=true,object='';notesFetch('/api/notes?audio='+encodeURIComponent(id)).then(async r=>{if(!r.ok)throw new Error('录音尚未下载，请联网打开一次');object=URL.createObjectURL(await r.blob());if(alive)setUrl(object);else URL.revokeObjectURL(object);}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;if(object)URL.revokeObjectURL(object);};},[id]);return url?<audio controls src={url}/>:<small>{error||'正在读取录音…'}</small>;}
