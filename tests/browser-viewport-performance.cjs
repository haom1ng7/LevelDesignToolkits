// Same-machine navigation probe: STUDIO_PERF_LABEL, STUDIO_PERF_HTML, STUDIO_PERF_EXPECT_REUSE=1.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
const label=process.env.STUDIO_PERF_LABEL||process.argv[2]||'latest',reuse=process.env.STUDIO_PERF_EXPECT_REUSE==='1'||process.argv.includes('--expect-reuse');
const profiling=process.argv.includes('--profile');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 const out=path.join(__dirname,'../qa/viewport-performance');fs.mkdirSync(out,{recursive:true});const results=[],errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),cdp=await page.context().newCDPSession(page);
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,process.env.STUDIO_PERF_HTML||(process.argv.includes('--baseline')?'../.build/viewport-before.html':'../dist/index.html'))).href);await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{const R=StudioRender,M=StudioModel,scene=R.scene,geometry=M.geometry;window.probe={scenes:0,geometry:0};R.scene=(...args)=>{probe.scenes++;return scene(...args)};M.geometry=(...args)=>{probe.geometry++;return geometry(...args)}});
  for(const mode of process.argv.includes('--solid-only')?['solid']:['plan','elevation','solid']){
   await page.evaluate(mode=>{
    const A=SpatialEditor,M=StudioModel;A.createDocument('space','视角性能 '+mode);const d=A.document;
    const types=['plane','wall','stairs','ladder','spiral'],templates=types.map(t=>M.createObject(d,t,[0,0,0]));
    d.objects=Array.from({length:240},(_,i)=>{const o=M.clone(templates[i%types.length]);o.id='perf-'+i;o.name=o.id;o.position=[(i%16)*250,Math.floor(i/16)*250,0];return o});
    d.objects.push(Object.assign(M.createObject(d,'hole'),{host:d.objects[0].id,floor:d.activeFloor,points:[[-20,-20],[20,-20],[20,20],[-20,20]]}));d.objects[5].cutouts=[{points:[[-20,-20],[20,-20],[20,20],[-20,20]]}];
    A.setTool('select');document.querySelector(`[data-view="${mode}"]`).click();A.command('fit');
   },mode);
   if(mode==='solid')await page.locator('[data-floor]').first().click();
   await page.waitForTimeout(200);
   const state=await page.evaluate(()=>({project:JSON.stringify(SpatialEditor.project),undo:SpatialEditor.undoCount}));
   const box=await page.locator('#canvas').boundingBox(),x=box.x+box.width*.5,y=box.y+box.height*.5,button=mode==='solid'?'right':'middle';
   await page.mouse.move(x,y);await page.mouse.down({button});
   if(profiling){await cdp.send('Profiler.enable');await cdp.send('Profiler.start')}
   const row=await page.evaluate(async({x,y,mode})=>{
    const c=document.querySelector('#canvas'),before={...probe},stats={...SpatialEditor.viewportStats},durations=[],intervals=[];let last=performance.now(),i=0;
    const node=document.querySelector('#scene [data-object]');
    await new Promise(resolve=>{const frame=t=>{intervals.push(t-last);last=t;const start=performance.now();for(let j=0;j<4;j++)c.dispatchEvent(new MouseEvent('pointermove',{buttons:mode==='solid'?2:4,button:mode==='solid'?2:1,clientX:x+Math.sin((i*4+j)/25)*50,clientY:y+Math.cos((i*4+j)/30)*25,bubbles:true}));durations.push(performance.now()-start);if(++i<24)requestAnimationFrame(frame);else requestAnimationFrame(resolve)};requestAnimationFrame(frame)});
    const percentile=(a,p)=>[...a].sort((a,b)=>a-b)[Math.min(a.length-1,Math.floor(a.length*p))];
    return {mode,frames:i,p50:percentile(intervals,.5),p95:percentile(intervals,.95),handlerP50:percentile(durations,.5),handlerP95:percentile(durations,.95),sceneBuilds:probe.scenes-before.scenes,geometryCalls:probe.geometry-before.geometry,stableArtwork:!!node&&node.isConnected,gpuFrames:SpatialEditor.viewportStats?.frames-stats.frames};
   },{x,y,mode});
   if(profiling){const {profile}=await cdp.send('Profiler.stop');await cdp.send('Profiler.disable');if(mode==='solid')fs.writeFileSync(path.join(out,label+'.cpuprofile'),JSON.stringify(profile))}
   await page.mouse.up({button});
   assert.deepEqual(await page.evaluate(()=>({project:JSON.stringify(SpatialEditor.project),undo:SpatialEditor.undoCount})),state,'navigation preserves model/history');
   if(reuse&&mode!=='solid'){assert.equal(row.sceneBuilds,0,'draft navigation reuses projection');assert.equal(row.geometryCalls,0,'draft navigation reuses geometry');assert(row.stableArtwork,'draft navigation retains artwork DOM')}
   if(reuse&&mode==='solid'){
    assert(row.gpuFrames<=row.frames+1,'high-rate input paints at most once per display frame');assert.equal(row.geometryCalls,0,'orbit reuses cached world vertices and bounds');
    const checked=await page.evaluate(()=>{const A=SpatialEditor,s=StudioRender.scene(A.document,A.view,{interactive:true,selection:A.selection.ids,camera:A.camera});let checked=0;for(const [id,outline]of s.outlines){if(!outline.paths)continue;const actual=[...document.querySelectorAll(`[data-selection-outline="${id}"] mask path[fill="white"]`)].map(p=>p.getAttribute('d'));if(JSON.stringify(actual)!==JSON.stringify(outline.paths))throw Error('GPU selection differs from full projection: '+id);checked++}return checked});assert(checked>0,'compare actual holed material outline paths with full scene');row.materialOutlinesChecked=checked;
   }
   results.push(row);console.log(JSON.stringify(row));
   if(mode!=='solid'){
    const zoom=await page.evaluate(async({x,y})=>{const c=document.querySelector('#canvas'),before={...probe},node=document.querySelector('#scene [data-object]'),width=SpatialEditor.camera.w;for(let i=0;i<8;i++){c.dispatchEvent(new WheelEvent('wheel',{clientX:x,clientY:y,deltaY:i<4?-100:100,bubbles:true,cancelable:true}));await new Promise(requestAnimationFrame)}await new Promise(requestAnimationFrame);return {sceneBuilds:probe.scenes-before.scenes,geometryCalls:probe.geometry-before.geometry,stableArtwork:node.isConnected,width,afterWidth:SpatialEditor.camera.w,label:document.querySelector('#zoom-label').textContent}}, {x,y});
    assert(Math.abs(zoom.width-zoom.afterWidth)<1e-6,'wheel zoom reverses');if(reuse){assert.equal(zoom.sceneBuilds,0);assert.equal(zoom.geometryCalls,0);assert(zoom.stableArtwork);const documentWidth=await page.evaluate(()=>SpatialEditor.document.width);assert.equal(zoom.label,Math.round(documentWidth/zoom.afterWidth*100)+'%')}
    row.zoom=zoom;
   }
   await page.screenshot({path:path.join(out,`${label}-${mode}.png`)});
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify({browser:browser.version(),results,errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
