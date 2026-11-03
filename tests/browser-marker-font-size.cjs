// Real Chrome Backspace/Delete input and canvas deletion regression.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),out=path.join(__dirname,'../qa/marker-font-size'),checks=[],errors=[],requests=[];
  fs.mkdirSync(out,{recursive:true});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  for(const [type,mode,total]of [['space','plan',1],['space','elevation',1],['space','solid',1],['curve','plan',1],['space','plan',2]]){
   const ids=await page.evaluate(({type,total})=>{
    const A=SpatialEditor,M=StudioModel;A.createDocument(type,'标记字号退格回归');
    const markers=Array.from({length:total},(_,i)=>M.createObject(A.document,'marker',[400+i*150,300,0]));A.document.objects=markers;A.setTool('select');return markers.map(o=>o.id);
   },{type,total});
   if(mode!=='plan')await page.locator(`[data-view="${mode}"]`).click();
   const select=async()=>{for(const [i,id]of ids.entries())await page.locator(`[data-layer="${id}"]`).click({modifiers:i?['Control']:[]})};
   const sizes=()=>page.evaluate(ids=>ids.map(id=>SpatialEditor.document.objects.find(o=>o.id===id)?.size),ids);
   const focused=()=>page.locator('#prop-size').evaluate(el=>el===document.activeElement);
   const intact=async()=>{assert.deepEqual(await page.evaluate(()=>SpatialEditor.selection.ids),ids);assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),total)};
   await select();const count=await page.evaluate(()=>SpatialEditor.undoCount),size=page.locator('#prop-size');
   await size.click();await page.keyboard.press('End');await page.keyboard.press('Backspace');
   assert.equal(await size.inputValue(),'1',`${type}/${mode}/${total}: first Backspace removes a digit`);assert(await focused(),'first Backspace preserves input focus');await intact();
   await page.keyboard.press('Backspace');assert.equal(await size.inputValue(),'');assert(await focused(),'clearing the field preserves input focus');
   await page.keyboard.down('Backspace');await page.keyboard.down('Backspace');await page.keyboard.up('Backspace');await page.keyboard.press('Delete');
   assert.equal(await size.inputValue(),'');assert(await focused(),'repeated deletion stays in the empty input');await intact();
   await page.keyboard.type('32');assert.equal(await size.inputValue(),'32');assert(await focused());await page.keyboard.press('Tab');
   assert.deepEqual(await sizes(),ids.map(()=>32));assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),count+1,'one typing session is one undo');
   await page.locator('[data-action="undo"]').click();assert.deepEqual(await sizes(),ids.map(()=>16));
   await page.locator('[data-action="redo"]').click();assert.deepEqual(await sizes(),ids.map(()=>32));await select();
   // Selecting the entire value and deleting it follows the same safe empty-input path.
   const beforeEmpty=await page.evaluate(()=>SpatialEditor.undoCount);
   await size.click();await page.keyboard.press('Control+a');await page.keyboard.press('Delete');await page.keyboard.press('Backspace');await intact();
   assert.equal(await size.inputValue(),'');assert(await focused());await page.keyboard.press('Tab');assert.deepEqual(await sizes(),ids.map(()=>32));
   assert.equal(await size.inputValue(),'32','leaving an empty field restores the current size');assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),beforeEmpty);
   for(const [value,expected]of [['1',8],['250',200]]){await size.fill(value);assert(await focused(),'out-of-range edits retain focus');await page.keyboard.press('Tab');assert.deepEqual(await sizes(),ids.map(()=>expected));await intact()}
   if(type==='space'&&mode==='plan'&&total===1)await page.screenshot({path:path.join(out,'marker-font-size.png'),fullPage:true});
   // Canvas shortcuts must still delete the selection after explicitly leaving the input.
   await page.locator('#canvas').focus();await page.keyboard.press('Backspace');assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),0);
   await page.locator('[data-action="undo"]').click();assert.deepEqual(await sizes(),ids.map(()=>200));
   checks.push({type,mode,total,pass:true});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,requests},null,2));
  console.log('PASS Chrome marker font size: first/repeated Backspace, empty input, Delete, replacement typing, focus/selection, 8–200 bounds, single/batch history and canvas deletion; space three views and curve. Evidence: qa/marker-font-size/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
