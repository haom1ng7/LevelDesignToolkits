// Real browser restarts and IndexedDB structured cloning of real file handles.
// The picker selects an OPFS file so no native dialog or personal files are touched.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa/project-saving-restart'),profile=path.join(out,'profile-'+Date.now()),checks=[],errors=[];
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((_request,response)=>{response.setHeader('Content-Type','text/html; charset=utf-8');response.end(fs.readFileSync(path.join(root,'dist/index.html')))});
let context,page,url;
async function open(){
 context=await chromium.launchPersistentContext(profile,{headless:true,viewport:{width:1440,height:1000},...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{
  window.testSave={picks:0,alerts:[],permissions:0};window.alert=message=>testSave.alerts.push(message);
  if(sessionStorage.invalidDraft){sessionStorage.removeItem('invalidDraft');localStorage.setItem('spatial-studio-v9:'+location.pathname,'invalid JSON')}
  const query=FileSystemFileHandle.prototype.queryPermission;
  FileSystemFileHandle.prototype.queryPermission=function(options){return testSave.permission?Promise.resolve(testSave.permission):query.call(this,options)};
  FileSystemFileHandle.prototype.requestPermission=async function(){testSave.permissions++;return testSave.answer||'granted'};
  const open=indexedDB.open.bind(indexedDB),success=Object.getOwnPropertyDescriptor(IDBRequest.prototype,'onsuccess');
  indexedDB.open=(...args)=>{
   if(testSave.failStorage)throw new DOMException('模拟存储不可用','SecurityError');
   const request=open(...args);
   if(sessionStorage.holdRestore&&args[0]==='level-design-toolkits-project-files'){
    sessionStorage.removeItem('holdRestore');
    Object.defineProperty(request,'onsuccess',{set(callback){success.set.call(request,event=>{testSave.resumeRestore=()=>callback.call(request,event)})}});
   }
   return request;
  };
  window.showSaveFilePicker=async()=>{
   testSave.picks++;if(testSave.cancel)throw new DOMException('取消','AbortError');
   return (await navigator.storage.getDirectory()).getFileHandle('restart-project.json',{create:true});
  };
 });
 await page.goto(url);await page.waitForFunction(()=>!!window.SpatialEditor);
}
async function settled(){await page.waitForFunction(()=>!document.querySelector('[data-action="project"]').hasAttribute('aria-busy'))}
async function save(){await page.locator('[data-action="project"]').click();await settled()}
async function saved(){return page.evaluate(async()=>JSON.parse(await (await (await navigator.storage.getDirectory()).getFileHandle('restart-project.json')).getFile().then(file=>file.text())))}
(async()=>{
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url='http://127.0.0.1:'+server.address().port+'/';
  await open();await page.evaluate(()=>SpatialEditor.createDocument('space','关闭浏览器前'));await save();
  assert.equal(await page.evaluate(()=>testSave.picks),1);assert.equal((await saved()).documents[0].name,'关闭浏览器前');
  assert(!JSON.stringify(await saved()).includes('restart-project.json'),'file destinations stay out of project JSON');
  await page.evaluate(()=>SpatialEditor.command('undo'));await save();assert.equal((await saved()).documents.length,0);
  await page.evaluate(()=>SpatialEditor.command('redo'));await save();assert.equal(await page.evaluate(()=>testSave.picks),1);
  checks.push('文件关联不写入工程 JSON，撤销和重做仍保存到同一文件');
  // Close the entire browser process, retaining only its isolated on-disk profile.
  await context.close();context=null;await open();
  assert.equal(await page.evaluate(()=>SpatialEditor.document.name),'关闭浏览器前');
  assert.equal(await page.evaluate(()=>testSave.permissions),0,'restoring a draft never requests permission or writes the file');
  await page.evaluate(()=>{SpatialEditor.document.name='重启后覆盖原文件'});await save();
  assert.equal(await page.evaluate(()=>testSave.picks),0,'restarting the browser must restore the original destination');
  assert.equal((await saved()).documents[0].name,'重启后覆盖原文件');
  checks.push('真实关闭并重启 Chrome 后恢复工程，保存覆盖同一真实文件，不重新选择位置');

  await page.evaluate(()=>{testSave.permission='prompt';SpatialEditor.document.name='重新授权后保存'});await page.keyboard.press('Control+s');await settled();
  assert.equal(await page.evaluate(()=>testSave.permissions),1);assert.equal(await page.evaluate(()=>testSave.picks),0);
  assert.equal((await saved()).documents[0].name,'重新授权后保存');
  await page.evaluate(()=>{testSave.answer='denied';SpatialEditor.document.name='权限拒绝不覆盖'});await save();
  assert.equal((await saved()).documents[0].name,'重新授权后保存');assert.equal(await page.evaluate(()=>testSave.picks),0);
  await page.evaluate(()=>{testSave.answer='granted'});await save();assert.equal((await saved()).documents[0].name,'权限拒绝不覆盖');
  checks.push('原文件权限需重新授权时申请写权限；拒绝不写盘、不重新选位置，之后可重试');

  await page.evaluate(()=>{sessionStorage.holdRestore='1'});await page.reload();await page.waitForFunction(()=>!!testSave.resumeRestore);
  await page.evaluate(()=>{SpatialEditor.document.name='等待关联恢复后保存'});await page.locator('[data-action="project"]').click();
  assert.equal(await page.evaluate(()=>testSave.picks),0);assert(await page.locator('[data-action="project"]').getAttribute('aria-busy'));
  await page.evaluate(()=>testSave.resumeRestore());await settled();assert.equal(await page.evaluate(()=>testSave.picks),0);
  assert.equal((await saved()).documents[0].name,'等待关联恢复后保存');
  checks.push('启动时立即点击保存会等待文件关联恢复，不额外弹选择器');

  await page.evaluate(async()=>{await (await navigator.storage.getDirectory()).removeEntry('restart-project.json')});await save();
  assert.match(await page.locator('#status').textContent(),/原工程文件已移动或删除/);assert.equal(await page.evaluate(()=>testSave.picks),0);
  await save();assert.equal(await page.evaluate(()=>testSave.picks),1);assert.equal((await saved()).documents[0].name,'等待关联恢复后保存');
  checks.push('原文件删除时保留工程并提示重新选择，下一次保存可建立新关联');

  const original=await page.evaluate(()=>JSON.stringify(SpatialEditor.project));
  await page.evaluate(()=>{sessionStorage.holdRestore='1'});await page.reload();await page.waitForFunction(()=>!!testSave.resumeRestore);
  await page.evaluate(json=>{SpatialEditor.loadProject(JSON.parse(json));SpatialEditor.document.name='另一份工程';SpatialEditor.command('autosave')},original);
  await page.evaluate(()=>testSave.resumeRestore());
  await context.close();context=null;await open();assert.equal(await page.evaluate(()=>SpatialEditor.document.name),'另一份工程');
  await page.evaluate(()=>{testSave.cancel=true});await save();assert.equal(await page.evaluate(()=>testSave.picks),1,'imported project must not inherit the old destination after restart');
  assert.equal((await saved()).documents[0].name,'等待关联恢复后保存');
  checks.push('载入另一工程清除持久关联，旧异步恢复不会重新绑定；重启后首次保存需选位置，取消保留原文件和新工程');

  await page.evaluate(()=>{testSave.cancel=false});await save();
  await page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase('level-design-toolkits-project-files');request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error)}));
  await page.reload();await save();assert.equal(await page.evaluate(()=>testSave.picks),1);
  assert.equal((await saved()).documents[0].name,'另一份工程');
  checks.push('浏览器文件关联存储丢失时保留暂存工程，可重新选择并保存');

  await page.goto(url+'another.html');assert.equal(await page.evaluate(()=>SpatialEditor.project.documents.length),0);
  await page.evaluate(()=>{testSave.cancel=true});await save();assert.equal(await page.evaluate(()=>testSave.picks),1);
  assert.equal((await saved()).documents[0].name,'另一份工程');
  await page.goto(url);await save();assert.equal(await page.evaluate(()=>testSave.picks),0);
  checks.push('不同网页路径的工程和保存关联隔离，返回原路径仍可覆盖原文件');

  await page.evaluate(()=>{sessionStorage.invalidDraft='1'});await page.reload();
  assert.equal(await page.evaluate(()=>SpatialEditor.project.documents.length),0);
  await page.evaluate(()=>{testSave.cancel=true});await save();assert.equal(await page.evaluate(()=>testSave.picks),1);
  assert.equal((await saved()).documents[0].name,'另一份工程');
  checks.push('损坏暂存回退空工程时不继承旧保存文件，避免覆盖原工程');

  await page.evaluate(()=>{testSave.cancel=false;testSave.failStorage=true;SpatialEditor.createDocument('space','关联存储不可用仍可保存')});await save();
  assert.equal((await saved()).documents[0].name,'关联存储不可用仍可保存');
  assert.match(await page.locator('#status').textContent(),/无法记住保存位置/);
  const picks=await page.evaluate(()=>testSave.picks);await save();assert.equal(await page.evaluate(()=>testSave.picks),picks);
  checks.push('持久存储不可用时仍写入有效文件并提示，当前页面继续复用同一位置');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({pass:true,checks,errors,note:'真实 Chrome 持久配置、完整进程重启、IndexedDB 和 OPFS 文件写入；文件选择器与权限响应由测试控制。'},null,2));
  console.log('PASS project saving restart: '+checks.join('；'));
 }finally{if(context)await context.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
