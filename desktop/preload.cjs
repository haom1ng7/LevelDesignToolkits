'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('studioDesktop',Object.freeze({
 saveProject:(content,chooseLocation)=>ipcRenderer.invoke('studio:save-project',content,chooseLocation)
}));
