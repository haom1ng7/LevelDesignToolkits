const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),out=path.join(__dirname,'../qa/grid-boundaries'),errors=[],network=[],checks=[];
  fs.mkdirSync(out,{recursive:true});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const near=(a,b,label,tolerance=1e-5)=>assert(Math.abs(a-b)<tolerance,`${label}: ${a} != ${b}`);
  const state=()=>page.evaluate(()=>JSON.stringify(SpatialEditor.document.objects));
  const at=p=>page.evaluate(p=>{const q=new DOMPoint(...p).matrixTransform(document.querySelector('#canvas').getScreenCTM());return {x:q.x,y:q.y}},p);
  async function setup(config,end,group=false){
   await page.evaluate(({config,group})=>{
    const A=SpatialEditor,M=StudioModel;A.createDocument('space','网格双侧吸附检查');A.project.documents.splice(0,A.project.documents.length-1);const d=A.document;d.objects=[];d.gridSize=config.step||100;
    const o=M.createObject(d,'plane',config.negative?[-513,-447,-620]:[513,447,420]);o.points=[[-130,-80],[130,-80],[130,80],[-130,80]];o.thickness=160;o.orientation=M.axisRotation([0,0,1],config.angle||0);d.objects.push(o);
    if(group){const h=M.createObject(d,'hole');h.host=o.id;h.points=[[-40,-30],[40,-30],[40,30],[-40,30]];const label=M.createObject(d,'text',M.add(o.position,[400,0,0]));o.group=label.group=M.uid();d.objects.push(h,label)}
    document.querySelector('#snap').checked=true;document.querySelector('#move-snap').checked=true;A.setTool('select');
   },{config,group});
   await page.locator(`[data-view="${config.mode}"]`).click();if(config.side)await page.locator(`[data-side="${config.side}"]`).click();
   const data=await page.evaluate(({config,end})=>{
    const A=SpatialEditor,M=StudioModel,d=A.document,o=d.objects[0];A.select(o.id);
    const axisIndex=config.axis||0,axes=config.mode==='solid'?[[0,1,2].map(i=>i===axisIndex?1:0)]:[A.scene.basis.r,A.scene.basis.down],ps=M.geometry(d,o).flatMap(f=>f.points),raw=[0,0,0],targets=[],sign=config.negative?-1:1;
    for(const axis of axes){const value=Math[end](...ps.map(p=>M.dot(p,axis))),target=(Math.round(value/d.gridSize)+sign*2)*d.gridSize;targets.push(target);raw.forEach((_,i)=>raw[i]+=axis[i]*(target-value+sign*(config.angle?.01:3)))}
    const start=M.project(M.world(d,o,[0,0,-80]),A.scene.basis),delta=[M.dot(raw,A.scene.basis.r),M.dot(raw,A.scene.basis.down)];
    Object.assign(A.camera,{x:start[0]-700,y:start[1]-500,w:1400,h:1000});A.setTool('select');
    return {id:o.id,axes,targets,raw,start,delta,positions:d.objects.map(o=>o.position),size:[0,1,2].map(i=>Math.max(...ps.map(p=>p[i]))-Math.min(...ps.map(p=>p[i]))),history:A.undoCount};
   },{config,end});
   let start=await at(data.start);
   if(config.mode==='solid')start=await page.locator(`[data-world-handle="${config.axis||0}"] .gizmo-axis`).evaluate(el=>{const p=el.getPointAtLength(el.getTotalLength()*.7).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y}});
   const zero=await at([0,0]),offset=await at(data.delta);return {...data,start,end:{x:start.x+offset.x-zero.x,y:start.y+offset.y-zero.y}};
  }
  async function metrics(id,axes,end){return page.evaluate(({id,axes,end})=>{const A=SpatialEditor,M=StudioModel,o=A.document.objects.find(o=>o.id===id),ps=M.geometry(A.document,o).flatMap(f=>f.points);return {values:axes.map(axis=>Math[end](...ps.map(p=>M.dot(p,axis)))),size:[0,1,2].map(i=>Math.max(...ps.map(p=>p[i]))-Math.min(...ps.map(p=>p[i]))),position:o.position,history:A.undoCount}}, {id,axes,end})}
  for(const config of [{mode:'plan'},{mode:'plan',negative:true},{mode:'elevation'},{mode:'elevation',side:'right'},{mode:'solid',axis:0},{mode:'solid',axis:1},{mode:'solid',axis:2},{mode:'plan',angle:.37,step:75}])for(const end of ['min','max']){
   const data=await setup(config,end),before=await state();await page.mouse.move(data.start.x,data.start.y);await page.mouse.down();await page.mouse.move(data.end.x,data.end.y,{steps:10});await page.mouse.up();
   const result=await metrics(data.id,data.axes,end);result.values.forEach((n,i)=>near(n,data.targets[i],`${JSON.stringify(config)} ${end} side ${i}`));result.size.forEach((n,i)=>near(n,data.size[i],'preserved size'));
   if(config.mode==='solid')result.position.forEach((n,i)=>{if(i!==config.axis)near(n,data.positions[0][i],'constrained axis')});assert.equal(result.history,Math.min(80,data.history+1));
   const after=await state();await page.keyboard.press('Control+z');assert.equal(await state(),before,'one undo restores gesture');await page.keyboard.press('Control+Shift+z');assert.equal(await state(),after,'redo restores snapped gesture');
   checks.push({config,end,targets:data.targets,actual:result.values});
   if(config.mode==='plan'&&!config.negative&&!config.angle&&end==='max')await page.screenshot({path:path.join(out,'right-bottom-snapped.png')});
  }
  // Ctrl can be pressed and released during a grouped gesture without accumulating drift.
  const data=await setup({mode:'plan'},'max',true),before=await state();await page.mouse.move(data.start.x,data.start.y);await page.mouse.down();await page.mouse.move(data.end.x,data.end.y,{steps:8});
  let result=await metrics(data.id,data.axes,'max');result.values.forEach((n,i)=>near(n,data.targets[i],'group nearest side'));
  const grouped=await page.evaluate(()=>SpatialEditor.document.objects.map(o=>o.position)),delta=result.position.map((n,i)=>n-data.positions[0][i]);grouped[2].forEach((n,i)=>near(n-data.positions[2][i],delta[i],'group relative positions'));
  await page.keyboard.down('Control');await page.mouse.move(data.end.x+1,data.end.y+1);await page.mouse.move(data.end.x,data.end.y);result=await metrics(data.id,data.axes,'max');result.position.forEach((n,i)=>near(n,data.positions[0][i]+data.raw[i],'Ctrl raw motion',.001));
  await page.keyboard.up('Control');await page.mouse.move(data.end.x+1,data.end.y+1);await page.mouse.move(data.end.x,data.end.y);result=await metrics(data.id,data.axes,'max');result.values.forEach((n,i)=>near(n,data.targets[i],'resume without drift'));
  assert.equal(await page.evaluate(()=>StudioModel.validGeometry(SpatialEditor.document)),true);await page.keyboard.press('Escape');await page.mouse.up();assert.equal(await state(),before,'Esc restores host, hole and group');assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),data.history);
  checks.push({check:'group/host/hole, dynamic Ctrl, resume without drift and Esc rollback'});assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,network},null,2));console.log(`PASS Chrome grid boundaries: ${checks.length} checks; four sides, negative coordinates, front/right elevation, XYZ constraints, rotated 75 cm grid, undo/redo, grouped host/hole, dynamic Ctrl and Esc. Evidence qa/grid-boundaries/.`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
