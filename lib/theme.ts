export type ReaderTheme={accent:string;mode:'light'|'paper'|'dark';paper:string};
export const defaultTheme:ReaderTheme={accent:'#147d64',mode:'light',paper:'#fffdf7'};
export const themePresets=[['松绿','#147d64'],['海蓝','#245ab5'],['紫藤','#7545a5'],['朱红','#a53d46'],['墨灰','#444953']];
export function validHex(value:unknown):value is string{return typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);}
export function themeColors(theme:ReaderTheme){
 const accent=validHex(theme.accent)?theme.accent:defaultTheme.accent;
 const rgb=accent.slice(1).match(/../g)!.map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 const luminance=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
 const dark=theme.mode==='dark';
 return {'--reader-accent':accent,'--reader-on-accent':luminance>.179?'#101820':'#ffffff','--reader-paper':dark?'#181c23':theme.mode==='paper'&&validHex(theme.paper)?theme.paper:'#ffffff','--reader-ink':dark?'#e9edf3':'#26312d','--reader-muted':dark?'#adb9c8':'#66716b','--reader-soft':dark?'#222934':theme.mode==='paper'?'color-mix(in srgb, var(--reader-paper), var(--reader-accent) 5%)':'#f5f7f7','--reader-line':dark?'#3b4552':'#dce3df'};
}
export function applyTheme(theme:ReaderTheme){const el=document.documentElement;for(const [k,v]of Object.entries(themeColors(theme)))el.style.setProperty(k,v);el.dataset.readerTheme=theme.mode;el.style.colorScheme=theme.mode==='dark'?'dark':'light';}
