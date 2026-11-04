const {openToolMenu,selectTool}=require('./tool-menu.cjs');
// Floor defaults through real creation tools, property edits and autosave.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 const out=path.join(__dirname,'../qa/floor-colors');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1100},reducedMotion:'reduce'}),errors=[],network=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{const A=SpatialEditor;A.createDocument('space','楼层默认颜色');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];A.setTool('select');A.command('fit');document.querySelector('#snap').checked=false;document.querySelector('#move-snap').checked=false});
  const screen=p=>page.evaluate(p=>{const q=new DOMPoint(...p).matrixTransform(document.querySelector('#canvas').getScreenCTM());return {x:q.x,y:q.y}},p);
  const state=()=>page.evaluate(()=>JSON.parse(JSON.stringify(SpatialEditor.document)));
  const setDefault=async value=>{
   await page.locator('[data-panel="document"]').click();
   const input=page.getByLabel('新增组件默认颜色',{exact:true}),before=await page.evaluate(()=>SpatialEditor.undoCount),objects=(await state()).objects;
   await input.fill(value);await input.dispatchEvent('change');
   const next=await state();assert.equal(next.floors.find(f=>f.id===next.activeFloor).componentColor,value);assert.deepEqual(next.objects,objects,'changing a floor default preserves existing components');
   assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),before+1,'one color edit is one undo step');
  };
  await setDefault('#91bfa5');
  const create=async(tool,from,to)=>{
   await selectTool(page,tool);const a=await screen(from);await page.mouse.move(a.x,a.y);
   if(to){const b=await screen(to);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.mouse.up()}else await page.mouse.click(a.x,a.y);
   return (await state()).objects.at(-1);
  };
  const samples=[['plane',[180,200],[400,360]],['ellipse',[800,440],[1000,600]],['wall',[290,360]],['stairs',[500,180],[620,380]],['ladder',[700,180],[780,200]],['spiral',[900,180],[1040,320]]];
  const first=[];for(const sample of samples)first.push(await create(...sample));
  assert.equal(first.length,(await state()).objects.length);assert.deepEqual(first.map(o=>o.type),['plane','plane','wall','stairs','ladder','spiral']);
  const color=first[0].fill;assert.equal(color,'#91bfa5');assert.equal(new Set(first.map(o=>o.fill)).size,1);assert.equal(new Set(first.map(o=>o.stroke)).size,1);checks.push('six real creation tools share the configured floor color');
  await page.keyboard.press('Escape');
  await setDefault('#5d87ac');
  await page.locator('[data-action="undo"]').click();assert.equal(await page.locator('#floor-componentColor').inputValue(),color);
  await page.locator('[data-action="redo"]').click();assert.equal(await page.locator('#floor-componentColor').inputValue(),'#5d87ac');
  await page.locator('[data-action="undo"]').click();assert.deepEqual((await state()).objects,first);checks.push('default edits preserve existing geometry and colors, with atomic undo/redo');
  await page.screenshot({path:path.join(out,'default-color-setting.png'),fullPage:true});
  for(const mode of ['plan','elevation','solid']){await page.locator(`[data-view="${mode}"]`).click();await page.locator('[data-action="fit"]').click();assert.equal(new Set((await state()).objects.map(o=>o.fill)).size,1);await page.screenshot({path:path.join(out,`floor-one-${mode}.png`),fullPage:true})}
  await page.locator('[data-view="plan"]').click();
  await page.locator('[data-panel="document"]').click();await page.locator('#document-properties [data-action="add-floor"]').click();
  const secondAllocated=(await state()).floors.at(-1).componentColor;assert.notEqual(secondAllocated,color);
  await setDefault('#c28f9e');
  const second=[];for(const sample of samples)second.push(await create(...sample));
  assert.equal(new Set(second.map(o=>o.fill)).size,1);assert.equal(second[0].fill,'#c28f9e');assert.notEqual(second[0].fill,color);checks.push('new floor has an independent configurable color');
  await page.keyboard.press('Escape');await page.locator('[data-panel="document"]').click();
  const floorIds=(await state()).floors.map(f=>f.id);
  await page.locator(`[data-floor="${floorIds[0]}"]`).click();assert.equal(await page.locator('#floor-componentColor').inputValue(),color);
  await page.locator(`[data-floor="${floorIds[1]}"]`).click();assert.equal(await page.locator('#floor-componentColor').inputValue(),second[0].fill);checks.push('floor switching displays each stored default');
  await page.keyboard.press('Escape');await page.evaluate(id=>SpatialEditor.select(id,false,true),second[0].id);
  const fill=page.locator('[data-scope="prop"][data-key="fill"]');await fill.fill('#123456');await fill.dispatchEvent('change');
  assert.equal((await state()).objects.find(o=>o.id===second[0].id).fill,'#123456');
  const extra=await create('plane',[500,500],[650,600]);assert.equal(extra.fill,second[0].fill);await page.keyboard.press('Escape');
  await page.keyboard.press('Control+z');assert(!(await state()).objects.some(o=>o.id===extra.id));await page.keyboard.press('Control+Shift+z');assert.equal((await state()).objects.find(o=>o.id===extra.id).fill,second[0].fill);checks.push('manual color remains independent and creation undo/redo is atomic');
  await selectTool(page,'plane');const a=await screen([500,680]),b=await screen([650,730]),beforeCancel=JSON.stringify(await state());await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.keyboard.press('Escape');await page.mouse.up();assert.equal(JSON.stringify(await state()),beforeCancel);checks.push('cancelled creation preserves colors and objects');
  await page.evaluate(()=>{StudioModel.validate(JSON.parse(JSON.stringify(SpatialEditor.project)));SpatialEditor.command('autosave')});const saved=await state();await page.reload();assert.deepEqual(await state(),saved);
  const afterReload=await create('wall',[290,200]);assert.equal(afterReload.fill,second[0].fill);assert.equal((await state()).objects.find(o=>o.id===second[0].id).fill,'#123456');checks.push('JSON/autosave restores default and custom colors');
  await page.keyboard.press('Escape');await page.locator('[data-view="solid"]').click();await page.locator('[data-action="fit"]').click();await page.screenshot({path:path.join(out,'two-floors-solid.png'),fullPage:true});
  await page.locator('[data-panel="document"]').click();
  for(const width of [1600,390])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:900});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   if(width<=990)await page.locator('[data-shell-pane="properties"]').click();
   const setting=page.getByLabel('新增组件默认颜色',{exact:true});await setting.scrollIntoViewIfNeeded();assert(await setting.isVisible());assert.equal(await setting.inputValue(),second[0].fill);
   assert(await page.evaluate(()=>{const r=document.querySelector('#floor-componentColor').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&document.documentElement.scrollWidth<=innerWidth}),'default color stays inside the viewport');
   await page.screenshot({path:path.join(out,`setting-${width}-${theme}.png`),fullPage:true});
  }
  checks.push('default color setting fits desktop/narrow screens and light/dark themes');
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,firstColor:color,secondColor:second[0].fill,errors,network},null,2));
  console.log('PASS Chrome floor colors: configurable defaults, six creation tools, two floors, three views, existing/manual colors, undo/redo, cancellation, JSON/autosave and responsive themes. Evidence: qa/floor-colors/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
