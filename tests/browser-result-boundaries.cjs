// Actual Chrome drags and rasterized selection masks for boolean/cut components.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const out=path.join(__dirname,'../qa/result-boundaries');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],network=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const at=p=>page.evaluate(p=>{const q=new DOMPoint(...p).matrixTransform(document.querySelector('#canvas').getScreenCTM());return {x:q.x,y:q.y}},p);
  const objects=()=>page.evaluate(()=>JSON.stringify(SpatialEditor.document.objects));
  async function drag(start,end,{ctrl=false,cancel=false}={}){
   const a=await at(start),b=await at(end);await page.mouse.move(a.x,a.y);await page.mouse.down();if(ctrl)await page.keyboard.down('Control');await page.mouse.move(b.x,b.y,{steps:8});
   const guides=await page.locator('[data-move-snap-guide]').count();if(cancel)await page.keyboard.press('Escape');await page.mouse.up();if(ctrl)await page.keyboard.up('Control');return guides;
  }
  async function seed(sourceSolid,targetSolid){return page.evaluate(({sourceSolid,targetSolid})=>{
   const M=StudioModel,A=SpatialEditor,d=M.createDocument('space','集合与切割边缘验证');d.objects=[];
   const box=(x,y,width,length)=>{const o=Object.assign(M.createObject(d,'plane',[x,y,0]),{points:[[0,0],[width,0],[width,length],[0,length]],thickness:40});d.objects.push(o);return o};
   const result=(x,y,width,length)=>{const a=box(x,y,width,length),b=box(x,y,width,length);M.setComponents(d,[a.id,b.id],'intersect');return d.objects.find(o=>o.id===a.id)};
   const source=(sourceSolid?result:box)(100,250,50,50);(targetSolid?result:box)(200,180,400,400);
   A.loadProject({format:'level-spatial-editor',version:7,documents:[d],activeDocument:d.id});A.select(source.id,false,true);return source.id;
  },{sourceSolid,targetSolid})}
  for(const [sourceSolid,targetSolid] of [[false,true],[true,false],[true,true]]){
   const id=await seed(sourceSolid,targetSolid);await page.locator('#snap').uncheck();await page.locator('#move-snap').check();
   const before=await objects(),history=await page.evaluate(()=>SpatialEditor.undoCount);
   assert(await drag([125,275],[170,275])>0,'real drag displays contact guide');
   assert(Math.abs(await page.evaluate(id=>SpatialEditor.document.objects.find(o=>o.id===id).position[0],id)-150)<1e-5,'real drag reaches material edge');
   assert.equal(await page.evaluate(()=>SpatialEditor.undoCount),history+1);const after=await objects();await page.keyboard.press('Control+z');assert.equal(await objects(),before);await page.keyboard.press('Control+Shift+z');assert.equal(await objects(),after);await page.keyboard.press('Control+z');
   assert.equal(await drag([125,275],[170,275],{ctrl:true}),0);assert(Math.abs(await page.evaluate(id=>SpatialEditor.document.objects.find(o=>o.id===id).position[0],id)-145)<1.5,'Ctrl preserves raw drag');await page.keyboard.press('Control+z');
   await drag([125,275],[170,275],{cancel:true});assert.equal(await objects(),before,'Esc restores original material');
  }
  checks.push('real plane/solid/solid-to-solid drag, contact guides, Ctrl, Esc and atomic undo/redo');
  // Closed-cut internal edges are not separate list objects but must snap.
  const cutId=await page.evaluate(()=>{
   const M=StudioModel,A=SpatialEditor,d=M.createDocument('space','内孔吸附');d.objects=[];let host=Object.assign(M.createObject(d,'plane',[200,150,0]),{points:[[0,0],[600,0],[600,500],[0,500]]});d.objects.push(host);M.cutComponents(d,host.id,[[150,150],[450,150],[450,350],[150,350],[150,150]]);host=d.objects.find(o=>o.cutouts);d.objects=[host];
   const o=Object.assign(M.createObject(d,'plane',[240,360,0]),{points:[[0,0],[65,0],[65,70],[0,70]]});d.objects.push(o);A.loadProject({format:'level-spatial-editor',version:7,documents:[d],activeDocument:d.id});A.select(o.id,false,true);return o.id;
  });
  assert(await drag([270,390],[310,390])>0);assert(Math.abs(await page.evaluate(id=>SpatialEditor.document.objects.find(o=>o.id===id).position[0],cutId)-285)<1e-5);await page.screenshot({path:path.join(out,'cutout-snap.png')});checks.push('real closed-cut inner-edge contact');
  // Rasterize only the selection overlay. Alpha checks detect convex-hull
  // bridges and also prove actual concave/hole/split boundary strokes survive.
  for(const shape of ['notch','hole','split']){
   await page.evaluate(shape=>{
    const M=StudioModel,A=SpatialEditor,d=M.createDocument('space','实际边缘 '+shape);d.objects=[];
    const box=(x,y,width,length)=>{const o=Object.assign(M.createObject(d,'plane',[x,y,0]),{points:[[0,0],[width,0],[width,length],[0,length]],thickness:40});d.objects.push(o);return o};
    let host=box(200,180,400,400);const cutter=shape==='notch'?box(400,380,300,300):shape==='hole'?box(300,280,200,200):box(350,130,100,500);M.setComponents(d,[host.id,cutter.id],'difference');host=d.objects.find(o=>o.id===host.id);d.objects=[host];A.loadProject({format:'level-spatial-editor',version:7,documents:[d],activeDocument:d.id});A.select(host.id,false,true);
   },shape);
   const pixels=await page.evaluate(async shape=>{
    const overlay=document.querySelector('[data-material-selection]'),svg='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="800" viewBox="0 0 1000 800">'+overlay.outerHTML+'</svg>',image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();const c=document.createElement('canvas');c.width=1000;c.height=800;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
    const ink=(x,y,r=8)=>{const data=ctx.getImageData(x-r,y-r,r*2+1,r*2+1).data;let count=0;for(let i=3;i<data.length;i+=4)if(data[i]>20)count++;return count};
    const strip=ctx.getImageData(250,160,100,20).data,widths=Array.from({length:100},(_,x)=>{let dark=0;for(let y=0;y<20;y++){const i=(y*100+x)*4;if(strip[i+3]>80&&strip[i]<80)dark++}return dark}),unit=parseFloat(overlay.querySelector('[stroke-dasharray]').getAttribute('stroke-dasharray'))/6;
    return {empty:shape==='notch'?ink(500,480):shape==='hole'?ink(400,380):ink(400,180),edge:shape==='notch'?ink(403,480):shape==='hole'?ink(303,380):ink(353,300),seam:ink(250,230),maxDarkWidth:Math.max(...widths),gapColumns:widths.filter(n=>!n).length,unit};
   },shape);
   assert.equal(pixels.empty,0,shape+' has no false hull boundary');assert(pixels.edge>0,shape+' shows its real inner boundary');assert.equal(pixels.seam,0,'material interior has no selection seams');
   if(shape==='notch'){assert(pixels.maxDarkWidth<=Math.ceil(pixels.unit*2.5)+1,'selection remains a thin stroke');assert(pixels.gapColumns>15&&pixels.gapColumns<60,'dash gaps remain visibly open')}
   for(const mode of ['plan','elevation','solid']){await page.locator(`[data-view="${mode}"]`).click();assert(await page.locator('[data-material-selection]').count());await page.screenshot({path:path.join(out,shape+'-'+mode+'.png')})}
   checks.push(shape+' three-view outline and raster alpha checks');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,network},null,2));console.log('PASS Chrome result boundaries: actual solid/cutout snapping, guides/Ctrl/Esc/history, three-view concave/holed/disconnected selection and rasterized boundary checks. Evidence qa/result-boundaries/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
