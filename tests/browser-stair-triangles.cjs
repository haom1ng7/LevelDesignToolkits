// Reproduce every adjacent-corner collapse with actual Chrome pointer events.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const out=path.join(__dirname,'../qa/stair-triangles');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],network=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const state=()=>page.evaluate(()=>JSON.stringify(SpatialEditor.document.objects));
  const point=i=>page.locator(`[data-vertex="${i}"]`).evaluate(el=>{const p=new DOMPoint(+el.getAttribute('cx'),+el.getAttribute('cy')).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y}});
  const setup=async()=>{await page.evaluate(()=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument('space','三角楼梯检查');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];
   const o=M.createObject(A.document,'stairs',[600,400,0]);o.flights[0].points=[[-50,-100],[50,-100],[50,100],[-50,100]];A.document.objects.push(o);document.querySelector('[data-view="plan"]').click();A.select(o.id,false,true);A.setTool('vertex');document.querySelector('#snap').checked=false;document.querySelector('#geometry-snap').checked=true;A.command('fit-selected');A.command('zoom-out');A.command('zoom-out');
  });await page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled(document.getAnimations().map(a=>a.finished))})};
  const verify=()=>page.evaluate(()=>{
   const A=SpatialEditor,M=StudioModel,o=A.document.objects[0],f=o.flights[0],tops=M.geometry(A.document,o).filter(f=>f.side===1).map(f=>f.points.map(p=>M.local(A.document,o,p))),length=200/f.steps;
   return {points:f.points,corners:new Set(f.points.map(p=>p.join(','))).size,steps:f.steps,tops:tops.length,parallel:tops.every(ps=>{const lo=Math.min(...ps.map(p=>p[1])),hi=Math.max(...ps.map(p=>p[1]));return Math.abs(hi-lo-length)<1e-6&&ps.every(p=>Math.abs(p[1]-lo)<1e-6||Math.abs(p[1]-hi)<1e-6)}),history:A.undoCount};
  });
  for(let from=0;from<4;from++)for(const to of [(from+1)%4,(from+3)%4]){
   await setup();const before=await state(),history=await page.evaluate(()=>SpatialEditor.undoCount),a=await point(from),b=await point(to);
   const hit=await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.outerHTML,a);assert(hit?.includes(`data-vertex="${from}"`),`vertex ${from} reachable ${JSON.stringify({a,b,hit})}`);
   await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:12});await page.mouse.up();
   const result=await verify();assert.equal(result.corners,3,`${from}->${to} collapses exactly ${JSON.stringify(result)}`);assert(result.parallel,`${from}->${to} parallel treads`);assert.equal(result.steps,result.tops);assert.equal(result.history,Math.min(80,history+1));
   const after=await state();await page.keyboard.press('Control+z');assert.equal(await state(),before);await page.keyboard.press('Control+Shift+z');assert.equal(await state(),after);
   await page.evaluate(()=>{SpatialEditor.select(SpatialEditor.document.objects[0].id,false,true);SpatialEditor.setTool('vertex')});
   const c=await point((from+2)%4);await page.mouse.move(c.x,c.y);await page.mouse.down();await page.mouse.move(c.x+30,c.y+20,{steps:4});await page.keyboard.press('Escape');await page.mouse.up();assert.equal(await state(),after,'cancel restores triangle');
   checks.push({from,to,...result});
  }
  // Height editing must move the merged corner's actual end, in one history entry.
  await page.evaluate(()=>{const A=SpatialEditor,o=A.document.objects[0];o.flights[0].points=[[-50,-100],[50,100],[50,100],[-50,100]];document.querySelector('[data-view="elevation"]').click();document.querySelector('[data-side="left"]').click();A.select(o.id,false,true);A.setTool('vertex');A.command('fit-selected');A.command('zoom-out')});
  const beforeHeight=await state(),heightHistory=await page.evaluate(()=>SpatialEditor.undoCount),height=await point(1);
  await page.mouse.move(height.x,height.y);await page.mouse.down();await page.mouse.move(height.x,height.y-30,{steps:8});await page.mouse.up();
  const heightResult=await page.evaluate(()=>{const A=SpatialEditor,M=StudioModel,o=A.document.objects[0];return {start:o.flights[0].start,end:o.flights[0].end,controls:M.controls(A.document,o,'elevation').map(c=>c.point),history:A.undoCount}});
  assert.equal(heightResult.start,0);assert(heightResult.end>160);assert.deepEqual(heightResult.controls[1],heightResult.controls[2]);assert.equal(heightResult.history,Math.min(80,heightHistory+1));await page.keyboard.press('Control+z');assert.equal(await state(),beforeHeight);checks.push({height:heightResult});
  await page.evaluate(()=>SpatialEditor.select(SpatialEditor.document.objects[0].id,false,true));const beforeSize=await state(),sizeHistory=await page.evaluate(()=>SpatialEditor.undoCount);
  await page.locator('#prop-dimensionZ').fill('258');await page.locator('#prop-dimensionZ').press('Tab');
  const resized=await page.evaluate(()=>{const A=SpatialEditor,o=A.document.objects[0],f=o.flights[0];return {start:f.start,end:f.end,thickness:o.thickness,history:A.undoCount}});
  assert.equal(resized.start,0);assert.equal(resized.end,240);assert.equal(resized.thickness,18);assert.equal(resized.history,Math.min(80,sizeHistory+1));const afterSize=await state();await page.keyboard.press('Control+z');assert.equal(await state(),beforeSize);await page.keyboard.press('Control+Shift+z');assert.equal(await state(),afterSize);checks.push({resize:resized});
  // Render the same four triangular outlines as the report, with no controls.
  await page.evaluate(()=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument('space','三角楼梯四向对照');A.project.documents.splice(0,A.project.documents.length-1);const d=A.document;d.objects=[];d.width=800;d.height=800;
   for(const [position,from,to] of [[[250,250,0],0,1],[[550,250,0],3,2],[[250,550,0],2,3],[[550,550,0],1,2]]){const o=M.createObject(d,'stairs',position);o.flights[0].points=[[-50,-100],[50,-100],[50,100],[-50,100]];o.flights[0].points[from]=[...o.flights[0].points[to]];M.updateCounts(o);d.objects.push(o)}
   document.querySelector('[data-view="plan"]').click();A.setTool('select');A.command('fit');
  });
  await page.screenshot({path:path.join(out,'four-triangles.png')});
  for(const mode of ['solid','elevation']){await page.locator(`[data-view="${mode}"]`).click();await page.evaluate(mode=>{if(mode==='solid'){SpatialEditor.view.elevation=60;SpatialEditor.setTool('select')}SpatialEditor.command('fit')},mode);assert(await page.locator('#canvas [data-object]').count()>0);await page.screenshot({path:path.join(out,mode+'.png')})}
  await page.locator('[data-view="plan"]').click();await page.locator('[data-action="export-menu"]').click();
  for(const format of ['svg','png','obj','fbx']){
   await page.locator('#export-format').selectOption(format);await page.waitForFunction(format=>SpatialEditor.exportPreview?.ready&&SpatialEditor.exportPreview.format===format&&!document.querySelector('#export-download').disabled,format);
   if(format==='png')await page.locator('#export-scale').selectOption('1');
   await page.waitForFunction(()=>!document.querySelector('#export-download').disabled);const pending=page.waitForEvent('download');await page.locator('#export-download').click();const download=await pending,target=path.join(out,'triangles.'+format);await download.saveAs(target);assert(fs.statSync(target).size>100);
   if(format==='svg'){const svg=fs.readFileSync(target,'utf8');assert(!/data-vertex|data-midpoint|data-selection-outline/.test(svg));assert(!/NaN|Infinity/.test(svg))}
   checks.push({download:format,bytes:fs.statSync(target).size});
  }
  const [{OBJLoader},{FBXLoader}]=await Promise.all([import('three/examples/jsm/loaders/OBJLoader.js'),import('three/examples/jsm/loaders/FBXLoader.js')]);
  for(const format of ['obj','fbx']){const bytes=fs.readFileSync(path.join(out,'triangles.'+format)),scene=format==='obj'?new OBJLoader().parse(bytes.toString('utf8')):new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o)});assert.equal(meshes.length,4);for(const mesh of meshes){const positions=mesh.geometry.getAttribute('position');assert([...positions.array].every(Number.isFinite));assert(positions.count>0)}checks.push({import:format,meshes:meshes.length})}
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,network},null,2));console.log(`PASS Chrome triangular stairs: 8 actual corner collapses, undo/redo/cancel, merged-end height editing, three views, PNG/SVG/OBJ/FBX downloads and independent model imports. Evidence qa/stair-triangles/.`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
