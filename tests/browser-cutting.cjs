const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const out=path.join(__dirname,'../qa/cutting');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],network=[],frames=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const state=()=>page.evaluate(()=>JSON.stringify(SpatialEditor.document.objects));
  const at=async p=>page.evaluate(p=>{const q=new DOMPoint(...p).matrixTransform(document.querySelector('#canvas').getScreenCTM());return {x:q.x,y:q.y}},p);
  const click=async p=>{const q=await at(p);await page.mouse.click(q.x,q.y)};
  const record=async()=>{if(process.argv.includes('--record-help')){const p=path.join(out,'help-'+frames.length+'.png');await page.screenshot({path:p});frames.push(p)}};
  const seed=async(extra={})=>page.evaluate(extra=>{const M=StudioModel,d=M.createDocument('space','切割工具验证');d.objects=[];const o=Object.assign(M.createObject(d,'plane',[200,150,0]),{points:[[0,0],[600,0],[600,500],[0,500]]},extra);d.objects.push(o);SpatialEditor.loadProject({format:'level-spatial-editor',version:7,documents:[d],activeDocument:d.id});SpatialEditor.select(o.id,false,true);return o.id},extra);
  let id=await seed();await page.locator('#snap').uncheck();await record();await page.locator('[data-tool="cut"]').click();await record();
  assert((await page.locator('#canvas').evaluate(el=>getComputedStyle(el).cursor)).includes('data:image/svg+xml'));assert.equal(await page.locator('[data-tool="hole"]').count(),0);
  let before=await state(),history=await page.evaluate(()=>SpatialEditor.undoCount);
  for(const p of [[350,300],[650,300],[650,500],[350,500]]){await click(p);await record()}
  assert.equal(await state(),before);await page.screenshot({path:path.join(out,'closed-seam-preview.png')});assert.equal(await page.locator('[data-cut-preview]').count(),1);
  // Closing within a few screen pixels snaps to the first vertex.
  let first=await at([350,300]);await page.mouse.click(first.x+2,first.y+2);await record();
  assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),2);assert.equal(await page.locator('[data-layer]').count(),2);assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),history+1);
  const cut=await state();await page.keyboard.press('Control+z');assert.equal(await state(),before);await page.keyboard.press('Control+Shift+z');assert.equal(await state(),cut);
  // A physical selection and drag moves the cut-out independently and exposes its void.
  const inner=await page.evaluate(()=>SpatialEditor.document.objects.find(o=>!o.cutouts).id);await page.locator(`[data-layer="${inner}"]`).click();assert.equal(await page.evaluate(()=>SpatialEditor.selection.ids.length),1);
  const start=await at([500,400]),end=await at([950,400]);await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:10});await page.mouse.up();await record();await record();await record();
  const actual=await page.evaluate(()=>{const M=StudioModel,A=SpatialEditor,o=A.document.objects.find(o=>o.cutouts);return {valid:M.validGeometry(A.document),hit:StudioRender.pickAll([500,400],A.scene,A.document,A.view).map(h=>h.id),outer:o.id}});assert(actual.valid);assert(!actual.hit.includes(actual.outer));await page.screenshot({path:path.join(out,'closed-cut-independent.png')});
  // PNG and SVG downloads must contain material openings and no editing overlay.
  await page.locator('[data-action="export-menu"]').click();
  for(const format of ['svg','png','obj','fbx']){await page.locator('#export-format').selectOption(format);if(format==='png')await page.locator('#export-scale').selectOption('1');await page.waitForFunction(format=>SpatialEditor.exportPreview?.ready&&SpatialEditor.exportPreview.format===format&&!document.querySelector('#export-download').disabled,format);const pending=page.waitForEvent('download');await page.locator('#export-download').click();const download=await pending,target=path.join(out,'cut-components.'+format);await download.saveAs(target);const data=fs.readFileSync(target);assert(data.length>100);if(format==='svg'){assert(data.toString().includes('<svg'));assert(!data.toString().includes('data-cut-preview'))}if(format==='png')assert.equal(data.toString('ascii',1,4),'PNG')}
  await page.locator('[data-action="export-close"]').first().click();
  // The final segment cuts both arms of a concave profile, yielding three objects.
  await seed({points:[[0,0],[600,0],[600,500],[450,500],[450,150],[150,150],[150,500],[0,500]]});await page.locator('[data-tool="cut"]').click();await click([200,450]);await click([800,450]);assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),3);assert(await page.evaluate(()=>StudioModel.validGeometry(SpatialEditor.document)));await page.screenshot({path:path.join(out,'three-parts.png')});
  // Right click, keyboard cancellation and a view change preserve history and source.
  id=await seed();before=await state();history=await page.evaluate(()=>SpatialEditor.undoCount);await page.locator('[data-tool="cut"]').click();await click([400,350]);await page.keyboard.press('Backspace');assert.equal(await page.evaluate(()=>SpatialEditor.drawing.points.length),0);await click([400,350]);await page.keyboard.press('Escape');assert.equal(await state(),before);assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),history);
  await page.keyboard.press('o');await click([400,350]);let q=await at([600,400]);await page.mouse.click(q.x,q.y,{button:'right'});assert.equal(await page.evaluate(()=>SpatialEditor.tool),'select');assert.equal(await page.evaluate(()=>SpatialEditor.selection.id),id);
  await page.keyboard.press('o');await click([400,350]);await page.locator('[data-view="solid"]').click();assert.equal(await page.evaluate(()=>SpatialEditor.drawing),null);assert.equal(await state(),before);
  // Walls can be cut on their actual elevation profile with physical clicks.
  await page.evaluate(()=>{const A=SpatialEditor,M=StudioModel;A.document.objects=[];const o=M.createObject(A.document,'wall',[500,350,0]);o.points=[[-250,0],[250,0],[250,400],[-250,400]];A.document.objects.push(o);A.select(o.id,false,true)});await page.locator('[data-view="elevation"]').click();await page.locator('[data-tool="cut"]').click();for(const p of [[-250,200],[250,200]]){const screen=await page.evaluate(p=>{const A=SpatialEditor,o=A.document.objects[0];return StudioModel.project(StudioModel.world(A.document,o,[p[0],-o.thickness/2,p[1]]),A.scene.basis)},p);await click(screen)}assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),2);
  // On a narrow screen selecting the tool returns to the canvas and stays usable.
  await page.setViewportSize({width:390,height:844});await seed();await page.locator('[data-shell-pane="tools"]').click();await page.locator('[data-tool="cut"]').click();assert.equal(await page.evaluate(()=>document.body.dataset.pane),'canvas');assert.equal(await page.locator('[data-cut-preview]').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(out,'mobile-cut.png')});
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks:['real scissors cursor','closed seam and first-point snap','physical independent move and empty opening','atomic undo/redo','PNG/SVG/OBJ/FBX downloads','three-way concave cut','Backspace/Esc/right-click/view cancel','wall elevation','390px tool access'],errors,network,frames},null,2));console.log('PASS Chrome cutting: physical clicks/closure/move, three parts, wall elevation, cursor/history/cancel/mobile; actual PNG/SVG/OBJ/FBX downloads. Evidence qa/cutting/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
