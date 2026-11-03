// Real current-UI recordings; APIs only prepare fixtures. Optional positional demo name.
// node tests/record-help-demos.js; encode/build/manual; node tests/record-help-demos.js --verify
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa/help-ui'),frames=path.join(out,'frames');
const names=['build','place','shape','annotate','world','curve','export'],viewport={width:1440,height:1000};
(async()=>{
 fs.mkdirSync(frames,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const page=await browser.newPage({viewport,acceptDownloads:true}),errors=[],network=[],checks=[],counts={};
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.join(root,'dist/index.html')).href);await page.evaluate(()=>document.fonts.ready);
  if(process.argv.includes('--verify')){
   const demos=JSON.parse(fs.readFileSync(path.join(root,'src/help/content.json'),'utf8')).sections.filter(s=>s.demo).map(s=>s.demo);assert.deepEqual(demos,names);
   const verify=async(inApp)=>{
    const buttons=page.locator(inApp?'[data-help-demo]':'.demo');assert.equal(await buttons.count(),7);
    for(const [i,name] of demos.entries()){
     const b=buttons.nth(i);await b.scrollIntoViewIfNeeded();
     for(const [ext,attr] of [['gif','data-gif'],['png','data-poster']])assert.equal((await b.getAttribute(attr)).split(',')[1],fs.readFileSync(path.join(root,'src/help',name+'.'+ext)).toString('base64'));
     await b.click();await b.locator('img').evaluate(im=>im.decode());assert.equal(await b.getAttribute('aria-pressed'),'true');
     const a=await b.screenshot();await page.waitForTimeout(1650);assert(!a.equals(await b.screenshot()),name+' advances');
     assert.equal(await buttons.evaluateAll(bs=>bs.filter(b=>b.querySelector('img').src.startsWith('data:image/gif')).length),1);
     await b.click();assert.equal(await b.getAttribute('aria-pressed'),'false');assert(await b.evaluate(b=>b.querySelector('img').src===b.dataset.poster));
    }
    checks.push((inApp?'In-app':'Standalone')+' seven current GIFs/posters, real animation, single playback and stop');
   };
   await page.locator('[data-action="help"]').click();await verify(true);
   await page.locator('[data-help-demo="WORLD"]').click();await page.locator('[data-action="close-help"]').click();
   assert(await page.locator('[data-help-demo]').evaluateAll(bs=>bs.every(b=>b.querySelector('img').src===b.dataset.poster)));
   for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});await page.locator('[data-action="help"]').click();await page.locator('#help-content').evaluate(el=>el.scrollTop=0);
    assert(await page.locator('#help-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth));await page.screenshot({path:path.join(out,'help-'+width+'.png')});await page.keyboard.press('Escape');
   }
   await page.goto(pathToFileURL(path.join(root,'docs/使用说明.html')).href);await page.setViewportSize(viewport);await verify(false);
   for(const width of [1440,390]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))}
   checks.push('1440px/390px help fits; closing help stops GIFs');assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
   fs.writeFileSync(path.join(out,'playback-report.json'),JSON.stringify({checks,errors,network},null,2));console.log('PASS '+checks.join('; '));return;
  }
  await page.addStyleTag({content:'.record-caption{position:fixed;z-index:100000;padding:10px 16px;border-left:4px solid #e8ed38;background:#22251ff2;color:#fff;font:600 19px/1.5 "Microsoft YaHei",sans-serif;pointer-events:none}.record-pointer{position:fixed;z-index:100001;pointer-events:none;width:25px;height:30px;left:-100px;top:-100px}'});
  await page.evaluate(()=>{
   const c=document.createElement('div');c.className='record-caption';document.body.append(c);
   const p=document.createElement('div');p.className='record-pointer';p.innerHTML='<svg viewBox="0 0 25 30"><path d="M2 2V24L8 18L13 28L17 26L12 16H22Z" fill="#22251f" stroke="white" stroke-width="2"/></svg>';document.body.append(p);
   document.addEventListener('pointermove',e=>{p.style.left=e.clientX+'px';p.style.top=e.clientY+'px'},true);
  });
  let active;
  const caption=text=>page.locator('.record-caption').evaluate((el,text)=>{el.textContent=text;const dialog=document.querySelector('#export-dialog'),open=dialog.open,b=(open?dialog:document.querySelector('#stage')).getBoundingClientRect();(open?dialog:document.body).append(el,document.querySelector('.record-pointer'));el.style.left=(b.left+18)+'px';el.style.top=(b.top+(open?112:14))+'px'},text);
  const frame=async(duration=160)=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:path.join(frames,`${active}_${String(counts[active]++).padStart(3,'0')}_${duration}.png`)})};
  const at=p=>page.evaluate(p=>{const q=new DOMPoint(...p).matrixTransform(document.querySelector('#canvas').getScreenCTM());return {x:q.x,y:q.y}},p);
  const center=async loc=>{const b=await loc.boundingBox();assert(b);return {x:b.x+b.width/2,y:b.y+b.height/2}};
  const click=async p=>{await page.mouse.move(p.x,p.y);await frame(450);await page.mouse.click(p.x,p.y);await frame(700)};
  const drag=async(a,b,{alt=false,shift=false,steps=9}={})=>{
   await page.mouse.move(a.x,a.y);await frame(600);if(alt)await page.keyboard.down('Alt');if(shift)await page.keyboard.down('Shift');await page.mouse.down();
   for(let i=1;i<=steps;i++){await page.mouse.move(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps);await frame()}
   await page.mouse.up();if(alt)await page.keyboard.up('Alt');if(shift)await page.keyboard.up('Shift');await frame(850);
  };
  const tool=async(t,g)=>{if(g){await page.locator(`[data-tool-group="${g}"]`).hover();await page.locator(`#tool-${g}-menu`).waitFor({state:'visible'});await frame(650)}await page.locator(`[data-tool="${t}"]`).click();await frame(500)};
  const fresh=async(type,title,plane=false)=>{
   await page.evaluate(({type,title,plane})=>{const M=StudioModel,A=SpatialEditor,d=M.createDocument(type,title);if(type==='space'){d.objects=[];d.heightReferences=false;if(plane){const o=M.createObject(d,'plane',[200,180,0]);o.points=[[0,0],[600,0],[600,420],[0,420]];d.objects.push(o)}}A.loadProject({format:'level-spatial-editor',version:7,documents:[d],activeDocument:d.id})},{type,title,plane});
   if(type==='space')for(const id of ['snap','move-snap','geometry-snap'])await page.locator('#'+id).uncheck();
   await page.locator('.canvas-top').evaluate(el=>el.scrollLeft=0);
   if(type==='space')await page.evaluate(()=>{const A=SpatialEditor,b=document.querySelector('#stage').getBoundingClientRect();Object.assign(A.camera,{x:0,y:0,w:1200,h:1200*b.height/b.width});A.setTool('select')});await page.mouse.move(900,150);
  };
  const demos={
   async build(){
    await fresh('space','切割与独立移动',true);const id=await page.evaluate(()=>SpatialEditor.document.objects[0].id);await page.locator(`[data-layer="${id}"]`).click();
    await caption('1 / 3  选中平面，点击「切割」');await frame(1000);await tool('cut');await caption('2 / 3  逐点取点，点击首点闭合');
    for(const p of [[350,300],[650,300],[650,470],[350,470],[350,300]])await click(await at(p));assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),2);
    const inner=await page.evaluate(()=>SpatialEditor.document.objects.find(o=>!o.cutouts).id);await page.locator(`[data-layer="${inner}"]`).click();await caption('3 / 3  单独拖动切下的组件');await drag(await at([500,380]),await at([940,490]));await frame(1800);
    assert(await page.evaluate(()=>StudioModel.validGeometry(SpatialEditor.document)));checks.push('closed cut and independent movement');
   },
   async place(){
    await fresh('space','楼梯与标记');
    for(const [t,a,b,label] of [['stairs',[230,260],[420,540],'1 / 4  建筑 → 楼梯：拖出矩形范围'],['ladder',[560,260],[650,540],'2 / 4  建筑 → 爬梯：拖出宽度和长度'],['spiral',[780,300],[1010,530],'3 / 4  建筑 → 旋转楼梯：拖出正圆占地']]){await caption(label);await tool(t,'buildings');await drag(await at(a),await at(b))}
    await caption('4 / 4  标注 → 标记：单击放置');await tool('marker','annotations');await click(await at([620,660]));await page.keyboard.press('Escape');await frame(1800);
    assert.deepEqual(await page.evaluate(()=>SpatialEditor.document.objects.map(o=>o.type)),['stairs','ladder','spiral','marker']);checks.push('current buildings menu, drag-created stairs and marker');
   },
   async shape(){
    await fresh('space','轮廓与大小');await caption('1 / 4  平面 → 矩形：拖拽创建');await tool('plane','shapes');await drag(await at([300,280]),await at([850,600]));await page.keyboard.press('Escape');
    await caption('2 / 4  顶点：拖动角点调整轮廓');await tool('vertex');let p=await page.locator('[data-vertex="0"]').evaluate(el=>[+el.getAttribute('cx'),+el.getAttribute('cy')]);await drag(await at(p),await at([p[0]-60,p[1]+70]));
    await caption('3 / 4  大小：拖边只改变一个尺寸');await tool('size');p=await page.locator('[data-size-edge="1"]').first().evaluate(el=>{const p=el.getPointAtLength(el.getTotalLength()/2);return [p.x,p.y]});await drag(await at(p),await at([p[0]+90,p[1]]));
    await caption('4 / 4  按住 Shift 拖角，等比缩放');p=await page.locator('[data-size-corner="2"]').evaluate(el=>[+el.getAttribute('cx'),+el.getAttribute('cy')]);await drag(await at(p),await at([p[0]+80,p[1]+50]),{shift:true});await frame(1800);
    assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),1);checks.push('rectangle, vertex, edge and Shift corner sizing');
   },
   async annotate(){
    await fresh('space','文字与路线');await caption('1 / 3  标注 → 文字：单击后输入');await tool('text','annotations');await click(await at([380,330]));await page.locator('#inline-editor').fill('主入口');await frame(850);
    await caption('2 / 3  在文字旁调整字号');await page.locator('#inline-font-size').fill('36');await frame(850);await page.keyboard.press('Control+Enter');
    await caption('3 / 3  标注 → 路线：逐点绘制，Enter 完成');await tool('route','annotations');for(const p of [[360,430],[580,430],[580,590],[920,590]])await click(await at(p));await page.keyboard.press('Enter');await frame(1800);
    assert(await page.evaluate(()=>SpatialEditor.document.objects.some(o=>o.type==='text'&&o.text==='主入口'&&o.size===36)));assert(await page.evaluate(()=>SpatialEditor.document.objects.some(o=>o.type==='route'&&o.points.length===4)));checks.push('text, font size and four-node route');
   },
   async world(){
    await fresh('space','立体移动与复制');const id=await page.evaluate(()=>{const A=SpatialEditor,M=StudioModel,d=A.document,p=M.createObject(d,'plane',[600,400,80]);p.points=[[-160,-110],[160,-110],[160,110],[-160,110]];const t=M.createObject(d,'text',[600,400,80]);t.text='平台';t.size=28;p.group=t.group=M.uid();d.objects.push(p,t);A.setTool('select');return p.id});
    await page.locator('[data-view="solid"]').click();await page.evaluate(id=>SpatialEditor.select(id),id);await page.locator('[data-action="fit-selected"]').click();await page.locator('#canvas').focus();await page.keyboard.press('w');
    const move=async(handle,delta,label,alt=false)=>{
     await caption(label);const a=await page.locator(`[data-world-handle="${handle}"]`).evaluate((el,h)=>{const p=el.querySelector(h.length===1?'.gizmo-axis':'.gizmo-plane');let q;if(h.length===1)q=p.getPointAtLength(p.getTotalLength()*.7);else{const b=p.getBBox();q=new DOMPoint(b.x+b.width/2,b.y+b.height/2)}q=q.matrixTransform(p.getScreenCTM());return {x:q.x,y:q.y}},handle);
     const v=await page.evaluate(delta=>{const A=SpatialEditor,M=StudioModel,b=A.scene.basis,p=M.project(delta,b),z=M.project([0,0,0],b),m=document.querySelector('#canvas').getScreenCTM();return {x:(p[0]-z[0])*m.a,y:(p[1]-z[1])*m.d}},delta);await drag(a,{x:a.x+v.x,y:a.y+v.y},{alt});
    };
    const before=await page.evaluate(()=>JSON.stringify(SpatialEditor.document.objects));await move('0',[70,0,0],'1 / 3  W：拖动 X 箭头，沿单轴移动');assert.notEqual(await page.evaluate(()=>JSON.stringify(SpatialEditor.document.objects)),before);
    await move('01',[-30,65,0],'2 / 3  拖动 XY 方块，沿平面移动');await move('2',[0,0,120],'3 / 3  按住 Alt 拖动，复制整组',true);await frame(1800);
    assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),4);checks.push('perspective axis/plane movement and Alt group copy');
   },
   async curve(){
    await fresh('curve','曲线与事件');await caption('1 / 3  拖动事件节点，改变曲线高低');let p=await center(page.locator('#scene [data-event] circle').nth(1));await drag(p,{x:p.x+45,y:p.y+65});
    await caption('2 / 3  双击事件文字，修改名称');const code=await page.evaluate(()=>SpatialEditor.document.curve.events[1].id);
    p=await page.evaluate(id=>{const t=SpatialEditor.scene.texts.find(t=>t.edit==='event:'+id),b=t.layout.box,q=new DOMPoint(b.x+b.w/2,b.y+b.h/2).matrixTransform(document.querySelector('#canvas').getScreenCTM());return {x:q.x,y:q.y}},code);
    await page.mouse.dblclick(p.x,p.y);await page.locator('#inline-editor').fill('遭遇战');await frame(850);await page.keyboard.press('Control+Enter');
    await caption('3 / 3  在右侧点击「＋事件」新增节点');await page.locator('[data-action="add-event"]').click();await frame(1800);
    assert.equal(await page.evaluate(()=>SpatialEditor.document.curve.events.length),4);assert(await page.evaluate(()=>SpatialEditor.document.curve.events.some(e=>e.label==='遭遇战')));checks.push('curve node drag, event rename and new event');
   },
   async export(){
    await fresh('space','保存与导出',true);await page.evaluate(()=>{const A=SpatialEditor,M=StudioModel,d=A.document;d.objects.push(M.createObject(d,'stairs',[500,390,0]));const t=M.createObject(d,'text',[500,220,0]);t.text='关卡入口';t.size=32;d.objects.push(t);A.setTool('select')});
    await caption('1 / 3  保存工程：JSON 可继续编辑');await page.evaluate(()=>{window.showSaveFilePicker=undefined});const pending=page.waitForEvent('download');await page.locator('[data-action="project"]').click();await(await pending).saveAs(path.join(out,'demo-project.json'));await frame(1300);assert.equal(JSON.parse(fs.readFileSync(path.join(out,'demo-project.json'),'utf8')).documents.length,1);
    await page.locator('[data-action="export-menu"]').click();const ready=()=>page.waitForFunction(()=>SpatialEditor.exportPreview?.ready&&!document.querySelector('#export-download').disabled);await ready();await caption('2 / 3  完整图稿：包含全部可见组件');await frame(1400);
    await page.locator('#export-range').selectOption('current');await ready();await caption('3 / 3  当前视野：滚轮缩放、拖动取景');await frame(900);
    const b=await page.locator('#export-preview-svg').boundingBox(),p={x:b.x+b.width*.5,y:b.y+b.height*.5};await page.mouse.move(p.x,p.y);await page.mouse.wheel(0,-230);await page.waitForTimeout(250);await frame(800);await drag(p,{x:p.x+55,y:p.y+35});await frame(1800);
    assert.equal(await page.locator('#export-range').inputValue(),'current');checks.push('JSON download and full/current export preview, wheel and pan');await page.locator('[data-action="export-close"]').first().click();
   }
  };
  const requested=process.argv.slice(2).filter(a=>names.includes(a));for(const name of requested.length?requested:names){
   for(const file of fs.readdirSync(frames))if(new RegExp('^'+name+'_\\d+_\\d+\\.png$').test(file))fs.unlinkSync(path.join(frames,file));
   active=name;counts[name]=0;await demos[name]();console.log('Recorded '+name+': '+counts[name]+' frames');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'recording-report.json'),JSON.stringify({viewport,counts,checks,errors,network,method:'Real current offline UI mouse/keyboard input; API fixture setup only; existing download fallback for JSON save.'},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
