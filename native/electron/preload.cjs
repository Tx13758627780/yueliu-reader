const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('yueliuDesktop',{request:input=>ipcRenderer.invoke('reader:request',input),instance:action=>ipcRenderer.invoke('reader:instance',action)});
