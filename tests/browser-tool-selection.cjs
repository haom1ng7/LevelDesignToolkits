// Canvas selection must update the actual tool, toolbar and handles together.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],out=path.join(__dirname,'../qa/tool-selection');fs.mkdirSync(out,{recursive:true});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const ids=await page.evaluate(()=>{const A=SpatialEditor,M=StudioModel;A.createDocument('space','工具状态同步');A.document.objects=[];const objects=[M.createObject(A.document,'wall',[270,350,0]),M.createObject(A.document,'wall',[760,350,0])];A.document.objects.push(...objects);A.select(objects[0].id,false,true);A.command('fit');return objects.map(o=>o.id)});
  const canvasPoint=async id=>page.evaluate(id=>{const A=SpatialEditor,polys=A.scene.faces.filter(f=>f.owner.id===id).map(f=>f.poly),p=polys.map(poly=>poly.reduce((a,p)=>[a[0]+p[0]/poly.length,a[1]+p[1]/poly.length],[0,0])).find(p=>StudioRender.pickAll(p,A.scene,A.document,A.view)[0]?.id===id);if(!p)throw Error('target component is not the first canvas hit');const q=new DOMPoint(...p).matrixTransform(document.querySelector('#canvas').getScreenCTM());if(!document.elementFromPoint(q.x,q.y)?.closest('#canvas'))throw Error('target component is outside the visible canvas');return {x:q.x,y:q.y}},id);
  const assertTool=async(expected,label)=>{
   assert.equal(await page.evaluate(()=>SpatialEditor.tool),expected,label+' actual tool');
   assert.deepEqual(await page.locator('[data-tool].active').evaluateAll(els=>els.map(el=>el.dataset.tool)),[expected],label+' active toolbar');
   assert.deepEqual(await page.locator('[data-tool][aria-pressed="true"]').evaluateAll(els=>els.map(el=>el.dataset.tool)),[expected],label+' accessible toolbar');
  };
  const before=await page.evaluate(()=>({objects:JSON.stringify(SpatialEditor.document.objects),undo:SpatialEditor.undoCount}));
  for(const mode of ['plan','elevation','solid']){
   await page.locator(`[data-view="${mode}"]`).click();
   for(const previous of mode==='solid'?['rotate','size']:['rotate','size','vertex']){
    await page.evaluate(id=>SpatialEditor.select(id,false,true),ids[0]);await page.locator(`[data-tool="${previous}"]`).click();await assertTool(previous,mode+' initial '+previous);
    const p=await canvasPoint(ids[1]);await page.mouse.move(p.x,p.y);await page.mouse.down();
    assert.equal(await page.evaluate(()=>SpatialEditor.selection.id),ids[1],mode+' selects clicked component');
    await assertTool('move',mode+' selecting from '+previous+' on pointerdown');await page.mouse.up();await assertTool('move',mode+' after pointerup');
    assert.equal(await page.locator('[data-ring],[data-world-rotate],[data-solid-corner],[data-size]').count(),0,'previous transform handles removed');
    if(mode==='solid')assert.equal(await page.locator('[data-world-handle]').count(),6,'solid selection shows move handles');
   }
   // Clicking the same component body keeps its explicitly chosen rotate tool.
   await page.locator('[data-tool="rotate"]').click();const p=await canvasPoint(ids[1]);await page.mouse.click(p.x,p.y);await assertTool('rotate',mode+' same selection preserves rotate');
   // Ctrl adds/removes a component and synchronizes the toolbar immediately.
   const q=await canvasPoint(ids[0]);await page.keyboard.down('Control');await page.mouse.click(q.x,q.y);await page.keyboard.up('Control');await assertTool('move',mode+' ctrl add');
   assert.equal(await page.evaluate(()=>SpatialEditor.selection.ids.length),2);await page.keyboard.down('Control');await page.mouse.click(q.x,q.y);await page.keyboard.up('Control');await assertTool('move',mode+' ctrl remove');
  }
  assert.deepEqual(await page.evaluate(()=>({objects:JSON.stringify(SpatialEditor.document.objects),undo:SpatialEditor.undoCount})),before,'selection and tools do not edit geometry or history');
  // A locked component falls back to Select, without stale rotate highlighting.
  await page.evaluate(id=>{SpatialEditor.document.objects.find(o=>o.id===id).locked=true},ids[0]);await page.locator('[data-tool="rotate"]').click();const locked=await canvasPoint(ids[0]);await page.mouse.click(locked.x,locked.y);await assertTool('select','locked component');assert.equal(await page.locator('[data-world-handle],[data-world-rotate]').count(),0);
  await page.evaluate(ids=>{SpatialEditor.document.objects.find(o=>o.id===ids[0]).locked=false;SpatialEditor.select(ids[1],false,true)},ids);
  await page.locator('[data-tool="rotate"]').click();const last=await canvasPoint(ids[0]);await page.mouse.click(last.x,last.y);await assertTool('move','final canvas selection');await page.locator('[data-tool="move"]').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));await page.screenshot({path:path.join(out,'canvas-select-move.png')});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks:['canvas selection from rotate/size/vertex','toolbar active and aria-pressed on pointerdown and pointerup','plan/elevation/solid','same selection preserves rotate','Ctrl multi-selection','locked fallback','geometry/history unchanged'],errors},null,2));
  console.log('PASS Chrome canvas selection: tool, toolbar and handles agree across three views; rotate/size/vertex, Ctrl selection, same-selection rotation, locked fallback and geometry/history isolation. Evidence: qa/tool-selection/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
