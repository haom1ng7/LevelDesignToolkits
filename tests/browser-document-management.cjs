// Real-browser acceptance for drawing management. Run after npm run build.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright-core');
const out=path.join(__dirname,'../qa/ui-refine');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 const errors=[],network=[];
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light',acceptDownloads:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const rename=page.locator('[data-action="rename-document"]'),input=page.locator('#rename-name'),dialog=page.locator('#rename-dialog');
  const state=()=>page.evaluate(()=>({document:JSON.stringify(SpatialEditor.document),undo:SpatialEditor.undoCount}));
  const name=()=>page.evaluate(()=>SpatialEditor.document.name);
  const remaining=()=>page.evaluate(()=>{const {name,...rest}=SpatialEditor.document;return JSON.stringify(rest)});
  assert(await rename.isDisabled(),'rename is disabled without a drawing');
  assert.equal(await page.locator('.drawing-heading-actions [data-action="new"]').count(),1,'new is in the engineering drawing section');
  await page.locator('[data-action="new"]').click();await page.locator('#new-name').fill('入口空间');await page.locator('#new-dialog [data-template="space"]').click();
  assert.equal(await name(),'入口空间');assert.equal(await page.locator('#document-count').textContent(),'1');
  const original=await state(),geometry=await remaining();
  await rename.click();assert.equal(await input.inputValue(),'入口空间');
  assert.deepEqual(await input.evaluate(el=>({focus:el===document.activeElement,start:el.selectionStart,end:el.selectionEnd})),{focus:true,start:0,end:4},'rename selects the existing name');
  await input.fill('不应保存');await dialog.locator('button').filter({hasText:'取消'}).click();assert.deepEqual(await state(),original,'cancel has no history or data effect');
  await rename.click();await input.fill('也不保存');await input.press('Escape');assert.equal(await dialog.isVisible(),false);assert.deepEqual(await state(),original,'Escape cancels');
  await rename.click();await input.fill('   ');await input.press('Enter');
  assert(await dialog.isVisible(),'whitespace does not close the dialog');assert.equal(await input.evaluate(el=>el.validity.valid),false);assert.deepEqual(await state(),original);
  // A real Enter while composition is active must not submit the form.
  await input.fill('  中庭 <入口>  ');await input.dispatchEvent('compositionstart',{data:'中'});await input.press('Enter');
  assert(await dialog.isVisible(),'IME Enter does not save');assert.deepEqual(await state(),original);
  const imePrevented=await input.evaluate(el=>!el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:229,isComposing:true,bubbles:true,cancelable:true})));
  assert(imePrevented,'composing and legacy IME Enter are prevented');await input.dispatchEvent('compositionend',{data:'中庭'});await input.press('Enter');
  assert.equal(await dialog.isVisible(),false);assert.equal(await name(),'中庭 <入口>');assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),original.undo+1,'one rename is one history entry');
  assert.equal(await remaining(),geometry,'rename preserves all artwork');
  assert.equal(await page.locator('#doc-title').textContent(),'中庭 <入口>');assert.equal(await page.locator('#document-select option:checked').textContent(),'中庭 <入口>');
  await page.locator('[data-panel="document"]').click();assert.equal(await page.locator('#doc-name').inputValue(),'中庭 <入口>','document settings reflect rename');
  await page.locator('[data-action="undo"]').click();assert.equal(await name(),'入口空间');assert.equal(await remaining(),geometry);
  await page.locator('[data-action="redo"]').click();assert.equal(await name(),'中庭 <入口>');
  const saved=await state();await rename.click();await input.press('Enter');assert.deepEqual(await state(),saved,'saving the same name adds no history');
  await page.keyboard.press('Control+z');assert.equal(await name(),'入口空间');await page.keyboard.press('Control+Shift+z');assert.equal(await name(),'中庭 <入口>');
  // Verify the actual JSON download and UI file import, not only serialization helpers.
  const downloadEvent=page.waitForEvent('download');await page.locator('[data-action="project"]').click();const download=await downloadEvent;
  const jsonPath=path.join(out,'renamed-project.json');await download.saveAs(jsonPath);const json=JSON.parse(fs.readFileSync(jsonPath,'utf8'));
  assert.equal(json.documents[0].name,'中庭 <入口>');assert.deepEqual(json.documents[0].objects,JSON.parse(geometry).objects);
  await page.locator('[data-action="new"]').click();await page.locator('#new-name').fill('体验曲线');await page.locator('#new-dialog [data-template="curve"]').click();
  const curve=await state(),chart=await remaining();await rename.click();await input.fill('第二阶段节奏');await input.press('Enter');
  assert.equal(await name(),'第二阶段节奏');assert.equal(await remaining(),chart,'curve title, events and geometry stay independent of drawing name');assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),curve.undo+1);
  await page.locator('[data-action="undo"]').click();assert.equal(await name(),'体验曲线');await page.locator('[data-action="redo"]').click();assert.equal(await name(),'第二阶段节奏');
  const chooserEvent=page.waitForEvent('filechooser');await page.locator('[data-action="import"]').click();await (await chooserEvent).setFiles(jsonPath);await page.waitForFunction(()=>SpatialEditor.project.documents.length===1&&SpatialEditor.document.name==='中庭 <入口>');
  assert.equal(await remaining(),geometry,'JSON import preserves the renamed drawing and artwork');
  // New and rename remain reachable from the tools pane at phone size.
  await page.setViewportSize({width:360,height:844});await page.locator('[data-shell-pane="tools"]').click();await rename.click();
  const bounds=await dialog.boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=360.5);await page.screenshot({path:path.join(out,'rename-mobile.png')});
  await input.fill('手机端图稿');await input.press('Enter');assert.equal(await name(),'手机端图稿');
  await page.locator('[data-action="new"]').click();await page.locator('#new-name').fill('移动端新增');await page.locator('#new-dialog [data-template="curve"]').click();
  assert.equal(await name(),'移动端新增');assert.equal(await page.locator('[data-shell-pane="canvas"]').getAttribute('aria-pressed'),'true');
  await page.reload();assert.deepEqual(await page.evaluate(()=>SpatialEditor.project.documents.map(d=>d.name)),['手机端图稿','移动端新增'],'autosave restores drawing names');
  await page.locator('[data-shell-pane="tools"]').click();await page.waitForTimeout(220);await page.screenshot({path:path.join(out,'drawings-mobile.png')});
  assert.deepEqual(errors,[],'no browser/CSP errors');assert.deepEqual(network,[],'no online resources');
  fs.writeFileSync(path.join(out,'document-management.json'),JSON.stringify({pass:true,checks:['local new','Chinese rename and trim','prefill/focus/selection','cancel/Escape','blank validation','IME Enter','one-step undo/redo','no-op history','artwork isolation','curve title isolation','actual JSON download/import','phone management','autosave reload'],browserErrors:errors,onlineRequests:network},null,2));
  console.log('PASS Chrome drawing management: local new; Chinese rename/trim; focus; cancel/Escape; whitespace/IME; one-step undo/redo and no-op; geometry/curve-title isolation; JSON download/import; phone new/rename and autosave. Evidence: qa/ui-refine/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
