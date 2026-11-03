// Real pointer gestures for rectangular stairs/ladders and circular spiral stairs.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
const {selectTool}=require('./tool-menu.cjs');
(async()=>{
 const out=path.join(__dirname,'../qa/stair-placement');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'}),errors=[],network=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const setup=async(mode='plan',snap=false)=>page.evaluate(({mode,snap})=>{const A=SpatialEditor;A.createDocument('space','楼梯拖拽放置');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];document.querySelector(`[data-view="${mode}"]`).click();document.querySelector('#snap').checked=snap;document.querySelector('#move-snap').checked=false;if(mode==='elevation')Object.assign(A.camera,{x:0,y:0,w:1200,h:900});A.setTool('select')},{mode,snap});
  const screen=async p=>page.locator('#canvas').evaluate((el,p)=>{const v=new DOMPoint(...p).matrixTransform(el.getScreenCTM());return {x:v.x,y:v.y}},p);
  const state=()=>page.evaluate(()=>({objects:JSON.stringify(SpatialEditor.document.objects),history:SpatialEditor.undoCount,tool:SpatialEditor.tool}));
  const begin=async(a,b)=>{const p=await screen(a),q=await screen(b);assert(await page.evaluate(p=>!!document.elementFromPoint(p.x,p.y)?.closest('#canvas'),p),'gesture starts on canvas '+JSON.stringify({a,b,p,q}));await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(q.x,q.y,{steps:8})};
  const dimensions=()=>page.evaluate(()=>{const A=SpatialEditor,M=StudioModel,o=A.document.objects.at(-1);if(!o)throw Error(JSON.stringify({view:A.view,tool:A.tool,status:document.querySelector('#status').textContent,camera:A.camera}));const ps=M.geometry(A.document,o).flatMap(f=>f.points);M.validate(A.project);return {type:o.type,position:o.position,outer:o.outer,inner:o.inner,rise:o.type==='stairs'?o.flights[0].end-o.flights[0].start:o.end-o.start,size:[0,1,2].map(i=>o.type==='spiral'&&i<2?o.outer*2:Math.max(...ps.map(p=>p[i]))-Math.min(...ps.map(p=>p[i]))),history:A.undoCount,tool:A.tool}});
  for(const type of ['stairs','ladder','spiral']){
   await setup();await selectTool(page,type);const before=await state();
   await begin([250,200],[550,380]);assert.equal((await state()).objects,before.objects,'preview does not commit');assert(await page.locator('[data-create-preview]').count());assert.equal(await page.locator('[data-placement-ghost]').count(),0);
   await page.screenshot({path:path.join(out,type+'-preview.png')});await page.mouse.up();
   const result=await dimensions();assert.equal(result.type,type);assert.equal(result.history,before.history+1);assert.equal(result.tool,type);assert(Math.abs(result.size[0]-300)<1e-5);assert(Math.abs(result.size[1]-(type==='spiral'?300:180))<1e-5);if(type==='spiral')assert(Math.abs(result.inner/result.outer-2/9)<1e-6);
   const after=await state();await page.keyboard.press('Control+z');assert.equal((await state()).objects,before.objects);await page.keyboard.press('Control+Shift+z');assert.equal((await state()).objects,after.objects);
   await selectTool(page,type);await begin([650,200],[850,360]);await page.mouse.up();assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),2,'continuous creation');
   const unchanged=await state();for(const cancel of ['Escape','right','view']){await begin([250,500],[450,650]);if(cancel==='Escape')await page.keyboard.press('Escape');if(cancel==='right')await page.mouse.click((await screen([450,650])).x,(await screen([450,650])).y,{button:'right'});if(cancel==='view')await page.evaluate(()=>document.querySelector('[data-view="elevation"]').click());await page.mouse.up();assert.equal((await state()).objects,unchanged.objects);assert.equal((await state()).history,unchanged.history);assert.equal(await page.locator('[data-create-preview]').count(),0);await page.evaluate(()=>document.querySelector('[data-view="plan"]').click());await selectTool(page,type)}
   await page.screenshot({path:path.join(out,type+'-created.png')});checks.push({type,...result});
  }
  for(const type of ['stairs','ladder','spiral']){
   await setup('plan',true);await selectTool(page,type);await begin([253,247],[566,429]);await page.mouse.up();const snapped=await dimensions();assert(Math.abs(snapped.size[0]/100-Math.round(snapped.size[0]/100))<1e-5);
   await page.keyboard.down('Control');await begin([700,200],[963,373]);await page.mouse.up();await page.keyboard.up('Control');const exact=await dimensions();assert(Math.abs(exact.size[0]-263)<1e-5);assert(Math.abs(exact.size[1]-(type==='spiral'?263:173))<1e-5);checks.push({type,snapped,exact});
   await setup('elevation');await selectTool(page,type);await begin([350,300],[650,540]);await page.mouse.up();const elevation=await dimensions();assert.equal(elevation.type,type);assert(Math.abs(elevation.size[0]-300)<1e-5);assert(Math.abs(elevation.rise-240)<1e-5,JSON.stringify(elevation));checks.push({type,elevation});
  }
  await page.setViewportSize({width:760,height:900});await setup();await page.locator('[data-shell-pane="tools"]').click();await selectTool(page,'spiral');const rect=await page.locator('#canvas').boundingBox();await page.mouse.move(rect.x+40,rect.y+60);await page.mouse.down();await page.mouse.move(rect.x+160,rect.y+140,{steps:8});await page.mouse.up();const narrow=await dimensions();assert.equal(narrow.type,'spiral');assert(Math.abs(narrow.size[0]-narrow.size[1])<1e-5);await page.screenshot({path:path.join(out,'narrow.png')});
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,narrow,errors,network},null,2));
  console.log('PASS Chrome stair placement: drag previews/commit, rectangles/circles, repeat, undo/redo, Escape/right/view cancel, grid/Ctrl, elevation, narrow viewport; no page errors or network requests.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
