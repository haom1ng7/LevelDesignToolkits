const {openToolMenu,selectTool}=require('./tool-menu.cjs');
// State-driven composition, short screens, real edits and representative artwork.
// A fresh browser context suppresses every project save write and deletion.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
const out=path.join(__dirname,'../qa/endfield-ui');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light'});
  await context.addInitScript(()=>{
   const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
   const projectKey=k=>/^(spatial-studio-v9:|level-diagram-studio-desktop-v1)/.test(k);
   Storage.prototype.setItem=function(k,v){if(!projectKey(k))return set.call(this,k,v)};
   Storage.prototype.removeItem=function(k){if(!projectKey(k))return remove.call(this,k)};
  });
  const page=await context.newPage(),errors=[],network=[],layouts=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const settle=()=>page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled(document.getAnimations().map(a=>a.finished))});
  const capture=async name=>{await settle();await page.screenshot({path:path.join(out,name+'.png')})};
  for(const {width,height} of [{width:1920,height:1080},{width:1440,height:900},{width:1280,height:720},{width:1024,height:600},{width:844,height:390},{width:390,height:844},{width:360,height:800}]){
   await page.setViewportSize({width,height});await settle();
   const layout=await page.evaluate(()=>{
    const r=document.querySelector('#stage').getBoundingClientRect(),welcome=document.querySelector('#welcome'),workspace=document.querySelector('.workspace').getBoundingClientRect(),workbench=document.querySelector('.workbench').getBoundingClientRect(),bottom=innerWidth>990?innerHeight:document.querySelector('.mobile-panes').getBoundingClientRect().top;
    return {width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,workspace:{left:workspace.left,right:workspace.right,bottom:workbench.bottom,expectedBottom:bottom},stageHeight:r.height,scrollable:welcome.scrollHeight>welcome.clientHeight,cards:[...welcome.querySelectorAll('[data-template]')].map(el=>{const b=el.getBoundingClientRect();return {width:b.width,inside:b.left>=r.left&&b.right<=r.right+.5&&b.bottom<=r.bottom+.5}})};
   });
   assert(!layout.overflow,`${width} horizontal overflow`);assert(layout.stageHeight>150,`${width} usable stage`);assert(layout.cards.every(r=>r.width>120));
   assert(Math.abs(layout.workspace.left)<.5&&Math.abs(layout.workspace.right-width)<.5,`${width} workspace uses the removed rail's width`);
   assert(Math.abs(layout.workspace.bottom-layout.workspace.expectedBottom)<.5,`${width} workspace uses the removed status row's height`);
   if(width===390)assert(layout.cards.every(r=>r.inside),'both entry actions visible at 390×844');
   assert(layout.cards.every(r=>r.inside)||layout.scrollable,'entry actions remain reachable');layouts.push(layout);
   await capture(`entry-${width}x${height}`);
  }
  await page.setViewportSize({width:1440,height:1000});await page.locator('#welcome [data-template="space"]').click();
  await selectTool(page,'plane');await page.locator('#snap').uncheck();
  const stage=await page.locator('#stage').boundingBox(),before=await page.evaluate(()=>({count:SpatialEditor.document.objects.length,history:SpatialEditor.undoCount}));
  await page.mouse.move(stage.x+stage.width*.12,stage.y+stage.height*.18);await page.mouse.down();
  await page.mouse.move(stage.x+stage.width*.36,stage.y+stage.height*.4,{steps:8});await page.mouse.up();
  assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),before.count+1);assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),before.history+1);
  await page.locator('[data-action="undo"]').click();assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),before.count);
  await page.locator('[data-action="redo"]').click();assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),before.count+1);
  await page.locator('[data-tool="select"]').click();
  const house=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/two-storey-house.json'),'utf8'));
  await page.evaluate(p=>SpatialEditor.loadProject(p),house);
  for(const theme of ['light','dark']){
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   for(const mode of ['plan','elevation','solid']){
    await page.locator(`[data-view="${mode}"]`).click();await page.locator('[data-action="fit"]').click();
    assert.equal(await page.locator('body').getAttribute('data-workspace-mode'),mode);await capture(`house-${mode}-${theme}`);
   }
  }
  await page.locator('[data-view="plan"]').click();
  await page.evaluate(()=>{const A=SpatialEditor;A.select(A.document.objects.find(o=>o.type==='plane'&&o.floor===A.document.activeFloor).id,false,true)});
  assert.equal(await page.locator('body').getAttribute('data-has-selection'),'true');
  await page.locator('#prop-name').fill('入口平台');await page.locator('#prop-name').press('Tab');
  assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.find(o=>o.id===SpatialEditor.selection.id).name),'入口平台');
  assert.equal(await page.locator('.workbench-rail,.workbench-status,[data-shell-section]').count(),0);
  assert(!(await page.locator('#status').isVisible()),'editing updates remain internal after removing the status row');
  await page.setViewportSize({width:1024,height:600});
  assert.equal(await page.locator('[data-shell-options]').count(),0);assert(await page.locator('#canvas-options').isVisible());
  assert((await page.locator('#stage').boundingBox()).height>250);
  await page.locator('[data-action="fit"]').focus();
  assert(await page.locator('[data-action="fit"]').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.closest('.canvas-top').getBoundingClientRect();return a.left>=b.left&&a.right<=b.right}),'compact toolbar scrolls to focused actions');
  await capture('compact-desktop-edit');
  await page.setViewportSize({width:390,height:844});await page.locator('[data-shell-pane="properties"]').click();
  await page.locator('.skip-workspace').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('body').getAttribute('data-pane'),'canvas');
  assert(await page.locator('#workspace-canvas').evaluate(el=>el===document.activeElement&&!el.inert),'skip link restores the active canvas pane and focus');
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:1000});
  await page.locator('[data-view="solid"]').click();
  assert.equal(await page.evaluate(()=>document.getAnimations().length),0,'reduced motion disables scripted and CSS transitions');
  await capture('house-solid-reduced-motion');
  await page.locator('[data-action="help"]').click();await capture('help-desktop');await page.locator('[data-action="close-help"]').click();
  const svg=await page.evaluate(()=>SpatialEditor.renderSVG());assert(!/stage-frame|shell-view|workbench/.test(svg),'shell instruments stay out of artwork');
  assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>/^(spatial-studio-v9:|level-diagram-studio-desktop-v1)/.test(k)).length),0);
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
  fs.writeFileSync(path.join(out,'workbench-report.json'),JSON.stringify({layouts,checks:['full workspace width and height without navigation rail or status row','real pointer create, single undo/redo','two-storey house in three views and both themes','real property name input','hidden internal status updates','compact desktop options','reduced motion parity','offline help','export shell exclusion','suppressed QA persistence'],errors,network},null,2));
  console.log('PASS Endfield workbench: 7 desktop/portrait/short-wide layouts; full workspace width and height without navigation rail or status row; both entry actions visible at 390×844; real pointer creation and undo/redo; house three views/light/dark; property edit; compact options; reduced motion; no shell in exports, page errors or network. Evidence: qa/endfield-ui/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
