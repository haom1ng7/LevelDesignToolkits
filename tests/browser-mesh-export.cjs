// Real Chrome download checks; independent importers read the saved files.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const {FBXLoader}=await import('three/addons/loaders/FBXLoader.js'),{OBJLoader}=await import('three/addons/loaders/OBJLoader.js');
 const out=path.join(__dirname,'../qa/mesh-export');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],network=[],report=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const house=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/two-storey-house.json'),'utf8'));await page.evaluate(p=>SpatialEditor.loadProject(p),house);
  const original=await page.evaluate(()=>JSON.stringify(SpatialEditor.project));
  await page.locator('[data-action="export-menu"]').click();
  async function format(value){await page.locator('#export-format').selectOption(value);await page.waitForFunction(value=>SpatialEditor.exportPreview?.ready&&SpatialEditor.exportPreview.format===value&&!document.querySelector('#export-download').disabled,value)}
  const parsedMeshes=scene=>{const a=[];scene.traverse(o=>{if(o.isMesh)a.push(o)});return a};
  for(const value of ['fbx','obj']){
   await format(value);assert.equal(await page.locator('#export-model-note').isVisible(),true);assert.equal(await page.locator('#export-range').isVisible(),false);assert.equal(await page.locator('#export-scale').isVisible(),false);assert.equal(await page.locator('#export-reference-options').isVisible(),false);
   const expected=await page.evaluate(()=>{const p=SpatialEditor.exportPreview;return {meshes:p.model.meshes.length,triangles:p.model.triangles,ids:p.model.meshes.map(m=>m.id)}});assert(expected.meshes>1);
   await page.locator('#export-name').fill('两层小楼.'+value);await page.screenshot({path:path.join(out,'preview-'+value+'.png')});
   // Preview pan/zoom changes the illustration, never the exported mesh.
   const content=await page.locator('#export-preview-content').boundingBox();await page.mouse.move(content.x+content.width*.6,content.y+content.height*.5);await page.mouse.wheel(0,-240);await page.mouse.down();await page.mouse.move(content.x+content.width*.5,content.y+content.height*.6,{steps:5});await page.mouse.up();
   assert.deepEqual(await page.evaluate(()=>SpatialEditor.exportPreview.model.meshes.map(m=>m.id)),expected.ids);
   const pending=page.waitForEvent('download');await page.locator('#export-download').click();const file=await pending;assert.equal(file.suggestedFilename(),'两层小楼.'+value);const target=path.join(out,'download-house.'+value);await file.saveAs(target);const bytes=fs.readFileSync(target),scene=value==='fbx'?new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''):new OBJLoader().parse(bytes.toString('utf8')),objects=parsedMeshes(scene);assert.equal(objects.length,expected.meshes);assert.equal(objects.reduce((s,o)=>s+o.geometry.getAttribute('position').count/3,0),expected.triangles);report.push({format:value,file:path.basename(target),bytes:bytes.length,...expected});
  }
  assert.equal(await page.evaluate(()=>JSON.stringify(SpatialEditor.project)),original,'download and preview preserve the project');
  await format('svg');assert.equal(await page.locator('#export-range').isVisible(),true);assert.equal(await page.locator('#export-model-note').isVisible(),false);
  for(const value of ['svg','png']){
   await format(value);if(value==='png')await page.locator('#export-scale').selectOption('1');await page.waitForFunction(()=>!document.querySelector('#export-download').disabled);
   const pending=page.waitForEvent('download');await page.locator('#export-download').click();const file=await pending,target=path.join(out,'download-image.'+value);await file.saveAs(target);const bytes=fs.readFileSync(target);if(value==='png')assert.equal(bytes.toString('ascii',1,4),'PNG');else{assert(bytes.toString('utf8').includes('<svg'));assert(!/data-world-(handle|rotate)|data-solid-corner/.test(bytes.toString('utf8')))}
  }
  await page.locator('[data-action="export-close"]').first().click();
  // Active planar floor and elevation selection do not constrain a 3D export.
  for(const mode of ['elevation','solid','plan']){await page.locator('[data-view="'+mode+'"]').click();await page.locator('[data-action="export-menu"]').click();await format('obj');assert.equal(await page.evaluate(()=>SpatialEditor.exportPreview.model.meshes.length),report[0].meshes);await page.locator('[data-action="export-close"]').first().click()}
  await page.setViewportSize({width:390,height:844});await page.locator('[data-action="export-menu"]').click();await format('fbx');await page.locator('#export-download').scrollIntoViewIfNeeded();assert.equal(await page.locator('#export-download').isVisible(),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(out,'preview-mobile.png'),fullPage:true});await page.locator('[data-action="export-close"]').first().click();
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>SpatialEditor.createDocument('curve'));await page.locator('[data-action="export-menu"]').click();assert.equal(await page.locator('#export-format').inputValue(),'png');for(const value of ['fbx','obj'])assert(await page.locator('#export-format option[value="'+value+'"]').evaluate(el=>el.disabled));await page.locator('[data-action="export-close"]').first().click();
  await page.evaluate(()=>{SpatialEditor.createDocument('space');SpatialEditor.document.objects=[];SpatialEditor.setTool('select')});await page.locator('[data-action="export-menu"]').click();await page.locator('#export-format').selectOption('obj');await page.waitForFunction(()=>document.querySelector('#export-ready').textContent.includes('没有可导出的实体'));assert(await page.locator('#export-download').isDisabled());
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));console.log('PASS Chrome model export: actual binary FBX/OBJ downloads independently imported; full floors in three views; filename, pan/zoom and project isolation; mobile controls; empty/curve cases; PNG/SVG downloads; no browser/CSP errors or network requests. Evidence: qa/mesh-export/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
