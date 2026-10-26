// Real pointer input for component ordering, range selection, cancellation and scrolling.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 const out=path.join(__dirname,'../qa/component-list');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1200}}),errors=[],requests=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const fresh=async(count=5)=>page.evaluate(count=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument('space','组件排序与连续选择');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];document.querySelector('#layer-filter').value='all';
   const ids=Array.from({length:count},(_,i)=>{const o=M.createObject(A.document,i%2?'text':'plane',[300+i*140,350,0]);o.name=String.fromCharCode(65+i);if(o.type==='text')o.text=o.name;A.document.objects.push(o);return o.id});A.setTool('select');return ids;
  },count);
  const row=id=>page.locator(`#layers [data-layer="${id}"]`),order=()=>page.locator('#layers [data-layer]').evaluateAll(els=>els.map(el=>el.dataset.layer)),selected=()=>page.evaluate(()=>SpatialEditor.selection.ids),count=()=>page.evaluate(()=>SpatialEditor.undoCount);
  const scroll=()=>page.locator('#layers').evaluate(el=>el.closest('aside').scrollTop=el.closest('aside').scrollHeight);
  const start=async(id,target,after=false)=>{
   await scroll();const from=await row(id).boundingBox(),to=await row(target).boundingBox();assert(from&&to);const x=from.x+Math.min(60,from.width/2),y=after?to.y+to.height-2:to.y+2;
   await page.mouse.move(x,from.y+from.height/2);await page.mouse.down();await page.mouse.move(x,y,{steps:10});return {x,y};
  };
  const drag=async(id,target,after=false)=>{await start(id,target,after);await page.mouse.up()};
  let [a,b,c,d,e]=await fresh();await row(d).click();await row(b).click({modifiers:['Shift']});assert.deepEqual(await selected(),[d,c,b]);await row(c).click({modifiers:['Shift']});assert.deepEqual(await selected(),[d,c]);
  await row(a).click();await row(c).click({modifiers:['Shift']});assert.deepEqual(await selected(),[c,b,a]);await row(e).click({modifiers:['Control']});await row(c).click({modifiers:['Control','Shift']});assert.deepEqual(await selected(),[c,b,a,e,d]);
  await page.locator('#layer-filter').selectOption('plane');await row(e).click();await row(a).click({modifiers:['Shift']});assert.deepEqual(await selected(),[e,c,a]);checks.push('Real Shift expansion, contraction, reverse range, Ctrl+Shift union and filtered rows');
  [a,b,c,d,e]=await fresh();const original=await page.evaluate(()=>JSON.stringify(SpatialEditor.document.objects));let h=await count();await start(a,d);assert(await page.locator('.layer-drag-ghost').isVisible());assert(await page.locator('.layer-insertion-line').isVisible());assert.equal(await page.evaluate(()=>JSON.stringify(SpatialEditor.document.objects)),original);await page.screenshot({path:path.join(out,'drag-preview-light.png'),fullPage:true});await page.mouse.up();assert.deepEqual(await order(),[e,a,d,c,b]);assert.equal(await count(),h+1);assert.deepEqual(await selected(),[a]);assert.equal(await page.locator('.layer-drag-ghost,.layer-insertion-line,.layer-dragging').count(),0);
  await page.locator('[data-action="undo"]').click();assert.deepEqual(await order(),[e,d,c,b,a]);await page.locator('[data-action="redo"]').click();assert.deepEqual(await order(),[e,a,d,c,b]);
  await row(e).click();await row(c).click({modifiers:['Control']});await drag(c,b,true);assert.deepEqual(await order(),[a,d,b,e,c]);checks.push('Real name drag, DOM-only preview, pointer capture, click suppression, stable batch order and single undo/redo');
  const stable=await order();h=await count();await start(a,c);await page.keyboard.press('Escape');await page.mouse.up();assert.deepEqual(await order(),stable);assert.equal(await count(),h);
  await start(a,c);await page.mouse.move(650,700,{steps:6});assert.equal(await page.locator('.layer-insertion-line').isVisible(),false);await page.mouse.up();assert.deepEqual(await order(),stable);
  await start(a,c);await page.evaluate(()=>dispatchEvent(new Event('blur')));await page.mouse.up();assert.deepEqual(await order(),stable);checks.push('Escape, outside release and window blur cancel without a history entry');
  // Double-click rename and visibility controls retain their original click behavior.
  await page.locator('[data-action="fit"]').click();await row(d).dblclick();await page.locator('.row-rename').fill('已改名');await page.locator('.row-rename').press('Enter');assert.equal(await page.evaluate(id=>SpatialEditor.document.objects.find(o=>o.id===id).name,d),'已改名');
  await page.locator(`[data-visible="${d}"]`).click();assert.equal(await page.evaluate(id=>SpatialEditor.document.objects.find(o=>o.id===id).visible,d),false);checks.push('Double-click rename and visibility icon stay clickable');
  // Host bundles and sibling holes use the same real mouse path.
  const hostIds=await page.evaluate(()=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument('space','宿主与空洞排序');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];
   const host=M.createObject(A.document,'plane',[450,350,0]),other=M.createObject(A.document,'plane',[850,350,0]),holes=[-60,60].map(x=>Object.assign(M.createObject(A.document,'hole'),{host:host.id,floor:host.floor,points:[[x-15,-15],[x+15,-15],[x+15,15],[x-15,15]]}));A.document.objects.push(host,other,...holes);A.setTool('select');return [host.id,other.id,...holes.map(o=>o.id)];
  });const [host,other,ha,hb]=hostIds;await drag(host,other);assert.deepEqual(await order(),[host,ha,hb,other]);await drag(hb,ha);assert.deepEqual(await order(),[host,hb,ha,other]);assert(await page.evaluate(()=>StudioModel.validGeometry(SpatialEditor.document)));
  await page.locator(`[data-lock="${ha}"]`).click();h=await count();await drag(host,other,true);assert.deepEqual(await order(),[host,hb,ha,other]);assert.equal(await count(),h);await page.locator(`[data-lock="${ha}"]`).click();checks.push('Host plus dependent holes, sibling-only hole reorder and dependent locks');
  const json=await page.evaluate(()=>JSON.stringify(SpatialEditor.project));await page.evaluate(json=>SpatialEditor.loadProject(JSON.parse(json)),json);assert.deepEqual(await order(),[host,hb,ha,other]);
  await page.waitForFunction(()=>{const key='spatial-studio-v9:'+location.pathname;const saved=localStorage.getItem(key);return saved&&JSON.parse(saved).documents[0]?.id===SpatialEditor.document.id});
  await page.reload();assert.deepEqual(await order(),[host,hb,ha,other]);checks.push('JSON and autosave reload preserve ordering');
  // Long lists must scroll while the pointer remains at the panel edge.
  const many=await fresh(24);await page.locator('#layers').evaluate(el=>{const pane=el.closest('aside');pane.scrollTop=el.offsetTop-pane.offsetTop-12});await row(many[23]).scrollIntoViewIfNeeded();
  const from=await row(many[23]).boundingBox(),pane=await page.locator('#layers').evaluate(el=>{const b=el.closest('aside').getBoundingClientRect();return {left:b.left,right:b.right,bottom:b.bottom}});const x=from.x+40;await page.mouse.move(x,from.y+from.height/2);await page.mouse.down();await page.mouse.move(x,pane.bottom-10,{steps:12});
  const initial=await page.locator('#layers').evaluate(el=>el.closest('aside').scrollTop);await page.waitForFunction(initial=>document.querySelector('#layers').closest('aside').scrollTop>initial+100,initial);const end=await page.locator('#layers').boundingBox();await page.mouse.move(x,Math.min(pane.bottom-12,end.y+end.height-4));await page.mouse.up();assert.notEqual((await order()).indexOf(many[23]),0);checks.push('Long list auto-scroll while dragging and release within the list');
  // Narrow layout keeps the list available in the tools panel; both themes retain feedback.
  const responsive=[];
  for(const width of [1440,390])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:1200});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   if(width<=990)await page.locator('[data-shell-pane="tools"]').click();
   [a,b,c,d,e]=await fresh();await row(e).click();await row(c).click({modifiers:['Shift']});assert.deepEqual(await selected(),[e,d,c]);await start(e,a,true);assert(await page.locator('.layer-insertion-line').isVisible());await page.screenshot({path:path.join(out,`${width}-${theme}.png`),fullPage:true});await page.mouse.up();assert.deepEqual(await order(),[b,a,e,d,c]);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!overflow);responsive.push({width,theme,overflow});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,responsive,errors,requests},null,2));
  console.log('PASS Chrome component list: real Shift/Ctrl selection, single/batch pointer reorder and preview, cancel/undo/redo, rename/icons, host holes/locks, JSON/autosave, auto-scroll, desktop/narrow light/dark. Evidence: qa/component-list/.');
 }catch(e){console.error(e);throw e}finally{await browser.close()}
})().catch(()=>process.exitCode=1);
