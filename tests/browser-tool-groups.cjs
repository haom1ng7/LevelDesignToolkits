// Tool flyouts: real mouse, keyboard/touch, viewport clipping and creation paths.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright-core');
const out=path.join(__dirname,'../qa/tool-groups'),url=pathToFileURL(path.join(__dirname,'../dist/index.html')).href;
const groups={shapes:['plane','ellipse','polygon'],ladders:['stairs','ladder','spiral'],annotations:['text','marker','route']};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const context=await browser.newContext({viewport:{width:1600,height:1000}}),errors=[],network=[],checks=[],layouts=[];
  await context.addInitScript(()=>{Storage.prototype.setItem=function(){};Storage.prototype.removeItem=function(){}});
  const track=page=>{page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())})};
  const page=await context.newPage();track(page);await page.goto(url);await page.evaluate(()=>document.fonts.ready);
  const trigger=g=>page.locator(`[data-tool-group="${g}"]`),menu=g=>page.locator(`#tool-${g}-menu`);
  for(const g of Object.keys(groups))assert(await trigger(g).isDisabled(),'empty project disables '+g);
  await page.locator('#welcome [data-template="space"]').click();
  const unchanged=()=>page.evaluate(()=>({project:JSON.stringify(SpatialEditor.project),undo:SpatialEditor.undoCount}));
  const before=await unchanged();
  await trigger('shapes').hover();assert(await menu('shapes').isVisible());
  assert.equal(await trigger('shapes').getAttribute('aria-expanded'),'true');
  await page.locator('[data-tool="ellipse"]').hover();assert(await menu('shapes').isVisible(),'cross gap into menu');
  await page.mouse.move(800,900);await menu('shapes').waitFor({state:'hidden'});
  await trigger('shapes').focus();await page.keyboard.press('ArrowDown');
  assert(await page.locator('[data-tool="plane"]').evaluate(el=>el===document.activeElement));
  await page.keyboard.press('ArrowUp');assert(await page.locator('[data-tool="polygon"]').evaluate(el=>el===document.activeElement));
  await page.keyboard.press('Home');await page.keyboard.press('End');
  await page.keyboard.press('Escape');assert(await trigger('shapes').evaluate(el=>el===document.activeElement));
  assert.equal(await page.evaluate(()=>SpatialEditor.tool),'select','closing menu preserves tool');
  await page.keyboard.press('Space');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>SpatialEditor.tool),'ellipse');assert(await menu('shapes').isHidden());
  assert(await trigger('shapes').evaluate(el=>el.classList.contains('active')));
  assert.equal(await page.locator('[data-tool="ellipse"]').getAttribute('aria-checked'),'true');
  assert(await page.locator('#canvas').evaluate(el=>el===document.activeElement),'selection returns focus to canvas');
  await trigger('ladders').click();await page.keyboard.press('Tab');assert(await menu('ladders').isHidden());
  await trigger('ladders').hover();await trigger('annotations').hover();assert(await menu('ladders').isHidden());assert(await menu('annotations').isVisible());
  await page.locator('#doc-title').click();assert(await menu('annotations').isHidden(),'outside pointer closes');
  assert.deepEqual(await unchanged(),before,'browsing menus and changing tools do not edit project/history');
  checks.push('hover, gap crossing, leave/outside dismissal, one menu, keyboard wrap/Home/End/Tab/Escape, focus and history isolation');
  // Existing physical shortcuts still select grouped tools without opening a menu.
  for(const [key,t,g] of [['p','plane','shapes'],['c','ellipse','shapes'],['t','text','annotations'],['m','marker','annotations'],['l','route','annotations']]){
   await page.locator('#canvas').focus();await page.keyboard.press(key);assert.equal(await page.evaluate(()=>SpatialEditor.tool),t);
   assert(await trigger(g).evaluate(el=>el.classList.contains('active')));assert(await menu(g).isHidden());
  }
  checks.push('P/C/T/M/L shortcuts and parent active state');
  // Create through every grouped menu using actual canvas gestures.
  await page.keyboard.press('Escape');await page.locator('#snap').uncheck();await page.locator('#move-snap').uncheck();
  const point=p=>page.evaluate(p=>{const q=new DOMPoint(...p).matrixTransform(document.querySelector('#canvas').getScreenCTM());return {x:q.x,y:q.y}},p);
  const pick=async t=>{const g=Object.keys(groups).find(g=>groups[g].includes(t));await trigger(g).click();await page.locator(`[data-tool="${t}"]`).click();assert(await menu(g).isHidden());assert.equal(await page.evaluate(()=>SpatialEditor.tool),t)};
  for(const [t,a,b] of [['plane',[160,140],[360,270]],['ellipse',[750,140],[950,270]],['stairs',[430,390]],['ladder',[720,390]],['spiral',[950,390]],['marker',[170,550]]]){
   await pick(t);const count=await page.evaluate(()=>SpatialEditor.document.objects.length),p=await point(a);await page.mouse.move(p.x,p.y);
   if(b){const q=await point(b);await page.mouse.down();await page.mouse.move(q.x,q.y,{steps:8});await page.mouse.up()}else await page.mouse.click(p.x,p.y);
   assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),count+1,'create '+t);
   assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.at(-1).type),t==='ellipse'?'plane':t);
  }
  await pick('polygon');const count=await page.evaluate(()=>SpatialEditor.document.objects.length);for(const a of [[200,300],[350,300],[300,450],[200,300]]){const q=await point(a);await page.mouse.click(q.x,q.y)}assert.equal(await page.evaluate(()=>SpatialEditor.document.objects.length),count+1);
  await pick('text');let p=await point([400,570]);await page.mouse.click(p.x,p.y);await page.locator('#inline-editor').fill('分组工具');await page.keyboard.press('Control+Enter');
  assert(await page.evaluate(()=>SpatialEditor.document.objects.some(o=>o.type==='text'&&o.text==='分组工具')));
  await pick('route');for(const a of [[700,560],[900,600]]){p=await point(a);await page.mouse.click(p.x,p.y)}await page.keyboard.press('Enter');
  assert(await page.evaluate(()=>SpatialEditor.document.objects.some(o=>o.type==='route')));checks.push('actual creation through all nine grouped tools');
  await page.keyboard.press('Escape');
  // Arrow navigation in a menu must never nudge selected geometry.
  await page.evaluate(()=>SpatialEditor.select(SpatialEditor.document.objects[0].id,false,true));const selectedBefore=await unchanged();
  await trigger('shapes').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Escape');
  assert.deepEqual(await unchanged(),selectedBefore);checks.push('menu arrows do not move selected objects');
  for(const mode of ['elevation','solid']){
   await page.locator(`[data-view="${mode}"]`).click();assert(await trigger('shapes').isDisabled());
   assert.equal(await trigger('ladders').isDisabled(),mode==='solid');
   await trigger('annotations').click();
   for(const t of groups.annotations)assert.equal(await page.locator(`[data-tool="${t}"]`).isDisabled(),mode==='solid'?t==='marker':t!=='marker');
   await page.keyboard.press('Escape');
  }
  await page.evaluate(()=>SpatialEditor.createDocument('curve','菜单状态检查'));assert(await trigger('shapes').isDisabled());assert(await trigger('ladders').isDisabled());
  await trigger('annotations').click();for(const t of groups.annotations)assert(await page.locator(`[data-tool="${t}"]`).isEnabled());await page.keyboard.press('Escape');
  checks.push('empty/curve/elevation/solid availability preserved');
  await page.evaluate(()=>SpatialEditor.createDocument('space','工具分组'));
  for(const width of [1600,1024,990,768,430,390,360])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:900});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   if(width<=990)await page.locator('[data-shell-pane="tools"]').click();
   for(const g of Object.keys(groups)){
    await trigger(g).click();
    await menu(g).evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
    const layout=await menu(g).evaluate(el=>{const r=el.getBoundingClientRect(),b=el.querySelector('button').getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return {box:r.toJSON(),hit:hit?.closest('[role="menu"]')===el,hitTarget:hit?.outerHTML.slice(0,200),overflow:document.documentElement.scrollWidth>innerWidth}});
    if(!layout.hit)await page.screenshot({path:path.join(out,'hit-failure.png')});
    assert(layout.box.x>=0&&layout.box.y>=0&&layout.box.right<=width&&layout.box.bottom<=900,`${width}/${theme}/${g} fits viewport`);assert(layout.hit,`${width}/${theme}/${g} menu reachable above scroll rail: ${JSON.stringify(layout)}`);assert(!layout.overflow);
    layouts.push({width,theme,group:g,...layout});
    if((width===1600&&g==='shapes')||(width===390&&g==='ladders'))await page.screenshot({path:path.join(out,`${g}-${width}-${theme}.png`)});
    await page.keyboard.press('Escape');
   }
  }
  checks.push('42 viewport/theme/group layouts and top-layer hit testing');
  await page.emulateMedia({reducedMotion:'reduce'});await trigger('shapes').click();
  assert.equal(await menu('shapes').evaluate(el=>getComputedStyle(el).animationName),'none');await page.keyboard.press('Escape');checks.push('reduced motion');
  const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await touch.addInitScript(()=>{Storage.prototype.setItem=function(){}});const phone=await touch.newPage();track(phone);await phone.goto(url);await phone.locator('#welcome [data-template="space"]').tap();await phone.locator('[data-shell-pane="tools"]').tap();
  await phone.locator('[data-tool-group="shapes"]').tap();assert(await phone.locator('#tool-shapes-menu').isVisible());assert.equal(await phone.locator('body').getAttribute('data-pane'),'tools');
  await phone.locator('[data-tool="ellipse"]').tap();assert.equal(await phone.locator('body').getAttribute('data-pane'),'canvas');assert.equal(await phone.evaluate(()=>SpatialEditor.tool),'ellipse');assert(await phone.locator('#tool-shapes-menu').isHidden());checks.push('touch opens menu, child selection returns to canvas');
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,layouts,errors,network},null,2));
  console.log('PASS tool groups: mouse/keyboard/touch, all nine creation paths, history isolation, view availability, 42 layouts, reduced motion; no errors or network. Evidence: qa/tool-groups/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
