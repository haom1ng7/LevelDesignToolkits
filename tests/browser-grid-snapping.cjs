const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),out=path.join(__dirname,'../qa/grid-snapping'),errors=[],network=[];fs.mkdirSync(out,{recursive:true});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  await page.evaluate(()=>{SpatialEditor.createDocument('space','100 UU 网格搭建');SpatialEditor.document.objects=[];SpatialEditor.setTool('select')});
  await page.locator('[data-panel="document"]').click();assert.equal(await page.locator('#doc-gridSize').inputValue(),'100');
  await page.locator('#doc-gridSize').fill('50');await page.locator('#doc-gridSize').press('Tab');assert.equal(await page.evaluate(()=>SpatialEditor.document.gridSize),50);
  await page.locator('#doc-gridSize').fill('100');await page.locator('#doc-gridSize').press('Tab');
  await page.locator('#snap').check();await page.locator('#show-grid').check();
  const at=async p=>page.evaluate(p=>{const q=new DOMPoint(...p).matrixTransform(document.querySelector('#canvas').getScreenCTM());return {x:q.x,y:q.y}},p);
  const drag=async(p,q)=>{await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(q.x,q.y,{steps:10});await page.mouse.up()};
  const state=()=>page.evaluate(()=>JSON.stringify(SpatialEditor.document.objects));
  const bounds=()=>page.evaluate(()=>{const A=SpatialEditor,M=StudioModel,o=A.document.objects.find(o=>o.id===A.selection.id),ps=M.geometry(A.document,o).flatMap(f=>f.points);return {id:o.id,min:[0,1,2].map(i=>Math.min(...ps.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...ps.map(p=>p[i])))}});
  const whole=n=>assert(Math.abs(n/100-Math.round(n/100))<1e-5,`${n} is on 100 UU grid`);
  await page.locator('[data-tool="plane"]').click();await drag(await at([123,167]),await at([586,428]));let b=await bounds();[...b.min,...b.max].forEach(whole);assert.equal(b.max[0]-b.min[0],500);assert.equal(b.max[1]-b.min[1],200);const planeId=b.id;
  // Physical wheel zoom changes pixel spacing while every line remains on 100 UU.
  const checkGrid=()=>page.locator('[data-viewport-grid] path').evaluateAll(nodes=>nodes.every(el=>{const n=el.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number),v=Math.abs(n[0]-n[2])<1e-6?n[0]:n[1];return Math.abs(v/100-Math.round(v/100))<1e-5}));
  assert(await checkGrid());await page.mouse.move((await at([400,300])).x,(await at([400,300])).y);await page.mouse.wheel(0,-500);assert(await checkGrid());
  await page.locator('[data-action="fit"]').click();await page.keyboard.press('Escape');await page.locator(`[data-layer="${planeId}"]`).click();
  let before=await state(),start=await at([350,300]),end=await at([487,353]);await drag(start,end);b=await bounds();b.min.slice(0,2).forEach(whole);assert.notEqual(await state(),before);await page.keyboard.press('Control+z');assert.equal(await state(),before);await page.keyboard.press('Control+Shift+z');await page.locator('[data-panel="properties"]').click();await page.locator(`[data-layer="${planeId}"]`).click();
  // A real 2D edge hit quantizes the dimension, with both snap modes enabled.
  await page.locator('[data-tool="size"]').click();let edge=page.locator('[data-size-edge="1"]').last();start=await edge.evaluate(el=>{const q=el.getPointAtLength(el.getTotalLength()*.5).matrixTransform(el.getScreenCTM());return {x:q.x,y:q.y}});await drag(start,{x:start.x+67,y:start.y});b=await bounds();whole(b.max[0]-b.min[0]);
  // Place stairs with a visible ghost, then inspect and resize from the solid view.
  await page.locator('[data-tool="stairs"]').click();start=await at([750,550]);await page.mouse.move(start.x,start.y);assert.equal(await page.locator('[data-placement-ghost]').count(),1);await page.mouse.click(start.x,start.y);const stairId=await page.evaluate(()=>SpatialEditor.selection.id);assert(await page.evaluate(()=>{const o=SpatialEditor.document.objects.find(o=>o.id===SpatialEditor.selection.id),p=o.flights[0].points;return Math.abs((p[1][0]-p[0][0])/100-Math.round((p[1][0]-p[0][0])/100))<1e-5}));
  await page.locator('[data-view="solid"]').click();await page.locator(`[data-layer="${planeId}"]`).click();await page.locator('[data-action="fit-selected"]').click();await page.keyboard.press('w');
  let handle=page.locator('[data-world-handle="0"] .gizmo-axis');start=await handle.evaluate(el=>{const q=el.getPointAtLength(el.getTotalLength()*.7).matrixTransform(el.getScreenCTM());return {x:q.x,y:q.y}});await drag(start,{x:start.x+70,y:start.y});b=await bounds();whole(b.min[0]);
  await page.keyboard.press('r');handle=page.locator('[data-solid-size-axis="0"] .gizmo-size-hit');start=await handle.evaluate(el=>{const q=el.getPointAtLength(el.getTotalLength()*.72).matrixTransform(el.getScreenCTM());return {x:q.x,y:q.y}});before=await state();await drag(start,{x:start.x+67,y:start.y});b=await bounds();whole(b.max[0]-b.min[0]);assert.notEqual(await state(),before);
  before=await state();start=await handle.evaluate(el=>{const q=el.getPointAtLength(el.getTotalLength()*.72).matrixTransform(el.getScreenCTM());return {x:q.x,y:q.y}});await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(start.x+40,start.y+10);await page.keyboard.press('Escape');await page.mouse.up();assert.equal(await state(),before);
  await page.locator('[data-view="plan"]').click();await page.locator('[data-action="fit"]').click();await page.locator('[data-panel="document"]').click();await page.screenshot({path:path.join(out,'grid-100-uu.png')});
  const saved=await page.evaluate(()=>JSON.stringify(SpatialEditor.project));await page.evaluate(s=>SpatialEditor.loadProject(JSON.parse(s)),saved);assert.equal(await page.evaluate(()=>SpatialEditor.document.gridSize),100);assert.equal(await page.evaluate(()=>StudioModel.validGeometry(SpatialEditor.document)),true);
  await page.setViewportSize({width:390,height:844});await page.locator('[data-shell-pane="properties"]').click();await page.locator('[data-panel="document"]').click();await page.locator('#doc-gridSize').scrollIntoViewIfNeeded();assert(await page.locator('#doc-gridSize').isVisible());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(out,'grid-settings-mobile.png')});
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks:['settings 50/100 UU','real grid rectangle','physical zoom preserves world spacing','real drag and undo/redo','real 2D size edge','stairs ghost and placement','3D world X move and size/Esc','JSON round trip','390px settings'],planeId,stairId,errors,network},null,2));
  console.log('PASS Chrome grid: real settings, rectangle/ghost placement, zoom, 2D/3D move and size, history/cancel, JSON and narrow settings. Evidence qa/grid-snapping/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
