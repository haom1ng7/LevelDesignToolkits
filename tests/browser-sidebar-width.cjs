// Floor component counts must not change the sidebar's usable width.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,ignoreDefaultArgs:['--hide-scrollbars'],args:['--disable-features=OverlayScrollbar,FluentOverlayScrollbar'],...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 const out=path.join(__dirname,'../qa/sidebar-width');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],requests=[],measurements=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  await page.evaluate(()=>document.fonts.ready);
  // Exercise classic scrollbars even when headless Chrome uses overlay scrollbars.
  await page.addStyleTag({content:'aside{scrollbar-width:auto}aside::-webkit-scrollbar{width:12px}'});
  const ids=await page.evaluate(()=>{
   const A=SpatialEditor,M=StudioModel;A.createDocument('space','侧栏宽度回归');A.project.documents.splice(0,A.project.documents.length-1);const d=A.document;d.objects=[];
   const counts=[0,1,2,3,4,30];d.floors=counts.map((count,i)=>({id:M.uid(),name:count+' 个组件',height:i*180,visible:true}));
   counts.forEach((count,i)=>{d.activeFloor=d.floors[i].id;for(let j=0;j<count;j++){const o=M.createObject(d,'plane',[300+j%5*150,300+Math.floor(j/5)*150,0]);o.name=j%2?'组件_'+('LongName'.repeat(8)):o.name;d.objects.push(o)}});
   d.activeFloor=d.floors[0].id;A.setTool('select');return d.floors.map(f=>f.id);
  });
  const measure=()=>page.evaluate(()=>{
   const pane=document.querySelector('#workspace-tools'),box=pane.getBoundingClientRect(),style=getComputedStyle(pane),bounds=selector=>{const b=document.querySelector(selector).getBoundingClientRect();return {x:b.x,width:b.width}};
   const right=document.querySelector('#workspace-properties'),rightBox=right.getBoundingClientRect(),rightStyle=getComputedStyle(right);
   return {outer:box.width,client:pane.clientWidth,scrollbar:pane.offsetWidth-pane.clientWidth-parseFloat(style.borderLeftWidth)-parseFloat(style.borderRightWidth),scrolls:pane.scrollHeight>pane.clientHeight,floor:bounds('#floor-panel'),tools:bounds('.tool-grid'),project:bounds('.project-dock'),right:{outer:rightBox.width,scrolls:right.scrollHeight>right.clientHeight,scrollbar:right.offsetWidth-right.clientWidth-parseFloat(rightStyle.borderLeftWidth)-parseFloat(rightStyle.borderRightWidth),tabs:bounds('.right .panel-tabs')},overflow:document.documentElement.scrollWidth>innerWidth,horizontalScroll:pane.scrollWidth>pane.clientWidth};
  });
  for(const width of [1440,1024,390])for(const height of [1000,1600])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   if(width<=990)await page.locator('[data-shell-pane="tools"]').click();
   const samples=[];
   for(const [index,id] of ids.entries()){
    await page.locator('#floors').evaluate(el=>el.closest('aside').scrollTop=0);await page.locator(`[data-floor="${id}"]`).click();
    await page.evaluate(()=>document.querySelector('#workspace-tools').scrollTop=0);
    const sample={components:[0,1,2,3,4,30][index],...await measure()};samples.push(sample);
   }
   measurements.push({width,height,theme,samples});
   fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({measurements,errors,requests},null,2));
   const base=samples[0];
   for(const sample of samples){
    assert(Math.abs(sample.outer-base.outer)<.5,'outer sidebar width stays fixed');
    for(const part of ['floor','tools','project'])for(const dimension of ['x','width'])assert(Math.abs(sample[part][dimension]-base[part][dimension])<.5,`${width}x${height} ${theme}: ${part}.${dimension} changes with ${sample.components} components (${base[part][dimension]} -> ${sample[part][dimension]})`);
    if(width>990){for(const dimension of ['x','width'])assert(Math.abs(sample.right.tabs[dimension]-base.right.tabs[dimension])<.5,'right property content width stays fixed');assert(Math.abs(sample.right.scrollbar)<1,'right scrollbar takes no layout width')}
    assert(Math.abs(sample.scrollbar)<1,'left scrollbar takes no layout width');
    assert(!sample.overflow&&!sample.horizontalScroll,'no horizontal overflow');
   }
   if(width===1440&&height===1600&&theme==='light'){
    assert(samples.some(s=>!s.scrolls)&&samples.some(s=>s.scrolls),'fixture crosses the vertical scrollbar threshold');
    await page.screenshot({path:path.join(out,'many-components.png'),fullPage:true});
   }
  }
  // Both bars remain usable with native wheel, direct thumb drag and keyboard.
  await page.setViewportSize({width:1440,height:700});await page.locator(`[data-floor="${ids.at(-1)}"]`).click();
  const beforeScroll=await page.evaluate(()=>JSON.stringify(SpatialEditor.project));
  for(const paneId of ['workspace-tools','workspace-properties']){
   const pane=page.locator('#'+paneId),bar=page.locator(`.sidebar-scrollbar[aria-controls="${paneId}"]`);
   await pane.evaluate(el=>el.scrollTop=0);await bar.waitFor({state:'visible'});
   await bar.focus();await page.keyboard.press('End');await page.waitForFunction(id=>{const el=document.getElementById(id);return el.scrollTop>=el.scrollHeight-el.clientHeight-1},paneId);
   await page.keyboard.press('Home');await page.waitForFunction(id=>document.getElementById(id).scrollTop===0,paneId);
   await page.keyboard.press('ArrowDown');await page.waitForFunction(id=>document.getElementById(id).scrollTop>0,paneId);assert.equal(await bar.evaluate(el=>getComputedStyle(el).outlineStyle),'none','keyboard focus has no full-height outline');await page.keyboard.press('Home');
   const box=await pane.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,250);await page.waitForFunction(id=>document.getElementById(id).scrollTop>0,paneId);
   await pane.evaluate(el=>el.scrollTop=0);await page.waitForFunction(id=>document.querySelector(`.sidebar-scrollbar[aria-controls="${id}"]`).getAttribute('aria-valuenow')==='0',paneId);
   const thumb=await bar.locator('.sidebar-scrollbar-thumb').boundingBox(),track=await bar.boundingBox();await page.mouse.move(thumb.x+thumb.width/2,thumb.y+thumb.height/2);await page.mouse.down();await page.mouse.move(thumb.x+thumb.width/2,track.y+track.height-3,{steps:8});await page.mouse.up();
   assert(await pane.evaluate(el=>el.scrollTop>=(el.scrollHeight-el.clientHeight)*.9),'overlay thumb drags to the bottom');
   const contents=await pane.evaluate(el=>{const target=el.querySelector('.tool-grid')||el.querySelector('.panel-tabs');return {width:el.getBoundingClientRect().width,content:target.getBoundingClientRect().width}});assert(contents.content>0);
   const header=await pane.locator('.project-dock,.inspector-heading').first().boundingBox();assert(track.y>=box.y+header.height+8,'scrollbar clears the heading divider');
  }
  assert.equal(await page.evaluate(()=>JSON.stringify(SpatialEditor.project)),beforeScroll,'scrollbar keyboard and pointer input never edit selected components');
  await page.evaluate(()=>{document.documentElement.dataset.theme='light';document.querySelectorAll('.workspace>aside').forEach(el=>el.scrollTop=0)});await page.locator('#canvas').focus();await page.mouse.move(700,300);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:path.join(out,'both-scrollbars-light.png'),fullPage:true});await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.screenshot({path:path.join(out,'both-scrollbars-dark.png'),fullPage:true});
  await page.waitForFunction(()=>[...document.querySelectorAll('.sidebar-scrollbar-thumb')].every(el=>getComputedStyle(el).opacity==='0'));await page.screenshot({path:path.join(out,'idle-scrollbars-dark.png'),fullPage:true});
  await page.mouse.move(1300,350);await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('[aria-controls="workspace-properties"].sidebar-scrollbar .sidebar-scrollbar-thumb')).opacity)>.4);await page.screenshot({path:path.join(out,'property-scrollbar-dark.png'),clip:await page.locator('#workspace-properties').boundingBox()});
  await page.setViewportSize({width:390,height:844});for(const name of ['tools','properties','canvas']){await page.locator(`[data-shell-pane="${name}"]`).click();await page.waitForFunction(name=>[...document.querySelectorAll('.sidebar-scrollbar')].filter(el=>!el.hidden).every(el=>el.getAttribute('aria-controls')===(name==='tools'?'workspace-tools':name==='properties'?'workspace-properties':'')),name)}
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({measurements,checks:['both sidebar contents keep their full width','wheel/keyboard/overlay thumb scroll both panes','mobile pane switches hide inactive scrollbars'],errors,requests},null,2));
  console.log('PASS sidebar width: both panes, 0/1/2/3/4/30 components, classic scrollbar threshold, long names, 1440/1024/390 widths, two heights, light/dark; wheel/keyboard/thumb drag, mobile switching and no layout width or horizontal overflow. Evidence: qa/sidebar-width/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
