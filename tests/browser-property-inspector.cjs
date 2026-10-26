// Real Chrome input, multi-selection, layout and history verification.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const ids=await page.evaluate(()=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument('space','多选组件属性');A.document.objects=[];
   const a=M.createObject(A.document,'plane',[400,300,0]),b=M.createObject(A.document,'plane',[800,450,0]);b.thickness=28;b.fill='#698599';b.orientation=M.axisRotation([0,0,1],Math.PI/6);A.document.objects.push(a,b);A.setTool('select');document.querySelector('#snap').checked=false;return [a.id,b.id];
  });
  const select=()=>page.evaluate(ids=>ids.forEach((id,i)=>SpatialEditor.select(id,i>0,true)),ids);
  const read=()=>page.evaluate(ids=>ids.map(id=>{const o=SpatialEditor.document.objects.find(o=>o.id===id);return {name:o.name,position:o.position,orientation:o.orientation,points:o.points,thickness:o.thickness,fill:o.fill}}),ids);
  await page.locator(`[data-layer="${ids[0]}"]`).click();await page.locator(`[data-layer="${ids[1]}"]`).click({modifiers:['Control']});
  assert.equal(await page.locator('#prop-px').getAttribute('placeholder'),'多个值');assert.equal(await page.locator('#prop-px').inputValue(),'');assert.equal(await page.locator('#prop-pz').inputValue(),'0');assert.equal(await page.locator('#prop-rz').inputValue(),'');
  const original=await read(),count=await page.evaluate(()=>SpatialEditor.undoCount),x=page.locator('#prop-px');
  await x.fill('');assert.deepEqual(await read(),original,'empty mixed input preserves geometry');await x.fill('620');assert(await x.evaluate(el=>el===document.activeElement),'typing retains focus');await x.press('Tab');
  let next=await read();assert(next.every(o=>o.position[0]===620));assert.deepEqual(next.map(o=>o.position[1]),original.map(o=>o.position[1]));assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),count+1);
  await page.locator('[data-action="undo"]').click();assert.deepEqual(await read(),original);await page.locator('[data-action="redo"]').click();await select();
  await page.locator('#prop-rx').fill('25');await page.locator('#prop-rx').press('Tab');assert.equal(await page.locator('#prop-rx').inputValue(),'25');assert.equal(await page.locator('#prop-rz').getAttribute('placeholder'),'多个值');
  await page.locator('#prop-dimensionX').fill('360');await page.locator('#prop-dimensionX').press('Tab');assert.equal(await page.locator('#prop-dimensionX').inputValue(),'360');assert((await read()).every(o=>Math.abs(o.points[1][0]-o.points[0][0]-360)<1e-6));
  await page.locator('#prop-name').fill('批量组件');await page.locator('#prop-name').press('End');await page.locator('#prop-name').pressSequentially('名称');assert((await read()).every(o=>o.name==='批量组件名称'));assert(await page.locator('#prop-name').evaluate(el=>el===document.activeElement));
  await page.locator('#prop-fill').fill('#789abc');await page.locator('#prop-fill').press('Tab');assert((await read()).every(o=>o.fill==='#789abc'));assert(await page.locator('#prop-fill').evaluate(el=>!el.closest('.mixed-color')));
  for(const mode of ['plan','elevation','solid']){await page.locator(`[data-view="${mode}"]`).click();assert.equal(await page.locator('.transform-values input').count(),9);assert.equal(await page.locator('#prop-dimensionX').inputValue(),'360');assert.equal(await page.locator('#prop-rx').inputValue(),'25')}
  // Fold states survive property edits and selection changes.
  const identity=page.locator('[data-inspector-section="identity"]');await identity.locator('summary').click();assert.equal(await identity.getAttribute('open'),null);await page.locator('#prop-pz').fill('35');await page.locator('#prop-pz').press('Tab');assert.equal(await identity.getAttribute('open'),null);await identity.locator('summary').click();
  await page.locator('#properties [data-action="lock"]').click();assert(await page.locator('#prop-px').isDisabled());await page.locator('#properties [data-action="lock"]').click();assert(await page.locator('#prop-px').isEnabled());
  const json=await page.evaluate(()=>JSON.stringify(SpatialEditor.project));await page.evaluate(json=>SpatialEditor.loadProject(JSON.parse(json)),json);await select();assert.equal(await page.locator('#prop-pz').inputValue(),'35');
  // Restore different values for screenshots and axis-width checks.
  await page.evaluate(ids=>{const A=SpatialEditor,M=StudioModel,b=A.document.objects.find(o=>o.id===ids[1]);b.position[0]=920;b.thickness=40;b.fill='#445566';A.select(ids[0],false,true);A.select(ids[1],true,true)},ids);
  const out=path.join(__dirname,'../qa/property-inspector');fs.mkdirSync(out,{recursive:true});const report=[];
  for(const width of [1440,1024,991,768,390,360])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:1000});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   if(width<=990)await page.locator('[data-shell-pane="properties"]').click();
   await page.locator('#properties').evaluate(el=>el.closest('aside').scrollTop=0);
   const layout=await page.evaluate(()=>{
    const rows=[...document.querySelectorAll('.transform-row')].map(row=>{const inputs=[...row.querySelectorAll('input')].map(el=>el.getBoundingClientRect()),r=row.getBoundingClientRect();return {sameRow:inputs.every(a=>Math.abs(a.y-inputs[0].y)<1),inside:inputs.every(a=>a.x>=r.x&&a.right<=r.right+.5),minWidth:Math.min(...inputs.map(a=>a.width))}});
    return {overflow:document.documentElement.scrollWidth>innerWidth,rows};
   });
   assert(!layout.overflow,`${width}/${theme} no page overflow`);assert.equal(layout.rows.length,3);assert(layout.rows.every(r=>r.sameRow&&r.inside&&r.minWidth>=36),`${width}/${theme} three usable values per row`);
   report.push({width,theme,...layout});
   if(width===1440||width===390)await page.screenshot({path:path.join(out,`${width}-${theme}.png`),fullPage:true});
  }
  await page.locator('#prop-dimensionZ').fill('60');await page.locator('#prop-dimensionZ').press('Tab');assert((await read()).every(o=>Math.abs(o.thickness-60)<1e-6),'narrow screen bulk edit');
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks:report,errors,requests},null,2));
  console.log('PASS Chrome property inspector: actual Ctrl multi-select and typing, mixed values, axis-only absolute edits, dimensions, color, focus/history, categories, locks, three views, JSON; 12 responsive/theme combinations and narrow bulk input. Evidence: qa/property-inspector/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
