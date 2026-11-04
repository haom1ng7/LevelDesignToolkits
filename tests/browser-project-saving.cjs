// Real Chrome keyboard/editor paths with a controlled file picker.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa/project-saving');
fs.mkdirSync(out,{recursive:true});
const html=path.join(root,'dist/index.html'),checks=[],errors=[];
async function browserChecks(){
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.testSave={picks:0,writes:[],alerts:[],aborts:0,options:null};
   window.alert=message=>testSave.alerts.push(message);
   window.showSaveFilePicker=async options=>{
    testSave.picks++;testSave.options=options;
    if(testSave.cancel)throw new DOMException('取消','AbortError');
    const name='工程'+testSave.picks+'.json';
    return {name,async createWritable(){let content;return {
     async write(value){if(testSave.fail)throw Error('模拟磁盘写入失败');content=value},
     async close(){if(testSave.delay)await new Promise(resolve=>{testSave.resume=resolve});testSave.writes.push({name,content})},
     async abort(){testSave.aborts++}
    }}};
   };
  });
  await page.goto(pathToFileURL(html).href);
  const save=page.locator('[data-action="project"]'),settled=()=>page.waitForFunction(()=>!document.querySelector('[data-action="project"]').hasAttribute('aria-busy'));
  assert.equal(await save.textContent(),'保存工程');
  await page.keyboard.press('Control+s');await settled();
  assert.equal(await page.evaluate(()=>testSave.picks),1);
  assert.equal(await page.evaluate(()=>JSON.parse(testSave.writes[0].content).documents.length),0,'empty projects can be saved');
  assert.deepEqual(await page.evaluate(()=>testSave.options.types[0].accept),{'application/json':['.json']});
  await page.evaluate(()=>SpatialEditor.createDocument('space','首次快速保存'));
  await save.click();await settled();
  assert.equal(await page.evaluate(()=>testSave.picks),1,'button shares the remembered destination');
  assert.equal(await page.evaluate(()=>JSON.parse(testSave.writes.at(-1).content).documents[0].name),'首次快速保存');
  const id=await page.evaluate(()=>{const A=SpatialEditor,o=StudioModel.createObject(A.document,'text',[300,300,0]);A.document.objects.push(o);A.select(o.id,false,true);return o.id});
  await page.locator('#prop-name').fill('Ctrl S 输入中的名称');await page.keyboard.press('Control+s');await settled();
  assert.equal(await page.evaluate(id=>JSON.parse(testSave.writes.at(-1).content).documents[0].objects.find(o=>o.id===id).name,id),'Ctrl S 输入中的名称');
  await page.evaluate(id=>SpatialEditor.beginEditing(SpatialEditor.document.objects.find(o=>o.id===id)),id);
  await page.locator('#inline-editor').fill('正在编辑的中文内容');await page.keyboard.press('Meta+s');await settled();
  assert.equal(await page.evaluate(id=>JSON.parse(testSave.writes.at(-1).content).documents[0].objects.find(o=>o.id===id).text,id),'正在编辑的中文内容');
  assert.equal(await page.locator('#inline-editor').isVisible(),false);
  assert.equal(await page.evaluate(()=>testSave.picks),1);
  checks.push('首次按钮/快捷键选择位置；后续按钮、Ctrl+S、Command+S 更新同一目标；输入框和行内中文编辑提交；空工程可保存');

  const count=await page.evaluate(()=>testSave.writes.length);
  const blocked=await page.evaluate(()=>{
   const key=options=>!document.querySelector('#canvas').dispatchEvent(new KeyboardEvent('keydown',{key:'s',code:'KeyS',ctrlKey:true,bubbles:true,cancelable:true,...options}));
   return [key({repeat:true}),key({isComposing:true,keyCode:229})];
  });
  assert.deepEqual(blocked,[true,true]);assert.equal(await page.evaluate(()=>testSave.writes.length),count);
  await page.locator('[data-action="help"]').click();await page.keyboard.press('Control+s');
  assert.equal(await page.evaluate(()=>testSave.writes.length),count);await page.locator('[data-action="close-help"]').click();

  await page.evaluate(()=>{testSave.delay=true;testSave.resume=null;SpatialEditor.command('save');SpatialEditor.command('save')});
  await page.waitForFunction(()=>!!testSave.resume);assert.equal(await page.evaluate(()=>testSave.writes.length),count);
  await page.evaluate(()=>{testSave.delay=false;testSave.resume()});await settled();
  assert.equal(await page.evaluate(()=>testSave.writes.length),count+1,'overlapping requests make one complete write');
  await page.evaluate(()=>{testSave.fail=true});await save.click();await settled();
  assert.equal(await page.evaluate(()=>testSave.writes.length),count+1);assert.equal(await page.evaluate(()=>testSave.aborts),1);
  assert.match(await page.evaluate(()=>testSave.alerts[0]),/保存失败/);
  await page.evaluate(()=>{testSave.fail=false});await save.click();await settled();assert.equal(await page.evaluate(()=>testSave.picks),1);
  checks.push('重复按键/输入法/对话框不误保存；并发去重；写入失败中止并提示；重试保留保存位置');

  const original=await page.evaluate(()=>JSON.stringify(SpatialEditor.project));
  await page.evaluate(json=>{SpatialEditor.loadProject(JSON.parse(json));testSave.cancel=true},original);
  await save.click();await settled();assert.equal(await page.evaluate(()=>testSave.picks),2);
  assert.equal(await page.evaluate(()=>JSON.stringify(SpatialEditor.project)),original);
  await page.evaluate(()=>{testSave.cancel=false});await save.click();await settled();assert.equal(await page.evaluate(()=>testSave.picks),3);
  await page.evaluate(()=>SpatialEditor.command('import'));
  await page.locator('#file-input').setInputFiles({name:'导入工程.json',mimeType:'application/json',buffer:Buffer.from(original)});
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('工程已载入'));
  await save.click();await settled();assert.equal(await page.evaluate(()=>testSave.picks),4,'UI import releases the old file');
  await page.evaluate(()=>{testSave.delay=true;testSave.resume=null;SpatialEditor.command('save')});await page.waitForFunction(()=>!!testSave.resume);
  await page.evaluate(json=>{SpatialEditor.loadProject(JSON.parse(json));testSave.delay=false;testSave.resume()},original);await settled();
  await save.click();await settled();assert.equal(await page.evaluate(()=>testSave.picks),5,'old asynchronous completion cannot bind a file to a new project');
  checks.push('打开工程及程序载入重置目标；取消不丢数据；旧保存异步完成不绑定新工程');

  await page.evaluate(()=>{window.showSaveFilePicker=undefined;SpatialEditor.loadProject(SpatialEditor.project)});
  const downloadEvent=page.waitForEvent('download');await save.click();const download=await downloadEvent;
  const fallback=path.join(out,'fallback.json');await download.saveAs(fallback);assert.equal(JSON.parse(fs.readFileSync(fallback,'utf8')).format,'level-spatial-editor');
  await page.screenshot({path:path.join(out,'save-engineering.png'),fullPage:true});
  checks.push('不支持文件保存接口时下载有效 JSON，并明确说明位置由浏览器决定');
 }finally{await browser.close()}
}
(async()=>{await browserChecks();assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({pass:true,checks,errors,pickerNote:'浏览器文件句柄与文件选择器使用测试替身；Chrome 编辑、键盘及 JSON 下载真实运行。'},null,2));console.log('PASS project saving: '+checks.join('；'))})().catch(error=>{console.error(error);process.exitCode=1});
