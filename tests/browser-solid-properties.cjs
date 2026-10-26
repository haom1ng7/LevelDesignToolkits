// Run after npm run build. Uses installed Chrome, or STUDIO_BROWSER for another Chromium executable.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright-core');

(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const ids=await page.evaluate(()=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument('space','立体属性验收');A.document.objects=[];
   const plane=M.createObject(A.document,'plane',[450,350,20]),stairs=M.createObject(A.document,'stairs',[750,350,0]);
   A.document.objects.push(plane,stairs);A.setTool('select');return {plane:plane.id,stairs:stairs.id};
  });
  const value=(id,key)=>page.evaluate(({id,key})=>SpatialEditor.document.objects.find(o=>o.id===id)[key],{id,key});
  await page.locator('[data-view="solid"]').click();
  await page.locator(`[data-layer="${ids.plane}"]`).click();
  const name=page.locator('#prop-name');assert(await name.isEnabled());
  await name.fill('立体属性');await name.press('End');await name.pressSequentially('修改');
  assert.equal(await value(ids.plane,'name'),'立体属性修改');assert(await name.evaluate(el=>el===document.activeElement),'typing retains focus');
  const originalThickness=await value(ids.plane,'thickness');
  await page.locator('#prop-dimensionZ').fill('32');await page.locator('#prop-dimensionZ').press('Tab');
  assert.equal(await value(ids.plane,'thickness'),32);
  await page.locator('[data-action="undo"]').click();assert.equal(await value(ids.plane,'thickness'),originalThickness);
  await page.locator('[data-action="redo"]').click();assert.equal(await value(ids.plane,'thickness'),32);
  await page.locator(`[data-layer="${ids.plane}"]`).click();
  await page.locator('#prop-fill').fill('#123456');await page.locator('#prop-opacity').fill('0.65');await page.locator('#prop-opacity').press('Tab');
  for(const mode of ['plan','elevation','solid']){
   await page.locator(`[data-view="${mode}"]`).click();
   assert.equal(await page.locator('#prop-dimensionZ').inputValue(),'32');
   assert.equal(await page.locator('#prop-fill').inputValue(),'#123456');
   assert.equal(await page.locator('#prop-opacity').inputValue(),'0.65');
  }
  assert(await page.locator('[data-tool="rotate"]').isEnabled());assert(await page.locator('[data-tool="size"]').isEnabled());assert(await page.locator('[data-action="vertices"]').isDisabled());
  await page.locator('#properties [data-action="lock"]').click();assert(await name.isDisabled());assert(await page.locator('#prop-dimensionZ').isDisabled());
  await page.locator('#properties [data-action="lock"]').click();assert(await name.isEnabled());
  await page.locator(`[data-layer="${ids.stairs}"]`).click();
  await page.locator('#flight-end').fill('240');await page.locator('#flight-end').press('Tab');
  assert.equal((await value(ids.stairs,'flights'))[0].end,240);
  await page.locator('#prop-countMode').selectOption('manual');
  await page.locator('#flight-steps').fill('18');await page.locator('#flight-steps').press('Tab');
  assert.equal((await value(ids.stairs,'flights'))[0].steps,18);
  await page.locator('#properties [data-action="lock"]').click();assert(await page.locator('#flight-end').isDisabled());
  await page.locator('#properties [data-action="lock"]').click();
  const serialized=await page.evaluate(()=>JSON.stringify(SpatialEditor.project));
  await page.evaluate(json=>SpatialEditor.loadProject(JSON.parse(json)),serialized);
  assert.equal((await value(ids.stairs,'flights'))[0].end,240);assert.equal(await value(ids.plane,'fill'),'#123456');
  await page.locator('[data-view="solid"]').click();await page.locator(`[data-layer="${ids.stairs}"]`).click();
  const out=path.join(__dirname,'../qa/solid-properties');fs.mkdirSync(out,{recursive:true});
  await page.screenshot({path:path.join(out,'solid-properties.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS Chrome solid properties: actual typing/focus, numeric and color input, undo/redo, three-view sync, lock/unlock, stair fields/select, JSON reload; screenshot qa/solid-properties/solid-properties.png.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
