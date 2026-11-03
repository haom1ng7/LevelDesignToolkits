const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const out=path.join(__dirname,'../qa/component-names');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'}),errors=[],network=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);await page.evaluate(()=>document.fonts.ready);
  const id=await page.evaluate(()=>{const A=SpatialEditor,M=StudioModel;A.createDocument('space','组件命名');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];A.document.counters={};const o=M.createObject(A.document,'plane',[600,400,0]);A.document.objects.push(o);A.select(o.id,false,true);return o.id});
  const state=()=>page.evaluate(()=>({objects:SpatialEditor.document.objects.map(o=>({id:o.id,name:o.name})),history:SpatialEditor.undoCount}));
  const name=async()=> (await state()).objects.find(o=>o.id===id).name;
  assert.equal(await name(),'平面_001');let before=await state();
  await page.locator('#prop-name').fill('入口.平台');await page.locator('#prop-name').press('Tab');assert.equal(await name(),'入口_平台');assert.equal((await state()).history,before.history+1);
  await page.keyboard.press('Control+z');assert.equal(await name(),'平面_001');await page.keyboard.press('Control+Shift+z');assert.equal(await name(),'入口_平台');
  checks.push({inspectorDots:true,oneUndo:true});
  await page.locator(`[data-layer="${id}"]`).dblclick();await page.locator('.row-rename').fill('大厅 · 入口');await page.locator('.row-rename').press('Enter');assert.equal(await name(),'大厅_入口');
  before=await state();await page.locator(`[data-layer="${id}"]`).dblclick();await page.locator('.row-rename').fill('取消.修改');await page.locator('.row-rename').press('Escape');assert.deepEqual(await state(),before);
  // Copy and paste through real keyboard input, outside a name field.
  await page.locator('#canvas').focus();await page.keyboard.press('Control+c');await page.keyboard.press('Control+v');assert.equal((await state()).objects.at(-1).name,'大厅_入口_副本_001');
  await page.keyboard.press('Control+c');await page.keyboard.press('Control+v');assert.equal((await state()).objects.at(-1).name,'大厅_入口_副本_002');checks.push({inlineRename:true,cancel:true,keyboardPaste:true,copyOfCopy:true});
  const copyId=(await state()).objects.at(-1).id;await page.locator(`[data-layer="${copyId}"]`).click();await page.locator('#prop-name').fill('大厅.入口');await page.locator('#prop-name').press('Tab');assert.equal((await state()).objects.at(-1).name,'大厅_入口_002');
  before=await state();await page.locator('#prop-name').fill(' ');await page.locator('#prop-name').press('Tab');assert.deepEqual(await state(),before);checks.push({collisionSuffix:true,emptyRejected:true});
  await page.screenshot({path:path.join(out,'desktop-names.png')});
  const saved=await page.evaluate(()=>JSON.stringify(SpatialEditor.project));await page.reload();await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>JSON.stringify(SpatialEditor.project)),saved,'autosave retains normalized names');checks.push({autosaveRestore:true});
  await page.setViewportSize({width:390,height:844});await page.locator('[data-shell-pane="tools"]').click();await page.locator(`[data-layer="${id}"]`).dblclick();await page.locator('.row-rename').fill('窄屏.入口');await page.locator('.row-rename').press('Enter');assert.equal(await name(),'窄屏_入口');await page.screenshot({path:path.join(out,'narrow-names.png')});checks.push({width:390,inlineRename:true});
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,network},null,2));
  console.log('PASS Chrome component names: actual inspector/inline typing, dotted separators, cancel, blank rejection, collision numbering, keyboard copy/paste and copy of copy, undo/redo, autosave restore and 390px inline editing. Evidence: qa/component-names/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
