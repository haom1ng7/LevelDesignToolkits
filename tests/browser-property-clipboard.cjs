const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],requests=[],out=path.join(__dirname,'../qa/property-clipboard');fs.mkdirSync(out,{recursive:true});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  await page.addInitScript(()=>window.addEventListener('contextmenu',e=>{if(e.target.closest('#properties'))setTimeout(()=>window.testPropertyContext=e.defaultPrevented,0)},true));
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  await page.evaluate(()=>document.addEventListener('pointerdown',e=>window.testPropertyPointer=e.pointerId,true));
  let ids=[];
  const read=()=>page.evaluate(()=>JSON.parse(JSON.stringify(SpatialEditor.document.objects))),count=()=>page.evaluate(()=>SpatialEditor.undoCount),near=(a,b,msg='value')=>assert(Math.abs(a-b)<1e-6,`${msg}: ${a} != ${b}`);
  async function fresh(options={}){ids=await page.evaluate(options=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument('space','属性复制粘贴');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];
   const objects=(options.types||['plane','plane']).map((type,i)=>M.createObject(A.document,type,[400+i*400,350,20]));
   const a=objects[0];a.position=[123.123456789,234.5,36.75];a.orientation=M.product(M.product(M.axisRotation([0,0,1],30*Math.PI/180),M.axisRotation([0,1,0],20*Math.PI/180)),M.axisRotation([1,0,0],10*Math.PI/180));
   if(a.points&&a.type==='plane'){a.points=a.points.map(p=>[p[0]*1.25,p[1]*1.5]);a.thickness=13.75}a.fill='#123456';a.stroke='#654321';if(a.type==='stairs')a.flights[0].end=137.25;if(a.type==='text')a.text='快捷复制\n多行文本 <>&';if(a.type==='route')a.style='dotted';if(a.type==='spiral')a.direction=-1;
   A.document.objects.push(...objects);document.querySelector(`[data-view="${options.mode||'plan'}"]`).click();document.querySelector('#snap').checked=true;A.select(objects[0].id,false,true);return objects.map(o=>o.id);
  },options)}
  const select=index=>page.evaluate(id=>SpatialEditor.select(id,false,true),ids[index]);
  const multi=()=>page.evaluate(ids=>ids.forEach((id,i)=>SpatialEditor.select(id,i>0,true)),ids);
  function row(key){return page.locator('#prop-'+key).locator('xpath=ancestor::div[contains(@class,"transform-row")]').locator('.transform-label')}
  async function copy(target){if(typeof target==='string')target=page.locator(target);const before=await read(),undo=await count();await page.evaluate(()=>delete window.testPropertyContext);await target.click({button:'right',modifiers:['Shift']});assert.deepEqual(await read(),before,'copy is read-only');assert.equal(await count(),undo);assert.match(await page.locator('#status').innerText(),/已复制|多个值/);assert.notEqual(await page.evaluate(()=>window.testPropertyContext),false,'native context menu is suppressed or its event is prevented')}
  async function paste(target){if(typeof target==='string')target=page.locator(target);await target.click({modifiers:['Shift']})}
  async function restore(before,after,undo){assert.equal(await count(),Math.min(80,undo+1));await page.locator('[data-action="undo"]').click();assert.deepEqual(await read(),before);await page.locator('[data-action="redo"]').click();assert.deepEqual(await read(),after)}
  // Native mouse clicks cover every transform axis in all three views.
  for(const mode of ['plan','elevation','solid'])for(const key of ['px','py','pz','rx','ry','rz','dimensionX','dimensionY','dimensionZ']){
   await fresh({mode});const expected=+(await page.locator('#prop-'+key).inputValue());await copy('#prop-'+key);await select(1);const before=await read(),undo=await count();await paste('#prop-'+key);near(+(await page.locator('#prop-'+key).inputValue()),expected,mode+' '+key);await restore(before,await read(),undo);
  }
  await fresh();await copy('#prop-px');await select(1);await paste('#prop-px');near((await read())[1].position[0],123.123456789,'scalar clipboard retains full model precision');
  for(const key of ['px','rx','dimensionX']){
   await fresh();const values=await row(key).locator('xpath=..').locator('input').evaluateAll(inputs=>inputs.map(i=>i.value));await copy(row(key));await select(1);const before=await read(),undo=await count();await paste(row(key));assert.deepEqual(await row(key).locator('xpath=..').locator('input').evaluateAll(inputs=>inputs.map(i=>i.value)),values);await restore(before,await read(),undo);
  }
  // Color/select native pickers must stay closed, and textarea/flight values must paste once.
  for(const [type,source,target,value,key] of [['plane','#prop-fill','#prop-stroke','#123456','stroke'],['text','#prop-text','#prop-text','快捷复制\n多行文本 <>&','text'],['route','#prop-style','#prop-style','dotted','style'],['spiral','#prop-direction','#prop-direction',-1,'direction'],['stairs','#flight-end','#flight-start',137.25,'start']]){
   await fresh({types:[type,type]});await copy(source);await select(1);const before=await read(),undo=await count();await paste(target);const after=await read();assert.equal(type==='stairs'?after[1].flights[0][key]:after[1][key],value);await restore(before,after,undo);
  }
  await fresh();await copy('#prop-fill');await select(1);let before=await read(),undo=await count();await paste('#prop-px');assert.deepEqual(await read(),before);assert.equal(await count(),undo);assert.match(await page.locator('#status').innerText(),/类型不兼容/);
  await select(0);await copy('#prop-px');await select(1);before=await read();await paste('#prop-opacity');assert.deepEqual(await read(),before);assert.match(await page.locator('#status').innerText(),/有效范围/);
  // Mixed copy refuses an arbitrary primary value; pasting still unifies a batch once.
  await multi();await copy('#prop-px');assert.match(await page.locator('#status').innerText(),/多个值/);before=await read();undo=await count();await paste('#prop-py');let after=await read();after.forEach(o=>near(o.position[1],123.123456789));await restore(before,after,undo);
  // A Shift-click must not become scrubbing, and a Shift-drag must not become paste.
  await fresh();await copy('#prop-py');await select(1);before=await read();undo=await count();const input=page.locator('#prop-px');await input.scrollIntoViewIfNeeded();let box=await input.boundingBox(),p={x:box.x+box.width/2,y:box.y+box.height/2};
  await page.keyboard.down('Shift');await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+20,p.y,{steps:5});await page.mouse.up();await page.keyboard.up('Shift');after=await read();near(after[1].position[0],before[1].position[0]+2,'Shift held from drag start refines values');await restore(before,after,undo);
  await select(1);await input.click();await input.fill('650');await input.press('Tab');near((await read())[1].position[0],650,'plain click still supports keyboard entry');
  // Esc, pointer cancellation and release elsewhere cancel pending click actions.
  for(const cancel of ['escape','pointercancel','blur','outside']){
   await fresh();await copy('#prop-py');await select(1);before=await read();undo=await count();await input.scrollIntoViewIfNeeded();box=await input.boundingBox();p={x:box.x+box.width/2,y:box.y+box.height/2};await page.keyboard.down('Shift');await page.mouse.move(p.x,p.y);await page.mouse.down();
   if(cancel==='escape')await page.keyboard.press('Escape');else if(cancel==='pointercancel')await page.evaluate(()=>document.querySelector('#properties').dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:window.testPropertyPointer})));else if(cancel==='blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));else await page.mouse.move(p.x,p.y-100);
   await page.mouse.up();await page.keyboard.up('Shift');assert.deepEqual(await read(),before,cancel+' cancels');assert.equal(await count(),undo);
  }
  // Locked values can be copied by their row label; locked targets cannot be changed.
  await fresh();await copy('#prop-px');await select(1);await page.locator('#properties [data-action="lock"]').click();before=await read();undo=await count();await paste(row('px'));assert.deepEqual(await read(),before);assert.equal(await count(),undo);assert.match(await page.locator('#status').innerText(),/锁定/);
  // Hover and one-shot feedback use the whole row, survive paste re-rendering, and leave layout fixed.
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await fresh();const line=row('px').locator('xpath=..');await line.scrollIntoViewIfNeeded();await page.mouse.move(800,100);
   const normal=await line.evaluate(el=>getComputedStyle(el).backgroundColor),bounds=await line.boundingBox();await line.hover();await page.waitForTimeout(160);assert.notEqual(await line.evaluate(el=>getComputedStyle(el).backgroundColor),normal,'hover changes row color');assert.deepEqual(await line.boundingBox(),bounds,'hover does not shift layout');
   await page.screenshot({path:path.join(out,`hover-${theme}.png`),fullPage:true});await copy(row('px'));
   assert(await line.evaluate(el=>el.classList.contains('property-flash')&&getComputedStyle(el,'::after').pointerEvents==='none'),'copy flashes without blocking controls');
   await page.screenshot({path:path.join(out,`copy-flash-${theme}.png`),fullPage:true});await page.waitForFunction(()=>!document.querySelector('.property-flash'));
   await select(1);await paste(row('px'));assert(await line.evaluate(el=>el.classList.contains('property-flash')),'paste flashes the replacement DOM row');await page.screenshot({path:path.join(out,`paste-flash-${theme}.png`),fullPage:true});await page.waitForFunction(()=>!document.querySelector('.property-flash'));
   await copy(row('px'));assert(await line.evaluate(el=>el.classList.contains('property-flash')),'repeat shortcut restarts feedback');await page.waitForFunction(()=>!document.querySelector('.property-flash'));
   await row('dimensionX').hover();await page.waitForTimeout(160);const sizes=row('dimensionX').locator('xpath=..');assert(await sizes.evaluate(el=>{const a=el.getBoundingClientRect(),b=el.querySelector('.transform-label').getBoundingClientRect(),c=el.querySelector('.axis-field:last-child').getBoundingClientRect(),s=el.closest('.inspector-section').getBoundingClientRect();return b.left-a.left>=8&&a.right-c.right>=8&&Math.abs(a.left-s.left)<1&&Math.abs(a.right-s.right)<1}),'hover band fills the section width and has padding around the label and all controls');await line.locator('xpath=../..').screenshot({path:path.join(out,`hover-rows-${theme}.png`)});
   await fresh();await copy('#prop-fill');await select(1);await paste('#prop-px');assert.equal(await page.locator('.property-flash').count(),0,'invalid paste does not flash success');
  }
  await page.emulateMedia({reducedMotion:'reduce'});await fresh();await copy(row('px'));assert.equal(await row('px').locator('xpath=..').evaluate(el=>getComputedStyle(el,'::after').animationName),'none','reduced motion uses a static cue');await page.waitForFunction(()=>!document.querySelector('.property-flash'));await page.emulateMedia({reducedMotion:'no-preference'});
  // Whole-row and individual targets work at phone, wide phone, tablet and desktop widths in both themes.
  for(const width of [1600,768,440,390])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:1000});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await fresh();if(width<=990)await page.locator('[data-shell-pane="properties"]').click();await copy(row('px'));await select(1);await paste(row('px'));after=await read();near(after[1].position[0],123.123456789);near(after[1].position[1],234.5);near(after[1].position[2],36.75);await page.screenshot({path:path.join(out,`${width}-${theme}.png`),fullPage:true});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({axes:9,views:3,groups:3,controlKinds:5,cancellations:4,layouts:8,motion:'hover, copy/paste pulse, repeat, failure exclusion, reduced motion',errors,requests},null,2));
  console.log('PASS Chrome property clipboard: native Shift-click copy/paste on nine axes in three views, row triples, colors/selects/textarea/flight, full precision, one undo/redo, invalid/mixed/batch/locked values, Shift-drag precision, normal typing, cancellation, hover/feedback/reduced motion and eight responsive/theme layouts; no page errors or online requests.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
