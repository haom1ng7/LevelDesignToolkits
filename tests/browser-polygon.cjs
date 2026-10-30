const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
const {selectTool}=require('./tool-menu.cjs');
(async()=>{
 const out=path.join(__dirname,'../qa/polygon');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const context=await browser.newContext({viewport:{width:1600,height:1000}}),errors=[],network=[],checks=[];
  await context.addInitScript(()=>{Storage.prototype.setItem=function(){}});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);await page.evaluate(()=>document.fonts.ready);
  const seed=async(height=0)=>page.evaluate(height=>{const M=StudioModel,d=M.createDocument('space','多边形工具');d.objects=[];d.floors[0].height=height;SpatialEditor.loadProject({format:'level-spatial-editor',version:7,documents:[d],activeDocument:d.id})},height);
  const at=p=>page.evaluate(p=>{const q=new DOMPoint(...p).matrixTransform(document.querySelector('#canvas').getScreenCTM());return {x:q.x,y:q.y}},p);
  const click=async p=>{const q=await at(p);await page.mouse.click(q.x,q.y)};
  const state=()=>page.evaluate(()=>({project:JSON.stringify(SpatialEditor.project),history:SpatialEditor.undoCount}));
  await seed();await page.locator('#snap').uncheck();
  await page.locator('#tool-shapes').click();await page.screenshot({path:path.join(out,'menu-desktop.png')});await page.locator('[data-tool="polygon"]').click();
  assert.equal(await page.evaluate(()=>SpatialEditor.tool),'polygon');assert(await page.locator('#tool-shapes-menu').isHidden());assert.equal(await page.locator('#canvas').evaluate(el=>getComputedStyle(el).cursor),'crosshair');
  const before=await state(),ring=[[200,200],[700,200],[700,600],[450,400],[200,600]];
  for(const p of ring)await click(p);
  assert.deepEqual(await state(),before);let first=await at(ring[0]);await page.mouse.move(first.x+3,first.y+3);
  assert(await page.evaluate(()=>SpatialEditor.drawing.hover.close));assert.equal(await page.locator('[data-polygon-preview]').count(),1);
  await page.screenshot({path:path.join(out,'concave-preview.png')});
  await page.mouse.click(first.x+3,first.y+3);
  assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),1);assert.equal(await page.evaluate(()=>SpatialEditor.document.objects[0].points.length),5);assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),before.history+1);assert.equal(await page.evaluate(()=>SpatialEditor.tool),'vertex');
  const created=await state();await page.keyboard.press('Control+z');assert.equal((await state()).project,before.project);await page.keyboard.press('Control+Shift+z');assert.equal((await state()).project,created.project);
  // A real vertex gesture edits the created footprint through the existing editor.
  await page.evaluate(()=>{SpatialEditor.select(SpatialEditor.document.objects[0].id,false,true);SpatialEditor.setTool('vertex')});
  const start=await at([700,600]),end=await at([750,650]);await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:8});await page.mouse.up();
  assert.notEqual((await state()).project,created.project);assert(await page.evaluate(()=>StudioModel.validGeometry(SpatialEditor.document)));await page.keyboard.press('Control+z');assert.equal((await state()).project,created.project);
  for(const mode of ['solid','elevation','plan']){await page.locator(`[data-view="${mode}"]`).click();assert(await page.evaluate(()=>SpatialEditor.scene.faces.length>0));if(mode==='solid')await page.screenshot({path:path.join(out,'solid-polygon.png')})}
  checks.push('group entry, concave preview, near-first-point closure, one undo/redo, vertex editing and three views');
  // Closure via Enter and grid snapping retain a non-grid floor elevation.
  await seed(275);await page.locator('#snap').check();await selectTool(page,'polygon');
  for(const p of [[212,218],[718,209],[421,612]])await click(p);await page.keyboard.press('Enter');
  assert.deepEqual(await page.evaluate(()=>{const A=SpatialEditor,M=StudioModel,o=A.document.objects[0];return o.points.map(p=>M.world(A.document,o,[...p,0])).map(p=>p.map(v=>Math.round(v)))}),[[200,200,275],[700,200,275],[400,600,275]]);
  await selectTool(page,'polygon');await page.keyboard.down('Control');for(const p of [[217,217],[517,217],[317,417]])await click(p);await page.keyboard.up('Control');await page.locator('[data-action="finish"]').click();
  assert.equal(await page.evaluate(()=>Math.round(StudioModel.world(SpatialEditor.document,SpatialEditor.document.objects[1],[...SpatialEditor.document.objects[1].points[0],0])[0])),217);
  checks.push('grid, fractional floor elevation, Ctrl bypass and Enter/button closure');
  await seed();await page.locator('#snap').uncheck();await selectTool(page,'polygon');const empty=await state();
  for(const p of [[200,200],[700,600],[200,600],[700,200],[200,200]])await click(p);
  assert.deepEqual(await state(),empty);assert.match(await page.locator('#status').textContent(),/相交/);
  await page.keyboard.press('Backspace');await page.keyboard.press('Delete');await click([200,600]);await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),1);
  for(const cancel of ['Escape','right','view','tool']){
   await page.locator('[data-view="plan"]').click();await selectTool(page,'polygon');const beforeCancel=await state();await click([300,300]);await click([500,300]);
   if(cancel==='Escape')await page.keyboard.press('Escape');else if(cancel==='right'){const q=await at([600,500]);await page.mouse.click(q.x,q.y,{button:'right'})}else if(cancel==='view')await page.locator('[data-view="solid"]').click();else await selectTool(page,'plane');
   assert.equal(await page.evaluate(()=>SpatialEditor.drawing),null);assert.deepEqual(await state(),beforeCancel);
  }
  checks.push('self-intersection rejected, correction with Backspace/Delete, Esc/right-click/view/tool cancellation');
  // Real downloads verify the ordinary plane export path and exclude draft overlays.
  await page.locator('[data-view="plan"]').click();await page.locator('[data-action="export-menu"]').click();
  for(const format of ['svg','png']){await page.locator('#export-format').selectOption(format);if(format==='png')await page.locator('#export-scale').selectOption('1');await page.waitForFunction(format=>SpatialEditor.exportPreview?.ready&&SpatialEditor.exportPreview.format===format&&!document.querySelector('#export-download').disabled,format);const pending=page.waitForEvent('download');await page.locator('#export-download').click();const download=await pending,target=path.join(out,'polygon.'+format);await download.saveAs(target);const data=fs.readFileSync(target);assert(data.length>100);if(format==='svg')assert(!data.toString().includes('data-polygon-preview'));else assert.equal(data.toString('ascii',1,4),'PNG')}
  await page.locator('[data-action="export-close"]').first().click();checks.push('actual PNG/SVG downloads');
  // Narrow touch layout uses the same grouped entry, with no menu clipping.
  await page.setViewportSize({width:390,height:844});await seed();await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.locator('[data-shell-pane="tools"]').click();
  await page.locator('#tool-shapes').click();await page.locator('#tool-shapes-menu').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
  const box=await page.locator('#tool-shapes-menu').boundingBox();assert(box.x>=0&&box.x+box.width<=390);await page.screenshot({path:path.join(out,'menu-mobile-dark.png')});
  await page.locator('[data-tool="polygon"]').click();assert.equal(await page.locator('body').getAttribute('data-pane'),'canvas');
  const camera=await page.evaluate(()=>SpatialEditor.camera),mobile=[[.2,.3],[.8,.3],[.5,.75]].map(([x,y])=>[camera.x+camera.w*x,camera.y+camera.h*y]);
  for(const p of mobile)await click(p);await click(mobile[0]);assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(out,'polygon-mobile-dark.png')});
  checks.push('390px dark menu, canvas return and physical closure');
  const phone=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const touch=await phone.newPage();touch.on('pageerror',e=>errors.push(e.message));await touch.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  await touch.locator('#welcome [data-template="space"]').tap();await touch.evaluate(()=>{SpatialEditor.document.objects=[];SpatialEditor.setTool('select')});await touch.locator('[data-shell-pane="tools"]').tap();await touch.locator('#tool-shapes').tap();await touch.locator('[data-tool="polygon"]').tap();
  const r=await touch.locator('#canvas').boundingBox(),tap=[[.2,.3],[.8,.3],[.5,.75]].map(([x,y])=>[r.x+r.width*x,r.y+r.height*y]);for(const p of [...tap,tap[0]])await touch.touchscreen.tap(...p);
  assert.equal(await touch.evaluate(()=>SpatialEditor.document.objects.length),1);await phone.close();checks.push('touch menu and tap-to-close');
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,network},null,2));console.log('PASS Chrome polygon: '+checks.join('; ')+'. Evidence qa/polygon/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
