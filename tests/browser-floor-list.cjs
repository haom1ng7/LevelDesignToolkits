// Chrome keyboard input and real pointer gestures, including responsive list feedback.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 const out=path.join(__dirname,'../qa/floor-list');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],requests=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const fresh=async(count=5)=>page.evaluate(count=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument('space','楼层快捷键与排序');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];
   for(let i=1;i<count;i++)A.document.floors.push({id:M.uid(),name:'测试楼层 '+(i+1),height:i*180,visible:i!==2});
   for(const f of A.document.floors){A.document.activeFloor=f.id;const o=M.createObject(A.document,'plane',[500,350,0]);A.document.objects.push(o);const h=Object.assign(M.createObject(A.document,'hole'),{host:o.id,floor:f.id,points:[[-15,-15],[15,-15],[15,15],[-15,15]]});A.document.objects.push(h)}
   A.document.activeFloor=A.document.floors[0].id;A.setTool('select');document.querySelector('#floors').closest('aside').scrollTop=0;return A.document.floors.map(f=>f.id);
  },count);
  const row=id=>page.locator(`#floors [data-floor="${id}"]`),order=()=>page.locator('#floors [data-floor]').evaluateAll(els=>els.map(el=>el.dataset.floor)),active=()=>page.evaluate(()=>SpatialEditor.document.activeFloor),history=()=>page.evaluate(()=>SpatialEditor.undoCount);
  const model=()=>page.evaluate(()=>({floors:Object.fromEntries(SpatialEditor.document.floors.map(f=>[f.id,JSON.stringify(f)]).sort(([a],[b])=>a.localeCompare(b))),objects:JSON.stringify(SpatialEditor.document.objects),active:SpatialEditor.document.activeFloor,selection:SpatialEditor.selection}));
  const start=async(id,target,after=false)=>{
   await row(id).scrollIntoViewIfNeeded();const from=await row(id).boundingBox(),to=await row(target).boundingBox();assert(from&&to);const x=from.x+50,y=after?to.y+to.height-2:to.y+2;
   await page.mouse.move(x,from.y+from.height/2);await page.mouse.down();await page.mouse.move(x,y,{steps:10});return {x,y};
  };
  const drag=async(id,target,after=false)=>{await start(id,target,after);await page.mouse.up()};
  let ids=await fresh(10),h=await history();
  for(let i=0;i<10;i++){await page.keyboard.press('Digit'+((i+1)%10));assert.equal(await active(),ids[i])}
  // Playwright maps Numpad2 to ArrowDown (Num Lock off); send the numeric keypad event through Chrome instead.
  const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'2',code:'Numpad2',text:'2',windowsVirtualKeyCode:98,isKeypad:true});await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:'2',code:'Numpad2',windowsVirtualKeyCode:98,isKeypad:true});assert.equal(await active(),ids[1]);assert.equal(await history(),h);
  await page.locator('[data-panel="document"]').click();await page.locator('#floor-name').fill('数字 1234567890');assert.equal(await active(),ids[1]);await page.locator('#floor-name').press('Tab');
  await page.locator('[data-action="help"]').click();await page.keyboard.press('4');assert.equal(await active(),ids[1]);await page.keyboard.press('Escape');
  await page.locator('#canvas').focus();await page.keyboard.press('Shift+Digit4');assert.equal(await active(),ids[1]);
  ids=await fresh(3);await page.keyboard.press('0');await page.keyboard.press('9');assert.equal(await active(),ids[0]);
  for(const mode of ['plan','elevation','solid']){await page.locator(`[data-view="${mode}"]`).click();await page.keyboard.press('2');assert.equal(await active(),ids[1]);assert.equal(await page.evaluate(()=>SpatialEditor.view.mode),mode);await page.keyboard.press('1')}
  checks.push('Real Digit1–Digit0 and Numpad2; missing floors, text input, dialogs and Shift protection; three views');
  ids=await fresh();const [sa,sb,sc,sd,se]=ids;await page.keyboard.press('2');let initial=await model();h=await history();
  const selectedFloors=()=>page.locator('#floors [aria-pressed="true"]').evaluateAll(els=>els.map(el=>el.dataset.floor));
  await row(sd).click({modifiers:['Control']});assert.deepEqual(await selectedFloors(),[sb,sd]);await row(sb).click({modifiers:['Control']});assert.deepEqual(await selectedFloors(),[sd]);assert.deepEqual(await model(),initial);assert.equal(await history(),h);
  await row(sa).click({modifiers:['Shift']});assert.deepEqual(await selectedFloors(),[sa,sb]);await row(se).click({modifiers:['Control','Shift']});assert.deepEqual(await selectedFloors(),ids);
  await row(sd).click();await row(sb).click({modifiers:['Shift']});assert.deepEqual(await selectedFloors(),[sb,sc,sd]);await row(sc).click({modifiers:['Shift']});assert.deepEqual(await selectedFloors(),[sc,sd]);await page.locator('#canvas').focus();await page.keyboard.press('1');assert.deepEqual(await selectedFloors(),[sa]);
  await row(sb).click({modifiers:['Control']});await row(sd).click({modifiers:['Control']});initial=await model();h=await history();await drag(sd,se,true);assert.deepEqual(await order(),[sc,se,sa,sb,sd]);assert.deepEqual(await selectedFloors(),[sa,sb,sd]);assert.deepEqual(await model(),initial);assert.equal(await history(),h+1);
  await page.keyboard.press('Control+z');assert.deepEqual(await order(),ids);await page.keyboard.press('Control+Shift+z');assert.deepEqual(await order(),[sc,se,sa,sb,sd]);assert.equal(await page.locator('#floors kbd,.floor-name').count(),0);
  checks.push('Real Ctrl toggle, Shift range expansion/contraction, Ctrl+Shift union and stable disjoint batch drag; canvas selection stays unchanged, one undo/redo; original markup without badges');
  ids=await fresh();const [a,b,c,d,e]=ids;await page.keyboard.press('3');let before=await model();h=await history();
  await start(e,b);assert(await page.locator('.floor-drag-ghost').isVisible());assert(await page.locator('.floor-insertion-line').isVisible());assert.deepEqual(await order(),ids);assert.deepEqual(await model(),before);await page.screenshot({path:path.join(out,'drag-preview.png'),fullPage:true});await page.mouse.up();
  assert.deepEqual(await order(),[a,e,b,c,d]);assert.deepEqual(await model(),before);assert.equal(await history(),h+1);assert.equal(await page.locator('.floor-drag-ghost,.floor-insertion-line,.floor-dragging').count(),0);
  await page.keyboard.press('Control+z');assert.deepEqual(await order(),ids);await page.keyboard.press('Control+Shift+z');assert.deepEqual(await order(),[a,e,b,c,d]);await page.keyboard.press('2');assert.equal(await active(),e);
  await drag(a,d,true);assert.deepEqual(await order(),[e,b,c,d,a]);h=await history();const stable=await order();
  await start(a,e);await page.keyboard.press('Escape');await page.mouse.up();assert.deepEqual(await order(),stable);assert.equal(await history(),h);
  await start(a,e);await page.mouse.move(650,700,{steps:6});assert.equal(await page.locator('.floor-insertion-line').isVisible(),false);await page.mouse.up();assert.deepEqual(await order(),stable);
  await start(a,e);await page.evaluate(()=>dispatchEvent(new Event('blur')));await page.mouse.up();assert.deepEqual(await order(),stable);assert.equal(await history(),h);
  checks.push('Real up/down reorder, unchanged heights/visibility/colors/geometry/host links/current selection; one undo/redo, updated numeric mapping; Escape/outside/blur cancellation');
  await page.waitForTimeout(500);await row(b).dblclick();await page.locator('.row-rename').fill('名称 1234567890');await page.locator('.row-rename').press('Enter');assert.equal(await page.evaluate(id=>SpatialEditor.document.floors.find(f=>f.id===id).name,b),'名称 1234567890');
  const visible=await page.evaluate(id=>SpatialEditor.document.floors.find(f=>f.id===id).visible,b);await page.locator(`[data-floor-visible="${b}"]`).click();assert.equal(await page.evaluate(id=>SpatialEditor.document.floors.find(f=>f.id===id).visible,b),!visible);
  const json=await page.evaluate(()=>JSON.stringify(SpatialEditor.project));await page.evaluate(json=>SpatialEditor.loadProject(JSON.parse(json)),json);assert.deepEqual(await order(),stable);
  await page.waitForFunction(()=>{const p=JSON.parse(localStorage.getItem('spatial-studio-v9:'+location.pathname)||'null');return JSON.stringify(p)===JSON.stringify(SpatialEditor.project)});await page.reload();assert.deepEqual(await order(),stable);assert.equal(await active(),b);
  checks.push('Double-click rename with digits, visibility button, JSON round trip and autosave reload');
  const many=await fresh(30);await row(many[0]).scrollIntoViewIfNeeded();const from=await row(many[0]).boundingBox(),pane=await page.locator('#floors').evaluate(el=>{const b=el.closest('aside').getBoundingClientRect();return {left:b.left,right:b.right,bottom:b.bottom}}),x=from.x+50;
  await page.mouse.move(x,from.y+from.height/2);await page.mouse.down();await page.mouse.move(x,pane.bottom-10,{steps:12});const scrollInitial=await page.locator('#floors').evaluate(el=>el.closest('aside').scrollTop);
  await page.waitForFunction(initial=>document.querySelector('#floors').closest('aside').scrollTop>initial+100,scrollInitial);await page.mouse.up();assert((await order()).indexOf(many[0])>0);assert.equal(await order().then(a=>a.length),30);checks.push('30-floor list auto-scroll and insertion while pointer stays at the panel edge');
  const responsive=[];
  for(const width of [1440,390])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:1000});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);if(width<=990)await page.locator('[data-shell-pane="tools"]').click();
   const floors=await fresh();await start(floors[4],floors[1]);assert(await page.locator('.floor-insertion-line').isVisible());await page.screenshot({path:path.join(out,`${width}-${theme}.png`),fullPage:true});await page.mouse.up();assert.deepEqual(await order(),[floors[0],floors[4],floors[1],floors[2],floors[3]]);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!overflow);responsive.push({width,theme,overflow});
  }
  // A real Ctrl/Shift gesture must refresh the artwork as well as the list rows.
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{document.body.dataset.pane='canvas'});
  ids=await fresh(4);await page.evaluate(()=>{
   const A=SpatialEditor;for(const [i,f] of A.document.floors.entries())for(const o of A.document.objects.filter(o=>o.floor===f.id&&o.type!=='hole'))o.position=[240+i*300,350,0];
   document.querySelector('#ghost').checked=false;A.setTool('select');A.command('fit');
  });await page.keyboard.press('1');
  const planes=await page.evaluate(()=>SpatialEditor.document.objects.filter(o=>o.type==='plane').map(o=>o.id));
  const displayed=async()=>page.evaluate(()=>[...new Set(SpatialEditor.scene.faces.filter(f=>!f.ghost).map(f=>f.owner.floor))].sort());
  await row(ids[1]).click({modifiers:['Control']});assert.deepEqual(await displayed(),ids.slice(0,2).sort());assert.equal(await page.locator(`#scene [data-object="${planes[1]}"]`).count()>0,true);
  assert.equal(await row(ids[0]).getAttribute('aria-pressed'),'true');assert.equal(await row(ids[1]).getAttribute('aria-pressed'),'true');
  await page.screenshot({path:path.join(out,'multi-floor-canvas.png'),fullPage:true});
  await page.locator('[data-action="export-menu"]').click();await page.locator('#export-format').selectOption('svg');
  await page.waitForFunction(()=>SpatialEditor.exportPreview?.ready&&SpatialEditor.exportPreview.format==='svg');
  for(const id of planes.slice(0,2))assert(await page.locator(`#export-preview-content [data-object="${id}"]`).count()>0,'export preview contains selected floors');
  let downloaded=page.waitForEvent('download');await page.locator('#export-download').click();let file=await downloaded;await file.saveAs(path.join(out,'multi-floor.svg'));
  const svg=fs.readFileSync(path.join(out,'multi-floor.svg'),'utf8');for(const id of planes.slice(0,2))assert(svg.includes(`data-object="${id}"`));for(const id of planes.slice(2))assert(!svg.includes(`data-object="${id}"`));assert(!svg.includes('data-selection-outline'));
  await page.locator('#export-format').selectOption('png');await page.locator('#export-scale').selectOption('1');
  await page.waitForFunction(()=>SpatialEditor.exportPreview?.ready&&SpatialEditor.exportPreview.format==='png'&&SpatialEditor.exportPreview.mult===1);
  downloaded=page.waitForEvent('download');await page.locator('#export-download').click();file=await downloaded;await file.saveAs(path.join(out,'multi-floor.png'));
  const png=fs.readFileSync(path.join(out,'multi-floor.png'));assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),800);assert(png.length>1000);
  await page.locator('[data-action="export-close"]').first().click();
  const hit=await page.evaluate(id=>{const A=SpatialEditor,M=StudioModel,o=A.document.objects.find(o=>o.id===id),p=M.project(M.world(A.document,o,[40,40,0]),A.scene.basis),svg=document.querySelector('#canvas'),point=svg.createSVGPoint();point.x=p[0];point.y=p[1];const q=point.matrixTransform(svg.getScreenCTM());return {x:q.x,y:q.y}},planes[1]);
  await page.mouse.click(hit.x,hit.y);assert.equal(await page.evaluate(()=>SpatialEditor.selection.id),planes[1]);assert.deepEqual(await displayed(),ids.slice(0,2).sort());
  const blank=await page.evaluate(()=>{const svg=document.querySelector('#canvas'),p=svg.createSVGPoint();p.x=900;p.y=600;const q=p.matrixTransform(svg.getScreenCTM());return {x:q.x,y:q.y}});await page.mouse.click(blank.x,blank.y);assert.deepEqual(await displayed(),ids.slice(0,2).sort(),'clearing component selection keeps floor display scope');
  await page.locator('#canvas').focus();await page.keyboard.press('Escape');assert.deepEqual(await displayed(),ids.slice(0,2).sort());
  await row(ids[0]).click({modifiers:['Control']});assert.deepEqual(await displayed(),[ids[1]]);
  await row(ids[3]).click({modifiers:['Shift']});assert.deepEqual(await displayed(),[ids[0],ids[1],ids[3]].sort(),'Shift range excludes the hidden floor');
  await page.keyboard.press('2');assert.deepEqual(await displayed(),[ids[1]]);
  checks.push('Real Ctrl/Shift updates SVG geometry at full opacity, respects hidden floors, supports picking a non-current floor, retains multiple floors during selection, collapses with digit shortcuts, and exports actual SVG/PNG with the selected floor scope');
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,responsive,errors,requests},null,2));
  console.log('PASS Chrome floor list: real digit/numpad input, typing protection, three views, pointer preview/reorder, unchanged data and selection, history/cancel, rename/icons, JSON/autosave, 30-floor scrolling, desktop/narrow light/dark. Evidence: qa/floor-list/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
