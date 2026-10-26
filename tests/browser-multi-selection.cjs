// Real canvas clicks distinguish narrowing a multi-selection from dragging the batch.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],network=[],checks=[],out=path.join(__dirname,'../qa/multi-selection');fs.mkdirSync(out,{recursive:true});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const ids=()=>page.evaluate(()=>SpatialEditor.selection.ids),history=()=>page.evaluate(()=>SpatialEditor.undoCount),state=()=>page.evaluate(()=>JSON.stringify(SpatialEditor.document.objects));
  const sameIds=async expected=>assert.deepEqual((await ids()).sort(),[...expected].sort());
  const select=async values=>page.evaluate(values=>values.forEach((id,i)=>SpatialEditor.select(id,i>0,true)),values);
  const point=async id=>page.evaluate(id=>{
   const A=SpatialEditor,R=StudioRender,canvas=document.querySelector('#canvas'),matrix=canvas.getScreenCTM();
   for(const f of A.scene.faces.filter(f=>f.owner.id===id)){
    const center=f.poly[0].map((_,i)=>f.poly.reduce((sum,p)=>sum+p[i],0)/f.poly.length);
    for(const q of [center,...f.poly.map(p=>p.map((v,i)=>(v+center[i]*3)/4))]){
     if(R.pickAll(q,A.scene,A.document,A.view)[0]?.id!==id)continue;
     const p=new DOMPoint(...q).matrixTransform(matrix),target=document.elementFromPoint(p.x,p.y);
     if(target?.closest('#canvas')&&!target.closest('[data-world-handle],[data-solid-ring],[data-solid-size-corner],[data-ring],[data-vertex],[data-midpoint]'))return {x:p.x,y:p.y};
    }
   }
   throw Error('No reachable canvas face for '+id);
  },id);
  const fresh=async mode=>{
   const values=await page.evaluate(()=>{const A=SpatialEditor,M=StudioModel;A.createDocument('space','多选后单击验收');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];const values=[350,850].map(x=>{const o=M.createObject(A.document,'wall',[x,250,0]);o.thickness=80;A.document.objects.push(o);return o.id});A.setTool('select');document.querySelector('#snap').checked=false;document.querySelector('#move-snap').checked=false;return values});
   await page.locator(`[data-view="${mode}"]`).click();return values;
  };
  for(const mode of ['plan','elevation','solid']){
   const [a,b]=await fresh(mode);let p=await point(a);await page.mouse.click(p.x,p.y);p=await point(b);await page.keyboard.down('Control');await page.mouse.click(p.x,p.y);await page.keyboard.up('Control');await sameIds([a,b]);
   const before=await state(),undo=await history();p=await point(a);await page.mouse.move(p.x,p.y);await page.mouse.down();await sameIds([a,b]);await page.mouse.up();await sameIds([a]);assert.equal(await state(),before);assert.equal(await history(),undo);
   await select([a,b]);p=await point(b);await page.mouse.click(p.x,p.y);await sameIds([b]);
   // A little pointer jitter stays a click, while cancellation never commits the pending click.
   await select([a,b]);p=await point(a);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+1,p.y);await page.mouse.up();await sameIds([a]);
   for(const cancel of ['Escape','pointercancel','blur']){
    await select([a,b]);p=await point(a);await page.mouse.move(p.x,p.y);await page.mouse.down();
    if(cancel==='Escape')await page.keyboard.press('Escape');else if(cancel==='blur')await page.evaluate(()=>dispatchEvent(new Event('blur')));else await page.locator('#canvas').dispatchEvent('pointercancel');
    await page.mouse.up();await sameIds([a,b]);assert.equal(await state(),before);assert.equal(await history(),undo);
   }
   if(mode==='solid'){p=await point(a);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+40,p.y+20,{steps:5});await page.mouse.up();await sameIds([a,b]);assert.equal(await state(),before);assert.equal(await history(),undo)}
   // A locked member must not prevent narrowing to an unlocked member.
   await page.evaluate(id=>SpatialEditor.document.objects.find(o=>o.id===id).locked=true,b);await select([a,b]);p=await point(a);await page.mouse.click(p.x,p.y);await sameIds([a]);
   await page.evaluate(id=>SpatialEditor.document.objects.find(o=>o.id===id).locked=false,b);
   await select([a,b]);await page.evaluate(()=>{const A=SpatialEditor,M=StudioModel;for(const o of A.document.objects)o.group='test-group';const o=M.createObject(A.document,'wall',[1350,250,0]);o.thickness=80;A.document.objects.push(o);A.select(o.id,true,true)});p=await point(a);await page.mouse.click(p.x,p.y);await sameIds([a,b]);
   checks.push(`${mode}: real Ctrl multi-select, clicks on either member, pointer jitter, no geometry/history change, locks, groups, Escape/pointercancel/blur`);
   await page.screenshot({path:path.join(out,`${mode}-selected.png`)});
  }
  for(const mode of ['plan','elevation']){
   const [a,b]=await fresh(mode);await select([a,b]);let before=await state(),undo=await history(),p=await point(a);
   await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+47,p.y+27,{steps:8});await page.mouse.up();await sameIds([a,b]);assert.equal(await history(),undo+1);
   const after=await state(),original=JSON.parse(before),moved=JSON.parse(after),delta=moved[0].position.map((v,i)=>v-original[0].position[i]);assert(Math.hypot(...delta)>0);moved[1].position.forEach((v,i)=>assert(Math.abs(v-original[1].position[i]-delta[i])<1e-5));
   await page.keyboard.press('Control+z');assert.equal(await state(),before);await page.keyboard.press('Control+Shift+z');assert.equal(await state(),after);
   await select([a,b]);before=await state();undo=await history();p=await point(a);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+43,p.y-23,{steps:8});await page.keyboard.press('Escape');await page.mouse.up();await sameIds([a,b]);assert.equal(await state(),before);assert.equal(await history(),undo);
   p=await point(a);await page.mouse.move(p.x,p.y);await page.keyboard.down('Alt');await page.mouse.down();await page.mouse.move(p.x+43,p.y+23,{steps:8});await page.mouse.up();await page.keyboard.up('Alt');assert.equal(JSON.parse(await state()).length,4);assert.equal((await ids()).length,2);assert.equal(await history(),undo+1);await page.keyboard.press('Control+z');assert.equal(await state(),before);
   checks.push(`${mode}: batch body drag, relative positions, one undo/redo, Escape rollback and atomic Alt-copy`);
  }
  const marqueeIds=await fresh('plan'),bounds=await page.evaluate(()=>{const A=SpatialEditor,p=A.scene.faces.flatMap(f=>f.poly).map(q=>new DOMPoint(...q).matrixTransform(document.querySelector('#canvas').getScreenCTM()));return {left:Math.min(...p.map(p=>p.x))-12,top:Math.min(...p.map(p=>p.y))-12,right:Math.max(...p.map(p=>p.x))+12,bottom:Math.max(...p.map(p=>p.y))+12}});
  await page.mouse.move(bounds.left,bounds.top);await page.mouse.down();await page.mouse.move(bounds.right,bounds.bottom,{steps:10});await page.mouse.up();await sameIds(marqueeIds);const marqueePoint=await point(marqueeIds[0]);await page.mouse.click(marqueePoint.x,marqueePoint.y);await sameIds([marqueeIds[0]]);checks.push('Real marquee multi-selection followed by a canvas click selects one component');
  // Narrow-screen canvas receives the same pointer gesture after switching panes.
  await page.setViewportSize({width:390,height:900});const [a,b]=await fresh('plan');await page.locator('[data-shell-pane="canvas"]').click();await select([a,b]);const p=await point(a);await page.mouse.click(p.x,p.y);await sameIds([a]);checks.push('390px: canvas click narrows multi-selection');
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,network},null,2));console.log('PASS Chrome multi-selection: three-view clicks, real Ctrl, batch drag/Alt-copy/history, groups/locks/cancellation and 390px canvas. Evidence: qa/multi-selection/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
