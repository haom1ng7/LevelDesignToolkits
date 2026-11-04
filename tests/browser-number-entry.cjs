// Real clicks must distinguish acquiring numeric focus from placing a text caret.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'}),errors=[],network=[],checks=[],out=path.join(__dirname,'../qa/number-entry');fs.mkdirSync(out,{recursive:true});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);await page.evaluate(()=>document.fonts.ready);
  const selected=()=>page.evaluate(()=>getSelection().toString()),count=()=>page.evaluate(()=>SpatialEditor.undoCount),read=()=>page.evaluate(()=>JSON.stringify(SpatialEditor.document.objects));
  async function fresh({mode='plan',type='plane',mixed=false}={}){await page.evaluate(({mode,type,mixed})=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument('space','数值输入');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];
   const a=M.createObject(A.document,type,[12345.67,-2345.6,20]);A.document.objects.push(a);
   if(mixed)A.document.objects.push(M.createObject(A.document,type,[400,350,20]));
   document.querySelector(`[data-view="${mode}"]`).click();A.select(a.id,false,true);if(mixed)A.select(A.document.objects[1].id,true,true);
  },{mode,type,mixed})}
  async function leftPoint(input){await input.scrollIntoViewIfNeeded();return input.evaluate(i=>{const r=i.getBoundingClientRect(),s=getComputedStyle(i);return {x:r.left+parseFloat(s.paddingLeft)+parseFloat(s.borderLeftWidth)+1,y:r.top+r.height/2}})}
  async function clickLeft(input){const p=await leftPoint(input);await page.mouse.click(p.x,p.y);return p}
  async function firstClick(selector){const input=page.locator(selector),value=await input.inputValue(),before=await read(),undo=await count();await clickLeft(input);assert.equal(await selected(),value,selector+' first click selects the whole number');assert.deepEqual(await read(),before);assert.equal(await count(),undo);checks.push(selector);return input}
  for(const mode of ['plan','elevation','solid']){
   await fresh({mode});const input=await firstClick('#prop-px');await page.screenshot({path:path.join(out,`${mode}-selected.png`),fullPage:true});
   await clickLeft(input);assert.equal(await selected(),'','second click places caret');await page.keyboard.type('9');assert.equal(await input.inputValue(),'912345.67','second click inserts at chosen digit');
   await page.locator('#prop-name').click();await firstClick('#prop-px');await page.keyboard.type('650');assert.equal(await input.inputValue(),'650','typing replaces all digits');
   await page.locator('#prop-name').click();await firstClick('#prop-py');
   for(const key of ['pz','rx','ry','rz','dimensionX','dimensionY','dimensionZ'])await firstClick('#prop-'+key);
  }
  // A focused numeric field permits native partial text selection without changing geometry.
  await fresh();let input=await firstClick('#prop-px'),before=await read(),undo=await count(),p=await leftPoint(input);
  await clickLeft(input);assert.equal(await selected(),'','place caret before selecting part of the number');
  await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+20,p.y,{steps:6});await page.mouse.up();assert((await selected()).length>0);assert((await selected()).length<(await input.inputValue()).length,JSON.stringify({selected:await selected(),value:await input.inputValue(),point:p,focus:await input.evaluate(i=>document.activeElement===i)}));assert.equal(await read(),before);assert.equal(await count(),undo);assert.equal(await page.locator('body.property-scrubbing').count(),0);checks.push('focused text selection');
  // New focus still allows direct scrubbing; the badge also scrubs while text has focus.
  await page.locator('#prop-name').click();p=await leftPoint(input);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+20,p.y,{steps:6});await page.mouse.up();assert.equal(+(await input.inputValue()),12365.67);assert.equal(await count(),undo+1);
  await page.locator('[data-action="undo"]').click();assert.equal(await read(),before);await page.locator('[data-action="redo"]').click();await page.evaluate(()=>SpatialEditor.select(SpatialEditor.document.objects[0].id,false,true));assert.equal(+(await input.inputValue()),12365.67);
  await firstClick('#prop-px');const badge=page.locator('[data-property-scrub="px"]>span'),box=await badge.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+12,box.y+box.height/2,{steps:4});await page.mouse.up();assert.equal(+(await input.inputValue()),12377.67);checks.push('direct and badge scrub');
  // Keyboard focus selects everything, and a small first-click hand jitter does too.
  await fresh();input=page.locator('#prop-px');await page.locator('[data-inspector-section="transform"]>summary').focus();await page.keyboard.press('Tab');assert(await input.evaluate(i=>i===document.activeElement));assert.equal(await selected(),await input.inputValue());
  await page.locator('#prop-name').click();p=await leftPoint(input);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+2,p.y);await page.mouse.up();assert.equal(await selected(),await input.inputValue());checks.push('Tab and hand jitter');
  // Other numeric attributes, flight parameters, mixed values and settings share the behavior.
  for(const [type,selector] of [['plane','#prop-opacity'],['wall','#prop-thickness'],['text','#prop-size'],['stairs','#flight-end'],['spiral','#prop-inner']]){await fresh({type});await firstClick(selector)}
  await fresh({mixed:true});input=await firstClick('#prop-px');assert.equal(await input.getAttribute('placeholder'),'多个值');await page.keyboard.type('650');assert(await page.evaluate(()=>SpatialEditor.document.objects.every(o=>o.position[0]===650)));checks.push('mixed replacement');
  await page.locator('[data-panel="document"]').click();await firstClick('#doc-gridSize');
  await page.evaluate(()=>SpatialEditor.createDocument('curve','曲线数值'));await page.locator('[data-panel="properties"]').click();await firstClick('#curve-titleSize');
  // The same first/second-click behavior works in both themes at mobile width.
  for(const theme of ['light','dark']){await fresh();await page.setViewportSize({width:390,height:1000});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await page.locator('[data-shell-pane="properties"]').click();input=await firstClick('#prop-px');await page.screenshot({path:path.join(out,`390-${theme}.png`),fullPage:true});await clickLeft(input);assert.equal(await selected(),'');checks.push('390 '+theme)}
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,network},null,2));
  console.log('PASS Chrome numeric entry: first click/Tab selects all, second click places caret, focused drag selects text, unfocused/badge drag adjusts values, replacement/history, negatives/fractions, mixed/parameters/flight/document/curve and narrow themes.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
