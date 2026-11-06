const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom'),{createClient}=require('./helpers/mcp-client.cjs');
const root=path.resolve(__dirname,'..');
function editor(){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'dist/index.html'),'utf8'),{url:'https://qa.local/mcp.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1200,height:800});
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};
 }});return {dom,w:dom.window,errors};
}
test('native AI editing is atomic, undoable, revision guarded, and shares host/floor/curve semantics',async()=>{
 const {dom,w,errors}=editor(),api=(method,args)=>w.StudioMCP.dispatch(method,args),state=()=>api('get_state');
 const apply=async operations=>api('apply_operations',{expectedRevision:(await state()).revision,operations});
 try{
  assert.equal(w.SpatialEditor.project.documents.length,0);
  const schema=await api('get_schema');assert(schema.templates.stairs.flights.length);assert.equal(schema.templates.hole.host,'REPLACE_WITH_HOST_ID');
  const initial=await state();
  let s=await apply([{op:'create_document',type:'space',id:'arena',name:'中文中庭'},{op:'create_object',type:'plane',id:'ground',props:{position:[600,400,0],points:[[-400,-300],[400,-300],[400,300],[-400,300]]}},{op:'create_object',type:'hole',id:'opening',props:{host:'ground',points:[[-40,-40],[40,-40],[40,40],[-40,40]]}},{op:'create_object',type:'route',id:'path',props:{position:[0,0,0],points:[[300,400,0],[600,400,0],[900,400,0]]}}]);
  assert.equal(s.document.objects.length,3);assert.equal(s.undoCount,1);assert.notEqual(s.revision,initial.revision);
  s=await api('set_view',{expectedRevision:s.revision,ids:['ground'],fit:false});
  const selectedHistory=s.undoCount;s=await apply([{op:'update_object',id:'ground',props:{opacity:1}}]);assert.equal(s.selection[0],'ground');assert.equal(s.undoCount,selectedHistory,'no-op preserves selection and history');
  await assert.rejects(api('apply_operations',{expectedRevision:initial.revision,operations:[{op:'update_document',props:{name:'stale'}}]}),/图稿已变化/);
  const before=JSON.stringify(w.SpatialEditor.project),history=s.undoCount;
  for(const bad of [
   [{op:'update_document',props:{name:'must rollback'}},{op:'update_object',id:'opening',props:{points:[[900,900],[910,900],[910,910],[900,910]]}}],
   [{op:'update_object',id:'ground',props:{points:[[-100,-100],[100,100],[-100,100],[100,-100]]}}],
   [{op:'create_object',type:'plane',id:'ground'}],
   [{op:'update_object',id:'ground',props:{orientation:[0,0,0,0,0,0,0,0,0]}}],
   JSON.parse('[{"op":"update_document","props":{"__proto__":{"polluted":true}}}]')
  ]){await assert.rejects(apply(bad));assert.equal(JSON.stringify(w.SpatialEditor.project),before);assert.equal((await state()).undoCount,history)}
  s=await apply([{op:'move_objects',ids:['ground'],delta:[100,0,20]}]);
  assert.deepEqual(Array.from(s.document.objects.find(o=>o.id==='ground').position),[700,400,20]);
  assert.equal(JSON.stringify(s.document.objects.find(o=>o.id==='opening').points),JSON.stringify([[-40,-40],[40,-40],[40,40],[-40,40]]));
  s=await apply([{op:'create_floor',id:'upper',props:{name:'上层',height:300,componentColor:'#ffcc00'}},{op:'update_object',id:'ground',props:{floor:'upper'}},{op:'create_object',id:'upper-plane',type:'plane',props:{floor:'upper'}}]);
  assert.equal(s.document.objects.find(o=>o.id==='opening').floor,'upper');assert.equal(s.document.objects.find(o=>o.id==='upper-plane').fill,'#ffcc00');
  s=await apply([{op:'delete_objects',ids:['ground']}]);assert(!s.document.objects.some(o=>o.id==='opening'));
  s=await api('history',{action:'undo',expectedRevision:s.revision});assert(s.document.objects.some(o=>o.id==='opening'));
  s=await api('history',{action:'redo',expectedRevision:s.revision});assert(!s.document.objects.some(o=>o.id==='opening'));
  s=await apply([{op:'update_object',id:'upper-plane',props:{locked:true}}]);
  await assert.rejects(apply([{op:'move_objects',ids:['upper-plane'],delta:[1,0,0]}]),/锁定/);
  await apply([{op:'update_object',id:'upper-plane',props:{locked:false}},{op:'move_objects',ids:['upper-plane'],delta:[1,0,0]}]);
  w.document.querySelector('[data-panel="document"]').click();w.document.querySelector('#doc-name').focus();assert.equal((await state()).busy,true);await assert.rejects(apply([{op:'update_document',props:{name:'busy'}}]),/手动操作/);w.document.activeElement.blur();
  s=await apply([{op:'create_document',type:'curve',id:'pacing',name:'节奏'}]);
  const stages=[{id:'explore',label:'探索',color:'#6699aa'},{id:'fight',label:'战斗',color:'#cc8866'}];
  s=await apply([{op:'set_curve',props:{title:'探索到战斗',stages,events:[{id:'battle',label:'第一场战斗',x:.75,y:.8,stage:'fight',fraction:.5,labelPosition:'above'}],yAxis:{title:'压力'}}}]);
  assert.equal(s.document.curve.events[0].stage,'fight');assert.equal(s.document.curve.events[0].fraction,.5);assert.equal(s.document.curve.yAxis.title,'压力');
  await assert.rejects(apply([{op:'create_object',type:'wall'}]));
  const exported=await api('export',{format:'project'});assert.equal(JSON.parse(exported.text).documents.length,2);
  const svg=await api('export',{format:'svg'});assert.match(svg.text,/<svg/);assert(!svg.text.includes('data-handle'));
  s=await state();await api('set_view',{expectedRevision:s.revision,documentId:'arena',mode:'solid',ids:['upper-plane']});assert.equal(w.SpatialEditor.view.mode,'solid');
  await apply([{op:'create_object',id:'ladder',type:'ladder'},{op:'create_object',id:'spiral',type:'spiral'},{op:'create_object',id:'wall',type:'wall'},{op:'create_object',id:'stairs',type:'stairs'},{op:'create_object',id:'marker',type:'marker'},{op:'create_object',id:'text',type:'text',props:{text:'中文标签'}}]);
  s=await apply([{op:'create_floor',id:'temporary',props:{height:600}},{op:'create_object',type:'plane',id:'temporary-plane'},{op:'delete_floor',id:'temporary'}]);assert(!s.document.objects.some(o=>o.id==='temporary-plane'));
  await apply([{op:'update_object',id:'ladder',props:{group:'paired'}},{op:'update_object',id:'spiral',props:{group:'paired'}}]);
  s=await apply([{op:'move_objects',ids:['ladder'],delta:[10,0,0]}]);assert.equal(s.document.objects.find(o=>o.id==='spiral').position[0],610);
  await assert.rejects(apply([{op:'update_object',id:'path',props:{points:[[1,2,3]]}}]));
  const full=(await api('get_state',{includeProject:true})).project;assert.equal(w.StudioModel.validate(full).documents.length,2);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close()}
});

test('stdio MCP advertises tools and negotiates; loopback bridge authenticates and prevents replay',async()=>{
 const client=createClient();let bridge;
 try{
  const hello=await client.request('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'test',version:'1'}});assert.equal(hello.protocolVersion,'2025-06-18');assert(hello.instructions.includes('revision'));
  const list=await client.request('tools/list');assert.equal(list.tools.length,7);assert(list.tools.some(t=>t.name==='studio_apply_operations'&&!t.annotations.readOnlyHint));
  const info=await client.tool('studio_connect');assert.equal(info.connected,false);
  await assert.rejects(client.tool('studio_get_state'),/尚未连接/);
  await assert.rejects(client.tool('studio_apply_operations',{expectedRevision:'x',operations:[],unexpected:true}));
  const page=await fetch(info.url);const html=await page.text();assert.match(html,/connect-src &#39;self&#39;/);assert.match(html,/AI 联动正在连接/);
  assert.match(fs.readFileSync(path.join(root,'dist/index.html'),'utf8'),/connect-src &#39;none&#39;/);
  assert.equal((await fetch(new URL('/bridge/poll',info.url),{method:'POST',body:'{}'})).status,401);
  const {startBridge}=await import('../tools/mcp/server.mjs');bridge=await startBridge({port:0,timeout:120});
  const token=new URLSearchParams(new URL(bridge.url).hash.slice(1)).get('studio-token');
  const poll=(body,extra={})=>fetch(bridge.origin+'/bridge/poll',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...extra},body:JSON.stringify(body)});
  assert.equal((await poll({clientId:'first'},{Origin:'https://evil.example'})).status,403);
  const hostStatus=await new Promise((resolve,reject)=>{const req=require('node:http').request(bridge.origin+'/bridge/poll',{method:'POST',headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode)});req.on('error',reject);req.end('{}')});assert.equal(hostStatus,403);
  assert.equal((await poll({clientId:'first',replies:[]})).status,200);
  assert.equal((await poll({clientId:'second',replies:[]})).status,409);
  const response=bridge.call('get_state',{});let command=(await (await poll({clientId:'first'})).json()).commands[0];
  await poll({clientId:'first',replies:[{id:command.id,result:{name:'中文返回值'}}]});assert.equal((await response).name,'中文返回值');
  const expired=bridge.call('apply_operations',{});await assert.rejects(expired,/超时/);assert.deepEqual((await (await poll({clientId:'first'})).json()).commands,[]);
  const controller=new AbortController(),cancelled=bridge.call('apply_operations',{}, {signal:controller.signal});controller.abort();await assert.rejects(cancelled,/取消/);assert.deepEqual((await (await poll({clientId:'first'})).json()).commands,[]);
  await fetch(bridge.origin+'/bridge/disconnect',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({clientId:'first'})});
  assert.equal((await poll({clientId:'first'})).status,401,'late in-flight polls cannot reconnect a disconnected page');assert.equal(bridge.info().connected,false);
 }finally{if(bridge)await bridge.close();await client.close()}
});
