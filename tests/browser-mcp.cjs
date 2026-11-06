// Full path: MCP stdio -> authenticated HTTP -> real Chrome -> editor history and export.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('playwright-core'),{createClient}=require('./helpers/mcp-client.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa/mcp');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const client=createClient(),errors=[],checks=[];let browser;
 try{
  await client.request('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'browser-test',version:'1'}});
  const info=await client.tool('studio_connect');
  browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER?{executablePath:process.env.STUDIO_BROWSER}:{channel:'chrome'})});
  const page=await browser.newPage({viewport:{width:1500,height:1000}});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(info.url);await page.locator('#studio-mcp-status').getByText('AI 已连接',{exact:false}).waitFor();
  assert.equal(await page.locator('#studio-mcp-status > span').textContent(),'AI 已连接');
  assert.equal(new URL(page.url()).hash,'','pairing fragment removed from address bar');
  const schema=await client.tool('studio_get_schema');assert(schema.templates.plane);
  const get=()=>client.tool('studio_get_state');const apply=async operations=>client.tool('studio_apply_operations',{expectedRevision:(await get()).revision,operations});
  let s=await apply([{op:'create_document',id:'arena',type:'space',name:'MCP 联动中庭'},
   {op:'create_object',id:'ground',type:'plane',props:{position:[600,400,0],points:[[-450,-300],[450,-300],[450,300],[-450,300]],thickness:20}},
   {op:'create_object',id:'wall',type:'wall',props:{position:[600,100,0],points:[[-450,0],[450,0],[450,240],[-450,240]],thickness:20}},
   {op:'create_object',id:'door',type:'hole',props:{host:'wall',points:[[-60,10],[60,10],[60,190],[-60,190]]}},
   {op:'create_object',id:'stairs',type:'stairs',props:{position:[900,400,0],countMode:'manual',flights:[{id:'flight',points:[[-50,-120],[50,-120],[50,120],[-50,120]],start:0,end:240,steps:12}]}},
   {op:'create_object',id:'label',type:'text',props:{position:[600,390,0],text:'AI 中央大厅',size:30}},
   {op:'create_object',id:'route',type:'route',props:{position:[0,0,0],points:[[600,650,0],[600,400,0],[600,100,0]],color:'#c69832',width:6}}
  ]);
  assert.equal(s.document.objects.length,6);assert.equal(s.undoCount,1);await page.locator('#doc-title').getByText('MCP 联动中庭',{exact:true}).waitFor();
  await page.screenshot({path:path.join(out,'space-plan.png'),fullPage:true});checks.push('stdio MCP 创建完整空间图、墙体空洞、楼梯、路线与中文标签，实时显示且一批一次历史');
  const before=JSON.stringify((await get()).document);
  await assert.rejects(apply([{op:'update_document',props:{name:'应当回滚'}},{op:'update_object',id:'door',props:{points:[[2000,0],[2100,0],[2100,100],[2000,100]]}}]),/空洞/);
  assert.equal(JSON.stringify((await get()).document),before);
  const revision=(await get()).revision;
  await page.evaluate(()=>{SpatialEditor.document.objects.find(o=>o.id==='label').text='手动修改';SpatialEditor.setTool('select')});
  await assert.rejects(client.tool('studio_apply_operations',{expectedRevision:revision,operations:[{op:'update_document',props:{name:'过期'}}]}),/图稿已变化/);
  await page.locator('[data-panel="document"]').click();await page.locator('#doc-name').focus();
  await assert.rejects(apply([{op:'update_document',props:{name:'输入中'}}]),/手动操作/);await page.locator('#doc-title').click();
  checks.push('真实页面无效空洞整批回滚，手动改图的 revision 冲突与输入期间写入被拒绝');
  s=await apply([{op:'move_objects',ids:['wall'],delta:[0,20,0]}]);
  s=await client.tool('studio_history',{expectedRevision:s.revision,action:'undo'});assert.equal(s.document.objects.find(o=>o.id==='wall').position[1],100);
  s=await client.tool('studio_history',{expectedRevision:s.revision,action:'redo'});assert.equal(s.document.objects.find(o=>o.id==='wall').position[1],120);
  for(const mode of ['elevation','solid','plan']){s=await client.tool('studio_set_view',{expectedRevision:(await get()).revision,mode,ids:[],fit:true});assert.equal(s.view.mode,mode);await page.screenshot({path:path.join(out,'space-'+mode+'.png'),fullPage:true})}
  const svg=await client.tool('studio_export',{format:'svg'});assert.match(svg.text,/<svg/);assert(svg.text.includes('手动修改'));fs.writeFileSync(path.join(out,'space.svg'),svg.text);
  await page.locator('[data-action="export-menu"]').click();await page.locator('#export-format').selectOption('svg');
  // The normal export preview uses its download action, rather than the MCP text path.
  try{await page.waitForFunction(()=>!document.querySelector('#export-download').disabled,{},{timeout:20000})}catch(error){await page.screenshot({path:path.join(out,'export-failure.png'),fullPage:true});throw Error('Export preview: '+await page.locator('#export-ready').textContent()+'; '+error.message)}
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-download').click()]);await download.saveAs(path.join(out,'ui-export.svg'));
  await page.locator('#export-dialog [data-action="export-close"]').first().click();checks.push('宿主移动与一次撤销/重做、三视图、MCP SVG 与网页实际 SVG 下载');
  s=await apply([{op:'create_document',id:'pacing',type:'curve',name:'AI 节奏曲线'}]);
  s=await apply([{op:'set_curve',props:{title:'潜入关卡节奏',stages:[{id:'a',label:'探索',color:'#8fa9c3'},{id:'b',label:'高潮',color:'#b99383'}],events:[{id:'e1',label:'进入中庭',stage:'a',fraction:.5,x:.25,y:.3,labelPosition:'above'},{id:'e2',label:'最终遭遇',stage:'b',fraction:.5,x:.75,y:.9,labelPosition:'above'}]}}]);
  assert.equal(s.document.curve.events.length,2);await page.screenshot({path:path.join(out,'curve.png'),fullPage:true});
  const project=await client.tool('studio_export',{format:'project'});fs.writeFileSync(path.join(out,'project.json'),project.text);assert.equal(JSON.parse(project.text).documents.length,2);
  // Reopen the exported JSON through the actual browser import path.
  await page.locator('[data-action="import"]').click();await page.locator('#file-input').setInputFiles(path.join(out,'project.json'));await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('工程已载入'));
  await page.waitForTimeout(600);assert.equal((await get()).documents.length,2);checks.push('节奏阶段/事件生成、完整工程导出和网页 JSON 重新导入');
  async function checkStatusPosition(){
   for(const width of [390,720,1500]){
    await page.setViewportSize({width,height:1000});
    for(const text of ['曲线属性','这是很长的当前选择状态，用于验证两侧内容不会推动 AI 提示']){
     await page.locator('#selection-info').evaluate((el,text)=>{el.textContent=text},text);
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     const layout=await page.locator('#studio-mcp-status').evaluate(el=>{const r=el.getBoundingClientRect(),stage=document.querySelector('#stage').getBoundingClientRect(),dock=el.closest('.canvas-bottom')?.getBoundingClientRect(),zoom=document.querySelector('.canvas-bottom .zoom').getBoundingClientRect();return {docked:!!dock,top:r.top,bottom:r.bottom,left:r.left,right:r.right,center:(r.left+r.right)/2,canvasCenter:(stage.left+stage.right)/2,stageBottom:stage.bottom,dockBottom:dock?.bottom,overlapsZoom:r.left<zoom.right&&r.right>zoom.left&&r.top<zoom.bottom&&r.bottom>zoom.top,overflow:document.documentElement.scrollWidth>innerWidth}});
     assert(layout.docked);assert(Math.abs(layout.center-layout.canvasCenter)<1,'AI status is centered on the canvas');assert(layout.top>=layout.stageBottom-1,'AI status stays below the drawing stage');assert(layout.bottom<=layout.dockBottom+1);assert.equal(layout.overlapsZoom,false,'AI status does not overlap zoom controls');assert.equal(layout.overflow,false);
    }
   }
  }
  await checkStatusPosition();
  await page.screenshot({path:path.join(out,'status-dock.png'),fullPage:true});checks.push('390/720/1500px 及长短选择信息下，AI 连接/断开状态始终相对画板居中且不遮挡画板或缩放控件');
  await page.locator('#studio-mcp-status button').click();await page.waitForTimeout(350);assert.equal((await client.tool('studio_connect')).connected,false);await assert.rejects(get(),/尚未连接/);
  assert.equal(await page.locator('#studio-mcp-status').textContent(),'AI 已断开');
  await checkStatusPosition();
  const offline=await browser.newPage();let requests=0;offline.on('request',req=>{if(/^https?:/.test(req.url()))requests++});await offline.goto(pathToFileURL(path.join(root,'dist/index.html')).href);assert.equal(await offline.locator('#studio-mcp-status').count(),0);assert.equal(requests,0);checks.push('断开后拒绝 AI 操作；原离线页无联动条与网络请求');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({pass:true,checks,errors},null,2));console.log('PASS MCP browser: '+checks.join('；'));
 }finally{if(browser)await browser.close();await client.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
