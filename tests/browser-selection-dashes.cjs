const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const out=path.join(__dirname,'../qa/selection-dashes');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const painted=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const measure=()=>page.evaluate(async()=>{
   const A=SpatialEditor,overlay=document.querySelector('[data-material-selection]'),path=overlay.querySelector('[data-material-contour]'),r=document.querySelector('#stage').getBoundingClientRect(),width=Math.ceil(r.width),height=Math.ceil(r.height),camera=A.camera,unit=camera.w/width,image=new Image();
   image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${camera.x} ${camera.y} ${camera.w} ${camera.h}" preserveAspectRatio="none">${overlay.outerHTML}</svg>`);await image.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,width,height).data,ink=[];
   for(let t=0;t<path.getTotalLength();t+=unit){const p=path.getPointAtLength(t),x=Math.round((p.x-camera.x)/camera.w*width),y=Math.round((p.y-camera.y)/camera.h*height);if(x<1||y<1||x>=width-1||y>=height-1)continue;const i=(y*width+x)*4;ink.push(pixels[i+3]>100&&pixels[i]<80)}
   let run=0,maxRun=0;for(const dark of ink){run=dark?run+1:0;maxRun=Math.max(maxRun,run)}return {gapRatio:ink.filter(v=>!v).length/ink.length,maxRun,samples:ink.length,rings:StudioRender.materialContours(A.scene.outlines.get(A.selection.id).regions).map(r=>({vertices:r.length,area:r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-p[1]*q[0]},0)/2}))};
  });
  for(const steps of [48,16]){
   await page.evaluate(steps=>{
    const M=StudioModel,A=SpatialEditor,d=M.createDocument('space','多面组件虚线');d.objects=[];
    const o=M.createObject(d,'stairs',[500,450,0]);o.countMode='manual';Object.assign(o.flights[0],{points:[[-100,-200],[100,-200],[100,200],[-100,200]],start:0,end:200,steps});d.objects.push(o);
    const cover=Object.assign(M.createObject(d,'plane',[0,0,1000]),{points:[[0,0],[1000,0],[1000,1000],[0,1000]],thickness:2000});d.objects.push(cover);M.setComponents(d,[o.id,cover.id],'intersect');
    A.loadProject({format:'level-spatial-editor',version:7,documents:[d],activeDocument:d.id});A.select(o.id,false,true);document.querySelector('[data-view="plan"]').click();
   },steps);
   await painted();const result=await page.evaluate(async()=>{
    const overlay=document.querySelector('[data-material-selection]'),image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="900">'+overlay.outerHTML+'</svg>');await image.decode();const c=document.createElement('canvas');c.width=1000;c.height=900;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
    const data=ctx.getImageData(380,280,20,340).data,rows=Array.from({length:340},(_,y)=>{for(let x=0;x<20;x++){const i=(y*20+x)*4;if(data[i+3]>80&&data[i]<80)return true}return false}),unit=parseFloat(overlay.querySelector('[stroke-dasharray]').getAttribute('stroke-dasharray'))/6;
    let run=0,maxRun=0;for(const ink of rows){run=ink?run+1:0;maxRun=Math.max(maxRun,run)}return {unit,gapRatio:rows.filter(v=>!v).length/rows.length,maxRun,faces:SpatialEditor.scene.faces.length};
   });
   results.push({steps,...result});await page.screenshot({path:path.join(out,'stairs-'+steps+'-plan.png')});
   assert(result.gapRatio>.18,'multi-face outline keeps dash gaps: '+JSON.stringify(result));assert(result.maxRun<result.unit*12+3,'short face edges cannot join into long black strokes: '+JSON.stringify(result));
   for(const mode of ['plan','elevation','solid']){await page.locator(`[data-view="${mode}"]`).click();await painted();const metric=await measure();results.push({steps,mode,...metric});await page.screenshot({path:path.join(out,'stairs-'+steps+'-'+mode+'.png')});assert(metric.samples>80,'visible contour is sampled');assert(metric.gapRatio>.08&&metric.gapRatio<.8,'dash gaps survive '+mode+': '+JSON.stringify(metric));assert(metric.maxRun<24,'dash runs stay short in '+mode+': '+JSON.stringify(metric))}
   await page.locator('[data-view="plan"]').click();await page.locator('#canvas').hover();await page.mouse.wheel(0,-300);await page.waitForTimeout(150);const zoom=await measure();results.push({steps,mode:'zoom',...zoom});assert(zoom.gapRatio>.08&&zoom.maxRun<24,'zoom retains separate dashes: '+JSON.stringify(zoom));
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({results,errors},null,2));console.log('PASS Chrome selection dashes: dense multi-face booleans keep clear gaps and bounded black runs; three-view screenshots.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
