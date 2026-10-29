// Real solid-view grouping through buttons, canvas context menus and shortcuts.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 const out=path.join(__dirname,'../qa/grouping');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[],network=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);await page.evaluate(()=>document.fonts.ready);
  const state=()=>page.evaluate(()=>JSON.stringify(SpatialEditor.document.objects)),history=()=>page.evaluate(()=>SpatialEditor.undoCount);
  const point=async id=>page.evaluate(id=>{
   const A=SpatialEditor,canvas=document.querySelector('#canvas'),matrix=canvas.getScreenCTM();
   for(const f of A.scene.faces.filter(f=>f.owner.id===id)){
    const center=f.poly[0].map((_,i)=>f.poly.reduce((sum,p)=>sum+p[i],0)/f.poly.length);
    for(const q of [center,...f.poly.map(p=>p.map((v,i)=>(v+center[i]*3)/4))]){
     if(StudioRender.pickAll(q,A.scene,A.document,A.view)[0]?.id!==id)continue;
     const p=new DOMPoint(...q).matrixTransform(matrix),target=document.elementFromPoint(p.x,p.y);
     if(target?.closest('#canvas')&&!target.closest('[data-world-handle],[data-solid-ring],[data-solid-size-corner]'))return {x:p.x,y:p.y};
    }
   }
   throw Error('No reachable face for '+id);
  },id);
  for(const width of [1440,390])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:1100});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   const pane=async name=>{if(width<=990)await page.locator(`[data-shell-pane="${name}"]`).click()};
   const fixture=await page.evaluate(()=>{
    const A=SpatialEditor,M=StudioModel;A.createDocument('space','立体图编组验收');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];
    const host=M.createObject(A.document,'plane',[300,300,0]),wall=M.createObject(A.document,'wall',[850,300,0]);
    host.name='平台';wall.name='墙壁';const hole=Object.assign(M.createObject(A.document,'hole'),{host:host.id,floor:host.floor,points:[[-20,-20],[20,-20],[20,20],[-20,20]]});
    A.document.objects.push(host,wall,hole);A.setTool('select');document.querySelector('#snap').checked=false;document.querySelector('#move-snap').checked=false;
    return {host:host.id,wall:wall.id,hole:hole.id};
   });
   await pane('canvas');await page.locator('[data-view="solid"]').click();await page.locator('[data-action="fit"]').click();
   const select=async()=>{
    await pane('canvas');let p=await point(fixture.host);await page.mouse.click(p.x,p.y);p=await point(fixture.wall);await page.keyboard.down('Control');await page.mouse.click(p.x,p.y);await page.keyboard.up('Control');
    assert.deepEqual((await page.evaluate(()=>SpatialEditor.selection.ids)).sort(),Object.values(fixture).sort());
   };
   const grouped=async()=>{
    const data=JSON.parse(await state()),g=data.find(o=>o.id===fixture.host).group;assert(g,'host is grouped');assert.equal(data.find(o=>o.id===fixture.wall).group,g);assert(!data.find(o=>o.id===fixture.hole).group);return g;
   };
   const button=async action=>{await pane('tools');await page.locator(`.selection-actions [data-action="${action}"]`).click()};
   const context=async action=>{await pane('canvas');const p=await point(fixture.host);await page.mouse.click(p.x,p.y,{button:'right'});await page.locator(`#context-menu [data-action="${action}"]`).click()};
   await select();const original=await state(),undo=await history();await button('group');const g=await grouped();assert.equal(await history(),undo+1);
   const expected=JSON.stringify(JSON.parse(original).map(o=>o.type==='hole'?o:{...o,group:g}));assert.equal(await state(),expected,'group only changes metadata');
   await pane('canvas');await page.keyboard.press('Control+z');assert.equal(await state(),original);await page.keyboard.press('Control+Shift+z');assert.equal(await state(),expected);
   let p=await point(fixture.host);await page.mouse.click(p.x,p.y);assert.deepEqual((await page.evaluate(()=>SpatialEditor.selection.ids)).sort(),Object.values(fixture).sort());
   await page.screenshot({path:path.join(out,`${width}-${theme}-grouped.png`),fullPage:true});
   // A group created in solid view must move both roots and preserve the attached hole.
   const move=await page.evaluate(()=>{
    const A=SpatialEditor,M=StudioModel,el=document.querySelector('[data-world-handle="0"] .gizmo-axis'),n=el.getAttribute('d').match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number),p=[n[0]*.3+n[2]*.7,n[1]*.3+n[3]*.7];
    const delta=M.sub(M.project([70,0,0],A.scene.basis),M.project([0,0,0],A.scene.basis)),matrix=document.querySelector('#canvas').getScreenCTM();
    const screen=q=>{const v=new DOMPoint(...q).matrixTransform(matrix);return {x:v.x,y:v.y}};return {from:screen(p),to:screen(M.add(p,delta))};
   });
   const moveUndo=await history();await page.mouse.move(move.from.x,move.from.y);await page.mouse.down();await page.mouse.move(move.to.x,move.to.y,{steps:10});await page.mouse.up();
   assert.equal(await history(),moveUndo+1);const moved=JSON.parse(await state()),before=JSON.parse(expected);
   for(const id of [fixture.host,fixture.wall]){const a=moved.find(o=>o.id===id),b=before.find(o=>o.id===id);assert(Math.abs(a.position[0]-b.position[0]-70)<2);assert.deepEqual(a.position.slice(1),b.position.slice(1))}
   assert(await page.evaluate(()=>StudioModel.validGeometry(SpatialEditor.document)));await page.keyboard.press('Control+z');assert.equal(await state(),expected);
   p=await point(fixture.host);await page.mouse.click(p.x,p.y);await context('ungroup');assert.equal(await state(),original);assert.equal(await history(),undo+2);
   await page.keyboard.press('Control+z');assert.equal(await state(),expected);await page.keyboard.press('Control+Shift+z');assert.equal(await state(),original);
   await select();await page.keyboard.press('Control+g');await grouped();await page.keyboard.press('Control+Shift+g');assert.equal(await state(),original);
   await context('group');await grouped();await button('ungroup');assert.equal(await state(),original);
   // Dependent locks protect the whole operation even though the hole has no group ID.
   await pane('tools');await page.locator(`[data-lock="${fixture.hole}"]`).click();const locked=await state(),lockedUndo=await history();await button('group');assert.equal(await state(),locked);assert.equal(await history(),lockedUndo);
   await page.locator(`[data-lock="${fixture.hole}"]`).click();await button('group');await grouped();await page.locator(`[data-lock="${fixture.hole}"]`).click();const lockedGroup=await state();await button('ungroup');assert.equal(await state(),lockedGroup);await page.locator(`[data-lock="${fixture.hole}"]`).click();
   const saved=await state();await page.evaluate(()=>{StudioModel.validate(JSON.parse(JSON.stringify(SpatialEditor.project)));SpatialEditor.command('autosave')});
   await page.reload();assert.equal(await state(),saved,'autosave restores group IDs and host links');await pane('canvas');await page.locator('[data-view="solid"]').click();
   p=await point(fixture.host);await page.mouse.click(p.x,p.y);await grouped();await context('ungroup');assert.equal(await state(),original,'restored solid group can ungroup');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);checks.push({width,theme,buttons:true,canvasSelection:true,context:true,shortcuts:true,history:true,worldMove:true,hostLock:true,jsonAutosave:true});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,network},null,2));
  console.log('PASS Chrome grouping: solid canvas selection, buttons/context/keyboard, atomic undo/redo, group world movement, host holes/locks and JSON/autosave in 1440/390px light/dark. Evidence: qa/grouping/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
