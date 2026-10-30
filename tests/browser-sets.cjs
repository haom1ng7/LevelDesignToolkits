// Real selection, set-menu commands, mesh edits, offline persistence and downloads.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const THREE=await import('three'),{FBXLoader}=await import('three/addons/loaders/FBXLoader.js'),{OBJLoader}=await import('three/addons/loaders/OBJLoader.js');
 const out=path.join(__dirname,'../qa/sets');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],network=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const seed=()=>page.evaluate(()=>{const M=StudioModel,d=M.createDocument('space','集合工具验证');d.objects=[];for(const x of [200,400]){const o=M.createObject(d,'plane',[x,200,0]);Object.assign(o,{points:[[0,0],[400,0],[400,300],[0,300]],thickness:100});d.objects.push(o)}SpatialEditor.loadProject({format:'level-spatial-editor',version:7,documents:[d],activeDocument:d.id});return d.objects.map(o=>o.id)});
  const point=p=>page.evaluate(p=>{const q=new DOMPoint(...p).matrixTransform(document.querySelector('#canvas').getScreenCTM());return {x:q.x,y:q.y}},p);
  const click=async(p,mod=false)=>{const q=await point(p);if(mod)await page.keyboard.down('Control');await page.mouse.click(q.x,q.y);if(mod)await page.keyboard.up('Control')};
  const state=()=>page.evaluate(()=>JSON.stringify(SpatialEditor.project));
  const choose=async()=>{await click([250,250]);assert(await page.locator('[data-tool-group="sets"]').isDisabled());await click([750,250],true);assert.equal(await page.evaluate(()=>SpatialEditor.selection.ids.length),2);assert(await page.locator('[data-tool-group="sets"]').isEnabled())};
  const operation=async name=>{await page.locator('[data-tool-group="sets"]').click();assert(await page.locator('#tool-sets-menu').isVisible());await page.locator(`[data-tool="${name}"]`).click();assert(await page.locator('#tool-sets-menu').isHidden());assert.equal(await page.evaluate(()=>SpatialEditor.tool),'select')};
  await seed();await choose();const before=await state(),history=await page.evaluate(()=>SpatialEditor.undoCount);
  await page.locator('[data-tool-group="sets"]').hover();await page.locator('#tool-sets-menu').waitFor({state:'visible'});await page.screenshot({path:path.join(out,'menu-desktop.png')});await page.keyboard.press('Escape');assert.equal(await state(),before);
  await operation('intersect');assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),1);assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),history+1);assert.equal(await page.evaluate(()=>SpatialEditor.selection.ids.length),1);await page.screenshot({path:path.join(out,'intersection-plan.png')});
  const intersection=await state();await page.keyboard.press('Control+z');assert.equal(await state(),before);await page.keyboard.press('Control+Shift+z');assert.equal(await state(),intersection);
  await page.evaluate(()=>SpatialEditor.command('autosave'));await page.reload();assert.equal(await page.evaluate(()=>SpatialEditor.document.objects[0].type),'solid');
  await seed();await choose();await operation('difference');assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),2);
  assert.equal(await page.evaluate(()=>StudioRender.pickAll([500,300],SpatialEditor.scene,SpatialEditor.document,SpatialEditor.view).length),0,'removed overlap cannot be picked');
  await page.screenshot({path:path.join(out,'difference-plan.png')});checks.push('actual canvas Ctrl multi-select, menu hover/click, atomic undo/redo, autosave/reload, removed overlap hit test');
  // Actual mesh size and move gestures preserve the removed material.
  await click([250,250]);await page.locator('#prop-dimensionX').fill('300');await page.locator('#prop-dimensionX').press('Tab');assert.equal(+await page.locator('#prop-dimensionX').inputValue(),300);
  await page.keyboard.press('Control+z');await page.locator('[data-tool="size"]').click();const handle=page.locator('[data-size-corner="2"]');assert(await handle.isVisible());const p=await handle.boundingBox();await page.mouse.move(p.x+p.width/2,p.y+p.height/2);await page.mouse.down();await page.mouse.move(p.x+p.width/2+40,p.y+p.height/2+25,{steps:6});await page.mouse.up();assert(+await page.locator('#prop-dimensionX').inputValue()>200);await page.keyboard.press('Control+z');
  await click([250,250]);await page.locator('[data-view="solid"]').click();await page.locator('[data-tool="rotate"]').click();assert(await page.locator('[data-world-rotate="2"]').isVisible());await page.locator('[data-tool="size"]').click();assert.equal(await page.locator('[data-solid-corner]').count(),8);await page.screenshot({path:path.join(out,'difference-solid.png')});
  checks.push('actual numeric size and corner resize with undo, solid rotation and size handles');
  // Export the difference and independently ray-test both model formats.
  await page.locator('[data-tool="select"]').click();await page.locator('[data-action="export-menu"]').click();
  for(const format of ['fbx','obj','svg','png']){
   await page.locator('#export-format').selectOption(format);if(format==='png')await page.locator('#export-scale').selectOption('1');await page.waitForFunction(f=>SpatialEditor.exportPreview?.ready&&SpatialEditor.exportPreview.format===f&&!document.querySelector('#export-download').disabled,format);
   const pending=page.waitForEvent('download');await page.locator('#export-download').click();const download=await pending,target=path.join(out,'difference.'+format);await download.saveAs(target);const bytes=fs.readFileSync(target);
   if(format==='svg'){assert(bytes.toString().includes('<svg'));assert(!/data-world-(handle|rotate)|data-solid-corner/.test(bytes.toString()))}
   else if(format==='png')assert.equal(bytes.toString('ascii',1,4),'PNG');
   else{
    const scene=format==='fbx'?new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''):new OBJLoader().parse(bytes.toString());let volume=0,count=0;
    scene.updateMatrixWorld(true);scene.traverse(o=>{if(!o.isMesh)return;count++;o.material.side=THREE.DoubleSide;const p=o.geometry.getAttribute('position');let signed=0;for(let i=0;i<p.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);signed+=a.dot(b.cross(c))/6}volume+=Math.abs(signed)});assert.equal(count,2);assert(Math.abs(volume-12000000)<1);
    for(const [x,expected] of [[250,true],[500,false],[750,true]])assert.equal(new THREE.Raycaster(new THREE.Vector3(x,300,200),new THREE.Vector3(0,0,-1)).intersectObject(scene,true).length>0,expected,format+' overlap removed');
   }
  }
  await page.locator('[data-action="export-close"]').first().click();checks.push('actual PNG/SVG/OBJ/FBX downloads; independent Three.js volume and rays through retained/removed material');
  // Keyboard-only actions and responsive menu hit testing use the existing flyout.
  await page.locator('[data-view="plan"]').click();await seed();await choose();await page.locator('[data-tool-group="sets"]').focus();await page.keyboard.press('ArrowDown');assert(await page.locator('[data-tool="intersect"]').evaluate(el=>el===document.activeElement));await page.keyboard.press('ArrowDown');assert(await page.locator('[data-tool="difference"]').evaluate(el=>el===document.activeElement));await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.filter(o=>o.type==='solid').length),2);
  for(const width of [1440,990,390,360])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await seed();await page.evaluate(()=>SpatialEditor.command('select-all'));if(width<=990)await page.locator('[data-shell-pane="tools"]').click();
   await page.locator('[data-tool-group="sets"]').click();const layout=await page.locator('#tool-sets-menu').evaluate(el=>{const r=el.getBoundingClientRect(),b=el.querySelector('button').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,hit:document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('[role="menu"]')===el,overflow:document.documentElement.scrollWidth>innerWidth}});assert(layout.left>=0&&layout.top>=0&&layout.right<=width&&layout.bottom<=900&&layout.hit&&!layout.overflow);
   if(width===390)await page.screenshot({path:path.join(out,'menu-mobile-'+theme+'.png')});await page.locator('[data-tool="difference"]').click();assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.filter(o=>o.type==='solid').length),2);if(width<=990)assert.equal(await page.locator('body').getAttribute('data-pane'),'canvas');
  }
  checks.push('keyboard menu execution; 8 viewport/theme layouts, clipping/hit testing and narrow-screen return to canvas');
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,network},null,2));console.log('PASS Chrome sets: real multi-selection/menu/keyboard, editing/history/persistence, 8 layouts, four actual downloads and independent model volume/rays; no errors/network. Evidence: qa/sets/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
