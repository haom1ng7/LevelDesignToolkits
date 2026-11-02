// Reproducible CPU/GPU stress probe. Run before/after against the same dist build and browser.
// STUDIO_PERF_LABEL=before|after, STUDIO_PERF_COUNTS=400,1200,3000, STUDIO_PERF_MS=1000.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
const label=process.env.STUDIO_PERF_LABEL||'latest',counts=(process.env.STUDIO_PERF_COUNTS||'400,1200,3000').split(',').map(Number),kinds=(process.env.STUDIO_PERF_KINDS||'opaque,transparent,mixed').split(','),duration=Number(process.env.STUDIO_PERF_MS||1000),selectionIndex=Number(process.env.STUDIO_PERF_SELECTED_INDEX||0);
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 const out=path.join(__dirname,'../qa/perspective-performance');fs.mkdirSync(out,{recursive:true});const results=[],errors=[],network=[],environment={browser:browser.version(),platform:process.platform,node:process.version,viewport:{width:1600,height:1000},duration,selectionIndex};
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),cdp=await page.context().newCDPSession(page);
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.resolve(__dirname,process.env.STUDIO_PERF_HTML||'../dist/index.html')).href);await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>SpatialEditor.createDocument('space','透视压力测试'));await page.locator('[data-view="solid"]').click();assert(await page.evaluate(()=>!!SpatialEditor.view.fly),'solid defaults to perspective');
  environment.webgl=await page.evaluate(()=>{const gl=document.querySelector('#solid-webgl').getContext('webgl2'),info=gl.getExtension('WEBGL_debug_renderer_info');return {vendor:info?gl.getParameter(info.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR),renderer:info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}});
  for(const kind of kinds)for(const count of counts){
   const setup=await page.evaluate(({count,kind})=>{
    const A=SpatialEditor,M=StudioModel,d=A.document;const t=performance.now();
    if(A.selection.id)A.select(A.selection.id,true,true);
    const templates=Object.fromEntries(['plane','wall','stairs','ladder','spiral'].map(type=>[type,M.createObject(d,type,[0,0,0])]));
    const columns=Math.ceil(Math.sqrt(count)),step=400;
    d.gridVisible=true;d.heightReferences=true;d.objects=Array.from({length:count},(_,i)=>{
     const type=kind==='mixed'?['plane','wall','stairs','ladder','spiral'][i%5]:'plane',o=M.clone(templates[type]);
     o.id='stress-'+i;o.name=type+' '+i;o.position=[i%columns*step,Math.floor(i/columns)*step,0];o.opacity=kind==='transparent'?.55:1;return o;
    });
    A.view.azimuth=35;A.view.elevation=35;const b=M.viewBasis(d,A.view),center=[columns*step/2,columns*step/2,0];A.view.fly.eye=M.add(center,M.mul(b.n,columns*step*1.3));
    A.setTool('select');return {ms:performance.now()-t,stats:A.viewportStats};
   },{count,kind});
   assert.equal(setup.stats.backend,'webgl','performance requires a real WebGL context');assert.equal(setup.stats.objects,count);
   // Drive the actual camera/navigation handlers, collecting displayed frame intervals.
   const measure=async(selected)=>{
    await page.evaluate(({selected,selectionIndex})=>{const A=SpatialEditor;if(selected)A.select(A.document.objects[selectionIndex].id,false,true);else if(A.selection.id)A.select(A.selection.id,true,true)},{selected,selectionIndex});
    await page.locator('#canvas').focus();
    const bounds=await page.locator('#canvas').boundingBox();await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down({button:'right'});
    const result=await page.evaluate(async({duration,selected,startX,startY})=>{
     const A=SpatialEditor,M=StudioModel,c=document.querySelector('#canvas'),before={...A.viewportStats},intervals=[],start=performance.now();let last=start;
     const sample=t=>{intervals.push(t-last);last=t;if(performance.now()-start<duration)requestAnimationFrame(sample)};requestAnimationFrame(sample);
     let i=0;await new Promise(resolve=>{const frame=()=>{c.dispatchEvent(new MouseEvent('pointermove',{button:2,buttons:2,clientX:startX+10+(i++%30),clientY:startY+10,bubbles:true}));if(performance.now()-start<duration)requestAnimationFrame(frame);else resolve()};requestAnimationFrame(frame)});
     const elapsed=performance.now()-start,after={...A.viewportStats},sorted=intervals.sort((a,b)=>a-b),percentile=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))]||0;
     return {selected,elapsed,frames:after.frames-before.frames,fps:(after.frames-before.frames)/(elapsed/1000),p50:percentile(.5),p95:percentile(.95),max:Math.max(...sorted),before,after};
    },{duration,selected,startX:bounds.x+bounds.width/2,startY:bounds.y+bounds.height/2});
    const release=Date.now();await page.mouse.up({button:'right'});result.releaseMs=Date.now()-release;
    assert.equal(result.after.geometryBuilds,result.before.geometryBuilds,'camera motion reuses component geometry');assert.equal(result.after.sceneBuilds,result.before.sceneBuilds,'camera motion reuses GPU buffers');
    assert(result.after.drawCalls>0&&result.after.triangles>0,'stress geometry must stay in the camera frustum');
    if(result.after.pickingBuilds!==undefined)assert.equal(result.after.pickingBuilds,result.before.pickingBuilds,'camera motion does not build a complete picking scene');
    return result;
   };
   await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
   const empty=await measure(false),selected=await measure(true);
   const {profile}=await cdp.send('Profiler.stop');await cdp.send('Profiler.disable');
   if(count===counts.at(-1)&&kind==='opaque')fs.writeFileSync(path.join(out,label+'.cpuprofile'),JSON.stringify(profile));
   const hitTimes=await page.evaluate(()=>{const A=SpatialEditor,times=[];for(let i=0;i<3;i++){const t=performance.now();void A.scene;times.push(performance.now()-t)}return times});
   const clickBounds=await page.locator('#canvas').boundingBox(),clickStart=Date.now();await page.mouse.click(clickBounds.x+clickBounds.width/2,clickBounds.y+clickBounds.height/2);const clickMs=Date.now()-clickStart;
   const row={count,kind,setup,empty,selected,pickingSceneMs:hitTimes,clickMs};results.push(row);console.log(JSON.stringify({count,kind,setupMs:setup.ms,emptyFPS:empty.fps,selectedFPS:selected.fps,p95:selected.p95,releaseMs:selected.releaseMs,pickingSceneMs:hitTimes,clickMs,drawCalls:selected.after.drawCalls}));
   fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify({label,duration,counts,environment,results,errors,network},null,2));
  }
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);await page.screenshot({path:path.join(out,label+'.png')});
 }catch(e){fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify({label,duration,counts,environment,results,errors,network,failure:e.message},null,2));throw e}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
