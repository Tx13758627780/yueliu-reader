const {app,BrowserWindow,protocol,net,ipcMain,dialog,shell}=require('electron');
const path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url'),{execFile}=require('node:child_process');
const {promisify}=require('node:util'),run=promisify(execFile);
protocol.registerSchemesAsPrivileged([{scheme:'yueliu',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
let win,starting;
function authorized(event){if(!win||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame||!event.senderFrame.url.startsWith('yueliu://app/'))throw new Error('请求来源无效');}
async function instance(action){
 if(!['start','stop','status'].includes(action))throw new Error('无效操作');
 const name='yueliu-rsshub';
 try{await run('docker',['info','--format','{{.ServerVersion}}'],{timeout:15000,windowsHide:true});}catch{throw new Error('请先安装并启动 Docker Desktop，再点击启用本机实例。');}
 let exists=false;try{const r=await run('docker',['inspect','--format','{{index .Config.Labels "app.yueliu.managed"}}',name],{timeout:10000,windowsHide:true});if(r.stdout.trim()!=='true')throw new Error('同名容器不是阅流创建的，请先更换其名称');exists=true;}catch(e){if(e.message.includes('同名容器'))throw e;}
 if(action==='stop'){if(exists)await run('docker',['stop',name],{timeout:30000,windowsHide:true});return {running:false,url:'http://127.0.0.1:1200'};}
 if(action==='start'){if(exists)await run('docker',['start',name],{timeout:30000,windowsHide:true});else await run('docker',['run','-d','--name',name,'--label','app.yueliu.managed=true','--restart','unless-stopped','-p','127.0.0.1:1200:1200','-e','CACHE_EXPIRE=3600','diygod/rsshub:chromium-bundled'],{timeout:600000,maxBuffer:2000000,windowsHide:true});}
 const deadline=Date.now()+(action==='start'?45000:1000);do{try{const r=await fetch('http://127.0.0.1:1200/healthz',{signal:AbortSignal.timeout(1500)});if(r.ok)return {running:true,url:'http://127.0.0.1:1200'};}catch{}if(action==='status')break;await new Promise(r=>setTimeout(r,1000));}while(Date.now()<deadline);
 return {running:false,url:'http://127.0.0.1:1200',message:action==='start'?'容器已启动，服务仍在准备。稍后点击检查状态。':'实例未运行'};
}
app.whenReady().then(()=>{
 const root=path.join(app.getAppPath(),'www');
 protocol.handle('yueliu',async req=>{const u=new URL(req.url);if(u.host!=='app')return new Response('Not found',{status:404});let file;try{file=path.resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));}catch{return new Response('Bad request',{status:400});}if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return new Response('Not found',{status:404});const response=await net.fetch(pathToFileURL(file).href);const headers=new Headers(response.headers);headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; connect-src 'self' https: data:; media-src 'self' https: blob:; frame-src https://player.bilibili.com; object-src 'none'; base-uri 'self'");return new Response(response.body,{status:response.status,headers});});
 win=new BrowserWindow({width:1360,height:900,minWidth:390,minHeight:600,title:'阅流',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 ipcMain.handle('reader:request',(event,input)=>{authorized(event);return require('./api.cjs').request(input);});
 ipcMain.handle('reader:instance',async(event,action)=>{authorized(event);if(starting)throw new Error('实例正在启动，请稍候');if(action==='start'){starting=instance(action);try{return await starting;}finally{starting=null;}}return instance(action);});
 win.webContents.setWindowOpenHandler(({url})=>{if(/^https?:\/\//.test(url))void shell.openExternal(url);return {action:'deny'};});
 win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('yueliu://app/')){event.preventDefault();if(/^https?:\/\//.test(url))void shell.openExternal(url);}});
 win.webContents.session.setPermissionRequestHandler(async(wc,permission,callback,details)=>{if(wc!==win.webContents||!details.isMainFrame||!details.requestingUrl.startsWith('yueliu://app/')||permission!=='media'){callback(false);return;}const result=await dialog.showMessageBox(win,{type:'question',buttons:['允许录音','取消'],defaultId:1,cancelId:1,message:'允许阅流使用麦克风录制笔记？'});callback(result.response===0);});
 win.webContents.session.setPermissionCheckHandler((wc,permission,origin)=>wc===win.webContents&&origin==='yueliu://app'&&permission==='media');
 win.loadURL('yueliu://app/');
});
app.on('window-all-closed',()=>app.quit());
