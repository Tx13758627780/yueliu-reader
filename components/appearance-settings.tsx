'use client';
import {useEffect,useState} from 'react';
import {Palette,Check} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {defaultTheme,themePresets,applyTheme,type ReaderTheme} from '@/lib/theme';
import {toast} from 'sonner';
export function AppearanceSettings(){const [open,setOpen]=useState(false),[theme,setTheme]=useState<ReaderTheme>(defaultTheme);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('yueliu-theme')||'null');const value={...defaultTheme,...saved};setTheme(value);applyTheme(value);}catch{applyTheme(defaultTheme);}},[]);
 function update(p:Partial<ReaderTheme>){const next={...theme,...p};setTheme(next);applyTheme(next);try{localStorage.setItem('yueliu-theme',JSON.stringify(next));}catch{toast.error('配色未能保存');}}
 return <><button className="settings-button" onClick={()=>setOpen(true)}><Palette size={17}/>外观与色调</button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="app-dialog appearance-dialog"><DialogTitle>让阅读有自己的颜色</DialogTitle><DialogDescription>即时预览，自动保存在这台设备。</DialogDescription><Tabs value={theme.mode} onValueChange={mode=>update({mode:mode as ReaderTheme['mode']})}><TabsList className="safe-tabs"><TabsTrigger value="light">明亮</TabsTrigger><TabsTrigger value="paper">纸张</TabsTrigger><TabsTrigger value="dark">夜读</TabsTrigger></TabsList></Tabs><div className="theme-swatches">{themePresets.map(([name,color])=><button key={color} onClick={()=>update({accent:color})} aria-pressed={theme.accent===color}><i style={{background:color}}>{theme.accent===color&&<Check size={17}/>}</i>{name}</button>)}</div><label className="color-field">自定义主题色<input type="color" value={theme.accent} onChange={e=>update({accent:e.target.value})}/><code>{theme.accent}</code></label>{theme.mode==='paper'&&<label className="color-field">纸张底色<input type="color" value={theme.paper} onChange={e=>update({paper:e.target.value})}/></label>}<div className="theme-sample"><small>阅读预览</small><h3>留下一点思考的空间</h3><p>文章、批注与自由笔记，沿用你选择的色调。</p><button className="primary" onClick={()=>setOpen(false)}>使用这个色调</button></div><button className="subtle" onClick={()=>update(defaultTheme)}>恢复默认配色</button></DialogContent></Dialog></>;
}
