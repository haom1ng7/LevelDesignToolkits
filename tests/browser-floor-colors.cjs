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
  const create=async(tool,from,to)=>{
   await page.locator(`[data-tool="${tool}"]`).click();const a=await screen(from);await page.mouse.move(a.x,a.y);
   if(to){const b=await screen(to);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.mouse.up()}else await page.mouse.click(a.x,a.y);
   return (await state()).objects.at(-1);
  };
  const samples=[['plane',[180,200],[400,360]],['ellipse',[800,440],[1000,600]],['wall',[180,480],[400,510]],['stairs',[540,260]],['ladder',[750,260]],['spiral',[990,260]]];
  const first=[];for(const sample of samples)first.push(await create(...sample));
  assert.equal(first.length,(await state()).objects.length);assert.deepEqual(first.map(o=>o.type),['plane','plane','wall','stairs','ladder','spiral']);
  const color=first[0].fill;assert.equal(new Set(first.map(o=>o.fill)).size,1);assert.equal(new Set(first.map(o=>o.stroke)).size,1);checks.push('six real creation tools share one floor color');
  await page.keyboard.press('Escape');
  for(const mode of ['plan','elevation','solid']){await page.locator(`[data-view="${mode}"]`).click();await page.locator('[data-action="fit"]').click();assert.equal(new Set((await state()).objects.map(o=>o.fill)).size,1);await page.screenshot({path:path.join(out,`floor-one-${mode}.png`),fullPage:true})}
  await page.locator('[data-view="plan"]').click();
  await page.locator('[data-panel="document"]').click();await page.locator('#document-properties [data-action="add-floor"]').click();
  const second=[];for(const sample of samples)second.push(await create(...sample));
  assert.equal(new Set(second.map(o=>o.fill)).size,1);assert.notEqual(second[0].fill,color);checks.push('new floor has an independent shared color');
  await page.keyboard.press('Escape');await page.evaluate(id=>SpatialEditor.select(id,false,true),second[0].id);
  const fill=page.locator('[data-scope="prop"][data-key="fill"]');await fill.fill('#123456');await fill.dispatchEvent('change');
  assert.equal((await state()).objects.find(o=>o.id===second[0].id).fill,'#123456');
  const extra=await create('plane',[500,500],[650,600]);assert.equal(extra.fill,second[0].fill);await page.keyboard.press('Escape');
  await page.keyboard.press('Control+z');assert(!(await state()).objects.some(o=>o.id===extra.id));await page.keyboard.press('Control+Shift+z');assert.equal((await state()).objects.find(o=>o.id===extra.id).fill,second[0].fill);checks.push('manual color remains independent and creation undo/redo is atomic');
  await page.locator('[data-tool="plane"]').click();const a=await screen([500,680]),b=await screen([650,730]),beforeCancel=JSON.stringify(await state());await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.keyboard.press('Escape');await page.mouse.up();assert.equal(JSON.stringify(await state()),beforeCancel);checks.push('cancelled creation preserves colors and objects');
  await page.evaluate(()=>{StudioModel.validate(JSON.parse(JSON.stringify(SpatialEditor.project)));SpatialEditor.command('autosave')});const saved=await state();await page.reload();assert.deepEqual(await state(),saved);
  const afterReload=await create('wall',[180,680],[400,710]);assert.equal(afterReload.fill,second[0].fill);assert.equal((await state()).objects.find(o=>o.id===second[0].id).fill,'#123456');checks.push('JSON/autosave restores default and custom colors');
  await page.keyboard.press('Escape');await page.locator('[data-view="solid"]').click();await page.locator('[data-action="fit"]').click();await page.screenshot({path:path.join(out,'two-floors-solid.png'),fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,firstColor:color,secondColor:second[0].fill,errors,network},null,2));
  console.log('PASS Chrome floor colors: six creation tools, two floors, three views, manual color, undo/redo, cancellation and JSON/autosave. Evidence: qa/floor-colors/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
