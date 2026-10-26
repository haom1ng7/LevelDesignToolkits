// Single-row toolbar: real scrolling, keyboard/touch access and editor state.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
const out=path.join(__dirname,'../qa/single-row-toolbar');
const url=pathToFileURL(path.join(__dirname,'../dist/index.html')).href;
const house=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/two-storey-house.json'),'utf8'));
const suppressPersistence=()=>{Storage.prototype.setItem=function(){};Storage.prototype.removeItem=function(){}};
const withinToolbar=el=>{const a=el.getBoundingClientRect(),b=el.closest('.canvas-top').getBoundingClientRect();return a.left>=b.left-.5&&a.right<=b.right+.5&&a.top>=b.top&&a.bottom<=b.bottom};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light'});
  await context.addInitScript(suppressPersistence);
  const page=await context.newPage(),errors=[],network=[],layouts=[];
  const track=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())})};track(page);
  await page.goto(url);await page.evaluate(p=>SpatialEditor.loadProject(p),house);
  const settle=()=>page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled(document.getAnimations().map(a=>a.finished))});
  assert.equal(await page.locator('[data-shell-options]').count(),0);
  // With spare room, context stays by the views and common actions reach the right edge.
  await page.setViewportSize({width:2560,height:1080});
  for(const mode of ['plan','elevation','solid']){
   await page.locator(`[data-view="${mode}"]`).click();await settle();
   const alignment=await page.evaluate(()=>{const toolbar=document.querySelector('.canvas-top'),s=getComputedStyle(toolbar),box=el=>el.getBoundingClientRect(),r=box(toolbar),views=box(toolbar.querySelector('.segmented')),actions=box(document.querySelector('#canvas-options')),references=box(document.querySelector('#space-options')),elevation=box(document.querySelector('#elevation-tabs'));return {left:r.left+parseFloat(s.paddingLeft),right:r.right-parseFloat(s.paddingRight),views:views.toJSON(),actions:actions.toJSON(),references:references.toJSON(),elevation:elevation.toJSON()}});
   assert(Math.abs(alignment.views.left-alignment.left)<1,'views stay on the left');
   assert(Math.abs(alignment.actions.right-alignment.right)<1,'common toolbar is right aligned');
   if(mode==='elevation'){assert(alignment.elevation.left>=alignment.views.right,'elevation context follows the view switch');assert(alignment.elevation.right<alignment.references.left,'elevation context precedes right aligned common options')}
  }
  for(const [width,height] of [[1920,1080],[1440,1000],[1280,900],[1024,600],[991,740],[990,844],[768,1000],[390,844],[360,800],[844,390]])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   for(const mode of ['plan','elevation','solid']){
    await page.locator(`[data-view="${mode}"]`).click();await settle();
    const layout=await page.evaluate(()=>{
     const toolbar=document.querySelector('.canvas-top'),r=toolbar.getBoundingClientRect(),stage=document.querySelector('#stage').getBoundingClientRect();
     const controls=[...toolbar.querySelectorAll('button,input,select')].filter(el=>el.getClientRects().length).map(el=>{const b=el.getBoundingClientRect();return {id:el.id||el.dataset.action||el.dataset.view||el.dataset.side||el.textContent.trim(),top:b.top,bottom:b.bottom,center:b.top+b.height/2}});
     return {width:innerWidth,height:innerHeight,theme:document.documentElement.dataset.theme,mode:SpatialEditor.view.mode,toolbar:r.toJSON(),stage:stage.toJSON(),controls,scrollWidth:toolbar.scrollWidth,clientWidth:toolbar.clientWidth,pageOverflow:document.documentElement.scrollWidth>innerWidth};
    });
    assert(!layout.pageOverflow,`${width}/${mode} scroll stays inside toolbar`);
    assert(layout.toolbar.height<80,`${width}/${mode} bounded toolbar height`);
    assert(layout.stage.height>100,`${width}/${mode} usable drawing height`);
    assert(layout.controls.every(c=>c.top>=layout.toolbar.top&&c.bottom<=layout.toolbar.bottom),`${width}/${mode} no vertical clipping`);
    assert(Math.max(...layout.controls.map(c=>c.center))-Math.min(...layout.controls.map(c=>c.center))<2,`${width}/${mode} every option shares one row`);
    layouts.push(layout);
    if(mode==='plan'&&(width===1440||width===390)){await page.locator('.canvas-top').evaluate(el=>el.scrollLeft=0);await page.screenshot({path:path.join(out,`after-${width}-${theme}.png`)})}
   }
  }
  await page.setViewportSize({width:1440,height:1000});await page.locator('[data-view="plan"]').click();
  const baselineFile=path.join(out,'before.json');
  let heightGain;
  if(fs.existsSync(baselineFile)){const before=JSON.parse(fs.readFileSync(baselineFile,'utf8'));heightGain=(await page.locator('#stage').boundingBox()).height-before.stage.height;assert(heightGain>30,'removed row becomes drawing space')}
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-action="fit-selected"]').focus();await page.keyboard.press('Tab');
  assert(await page.locator('[data-action="fit"]').evaluate(el=>el===document.activeElement),'Tab reaches final toolbar action');
  assert(await page.locator('[data-action="fit"]').evaluate(withinToolbar),'focus scrolls final action into view');
  await page.keyboard.press('Enter');
  await page.locator('[data-view="elevation"]').click();await page.locator('#height-refs').check();
  assert(await page.locator('#scene [data-height-references]').count());
  const history=await page.evaluate(()=>SpatialEditor.undoCount);
  await page.locator('#height-refs').uncheck();assert.equal(await page.locator('#scene [data-height-references]').count(),0);
  assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),history+1);
  await page.locator('[data-action="undo"]').click();assert(await page.locator('#height-refs').isChecked());
  await page.locator('[data-view="plan"]').click();await page.locator('#stair-arrows').uncheck();
  assert.equal(await page.evaluate(()=>SpatialEditor.document.stairArrows),false);
  await page.locator('[data-action="undo"]').click();assert(await page.locator('#stair-arrows').isChecked());
  const stageBefore=(await page.locator('#stage').boundingBox()).height;
  await page.evaluate(()=>SpatialEditor.setTool('hole'));await page.locator('#creation-shape').focus();await page.keyboard.press('ArrowDown');
  assert.equal(await page.locator('#creation-shape').inputValue(),'ellipse');
  assert(Math.abs((await page.locator('#stage').boundingBox()).height-stageBefore)<1,'creation options consume no extra row');
  assert(await page.locator('#creation-shape').evaluate(withinToolbar));
  await page.locator('.canvas-top').screenshot({path:path.join(out,'creation-options-portrait.png')});
  await page.evaluate(()=>SpatialEditor.createDocument('curve','单行工具栏曲线检查'));assert(!(await page.locator('#space-options').isVisible()));
  await page.locator('[data-action="fit"]').click();
  const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'dark'});
  await touch.addInitScript(suppressPersistence);const phone=await touch.newPage();track(phone);await phone.goto(url);await phone.locator('#welcome [data-template="space"]').tap();
  await phone.locator('.canvas-top').evaluate(el=>el.scrollLeft=el.scrollWidth);
  await phone.locator('[data-action="fit"]').tap();assert(await phone.locator('[data-action="fit"]').evaluate(withinToolbar));
  assert((await phone.locator('#stage').boundingBox()).height>250,'touch drawing space remains usable');
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({layouts,heightGain,checks:['single row in plan/elevation/solid','keyboard Tab and Enter scroll to final action','height/stair toggles and undo','creation shape without extra height','curve hides spatial switches','touch reaches final action'],errors,network},null,2));
  console.log(`PASS single-row toolbar: ${layouts.length} viewport/theme/mode layouts; keyboard, touch, toggles/undo, creation and curve actions; desktop canvas gains ${heightGain?.toFixed(1)??'n/a'}px; no errors or network. Evidence: qa/single-row-toolbar/.`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
