// Real-browser UI acceptance. Run after npm run build; uses Chrome or STUDIO_BROWSER.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright-core');
const out=path.join(__dirname,'../qa/endfield-ui');
const url=pathToFileURL(path.join(__dirname,'../dist/index.html')).href;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 const errors=[],network=[];
 const track=page=>{page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})};
 const bounds=async(page,label)=>{
  const result=await page.evaluate(()=>{
   const clipped=[...document.querySelectorAll('button,select,input,textarea')].filter(el=>!el.closest('#canvas,[inert]')).filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&r.bottom>0&&r.top<innerHeight}).filter(el=>{const r=el.getBoundingClientRect();return r.left<-.5||r.right>innerWidth+.5}).map(el=>el.id||el.textContent.trim().slice(0,20));
   return {overflow:document.documentElement.scrollWidth>innerWidth,clipped};
  });assert.equal(result.overflow,false,label+' has no horizontal page scroll');assert.deepEqual(result.clipped,[],label+' controls fit the viewport');
 };
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light'});
  const page=await context.newPage();track(page);await page.goto(url);await page.evaluate(()=>document.fonts.ready);
  assert(await page.evaluate(()=>document.fonts.check('600 14px Saira')),'embedded Saira loads under CSP');
  assert.equal(await page.locator('#document-count').textContent(),'0','formal seed stays empty');
  await page.screenshot({path:path.join(out,'welcome-light.png')});
  for(const theme of ['light','dark']){
   await page.emulateMedia({colorScheme:theme});
   for(const width of [360,390,430,768,990,991,1024,1440]){
    await page.setViewportSize({width,height:width<600?844:1000});await bounds(page,theme+' welcome '+width);
    if(width===390||width===1440)await page.screenshot({path:path.join(out,`welcome-${theme}-${width}.png`)});
    if(width<=990){
     for(const pane of ['tools','properties','canvas']){await page.locator(`[data-shell-pane="${pane}"]`).click();await bounds(page,theme+' '+pane+' '+width)}
    }
   }
  }
  await page.emulateMedia({colorScheme:'light'});await page.setViewportSize({width:1440,height:1000});
  await page.locator('#welcome [data-template="space"]').click();
  assert.equal(await page.locator('[data-view="plan"]').getAttribute('aria-pressed'),'true');
  const state=await page.evaluate(()=>({json:JSON.stringify(SpatialEditor.project),undo:SpatialEditor.undoCount,background:SpatialEditor.document.background}));
  await page.locator('#theme-toggle').click();assert.equal(await page.locator('#theme-toggle').getAttribute('aria-pressed'),'true');
  assert.deepEqual(await page.evaluate(()=>({json:JSON.stringify(SpatialEditor.project),undo:SpatialEditor.undoCount,background:SpatialEditor.document.background})),state,'theme never edits artwork/history');
  await page.reload();assert.equal(await page.locator('#theme-toggle').getAttribute('aria-pressed'),'true','theme persists on reload');
  // Autostorage is delayed; create a fresh drawing through the UI if reload preceded it.
  if(await page.locator('#welcome').isVisible())await page.locator('#welcome [data-template="space"]').click();
  await page.locator('[data-view="solid"]').click();await page.screenshot({path:path.join(out,'space-dark.png')});
  await page.locator('#theme-toggle').click();await page.locator('[data-view="plan"]').click();
  for(const width of [360,430,768,1024,1440]){await page.setViewportSize({width,height:1000});await bounds(page,'space '+width)}
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-shell-pane="tools"]').click();
  await page.locator('[data-tool="plane"]').click();
  assert.equal(await page.locator('[data-shell-pane="canvas"]').getAttribute('aria-pressed'),'true','choosing a tool returns to canvas');
  assert(await page.locator('#workspace-tools').evaluate(el=>el.inert),'hidden pane cannot capture keyboard focus');
  const before=await page.evaluate(()=>({count:SpatialEditor.document.objects.length,undo:SpatialEditor.undoCount}));
  const rect=await page.locator('#stage').boundingBox();assert(rect.width>300&&rect.height>100,'narrow canvas remains usable');
  await page.mouse.move(rect.x+50,rect.y+50);await page.mouse.down();await page.mouse.move(rect.x+150,rect.y+110);await page.mouse.up();
  assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),before.count+1,'draw rectangle in narrow canvas');
  assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),before.undo+1);
  await page.locator('[data-action="undo"]').click();assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),before.count,'one-step undo');
  const editUndo=await page.evaluate(()=>{const A=SpatialEditor;A.beginEditing(A.document.objects.find(o=>o.type==='text'));return A.undoCount});await page.locator('#inline-editor').fill('入口文字');
  await page.locator('[data-shell-pane="properties"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#inline-editor').isVisible(),false,'keyboard panel switch commits inline editing');assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),editUndo+1);await page.locator('[data-shell-pane="canvas"]').click();
  await page.screenshot({path:path.join(out,'space-mobile.png')});
  // Guide and export settings remain reachable at phone sizes.
  await page.locator('[data-action="help"]').click();await bounds(page,'mobile guide');await page.screenshot({path:path.join(out,'help-mobile.png')});await page.locator('[data-action="close-help"]').click();
  await page.locator('[data-action="export-menu"]').click();await page.locator('#export-format').selectOption('svg');
  await page.locator('#export-download').waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('#export-download').disabled);
  await bounds(page,'mobile export');await page.screenshot({path:path.join(out,'export-mobile.png')});
  const download=page.waitForEvent('download');await page.locator('#export-download').click();const file=await download;const target=path.join(out,'drawing.svg');await file.saveAs(target);
  const svg=fs.readFileSync(target,'utf8');assert(svg.includes('<svg'));assert(!svg.includes('world-gizmo'));assert(!svg.includes('Saira'));assert(!svg.includes('data-shell-pane'));
  await page.locator('#export-format').selectOption('png');await page.locator('#export-scale').selectOption('1');
  await page.waitForFunction(()=>!document.querySelector('#export-download').disabled&&document.querySelector('#export-ready').textContent.includes('PNG'));
  const expected=await page.evaluate(()=>({width:SpatialEditor.exportPreview.width,height:SpatialEditor.exportPreview.height}));
  const pngDownload=page.waitForEvent('download');await page.locator('#export-download').click();const pngFile=await pngDownload;const pngPath=path.join(out,'drawing.png');await pngFile.saveAs(pngPath);const png=fs.readFileSync(pngPath);assert.equal(png.toString('ascii',1,4),'PNG');assert.equal(png.readUInt32BE(16),expected.width);assert.equal(png.readUInt32BE(20),expected.height);
  await page.locator('[data-action="export-close"]').first().click();
  await page.setViewportSize({width:1440,height:1000});assert.equal(await page.locator('#workspace-tools').evaluate(el=>el.inert),false,'desktop sidebars regain focus');
  await page.locator('[data-action="new"]').click();await page.locator('#new-name').fill('关卡体验曲线');await page.locator('#new-dialog [data-template="curve"]').click();
  await page.locator('#theme-toggle').click();await page.waitForTimeout(220);await page.screenshot({path:path.join(out,'curve-dark.png')});
  await page.locator('#theme-toggle').click();await page.waitForTimeout(220);await page.screenshot({path:path.join(out,'curve-light.png')});await bounds(page,'desktop curve');
  for(const width of [360,430,768,1024,1440]){await page.setViewportSize({width,height:1000});await bounds(page,'curve '+width)}
  assert.equal(await page.locator('#workspace-count').textContent(),String(await page.evaluate(()=>SpatialEditor.document.curve.events.length)),'readout uses real event count');
  const house=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/two-storey-house.json'),'utf8'));await page.evaluate(p=>SpatialEditor.loadProject(p),house);await page.locator('[data-view="solid"]').click();await page.waitForTimeout(220);await page.screenshot({path:path.join(out,'workspace-light.png')});
  await page.locator('#theme-toggle').click();await page.waitForTimeout(220);await page.screenshot({path:path.join(out,'workspace-dark.png')});
  await page.emulateMedia({reducedMotion:'reduce'});
  assert(await page.locator('[data-tool="select"]').evaluate(el=>getComputedStyle(el).transitionDuration==='0s'),'reduced motion disables transitions');
  await page.locator('[data-action="export-menu"]').focus();await page.keyboard.press('Tab');assert(await page.locator('#theme-toggle').evaluate(el=>el===document.activeElement&&getComputedStyle(el).outlineStyle==='solid'),'visible keyboard focus');
  await context.close();
  // Touch targets / dark system preference / three mobile widths.
  const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'dark'}),phone=await touch.newPage();track(phone);await phone.goto(url);
  for(const width of [360,390,430]){
   await phone.setViewportSize({width,height:844});await bounds(phone,'touch '+width);
   const targets=await phone.locator('.command-bar button,.mobile-panes button').evaluateAll(els=>els.map(el=>({label:el.textContent.trim(),height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width})));assert(targets.every(t=>t.height>=44&&t.width>=44),JSON.stringify(targets));
  }
  await phone.screenshot({path:path.join(out,'touch-dark.png')});
  await phone.setViewportSize({width:390,height:844});await phone.locator('#welcome [data-template="space"]').tap();
  let stage=await phone.locator('#stage').boundingBox();assert(stage.height>250,'touch canvas gets enough drawing space');
  await phone.locator('[data-shell-options]').tap();assert(await phone.locator('#move-snap').isVisible(),'touch editing options expand');await bounds(phone,'touch options');await phone.locator('[data-shell-options]').tap();assert.equal(await phone.locator('#move-snap').isVisible(),false);
  await phone.locator('[data-shell-pane="tools"]').tap();await phone.locator('[data-tool="plane"]').tap();stage=await phone.locator('#stage').boundingBox();assert(stage.height>200,'touch creation controls preserve drawing space');
  await phone.waitForTimeout(220);await phone.screenshot({path:path.join(out,'touch-space.png')});
  await phone.setViewportSize({width:844,height:390});await bounds(phone,'touch landscape');stage=await phone.locator('#stage').boundingBox();assert(stage.height>100,'landscape preserves drawing space');await phone.screenshot({path:path.join(out,'touch-landscape.png')});await touch.close();
  assert.deepEqual(network,[],'no online resources');assert.deepEqual(errors,[],'no browser or CSP errors');
  console.log('PASS UI Chrome: light/dark at 360/390/430/768/1024/1440; theme persistence and project isolation; embedded font/offline CSP; responsive panes/focus; narrow rectangle/undo; guide, SVG/PNG downloads and PNG dimensions; curve/house; reduced motion; touch targets/options/canvas. Evidence: qa/endfield-ui/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
