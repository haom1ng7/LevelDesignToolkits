const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const out=path.join(__dirname,'../qa/stair-ramp');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],network=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const id=await page.evaluate(()=>{const A=SpatialEditor,M=StudioModel;A.createDocument('space','斜面验证');A.project.documents.splice(0,A.project.documents.length-1);const d=A.document;d.objects=[];const o=M.createObject(d,'stairs',[600,400,0]);d.objects.push(o);document.querySelector('[data-view="solid"]').click();A.select(o.id,false,true);A.setTool('select');A.command('fit-selected');return o.id});
  const read=()=>page.evaluate(()=>{const A=SpatialEditor,M=StudioModel,o=A.document.objects[0],f=o.flights[0],faces=M.geometry(A.document,o);return {steps:f.steps,mode:o.countMode,faces:faces.length,tops:faces.filter(f=>f.side===1).length,finite:faces.every(f=>f.points.every(p=>p.every(Number.isFinite))),history:A.undoCount}});
  const original=await read();await page.locator('#flight-steps').fill('0');await page.locator('#flight-steps').press('Tab');
  const ramp=await read();assert.equal(ramp.steps,0);assert.equal(ramp.mode,'manual');assert.equal(ramp.tops,1);assert.equal(ramp.faces,6);assert(ramp.finite);assert.equal(ramp.history,original.history+1);
  await page.locator('[data-action="undo"]').click();assert.equal((await read()).steps,original.steps);await page.locator('[data-action="redo"]').click();assert.equal((await read()).steps,0);checks.push({input:ramp});
  await page.evaluate(id=>SpatialEditor.select(id,false,true),id);await page.locator('#flight-end').fill('240');await page.locator('#flight-end').press('Tab');assert.equal((await read()).steps,0);
  const saved=await page.evaluate(()=>JSON.parse(JSON.stringify(SpatialEditor.project)));await page.evaluate(p=>SpatialEditor.loadProject(p),saved);assert.equal((await read()).steps,0);
  for(const mode of ['plan','elevation','solid']){await page.locator(`[data-view="${mode}"]`).click();await page.evaluate(()=>{SpatialEditor.setTool('select');SpatialEditor.command('fit')});assert(await page.locator('#canvas [data-object]').count()>0);await page.screenshot({path:path.join(out,mode+'.png')});checks.push({view:mode,...await read()})}
  await page.locator('[data-action="export-menu"]').click();
  for(const format of ['svg','png','obj','fbx']){
   await page.locator('#export-format').selectOption(format);await page.waitForFunction(format=>SpatialEditor.exportPreview?.ready&&SpatialEditor.exportPreview.format===format&&!document.querySelector('#export-download').disabled,format);
   if(format==='png')await page.locator('#export-scale').selectOption('1');await page.waitForFunction(()=>!document.querySelector('#export-download').disabled);
   const pending=page.waitForEvent('download');await page.locator('#export-download').click();const download=await pending,target=path.join(out,'ramp.'+format);await download.saveAs(target);assert(fs.statSync(target).size>100);
   if(format==='svg'){const svg=fs.readFileSync(target,'utf8');assert(!/NaN|Infinity|data-vertex|data-selection-outline/.test(svg))}
   checks.push({download:format,bytes:fs.statSync(target).size});
  }
  const [{OBJLoader},{FBXLoader}]=await Promise.all([import('three/examples/jsm/loaders/OBJLoader.js'),import('three/examples/jsm/loaders/FBXLoader.js')]);
  for(const format of ['obj','fbx']){const bytes=fs.readFileSync(path.join(out,'ramp.'+format)),scene=format==='obj'?new OBJLoader().parse(bytes.toString('utf8')):new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o)});assert.equal(meshes.length,1);assert.equal(meshes[0].geometry.getAttribute('position').count,36,'ramp exports twelve triangles');checks.push({import:format,meshes:meshes.length})}
  await page.getByRole('button',{name:'关闭导出预览'}).click();await page.setViewportSize({width:390,height:844});await page.locator('[data-shell-pane="properties"]').click();await page.evaluate(id=>SpatialEditor.select(id,false,true),id);
  await page.locator('#flight-steps').fill('4');await page.locator('#flight-steps').press('Tab');assert.equal((await read()).tops,4);await page.locator('#flight-steps').fill('0');await page.locator('#flight-steps').press('Tab');assert.equal((await read()).tops,1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(out,'narrow.png')});
  await page.reload();assert.equal((await read()).steps,0,'autosave restores ramp');assert.equal((await read()).tops,1);
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,network},null,2));
  console.log('PASS Chrome zero-step ramp: actual numeric input, undo/redo, endpoint edit, JSON and autosave, three views, narrow screen, PNG/SVG/OBJ/FBX downloads and independent imports. Evidence qa/stair-ramp/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
