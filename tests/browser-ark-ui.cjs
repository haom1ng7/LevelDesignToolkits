const {openToolMenu,selectTool}=require('./tool-menu.cjs');
// Visual shell acceptance. Independent context; QA project writes/deletions are suppressed.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright-core');
const out=path.join(__dirname,'../qa/endfield-ui');
const luminance=color=>{
 const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});
 return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
};
const contrast=(a,b)=>{a=luminance(a);b=luminance(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light',acceptDownloads:true});
  await context.addInitScript(()=>{
   const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
   const projectKey=k=>/^(spatial-studio-v9:|level-diagram-studio-desktop-v1)/.test(k);
   Storage.prototype.setItem=function(k,v){if(!projectKey(k))return set.call(this,k,v)};
   Storage.prototype.removeItem=function(k){if(!projectKey(k))return remove.call(this,k)};
   window.showSaveFilePicker=undefined;
  });
  const page=await context.newPage(),errors=[],requests=[],layouts=[],contrasts=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  await page.goto(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
  const settle=()=>page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled(document.getAnimations().map(a=>a.finished))});
  const capture=async name=>{await settle();await page.screenshot({path:path.join(out,name+'.png')})};
  assert.equal(await page.title(),'关卡设计工具箱 v1.2');
  assert.equal(await page.locator('.version').innerText(),'v1.2');
  assert.equal(await page.locator('html').getAttribute('data-ark-theme'),'endfield');
  assert.equal(await page.locator('html').getAttribute('data-ark-depth'),'maximal');
  assert.equal(await page.locator('.workbench-rail,.workbench-status,[data-shell-section],#shell-context').count(),0,'removed shell regions are absent');
  assert(!(await page.locator('#status').isVisible()),'internal status messages do not occupy the interface');
  assert.equal(await page.locator('#shell-mode-label').innerText(),'START');
  assert.equal(await page.locator('#shell-view-index').innerText(),'00');
  assert((await page.locator('.ui-eyebrow').allTextContents()).every(text=>!/[\u3400-\u9fff]/.test(text)),'English micro-labels have no Chinese suffix');
  const unresolved=await page.evaluate(()=>[...document.querySelectorAll('[aria-controls],[aria-labelledby]')].flatMap(el=>['aria-controls','aria-labelledby'].flatMap(a=>(el.getAttribute(a)||'').split(/\s+/).filter(id=>id&&!document.getElementById(id)))));
  assert.deepEqual(unresolved,[]);
  for(const width of [1440,1024,991,990,768,390,360])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:width<660?844:1000});
   await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await settle();
   const layout=await page.evaluate(()=>{
    const stage=document.querySelector('#stage').getBoundingClientRect();
    const cards=[...document.querySelectorAll('#welcome [data-template]')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,width:r.width}});
    const welcome=document.querySelector('#welcome');
    return {overflow:document.documentElement.scrollWidth>innerWidth,stage:{x:stage.x,right:stage.right,y:stage.y,bottom:stage.bottom},cards,scrollable:welcome.scrollHeight>welcome.clientHeight};
   });
   assert(!layout.overflow,`${width}/${theme} page overflow`);
   assert(layout.cards.every(r=>r.x>=layout.stage.x&&r.right<=layout.stage.right+.5&&r.width>120));
   assert(layout.cards.every(r=>r.bottom<=layout.stage.bottom+.5)||layout.scrollable,'entry actions are visible or scrollable');
   layouts.push({width,theme,...layout});
   const pairs=await page.evaluate(()=>{
    const root=getComputedStyle(document.documentElement),read=name=>root.getPropertyValue('--ark-'+name).trim();
    const probe=document.createElement('span');document.body.append(probe);
    const rgb=val=>{probe.style.color=val;return getComputedStyle(probe).color};
    const result=[['body','ink','panel'],['muted','ink-2','panel'],['muted on paper','ink-2','paper'],['signal action','on-signal','signal'],['focus ring','focus','panel']].map(([role,a,b])=>({role,a:rgb(read(a)),b:rgb(read(b))}));probe.remove();return result;
   });
   for(const pair of pairs){const ratio=contrast(pair.a,pair.b);assert(ratio>=(pair.role==='focus ring'?3:4.5),`${theme} ${pair.role}: ${ratio}`);contrasts.push({width,theme,role:pair.role,ratio})}
   if(width===1440||width===390)await capture(`welcome-${width}-${theme}`);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>document.documentElement.dataset.theme='light');
  await page.locator('#welcome [data-template="space"]').click();
  const project=()=>page.evaluate(()=>({json:JSON.stringify(SpatialEditor.project),undo:SpatialEditor.undoCount}));
  const before=await project();
  await page.locator('#theme-toggle').click();await settle();assert.deepEqual(await project(),before,'theme does not alter project/history');
  assert.equal(await page.evaluate(()=>localStorage.getItem('level-toolkits-ui-theme')),'dark');
  for(const mode of ['solid','elevation','plan']){await page.locator(`[data-view="${mode}"]`).click();assert.equal(await page.locator(`[data-view="${mode}"]`).getAttribute('aria-pressed'),'true');assert.equal(await page.locator('body').getAttribute('data-workspace-mode'),mode);assert.equal(await page.locator('#shell-mode-label').innerText(),{solid:'VOLUME',elevation:'ELEVATION',plan:'PLAN'}[mode]);assert.equal(await page.locator('#shell-view-index').innerText(),'01','the first drawing keeps its number in every view');await capture('space-'+mode+'-desktop-dark')}
  const planeId=await page.evaluate(()=>SpatialEditor.document.objects.find(o=>o.type==='plane').id);
  await page.locator(`#layers [data-layer="${planeId}"]`).click();
  assert(await page.locator('#prop-px').isVisible());
  assert.equal(await page.locator('.transform-values input').count(),9);
  await capture('inspector-desktop-dark');
  // Use genuine keyboard navigation to check the visible focus and selected state.
  await page.locator('[data-view="plan"]').focus();await page.keyboard.press('Tab');
  assert(await page.locator('[data-view="elevation"]').evaluate(el=>el.matches(':focus-visible')&&getComputedStyle(el).outlineStyle==='solid'));
  await page.keyboard.press('Enter');assert.equal(await page.locator('[data-view="elevation"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-action="export-menu"]').click();
  await page.waitForFunction(()=>SpatialEditor.exportPreview?.ready);
  await capture('export-desktop-dark');
  await page.locator('#export-dialog [data-action="export-close"]').last().click();
  await page.locator('[data-view="plan"]').click();
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-shell-pane="tools"]').click();
  assert(await page.locator('#workspace-canvas').evaluate(el=>el.inert));
  await selectTool(page,'plane');
  assert.equal(await page.locator('body').getAttribute('data-pane'),'canvas');
  assert(await page.locator('#workspace-tools').evaluate(el=>el.inert));
  await page.evaluate(()=>SpatialEditor.setTool('select'));
  assert.equal(await page.locator('[data-shell-options]').count(),0);
  await page.locator('[data-action="fit"]').focus();
  assert(await page.locator('[data-action="fit"]').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.closest('.canvas-top').getBoundingClientRect();return a.left>=b.left&&a.right<=b.right}),'keyboard focus reveals offscreen toolbar actions');
  await page.locator('[data-view="plan"]').focus();
  await page.locator('[data-shell-pane="tools"]').click();
  await page.locator(`#layers [data-layer="${planeId}"]`).click();
  await page.locator('[data-shell-pane="properties"]').click();await capture('inspector-portrait-dark');
  await page.locator('[data-shell-pane="canvas"]').click();
  await page.locator('[data-action="help"]').click();assert(await page.locator('#help-chapter').isVisible());await capture('help-portrait-dark');
  await page.locator('[data-action="close-help"]').click();
  // Both direct entry types are exercised via the new drawing dialog.
  await page.locator('[data-shell-pane="tools"]').click();await page.locator('[data-action="new"]').click();
  await page.locator('#new-name').fill('节奏设计');await page.locator('#new-dialog [data-template="curve"]').click();
  assert.equal(await page.evaluate(()=>SpatialEditor.document.type),'curve');
  assert.equal(await page.locator('#shell-mode-label').innerText(),'RHYTHM');
  assert.equal(await page.locator('#shell-view-index').innerText(),'02','curve drawings share the project drawing order');
  await capture('curve-portrait-dark');
  await page.setViewportSize({width:1440,height:1000});await capture('curve-desktop-dark');
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await settle();
  assert.equal(await page.locator('.template-cards').evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('spatial-studio-v9:')).length),0,'QA does not persist project data');
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({layouts,contrasts,errors,requests},null,2));
  console.log('PASS Endfield maximal UI: 14 viewport/theme combinations; AA text contrast; keyboard focus/Enter; reduced motion; both drawing types; theme/history isolation; English micro-labels; removed navigation rail and status row; mode composition, inspector, export, help and narrow pane actions; no page errors or network requests. Evidence: qa/endfield-ui/.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
