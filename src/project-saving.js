// File destinations follow the local draft, never its undo history or exported JSON.
const projectDefaultName='关卡设计工具箱_工程_v1.2.json';
const projectFileKey=key+':file';
let projectFileHandle=null,projectFileRevision=0,projectSaveTask=null,projectFileToken=null,projectFileReady=Promise.resolve(),projectFileStorageTask=Promise.resolve();
function persistProjectFileToken(){if(projectFileToken)localStorage.setItem(projectFileKey,projectFileToken);else localStorage.removeItem(projectFileKey)}
function projectFileRecord(mode,value){
 // Serialize writes/deletes so an old save can never restore a reset association.
 const task=projectFileStorageTask.then(()=>new Promise((resolve,reject)=>{
  const request=indexedDB.open('level-design-toolkits-project-files',1);let blocked=false;
  request.onupgradeneeded=()=>request.result.createObjectStore('destinations');
  request.onerror=()=>reject(request.error);
  request.onblocked=()=>{blocked=true;reject(Error('保存位置存储被其他页面占用'))};
  request.onsuccess=()=>{
   const db=request.result;if(blocked){db.close();return}db.onversionchange=()=>db.close();
   let transaction,result;
   try{
    transaction=db.transaction('destinations',mode==='read'?'readonly':'readwrite');
    const store=transaction.objectStore('destinations'),operation=mode==='read'?store.get(key):mode==='write'?store.put(value,key):store.delete(key);
    operation.onsuccess=()=>{result=operation.result};
   }catch(error){if(transaction)transaction.abort();db.close();reject(error);return}
   transaction.oncomplete=()=>{db.close();resolve(result)};
   transaction.onabort=()=>{db.close();reject(transaction.error||Error('无法记住保存位置'))};
  };
 }));
 projectFileStorageTask=task.catch(()=>{});return task;
}
function resetProjectFile(){
 projectFileHandle=null;projectFileToken=null;projectFileRevision++;
 try{persistProjectFileToken()}catch{}
 if(!window.studioDesktop?.saveProject&&window.indexedDB)projectFileRecord('delete').catch(()=>{});
 $('[data-action="project"]').title='将工程保存为 JSON 文件';
}
function restoreProjectFile(restoredDraft){
 if(window.studioDesktop?.saveProject)return;
 try{projectFileToken=restoredDraft?localStorage.getItem(projectFileKey):null;if(!restoredDraft)persistProjectFileToken()}catch{}
 if(!projectFileToken)return;
 const token=projectFileToken,revision=projectFileRevision;
 projectFileReady=(async()=>{
  try{
   const record=await projectFileRecord('read');
   if(revision!==projectFileRevision)return;
   if(record?.token!==token||record.handle?.kind!=='file'||typeof record.handle.createWritable!=='function')throw Error('保存文件关联不可用');
   projectFileHandle=record.handle;
   $('[data-action="project"]').title='工程保存文件：'+record.handle.name;
  }catch{
   if(revision===projectFileRevision){projectFileToken=null;try{persistProjectFileToken()}catch{}status('上次保存位置无法恢复，请保存工程重新选择文件')}
  }
 })();
}
async function rememberProjectFile(handle,revision,draftSaved){
 if(projectFileToken)return true;
 if(!draftSaved)return false;
 try{
  const token=crypto.randomUUID();
  await projectFileRecord('write',{token,handle});
  if(revision!==projectFileRevision)return false;
  projectFileToken=token;persistProjectFileToken();return true;
 }catch{if(revision===projectFileRevision)projectFileToken=null;return false}
}
function saveProject(){
 if(projectSaveTask)return projectSaveTask;
 if(rowRename)finishRowRename();finishEditing();
 // Commit focused numeric/text fields before taking the file snapshot.
 if(textInput(document.activeElement))document.activeElement.blur();
 clearTimeout(timer);const draftSaved=save();
 const content=JSON.stringify(project,null,2),revision=projectFileRevision,button=$('[data-action="project"]');
 button.setAttribute('aria-busy','true');button.textContent='保存中…';
 projectSaveTask=(async()=>{
  try{
   await projectFileReady;
   if(revision!==projectFileRevision)return false;
   let handle=projectFileHandle,name=projectDefaultName;
   let remembered=true;
   if(window.studioDesktop?.saveProject){
    const result=await window.studioDesktop.saveProject(content,!handle);
    if(result.canceled){status('已取消保存');return false}
    handle={name:result.name};name=result.name;
   }else if(typeof window.showSaveFilePicker==='function'){
    if(!handle)handle=await window.showSaveFilePicker({suggestedName:projectDefaultName,types:[{description:'关卡设计工具箱工程',accept:{'application/json':['.json']}}]});
    else if(typeof handle.queryPermission==='function'&&await handle.queryPermission({mode:'readwrite'})!=='granted'){
     if(await handle.requestPermission({mode:'readwrite'})!=='granted'){status('未获得原工程文件的写入权限，内容仍保留；再次保存可重试授权');return false}
    }
    if(revision!==projectFileRevision)return false;
    if(typeof handle.getFile==='function')await handle.getFile();
    const writable=await handle.createWritable();
    try{await writable.write(content);await writable.close()}catch(error){try{await writable.abort()}catch{}throw error}
    name=handle.name;
    if(revision===projectFileRevision){projectFileHandle=handle;remembered=await rememberProjectFile(handle,revision,draftSaved)}
   }else{
    download(projectDefaultName,content,'application/json');
    status('已交给浏览器下载 · 保存位置由浏览器设置决定');
    button.title='工程通过浏览器下载保存，保存位置由浏览器设置决定';
    return true;
   }
   if(revision===projectFileRevision){projectFileHandle=handle;status('工程已保存：'+name+(remembered?'':' · 无法记住保存位置，重开后需重新选择'));button.title='工程保存文件：'+name}
   return true;
  }catch(error){
   if(error.name==='AbortError'){status('已取消保存');return false}
   if(error.name==='NotFoundError'&&revision===projectFileRevision){resetProjectFile();status('原工程文件已移动或删除，内容仍保留；请再次保存并选择文件位置');return false}
   if(revision===projectFileRevision){status('工程保存失败：'+error.message);window.alert('工程保存失败：'+error.message+'\n编辑内容仍保留，请重试保存。')}
   return false;
  }finally{button.removeAttribute('aria-busy');button.textContent='保存工程'}
 })().finally(()=>{projectSaveTask=null});
 return projectSaveTask;
}
