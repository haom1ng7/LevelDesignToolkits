// Creating a selected component must reveal its properties, even from document settings.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
const {selectTool}=require('./tool-menu.cjs');
(async()=>{
 const out=path.join(__dirname,'../qa/creation-inspector');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'}),errors=[],network=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);await page.evaluate(()=>document.fonts.ready);
  const narrow=()=>page.viewportSize().width<=990;
  const panel=async name=>{
   if(narrow())await page.locator('[data-shell-pane="properties"]').click();
   await page.locator(`[data-panel="${name}"]`).click();
   if(narrow()){await page.locator('[data-shell-pane="canvas"]').click();await page.evaluate(()=>new Promise(requestAnimationFrame))}
  };
  const assertPanel=async name=>{
   assert.equal(await page.locator('body').getAttribute('data-inspector'),name,'inspector follows selection');
   assert.equal(await page.locator(`[data-panel="${name}"]`).getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('#properties').evaluate(el=>el.hidden),name!=='properties');
   assert.equal(await page.locator('#document-properties').evaluate(el=>el.hidden),name!=='document');
  };
  const setup=async(type='space',mode='plan',host=null)=>page.evaluate(({type,mode,host})=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument(type,'放置后组件属性');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];
   if(host){const o=M.createObject(A.document,host,[600,400,0]);o.points=host==='plane'?[[-300,-200],[300,-200],[300,200],[-300,200]]:[[-300,0],[300,0],[300,300],[-300,300]];A.document.objects.push(o)}
   document.querySelector(`[data-view="${mode}"]`).click();document.querySelector('#snap').checked=false;document.querySelector('#move-snap').checked=false;A.setTool('select');
  },{type,mode,host});
  const prepare=async tool=>{
   await panel('document');
   // Legacy hole creation has no toolbar entry, but still shares the rectangle commit path.
   if(tool==='hole')await page.evaluate(()=>SpatialEditor.setTool('hole'));
   else{if(narrow())await page.locator('[data-shell-pane="tools"]').click();await selectTool(page,tool)}
   await page.evaluate(()=>new Promise(requestAnimationFrame));
   await page.evaluate(()=>{const A=SpatialEditor,r=document.querySelector('#stage').getBoundingClientRect();Object.assign(A.camera,{x:0,y:0,w:1200,h:1200*r.height/r.width});A.setTool(A.tool)});
   await assertPanel('document');
  };
  const screen=p=>page.locator('#canvas').evaluate((el,p)=>{const q=new DOMPoint(...p).matrixTransform(el.getScreenCTM());return {x:q.x,y:q.y}},p);
  const move=async p=>{const q=await screen(p);assert(await page.evaluate(q=>!!document.elementFromPoint(q.x,q.y)?.closest('#canvas'),q),'pointer hits canvas');await page.mouse.move(q.x,q.y);return q};
  const click=async p=>{const q=await move(p);await page.mouse.click(q.x,q.y)};
  const state=()=>page.evaluate(()=>({objects:JSON.stringify(SpatialEditor.document.objects),count:SpatialEditor.document.objects.length,undo:SpatialEditor.undoCount}));
  const created=async(before,type,tool)=>{
   const after=await state();assert.equal(after.count,before.count+1,type+' '+tool+' creates component');assert.equal(after.undo,before.undo+1,'one creation undo');
   await assertPanel('properties');
   const o=await page.evaluate(()=>{const A=SpatialEditor,o=A.document.objects.at(-1);return {id:o.id,name:o.name,type:o.type,selected:A.selection.id,tool:A.tool}});
   assert.equal(o.type,type);assert.equal(o.selected,o.id);assert.equal(o.tool,tool);assert.equal(await page.locator('#prop-name').inputValue(),o.name);
   await page.screenshot({path:path.join(out,`${checks.length}-${type}-${page.viewportSize().width}.png`)});
   if(type==='text')await page.keyboard.press('Escape');
   await panel('document');await assertPanel('document');assert.equal((await state()).undo,after.undo,'manual tab changes do not enter history');
   if(narrow())await page.locator('[data-shell-pane="properties"]').click();
   await page.locator('#doc-width').fill('1600');await page.locator('#doc-width').press('Tab');await assertPanel('document');
   await page.evaluate(()=>SpatialEditor.command('undo'));assert.equal((await state()).objects,after.objects,'undo document edit preserves new component');
   await page.evaluate(()=>SpatialEditor.command('undo'));assert.equal((await state()).objects,before.objects,'undo creation');
   await page.evaluate(()=>SpatialEditor.command('redo'));assert.equal((await state()).objects,after.objects,'redo creation');
   checks.push({type,tool,width:page.viewportSize().width});
  };
  const rectangle=async(tool,mode='plan')=>{
   await setup('space',mode,tool==='hole'?(mode==='plan'?'plane':'wall'):null);await prepare(tool);const before=await state();
   const [a,b]=tool==='hole'&&mode==='elevation'?await page.evaluate(()=>{const A=SpatialEditor,M=StudioModel,o=A.document.objects[0];return [[-250,250],[0,100]].map(p=>M.project(M.world(A.document,o,M.facePoint(o,p)),A.scene.basis))}):[[350,250],[600,430]];
   await move(a);await page.mouse.down();await move(b);await assertPanel('document');assert.deepEqual(await state(),before,'preview has no model/history effects');await page.mouse.up();
   await created(before,tool==='ellipse'?'plane':tool,tool);
  };
  for(const tool of ['plane','ellipse','stairs','ladder','spiral','hole'])await rectangle(tool);
  for(const tool of ['stairs','ladder','spiral','hole'])await rectangle(tool,'elevation');
  await setup('space','plan','plane');await prepare('wall');let before=await state();await move([600,200]);await page.mouse.down();await assertPanel('document');await page.mouse.up();await created(before,'wall','wall');
  for(const type of ['space','curve'])for(const tool of ['marker','text','route',...(type==='space'?['polygon']:[])]){
   await setup(type);await prepare(tool);before=await state();await click([350,250]);
   if(tool==='route'||tool==='polygon'){await click([650,250]);await assertPanel('document');if(tool==='polygon')await click([650,450]);await page.keyboard.press('Enter')}
   await created(before,tool==='polygon'?'plane':tool,tool==='polygon'?'vertex':tool==='route'?'move':tool);
  }
  // Aborted, invalid and tiny gestures must leave document settings active.
  for(const cancel of ['Escape','pointercancel','tiny','invalid-hole','invalid-polygon']){
   await setup();await prepare(cancel==='invalid-hole'?'hole':cancel==='invalid-polygon'?'polygon':'plane');before=await state();
   await move([350,250]);await page.mouse.down();await move(cancel==='tiny'?[351,251]:[600,430]);
   if(cancel==='Escape')await page.keyboard.press('Escape');
   if(cancel==='pointercancel')await page.locator('#canvas').dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse',bubbles:true});
   await page.mouse.up();
   if(cancel==='invalid-polygon'){await click([650,250]);await click([500,250]);await page.keyboard.press('Enter')}
   await assertPanel('document');assert.deepEqual(await state(),before,cancel+' does not create or change history');checks.push({cancel});
  }
  await page.setViewportSize({width:390,height:844});await rectangle('plane');
  // The narrow layout keeps the canvas open for continuous creation, with the properties tab ready.
  await setup();await prepare('marker');before=await state();await click([350,250]);await assertPanel('properties');
  assert.equal(await page.locator('body').getAttribute('data-pane'),'canvas');await panel('document');await prepare('marker');await click([650,450]);await assertPanel('properties');
  assert.equal((await state()).count,before.count+2);assert.equal((await state()).undo,before.undo+2);await page.locator('[data-shell-pane="properties"]').click();assert(await page.locator('#prop-name').isVisible());
  await page.screenshot({path:path.join(out,'narrow-properties.png')});checks.push({width:390,continuous:true});
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,network},null,2));
  console.log('PASS Chrome creation inspector: all creation paths, plan/elevation/curve, preview/cancel/invalid gestures, manual document settings, single undo/redo and narrow continuous creation. Evidence: qa/creation-inspector/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
