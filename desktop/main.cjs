'use strict';
const {app,BrowserWindow,Menu,session,dialog,ipcMain}=require('electron');
const path=require('node:path');
const {mkdirSync}=require('node:fs');
const fs=require('node:fs/promises');
const {randomUUID}=require('node:crypto');
const {pathToFileURL}=require('node:url');

app.setName('Level Design Toolkits');
// An isolated profile is useful for reproducible release smoke tests.
const profile=process.argv.find(v=>v.startsWith('--studio-profile='));
if(profile)app.setPath('userData',path.resolve(profile.slice('--studio-profile='.length)));
// Keep existing autosaved projects in the original profile after the product rename.
else{
 const legacyUserData=path.join(app.getPath('appData'),'Level Diagram Studio');
 mkdirSync(legacyUserData,{recursive:true});
 app.setPath('userData',legacyUserData);
}
if(!app.requestSingleInstanceLock()){app.quit();}else{
 let window;
 app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus()}});
 app.whenReady().then(()=>{
  const home=pathToFileURL(path.join(__dirname,'index.html')).href;
  let projectPath=null,projectSaving=false;
  ipcMain.handle('studio:save-project',async(event,content,chooseLocation)=>{
   if(event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame||event.senderFrame.url!==home)throw Error('无效的保存来源');
   if(typeof content!=='string'||typeof chooseLocation!=='boolean'||JSON.parse(content)?.format!=='level-spatial-editor')throw Error('无效的工程数据');
   if(projectSaving)throw Error('工程正在保存');
   projectSaving=true;let temporary;
   try{
    let destination=projectPath;
    if(chooseLocation||!destination){
     const result=await dialog.showSaveDialog(window,{title:'保存工程',defaultPath:destination||path.join(app.getPath('documents'),'关卡设计工具箱_工程_v1.2.json'),filters:[{name:'关卡设计工具箱工程',extensions:['json']}],properties:['showOverwriteConfirmation','createDirectory']});
     if(result.canceled||!result.filePath)return {canceled:true};
     destination=result.filePath;
    }
    // Replace only after a complete write, keeping the previous file on failure.
    temporary=path.join(path.dirname(destination),'.'+path.basename(destination)+'.'+randomUUID()+'.tmp');
    await fs.writeFile(temporary,content,{encoding:'utf8',flag:'wx'});
    await fs.rename(temporary,destination);temporary=null;projectPath=destination;
    return {canceled:false,name:path.basename(destination)};
   }finally{if(temporary)await fs.unlink(temporary).catch(()=>{});projectSaving=false}
  });
  // Offline app: imported projects never gain access to Node, OS APIs or the network.
  session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']},(_details,callback)=>callback({cancel:true}));
  session.defaultSession.on('will-download',(_event,item)=>item.setSaveDialogOptions({title:'保存工程或图稿',defaultPath:path.join(app.getPath('documents'),path.basename(item.getFilename()))}));
  window=new BrowserWindow({width:1440,height:960,minWidth:960,minHeight:680,show:false,backgroundColor:'#f8f9fb',
   title:'关卡设计工具箱 v1.2',icon:path.join(__dirname,'icon.ico'),
   webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,spellcheck:false,preload:path.join(__dirname,'preload.cjs')}});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',(event,url)=>{if(url!==home)event.preventDefault()});
  window.webContents.on('will-attach-webview',event=>event.preventDefault());
  window.webContents.on('did-fail-load',(_e,code,description)=>{if(code!==-3)dialog.showErrorBox('页面未能载入',description)});
  Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'帮助',submenu:[
   {label:'图文使用说明',accelerator:'F1',click:()=>window.webContents.executeJavaScript('SpatialEditor.command("help")').catch(()=>{})},
   {label:'关于关卡设计工具箱',click:()=>dialog.showMessageBox(window,{type:'info',title:'关卡设计工具箱',message:'关卡设计工具箱 v1.2',detail:'Level Design Toolkits\n离线关卡简图与曲线绘制工具。\n点击“保存工程”或按 Ctrl+S 保存可编辑 JSON。'})}
  ]}]));
  window.once('ready-to-show',()=>window.show());
  // Commit inline text and flush the app debounce before disposing the renderer.
  let closing=false;
  window.on('close',event=>{
   if(closing)return;event.preventDefault();closing=true;
   window.webContents.executeJavaScript('SpatialEditor.finishEditing();SpatialEditor.command("autosave")')
    .catch(()=>{}).finally(()=>window.destroy());
  });
  window.loadURL(home);
 });
 app.on('window-all-closed',()=>app.quit());
}
