// File destinations belong to this open project, never to its undo history or JSON.
const projectDefaultName='关卡设计工具箱_工程_v1.2.json';
let projectFileHandle=null,projectFileRevision=0,projectSaveTask=null;
function resetProjectFile(){projectFileHandle=null;projectFileRevision++;const button=$('[data-action="project"]');button.title='保存工程（Ctrl+S）'}
function saveProject(){
 if(projectSaveTask)return projectSaveTask;
 if(rowRename)finishRowRename();finishEditing();
 // Commit focused numeric/text fields before taking the file snapshot.
 if(textInput(document.activeElement))document.activeElement.blur();
 clearTimeout(timer);save();
 const content=JSON.stringify(project,null,2),revision=projectFileRevision,button=$('[data-action="project"]');
 button.setAttribute('aria-busy','true');button.textContent='保存中…';
 projectSaveTask=(async()=>{
  try{
   let handle=projectFileHandle,name=projectDefaultName;
   if(window.studioDesktop?.saveProject){
    const result=await window.studioDesktop.saveProject(content,!handle);
    if(result.canceled){status('已取消保存');return false}
    handle={name:result.name};name=result.name;
   }else if(typeof window.showSaveFilePicker==='function'){
    if(!handle)handle=await window.showSaveFilePicker({suggestedName:projectDefaultName,types:[{description:'关卡设计工具箱工程',accept:{'application/json':['.json']}}]});
    const writable=await handle.createWritable();
    try{await writable.write(content);await writable.close()}catch(error){try{await writable.abort()}catch{}throw error}
    name=handle.name;
   }else{
    download(projectDefaultName,content,'application/json');
    status('已交给浏览器下载 · 保存位置由浏览器设置决定');
    button.title='此浏览器使用下载保存；选择位置请启用浏览器的下载前询问设置，或使用 Chrome / Edge、桌面版';
    return true;
   }
   if(revision===projectFileRevision){projectFileHandle=handle;status('工程已保存：'+name);button.title='保存工程（Ctrl+S）\n保存文件：'+name}
   return true;
  }catch(error){
   if(error.name==='AbortError'){status('已取消保存');return false}
   if(revision===projectFileRevision){status('工程保存失败：'+error.message);window.alert('工程保存失败：'+error.message+'\n编辑内容仍保留，请重试保存。')}
   return false;
  }finally{button.removeAttribute('aria-busy');button.textContent='保存工程'}
 })().finally(()=>{projectSaveTask=null});
 return projectSaveTask;
}
