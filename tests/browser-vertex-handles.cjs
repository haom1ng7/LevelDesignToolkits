// Real SVG hit testing, zoom stability and contour editing after node restyling.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const out=path.join(__dirname,'../qa/vertex-handles');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},colorScheme:'light'}),errors=[],network=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const settle=()=>page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled(document.getAnimations().map(a=>a.finished))});
  const setup=async(type='plane',mode='plan',background='#ffffff')=>{
   const id=await page.evaluate(({type,mode,background})=>{
    const A=SpatialEditor,M=StudioModel;A.createDocument('space','顶点编辑验收');A.document.objects=[];A.document.background=background;
    let o=M.createObject(A.document,type==='ellipse'?'plane':type,[600,400,0]);
    if(type==='plane'||type==='ellipse')o.points=[[-160,-100],[160,-100],[160,100],[-160,100]];
    if(type==='ellipse')o.shape='ellipse';
    if(type==='wall')o.points=[[-160,0],[160,0],[160,200],[-160,200]];
    if(type==='route')o.points=mode==='plan'?[[-160,-60,0],[0,70,0],[160,-30,0]]:[[-160,0,0],[0,0,160],[160,0,40]];
    if(type==='hole'){
     const host=M.createObject(A.document,mode==='plan'?'plane':'wall',[600,400,0]);host.points=mode==='plan'?[[-240,-180],[240,-180],[240,180],[-240,180]]:[[-240,0],[240,0],[240,300],[-240,300]];
     o.host=host.id;o.floor=host.floor;o.points=mode==='plan'?[[-90,-60],[90,-60],[90,60],[-90,60]]:[[-90,50],[90,50],[90,200],[-90,200]];A.document.objects.push(host);
    }
    A.document.objects.push(o);document.querySelector(`[data-view="${mode}"]`).click();A.select(o.id,false,true);if(type!=='route')A.setTool('vertex');
    for(const id of ['snap','move-snap','geometry-snap'])document.getElementById(id).checked=false;
    A.command('fit-selected');for(let i=0;i<3;i++)A.command('zoom-out');return o.id;
   },{type,mode,background});await settle();return id;
  };
  const at=selector=>page.locator(selector).evaluate(el=>{const p=new DOMPoint(+el.getAttribute('cx'),+el.getAttribute('cy')).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y}});
  const state=()=>page.evaluate(()=>JSON.stringify(SpatialEditor.document.objects));
  const history=()=>page.evaluate(()=>SpatialEditor.undoCount);
  const hitSize=async()=>{const b=await page.locator('[data-vertex="0"]').boundingBox();assert(Math.abs(b.width-20)<.05&&Math.abs(b.height-20)<.05,JSON.stringify(b))};
  const checkExport=async()=>assert(await page.evaluate(()=>{const d=new DOMParser().parseFromString(SpatialEditor.renderSVG(),'image/svg+xml');return !d.querySelector('parsererror,[data-vertex],[data-midpoint],.contour-handle')}));
  for(const width of [1440,390])for(const theme of ['light','dark'])for(const background of ['#ffffff','#101214']){
   await page.setViewportSize({width,height:width===390?844:1000});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await setup('plane','plan',background);
   assert.equal(await page.locator('[data-vertex]').count(),4);assert.equal(await page.locator('[data-midpoint]').count(),4);await hitSize();
   const before=await state(),undo=await history();let p=await at('[data-vertex="0"]');
   // The invisible margin remains a usable target, without enlarging the glyph.
   await page.mouse.move(p.x+8,p.y);assert.equal(await page.locator('.contour-vertex').first().locator('.contour-body').evaluate(el=>getComputedStyle(el).fill),'rgb(255, 250, 0)');
   await page.mouse.click(p.x+8,p.y);await page.mouse.move(p.x+30,p.y+30);
   assert.equal(await page.locator('.contour-vertex.is-selected').count(),1);assert.equal(await state(),before);assert.equal(await history(),undo);
   assert.equal(await page.locator('.is-selected .contour-brackets').last().evaluate(el=>getComputedStyle(el).visibility),'visible');
   await page.evaluate(()=>SpatialEditor.command('zoom-out'));await hitSize();await checkExport();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(background===(theme==='dark'?'#101214':'#ffffff'))await page.screenshot({path:path.join(out,`${width}-${theme}.png`)});
   if(width===1440&&theme==='light'&&background==='#ffffff'){
    const b=await page.locator('#handles').boundingBox();await page.screenshot({path:path.join(out,'node-detail.png'),clip:{x:b.x-24,y:b.y-24,width:b.width+48,height:b.height+48}});
   }
   checks.push({width,theme,background});
  }
  await page.setViewportSize({width:1440,height:1000});
  for(const [type,mode] of [['plane','plan'],['ellipse','plan'],['wall','plan'],['wall','elevation'],['hole','plan'],['hole','elevation'],['stairs','plan'],['stairs','elevation'],['spiral','plan'],['spiral','elevation'],['route','plan'],['route','elevation'],['route','solid']]){
   await setup(type,mode);assert(await page.locator('[data-vertex]').count()>0,`${type}/${mode}`);await hitSize();
   const reachable=await page.locator('[data-vertex]').evaluateAll(nodes=>nodes.every(el=>{const p=new DOMPoint(+el.getAttribute('cx'),+el.getAttribute('cy')).matrixTransform(el.getScreenCTM()),hit=document.elementFromPoint(p.x,p.y);return !!hit?.closest('[data-vertex]')}));
   assert(reachable,`Nodes reachable in ${type}/${mode}`);await checkExport();checks.push({type,mode});
  }
  // Plane and route edits still commit once, restore exactly, and cancel cleanly.
  for(const type of ['plane','route']){
   const id=await setup(type),reselect=()=>page.evaluate(({id,type})=>{SpatialEditor.select(id,false,true);if(type!=='route')SpatialEditor.setTool('vertex')},{id,type});let before=await state(),undo=await history(),p=await at('[data-vertex="0"]');
   await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x-30,p.y-18,{steps:8});await page.mouse.up();
   const changed=await state();assert.notEqual(changed,before);assert.equal(await history(),undo+1);
   await page.keyboard.press('Control+z');assert.equal(await state(),before);await page.keyboard.press('Control+Shift+z');assert.equal(await state(),changed);await reselect();
   before=await state();undo=await history();p=await at('[data-vertex="0"]');await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x-20,p.y+16,{steps:4});await page.keyboard.press('Escape');await page.mouse.up();assert.equal(await state(),before);assert.equal(await history(),undo);
   const count=await page.locator('[data-vertex]').count();p=await at('[data-midpoint="0"]');await page.mouse.click(p.x,p.y);assert.equal(await page.locator('[data-vertex]').count(),count+1);assert.equal(await history(),undo+1);
   await page.keyboard.press('Delete');assert.equal(await page.locator('[data-vertex]').count(),count);await page.keyboard.press('Control+z');await reselect();assert.equal(await page.locator('[data-vertex]').count(),count+1);await checkExport();
   checks.push({type,editing:true});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,network},null,2));
  console.log(`PASS vertex handles: ${checks.length} layout/type/editing cases; real margin hit, hover/selection, fixed screen size, drag/insert/delete, undo/redo/cancel and SVG exclusion.`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
