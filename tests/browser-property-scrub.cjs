const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  await page.evaluate(()=>document.addEventListener('pointerdown',e=>window.testPropertyPointer=e.pointerId,true));
  let ids=[];
  async function fresh(options={}){ids=await page.evaluate(options=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument('space','拖动变换数值');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];
   const types=options.types||['plane'];const objects=types.map((type,i)=>M.createObject(A.document,type,[400+i*400,350,20]));
   if(options.mixed&&objects[1]){objects[1].points=objects[1].points.map(p=>[p[0]*(361.25/240),p[1]]);objects[1].orientation=M.axisRotation([0,0,1],Math.PI/6)}
   if(options.hole){const host=objects[0],h=Object.assign(M.createObject(A.document,'hole'),{host:host.id,floor:host.floor,points:[[-20,-20],[20,-20],[20,20],[-20,20]]});objects.push(h)}
   A.document.objects.push(...objects);document.querySelector(`[data-view="${options.mode||'plan'}"]`).click();document.querySelector('#snap').checked=options.grid!==false;
   A.select(objects[0].id,false,!!options.single);if(options.multi)A.select(objects[1].id,true,true);return objects.map(o=>o.id);
  },options);return ids}
  const read=()=>page.evaluate(()=>JSON.parse(JSON.stringify(SpatialEditor.document.objects))),count=()=>page.evaluate(()=>SpatialEditor.undoCount),near=(a,b,msg='value')=>assert(Math.abs(a-b)<1e-5,`${msg}: ${a} != ${b}`);
  const select=()=>page.evaluate(ids=>ids.filter(id=>SpatialEditor.document.objects.find(o=>o.id===id)?.type!=='hole').forEach((id,i)=>SpatialEditor.select(id,i>0,true)),ids);
  async function start(key,badge=false){const input=page.locator(`#prop-${key}`),target=badge?page.locator(`[data-property-scrub="${key}"]>span`):input;await target.scrollIntoViewIfNeeded();const box=await target.boundingBox(),p={x:box.x+box.width/2,y:box.y+box.height/2};await page.mouse.move(p.x,p.y);await page.mouse.down();return p}
  async function move(p,dx,keys=[]){for(const key of keys)await page.keyboard.down(key);await page.mouse.move(p.x+dx,p.y,{steps:5});for(const key of keys)await page.keyboard.up(key)}
  async function scrub(key,dx,keys=[],badge=false){const p=await start(key,badge);await move(p,dx,keys);await page.mouse.up()}
  // Live preview has no history entry; one release commits the complete gesture.
  await fresh();let before=await read(),undo=await count(),p=await start('dimensionX');await move(p,20);await move(p,40);assert.equal(await count(),undo);assert(await page.locator('body').evaluate(el=>el.classList.contains('property-scrubbing')));near((await read())[0].points[1][0]-(await read())[0].points[0][0],280);await page.mouse.up();assert.equal(await count(),Math.min(80,undo+1));
  let after=await read();assert.deepEqual(after[0].position,before[0].position);await page.locator('[data-action="undo"]').click();assert.deepEqual(await read(),before);await page.locator('[data-action="redo"]').click();assert.deepEqual(await read(),after);await select();
  await scrub('dimensionX',-20,[],true);near(+(await page.locator('#prop-dimensionX').inputValue()),260,'badge drags left to decrease');
  // Every transform row and axis works in all three views.
  for(const mode of ['plan','elevation','solid'])for(const key of ['px','py','pz','rx','ry','rz','dimensionX','dimensionY','dimensionZ']){
   await fresh({mode});const value=+(await page.locator('#prop-'+key).inputValue());await scrub(key,12);near(+(await page.locator('#prop-'+key).inputValue()),value+12,mode+' '+key);
  }
  // Mixed fields add the same delta to each target, preserving their differences.
  await fresh({types:['plane','plane'],mixed:true,multi:true});before=await read();undo=await count();await scrub('dimensionX',30);after=await read();after.forEach((o,i)=>near(o.points[1][0]-o.points[0][0],i?391.25:270));assert.equal(await page.locator('#prop-dimensionX').getAttribute('placeholder'),'多个值');assert.equal(await count(),Math.min(80,undo+1));
  await scrub('px',20);after=await read();after.forEach((o,i)=>near(o.position[0],before[i].position[0]+20));near(after[1].position[0]-after[0].position[0],400);
  await scrub('rz',10);after=await read();after.forEach((o,i)=>near(Math.atan2(o.orientation[3],o.orientation[0])*180/Math.PI,i?40:10));
  // Shift refines the increment; changing modifier mid-drag does not jump.
  await fresh();await scrub('px',30,['Shift']);near((await read())[0].position[0],403);p=await start('px');await move(p,20);await move(p,30,['Shift']);await page.mouse.up();near((await read())[0].position[0],424);
  for(const grid of [false,true])for(const keys of [[],['Control'],['Meta'],['Shift']]){await fresh({grid});await scrub('dimensionX',30,keys);near(+(await page.locator('#prop-dimensionX').inputValue()),keys.includes('Shift')?243:270,'size scrub is independent of grid/Ctrl/Command')}
  // Minimum dimensions cannot invert; reversing immediately moves away from the limit.
  await fresh();p=await start('dimensionX');await move(p,-300);near(+(await page.locator('#prop-dimensionX').inputValue()),.01);await move(p,-290);await page.mouse.up();near(+(await page.locator('#prop-dimensionX').inputValue()),10.01);
  // Host bores follow once, and circular sizes retain their shared radial factor.
  await fresh({hole:true});await scrub('dimensionX',60);after=await read();near(after[1].points[1][0]-after[1].points[0][0],50);assert(await page.evaluate(()=>StudioModel.validGeometry(SpatialEditor.document)));
  await fresh({types:['spiral']});await scrub('dimensionX',30);near(+(await page.locator('#prop-dimensionX').inputValue()),210);near(+(await page.locator('#prop-dimensionY').inputValue()),210);
  // Esc, pointer cancellation, lost focus, tool and selection changes cancel atomically.
  for(const cancel of ['escape','pointercancel','blur','tool','selection','view','undo']){
   await fresh({types:['plane','plane']});before=await read();undo=await count();p=await start('dimensionX');await move(p,35);
   if(cancel==='escape')await page.keyboard.press('Escape');
   else if(cancel==='undo')await page.keyboard.press('Control+z');
   else if(cancel==='pointercancel')await page.evaluate(()=>document.querySelector('#properties').dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:window.testPropertyPointer})));
   else if(cancel==='blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
   else if(cancel==='tool')await page.evaluate(()=>SpatialEditor.setTool('move'));
   else if(cancel==='view')await page.evaluate(()=>document.querySelector('[data-view="solid"]').click());
   else await page.evaluate(id=>SpatialEditor.select(id,false,true),ids[1]);
   await page.mouse.up();assert.deepEqual(await read(),before,cancel+' restores model');assert.equal(await count(),undo,cancel+' has no history');assert(!await page.locator('body').evaluate(el=>el.classList.contains('property-scrubbing')));
  }
  // A failed batch preview retains the last valid values for every target.
  await fresh({types:['plane','plane'],multi:true});await page.evaluate(ids=>{SpatialEditor.document.objects.find(o=>o.id===ids[1]).position[0]=999990;SpatialEditor.select(ids[0],false,true);SpatialEditor.select(ids[1],true,true)},ids);
  p=await start('px');await move(p,5);after=await read();await page.mouse.move(p.x+20,p.y);assert.deepEqual(await read(),after,'invalid second object rolls back whole preview');await page.mouse.up();assert.deepEqual(await read(),after);
  // A plain click and small hand jitter still allow normal keyboard entry.
  await fresh();before=await read();undo=await count();p=await start('px');await move(p,2);await page.mouse.up();assert.deepEqual(await read(),before);assert.equal(await count(),undo);const input=page.locator('#prop-px');await input.fill('650');await input.press('Tab');near((await read())[0].position[0],650);
  await page.locator('#properties [data-action="lock"]').click();before=await read();await scrub('dimensionX',25);assert.deepEqual(await read(),before,'locked fields cannot scrub');
  // The touch-width panel has the same drag target and behavior.
  await fresh();await page.setViewportSize({width:390,height:1000});await page.locator('[data-shell-pane="properties"]').click();await scrub('dimensionX',25);near(+(await page.locator('#prop-dimensionX').inputValue()),265);
  const out=path.join(__dirname,'../qa/property-scrub');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'390.png'),fullPage:true});assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({views:3,axes:9,cancellations:7,errors},null,2));
  console.log('PASS Chrome property scrubbing: grid-enabled exact sizes and all nine values in three views, live preview/single history, mixed fractional differences, Shift precision, grid/Ctrl/Command independence, minimum/reverse, host/circular coupling, seven cancellation paths, invalid batch, click/typing/locks and narrow panel.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
