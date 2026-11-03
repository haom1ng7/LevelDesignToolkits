// Real browser coverage for edge hover, release-to-place and cancellation.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
const {selectTool}=require('./tool-menu.cjs');
(async()=>{
 const out=path.join(__dirname,'../qa/wall-placement');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'}),errors=[],network=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);await page.evaluate(()=>document.fonts.ready);
  const setup=async(angle=0)=>page.evaluate(angle=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument('space','墙壁沿边放置');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];A.document.floors[0].height=350;
   const o=M.createObject(A.document,'plane',[600,400,25]);o.points=[[-260,-170],[260,-170],[260,170],[-260,170]];o.orientation=M.axisRotation([0,0,1],angle);A.document.objects.push(o);
   const r=document.querySelector('#stage').getBoundingClientRect();Object.assign(A.camera,{x:0,y:0,w:1200,h:1200*r.height/r.width});document.querySelector('#snap').checked=true;A.setTool('select');return o.id;
  },angle);
  const screen=p=>page.locator('#canvas').evaluate((el,p)=>{const q=new DOMPoint(...p).matrixTransform(el.getScreenCTM());return {x:q.x,y:q.y}},p);
  const edge=async(i=0)=>page.evaluate(i=>{const A=SpatialEditor,M=StudioModel,o=A.document.objects[0],a=M.world(A.document,o,[...o.points[i],0]),b=M.world(A.document,o,[...o.points[(i+1)%o.points.length],0]);return {a,b,q:M.project(M.mul(M.add(a,b),.5),A.scene.basis)}},i);
  const hover=async(q)=>{const p=await screen(q);await page.mouse.move(p.x,p.y);return p};
  const click=async q=>{const p=await hover(q);await page.mouse.click(p.x,p.y)};
  const state=()=>page.evaluate(()=>({objects:JSON.stringify(SpatialEditor.document.objects),history:SpatialEditor.undoCount,tool:SpatialEditor.tool}));
  const exactWall=async e=>{
   const result=await page.evaluate(()=>{const A=SpatialEditor,M=StudioModel,o=A.document.objects.at(-1);M.validate(A.project);return {type:o.type,a:M.world(A.document,o,[o.points[0][0],0,o.points[0][1]]),b:M.world(A.document,o,[o.points[1][0],0,o.points[1][1]]),thickness:o.thickness,height:o.points[3][1]-o.points[0][1],floor:o.floor,source:A.document.objects[0].floor,selection:A.selection.id,id:o.id}});
   assert.equal(result.type,'wall');for(const key of ['a','b'])result[key].forEach((v,i)=>assert(Math.abs(v-e[key][i])<1e-5));assert.equal(result.thickness,18);assert.equal(result.height,180);assert.equal(result.floor,result.source);assert.equal(result.selection,result.id);return result;
  };
  for(const angle of [0,.39]){
   const id=await setup(angle);await selectTool(page,'wall');assert((await page.locator('[data-tool="wall"]').getAttribute('title')).includes('边'));
   const before=await state(),e=await edge();const p=await hover(e.q);assert.equal(await page.locator('[data-wall-edge]').getAttribute('data-wall-edge'),id);assert.deepEqual(await state(),before,'hover has no model/history effect');assert.equal(await page.locator('[data-create-preview]').count(),0);
   await page.screenshot({path:path.join(out,angle?'rotated-edge.png':'edge-highlight.png')});await page.mouse.down();assert.deepEqual(await state(),before,'press does not commit');await page.mouse.up();await exactWall(e);assert.equal((await state()).history,before.history+1);assert.equal((await state()).tool,'wall');
   const after=await state();await page.keyboard.press('Control+z');assert.equal((await state()).objects,before.objects);await page.keyboard.press('Control+Shift+z');assert.equal((await state()).objects,after.objects);
   await selectTool(page,'wall');const second=await edge(1);await click(second.q);await exactWall(second);assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),3);await page.screenshot({path:path.join(out,angle?'rotated-walls.png':'walls-created.png')});
   const unchanged=await state();await click([1050,650]);await click([600,400]);assert.deepEqual(await state(),unchanged,'blank and interior clicks keep tool active');
   assert.equal(await page.evaluate(()=>SpatialEditor.renderSVG().includes('data-wall-edge=')),false);checks.push({angle,exactEndpoints:true,continuous:true,history:true,exportExcluded:true});
  }
  for(const cancel of ['Escape','right','drag','pointercancel','view','floor']){
   await setup();await selectTool(page,'wall');const before=await state(),e=await edge(),p=await hover(e.q);await page.mouse.down();
   if(cancel==='Escape')await page.keyboard.press('Escape');
   if(cancel==='right')await page.mouse.click(p.x,p.y,{button:'right'});
   if(cancel==='drag')await page.mouse.move(p.x+70,p.y+50,{steps:8});
   if(cancel==='pointercancel')await page.locator('#canvas').dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse',bubbles:true});
   if(cancel==='view')await page.evaluate(()=>document.querySelector('[data-view="elevation"]').click());
   if(cancel==='floor')await page.evaluate(()=>document.querySelector('[data-floor]').click());
   await page.mouse.up();assert.equal((await state()).objects,before.objects,cancel);assert.equal((await state()).history,before.history,cancel);assert.equal(await page.locator('[data-wall-edge]').count(),0,cancel);checks.push({cancel,preserved:true});
  }
  // Leave clears the highlight; locked and hidden components cannot receive walls.
  await setup();await selectTool(page,'wall');await hover((await edge()).q);await page.mouse.move(50,50);assert.equal(await page.locator('[data-wall-edge]').count(),0);
  for(const property of ['locked','visible']){await setup();await page.evaluate(property=>{SpatialEditor.document.objects[0][property]=property==='locked';SpatialEditor.setTool('select')},property);await selectTool(page,'wall');const before=await state();await click((await edge()).q);assert.equal(await page.locator('[data-wall-edge]').count(),0);assert.deepEqual(await state(),before)}
  checks.push({leaveAndIneligible:true});
  await page.setViewportSize({width:390,height:844});await setup();await page.locator('[data-shell-pane="tools"]').click();await selectTool(page,'wall');
  // Fit after the mobile panel closes, so the physical edge is inside the canvas.
  await page.evaluate(()=>{SpatialEditor.command('fit')});const e=await edge();await hover(e.q);assert.equal(await page.locator('[data-wall-edge]').count(),1);await page.screenshot({path:path.join(out,'narrow-highlight.png')});await click(e.q);await exactWall(e);checks.push({width:390,placed:true});
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,network},null,2));
  console.log('PASS Chrome wall placement: actual tool click, edge highlight, exact rotated geometry/floor, click release, continuous placement, blank/interior clicks, cancel, history, visibility, export exclusion and 390px layout. Evidence: qa/wall-placement/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
