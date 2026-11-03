// Selected routes must keep the GPU navigation path and resolve surfaces on demand.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),out=path.join(__dirname,'../qa/route-selection'),errors=[],network=[],checks=[];fs.mkdirSync(out,{recursive:true});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const id=await page.evaluate(()=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument('space','路线选择性能');const d=A.document;d.width=4000;d.height=3000;d.objects=[];
   for(let y=0;y<16;y++)for(let x=0;x<25;x++)d.objects.push(M.createObject(d,'plane',[x*300+200,y*300+200,0]));
   const route=M.createObject(d,'route',[2000,1600,100]);route.points=[[-300,0,0],[0,180,20],[300,0,0]];d.objects.push(route);A.setTool('select');return route.id;
  });
  await page.locator('[data-view="solid"]').click();await page.evaluate(id=>{SpatialEditor.select(id,false,true);SpatialEditor.command('fit-selected')},id);await page.evaluate(()=>document.fonts.ready);
  const canvas=page.locator('#canvas'),box=await canvas.boundingBox(),empty={x:box.x+box.width*.94,y:box.y+box.height*.08};
  await page.evaluate(()=>{
   const R=StudioRender,original=R.scene;window.__routeSceneWork={calls:0,solidObjects:0,maxObjects:0};
   R.scene=function(d,...args){const s=window.__routeSceneWork;s.calls++;s.maxObjects=Math.max(s.maxObjects,d.objects.length);s.solidObjects+=d.objects.filter(o=>StudioMeshExport.solidTypes.has(o.type)).length;return original.call(this,d,...args)};
  });
  const before=await page.evaluate(()=>({stats:SpatialEditor.viewportStats,project:JSON.stringify(SpatialEditor.project),undo:SpatialEditor.undoCount}));
  await page.mouse.move(empty.x,empty.y);await page.mouse.down({button:'right'});await page.keyboard.down('d');const started=Date.now();await page.waitForTimeout(1200);await page.keyboard.up('d');await page.mouse.move(empty.x-35,empty.y+20,{steps:5});await page.mouse.up({button:'right'});
  const after=await page.evaluate(()=>({stats:SpatialEditor.viewportStats,work:{...window.__routeSceneWork},project:JSON.stringify(SpatialEditor.project),undo:SpatialEditor.undoCount}));
  const performance={elapsed:Date.now()-started,frames:after.stats.frames-before.stats.frames,work:after.work,statsBefore:before.stats,statsAfter:after.stats};
  performance.averageFPS=performance.frames/(performance.elapsed/1000);
  await page.screenshot({path:path.join(out,'selected-route.png')});
  await page.keyboard.press('l');
  const measureHUD=()=>page.evaluate(()=>{
   const hint=document.querySelector('#drawing-hint'),view=document.querySelector('#view-controls'),a=hint.getBoundingClientRect(),b=view.getBoundingClientRect();
   return {hint:{x:a.x,y:a.y,w:a.width,h:a.height},view:{x:b.x,y:b.y,w:b.width,h:b.height},overlap:Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top),buttons:[...hint.querySelectorAll('button')].map(el=>{const r=el.getBoundingClientRect();return {text:el.textContent,hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})};
  });
  const hud=await measureHUD();
  await page.screenshot({path:path.join(out,'drawing-hud.png')});
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({performance,hud,errors,network},null,2));
  assert.equal(after.work.solidObjects,0,'selected route navigation must not project the entire solid scene');
  assert.equal(after.stats.geometryBuilds,before.stats.geometryBuilds);assert.equal(after.stats.sceneBuilds,before.stats.sceneBuilds);assert(performance.frames>=10,'camera renders multiple frames');
  assert.equal(after.project,before.project);assert.equal(after.undo,before.undo);assert.equal(hud.overlap,false,'drawing actions and camera controls must not overlap');assert(hud.buttons.every(b=>b.hit),'drawing actions must receive pointer hits');
  checks.push('400 solids and selected route: camera travel/orbit reuses GPU geometry, projects no solid scene, preserves project/history; drawing hint and actions remain above camera controls');
  await page.locator('#drawing-hint [data-action="cancel"]').click();assert.equal(await page.evaluate(()=>SpatialEditor.drawing),null);
  // A raised platform with an opening distinguishes exact surface placement from ground fallback.
  const routeId=await page.evaluate(()=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument('space','路线节点贴面');const d=A.document;d.floors[0].height=120;d.gridVisible=false;d.heightReferences=false;
   const base=M.createObject(d,'plane',[600,400,0]);base.points=[[-280,-240],[280,-240],[280,240],[-280,240]];
   const top=M.createObject(d,'plane',[600,400,200]);top.points=[[-120,-120],[120,-120],[120,120],[-120,120]];
   const hole=Object.assign(M.createObject(d,'hole'),{host:top.id,points:[[-40,-40],[40,-40],[40,40],[-40,40]]});
   const route=M.createObject(d,'route',[440,360,40]);route.points=[[0,0,0],[150,150,0],[300,30,0]];d.objects=[base,top,hole,route];A.setTool('select');return route.id;
  });
  await page.locator('[data-view="solid"]').click();await page.evaluate(id=>{SpatialEditor.select(id,false,true);SpatialEditor.command('fit')},routeId);
  const state=()=>page.evaluate(id=>{const A=SpatialEditor,o=A.document.objects.find(o=>o.id===id);return {points:JSON.stringify(o.points),undo:A.undoCount,stats:A.viewportStats}},routeId);
  const atWorld=world=>page.evaluate(world=>{const A=SpatialEditor,M=StudioModel,R=StudioRender,b=M.viewBasis(A.document,A.view),q=M.project(world,b),screen=new DOMPoint(...q).matrixTransform(document.querySelector('#canvas').getScreenCTM()),s=R.scene(A.document,A.view,{interactive:true,ghost:false,camera:A.camera});return {x:screen.x,y:screen.y,expected:R.surface(q,s,A.document,A.view)}},world);
  const nodePoint=index=>page.locator(`[data-vertex="${index}"]`).evaluate(el=>{const p=new DOMPoint(+el.getAttribute('cx'),+el.getAttribute('cy')).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y}});
  const target=await atWorld([680,420,320]),start=await nodePoint(0),original=await state();assert(Math.abs(target.expected[2]-320)<1e-5);
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(target.x,target.y,{steps:10});await page.mouse.up();
  const moved=await state(),world=await page.evaluate(id=>{const A=SpatialEditor,o=A.document.objects.find(o=>o.id===id);return StudioModel.world(A.document,o,o.points[0])},routeId);
  world.forEach((v,i)=>assert(Math.abs(v-target.expected[i])<.05,'node lands on visible raised surface: '+JSON.stringify({world,target})));assert.equal(moved.undo,original.undo+1);assert.equal(moved.stats.sceneBuilds,original.stats.sceneBuilds,'route drag reuses solid batches');assert.equal(moved.stats.geometryBuilds,original.stats.geometryBuilds);
  await page.keyboard.press('Control+z');assert.equal((await state()).points,original.points);await page.keyboard.press('Control+Shift+z');assert.equal((await state()).points,moved.points);await page.evaluate(id=>SpatialEditor.select(id,false,true),routeId);
  const opening=await atWorld([600,400,120]);assert(opening.expected[2]<319,'opening exposes a lower surface');
  let p=await nodePoint(0);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(opening.x,opening.y,{steps:6});await page.mouse.up();
  const through=await page.evaluate(id=>{const A=SpatialEditor,o=A.document.objects.find(o=>o.id===id);return StudioModel.world(A.document,o,o.points[0])},routeId);through.forEach((v,i)=>assert(Math.abs(v-opening.expected[i])<.05,'surface query preserves host openings: '+JSON.stringify({through,opening})));
  await page.keyboard.press('Control+z');await page.evaluate(id=>SpatialEditor.select(id,false,true),routeId);p=await nodePoint(0);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(opening.x,opening.y,{steps:6});await page.keyboard.press('Escape');await page.mouse.up();assert.equal((await state()).points,moved.points,'Escape restores the dragged node');
  const mid=await page.locator('[data-midpoint="0"]').evaluate(el=>{const p=new DOMPoint(+el.getAttribute('cx'),+el.getAttribute('cy')).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y}});
  await page.mouse.click(mid.x,mid.y);assert.equal(JSON.parse((await state()).points).length,4);await page.keyboard.press('Delete');assert.equal(JSON.parse((await state()).points).length,3);await page.keyboard.press('Control+z');assert.equal(JSON.parse((await state()).points).length,4);await page.evaluate(id=>SpatialEditor.select(id,false,true),routeId);
  await page.evaluate(()=>SpatialEditor.command('lock'));assert.equal(await page.locator('[data-vertex]').count(),0);await page.evaluate(()=>SpatialEditor.command('lock'));
  for(const mode of ['plan','elevation','solid']){await page.locator(`[data-view="${mode}"]`).click();assert.equal(await page.locator('[data-vertex]').count(),4)}
  checks.push('Real node drags resolve raised surfaces and host openings, retain GPU batches, one undo/redo and Escape; midpoint insertion, Delete, locks and three views');
  // Buttons must be visible and usable at desktop/phone sizes in both themes.
  const layouts=[];
  for(const width of [1600,390])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:width===390?844:1000});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await canvas.focus();await page.keyboard.press('l');
   const layout=await measureHUD();assert(!layout.overlap&&layout.buttons.every(b=>b.hit),JSON.stringify({width,theme,...layout}));assert(layout.hint.x>=0&&layout.hint.y>=0&&layout.hint.x+layout.hint.w<=width);
   const bounds=await canvas.boundingBox();await page.mouse.click(bounds.x+bounds.width*.35,bounds.y+bounds.height*.25);await page.mouse.click(bounds.x+bounds.width*.6,bounds.y+bounds.height*.35);
   const count=await page.evaluate(()=>SpatialEditor.document.objects.length),undo=await page.evaluate(()=>SpatialEditor.undoCount);await page.locator('#drawing-hint [data-action="finish"]').click();assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),count+1);assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),undo+1);
   await page.keyboard.press('l');await page.screenshot({path:path.join(out,`hud-${width}-${theme}.png`)});await page.locator('#drawing-hint [data-action="cancel"]').click();assert.equal(await page.evaluate(()=>SpatialEditor.drawing),null);assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),count+1);layouts.push({width,theme,...layout});
  }
  checks.push('1600px/390px light/dark: non-overlapping, on-screen drawing actions; actual clicks finish a route in one history step and cancel without creating');
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,performance,hud,layouts,errors,network},null,2));
  console.log('PASS Chrome route selection: '+checks.join('; ')+'. Evidence: qa/route-selection/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
