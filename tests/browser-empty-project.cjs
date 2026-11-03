// Real clicks must reach the welcome cards before and after the final drawing is deleted.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 const out=path.join(__dirname,'../qa/empty-project');fs.mkdirSync(out,{recursive:true});
 const errors=[],network=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  await page.evaluate(()=>document.fonts.ready);
  const emptyState=()=>page.evaluate(()=>{
   const canvas=document.querySelector('#canvas'),welcome=document.querySelector('#welcome');
   return {count:SpatialEditor.project.documents.length,canvasDisplay:getComputedStyle(canvas).display,welcomeVisible:!welcome.hidden,cards:[...welcome.querySelectorAll('[data-template]')].map(b=>{const r=b.getBoundingClientRect();return {type:b.dataset.template,hit:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})};
  });
  const assertEmpty=async()=>{
   const state=await emptyState();assert.equal(state.count,0);assert.equal(state.canvasDisplay,'none');assert(state.welcomeVisible);assert(state.cards.every(b=>b.hit),'both welcome cards receive pointer input');
   assert.equal(await page.locator('#scene,#handles').evaluateAll(els=>els.reduce((n,el)=>n+el.childElementCount,0)),0);
   assert.equal(await page.locator('#drawing-hint').isVisible(),false);assert.equal(await page.locator('#view-controls').isVisible(),false);
   assert.equal(await page.locator('#solid-webgl').isVisible(),false);
  };
  // Collect both original symptoms before asserting, so a failure retains useful evidence.
  const initial=await emptyState();
  await page.locator('[data-action="new"]').click();await page.locator('#new-dialog [data-template="space"]').click();
  await page.locator('[data-action="delete-document"]').click();
  const deleted=await emptyState();
  fs.writeFileSync(path.join(out,'startup-and-delete.json'),JSON.stringify({initial,deleted},null,2));
  await page.screenshot({path:path.join(out,'after-delete.png'),animations:'disabled'});
  assert.equal(initial.canvasDisplay,'none','the initial SVG must not cover the welcome cards');await assertEmpty();
  checks.push('Fresh startup and deleting the final space drawing leave both welcome cards clickable');
  const layouts=[];
  for(const width of [1440,390])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:width===390?844:1000});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   if(width===390)await page.locator('[data-shell-pane="canvas"]').click();
   await assertEmpty();
   for(const [type,mode]of [['space','plan'],['space','elevation'],['space','solid'],['curve','plan']]){
    await page.locator(`#welcome [data-template="${type}"]`).click();
    assert.equal(await page.evaluate(()=>SpatialEditor.document.type),type);
    assert(await page.locator('#canvas').isVisible());assert.equal(await page.locator('#welcome').isVisible(),false);
    if(mode!=='plan')await page.locator(`[data-view="${mode}"]`).click();
    if(mode==='solid')assert.equal(await page.evaluate(()=>SpatialEditor.viewportStats?.backend),'webgl');
    // Pending route drawing and a selected component must not leave a HUD or handles at home.
    await page.evaluate(()=>{const A=SpatialEditor;if(A.document.objects.length)A.select(A.document.objects[0].id,false,true);A.setTool('route')});
    const before=await page.evaluate(()=>({project:JSON.stringify(SpatialEditor.project),undo:SpatialEditor.undoCount}));
    if(width===390)await page.locator('[data-shell-pane="tools"]').click();
    await page.locator('[data-action="delete-document"]').click();
    assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),before.undo+1);
    if(width===390)await page.locator('[data-shell-pane="canvas"]').click();
    await assertEmpty();
    await page.locator('[data-action="undo"]').click();
    assert.equal(await page.evaluate(()=>JSON.stringify(SpatialEditor.project)),before.project,'one undo restores the deleted drawing');
    assert(await page.locator('#canvas').isVisible());
    await page.locator('[data-action="redo"]').click();await assertEmpty();
    layouts.push({width,theme,type,mode});
   }
   await page.screenshot({path:path.join(out,`${width}-${theme}.png`),animations:'disabled'});
  }
  checks.push('Real welcome-card creation and final deletion in plan/elevation/WebGL/curve, one undo/redo, route HUD cleanup, desktop/narrow and both themes');
  // Delete a mixed project, then reload the empty autosave and re-enter through each card.
  await page.evaluate(()=>{SpatialEditor.createDocument('space','空间');SpatialEditor.createDocument('curve','曲线')});
  await page.locator('[data-shell-pane="tools"]').click();
  await page.locator('[data-action="delete-document"]').click();assert.equal(await page.evaluate(()=>SpatialEditor.document.type),'space');
  await page.locator('[data-action="delete-document"]').click();
  await page.waitForFunction(()=>{const saved=localStorage.getItem('spatial-studio-v9:'+location.pathname);return saved&&JSON.parse(saved).documents.length===0});
  await page.reload();await assertEmpty();
  for(const type of ['space','curve']){
   await page.locator(`#welcome [data-template="${type}"]`).click();assert.equal(await page.evaluate(()=>SpatialEditor.document.type),type);
   await page.locator('[data-shell-pane="tools"]').click();await page.locator('[data-action="delete-document"]').click();await page.locator('[data-shell-pane="canvas"]').click();await assertEmpty();
  }
  checks.push('Deleting every drawing in a mixed project, empty autosave reload, and creating again from either welcome card');
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,layouts,errors,network},null,2));
  console.log('PASS Chrome empty project: welcome clicks, all drawings deleted, three space views/curve, GPU and HUD cleanup, undo/redo, autosave reload, desktop/narrow and light/dark. Evidence: qa/empty-project/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
