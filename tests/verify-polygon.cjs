const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/polygon',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{}}});
const w=dom.window,d=w.document,A=w.SpatialEditor,M=w.StudioModel,c=d.querySelector('#canvas');
const state=()=>JSON.stringify(A.project),points=o=>o.points.map(p=>M.world(A.document,o,[...p,0])).map(p=>p.map(v=>Math.round(v*1e6)/1e6));
function pointer(type,p,props={}){const a=A.camera;c.dispatchEvent(new w.MouseEvent(type,{bubbles:true,button:0,clientX:(p[0]-a.x)/a.w*1000,clientY:(p[1]-a.y)/a.h*700,...props}))}
function click(p,props={}){pointer('pointermove',p,props);pointer('pointerdown',p,props);pointer('pointerup',p,props)}
function key(key,props={}){c.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,...props}))}
function fresh(grid=false,height=0){const doc=M.createDocument('space','多边形验证');doc.objects=[];doc.floors[0].height=height;A.loadProject({format:'level-spatial-editor',version:7,documents:[doc],activeDocument:doc.id});d.querySelector('#snap').checked=grid;A.setTool('polygon')}
const triangle=[[100,100],[500,100],[300,400]];
try{
 assert(d.querySelector('[data-tool="polygon"]').disabled,'empty project');
 fresh();let before=state(),history=A.undoCount;
 assert.equal(A.tool,'polygon');assert.equal(A.drawing.points.length,0);assert.equal(c.style.cursor,'crosshair');
 assert.match(d.querySelector('#drawing-label').textContent,/首点闭合/);
 for(const p of triangle)click(p);
 assert.equal(state(),before,'draft never enters the project');assert.equal(A.undoCount,history);
 assert.equal(d.querySelectorAll('[data-polygon-preview]').length,1);
 pointer('pointermove',[101,101]);assert(A.drawing.hover.close,'closing tolerance uses screen pixels');
 assert(!A.renderSVG().includes('data-polygon-preview'),'draft is excluded from export');
 click([101,101]);assert.equal(A.document.objects.length,1);assert.equal(A.undoCount,history+1);assert.equal(A.tool,'vertex');assert.equal(A.drawing,null);
 const o=A.document.objects[0];assert.equal(o.type,'plane');assert.equal(o.fill,A.document.floors[0].componentColor);assert.equal(A.selection.id,o.id);
 assert.deepEqual(JSON.parse(JSON.stringify(points(o))),triangle.map(p=>[...p,0]));assert.equal(o.points.length,3,'closing does not store a duplicate vertex');
 const saved=state();A.command('undo');assert.equal(state(),before);A.command('redo');assert.equal(state(),saved);
 A.loadProject(JSON.parse(saved));assert.deepEqual(JSON.parse(JSON.stringify(points(A.document.objects[0]))),triangle.map(p=>[...p,0]));
 for(const mode of ['solid','elevation','plan']){d.querySelector(`[data-view="${mode}"]`).click();assert(A.scene.faces.length>0);assert(M.validGeometry(A.document));assert.equal(d.querySelector('[data-tool="polygon"]').disabled,mode!=='plan')}
 // Both winding orders and concave outlines retain their actual footprint.
 const concave=[[100,100],[500,100],[500,400],[300,250],[100,400]];
 for(const ring of [concave,[...concave].reverse()]){fresh();ring.forEach(p=>click(p));key('Enter');assert.equal(A.document.objects.length,1);assert.deepEqual(JSON.parse(JSON.stringify(points(A.document.objects[0]))),ring.map(p=>[...p,0]));assert(M.validGeometry(A.document))}
 // Grid affects XY only; a fractional floor elevation must remain exact.
 fresh(true,275);click([112,118]);click([518,109]);click([321,412]);click([110,110]);
 assert.deepEqual(JSON.parse(JSON.stringify(points(A.document.objects[0]))),[[100,100,275],[500,100,275],[300,400,275]]);assert.equal(A.document.objects[0].position[2],0);
 fresh(true);for(const p of triangle.map(p=>[p[0]+13,p[1]+17]))click(p,{ctrlKey:true});key('Enter');
 assert.deepEqual(JSON.parse(JSON.stringify(points(A.document.objects[0]))),triangle.map(p=>[p[0]+13,p[1]+17,0]));
 // Repeated clicks do not add duplicate points; insufficient/invalid outlines stay editable.
 fresh();click(triangle[0]);click(triangle[0]);click(triangle[1]);click(triangle[0]);assert.equal(A.drawing.points.length,2);key('Enter');assert.equal(A.document.objects.length,0);
 fresh();before=state();history=A.undoCount;
 [[100,100],[500,400],[100,400],[500,100]].forEach(p=>click(p));click([100,100]);
 assert.equal(state(),before);assert.equal(A.undoCount,history);assert.equal(A.drawing.points.length,4);assert.match(d.querySelector('#status').textContent,/相交/);
 key('Backspace');key('Delete');assert.equal(A.drawing.points.length,2);click([100,400]);key('Enter');assert.equal(A.document.objects.length,1,'invalid draft can be corrected');
 for(const ring of [[[100,100],[300,100],[500,100]],[[100,100],[500,100],[300,100],[300,400]],[[100,100],[500,100],[500,400],[300,100],[100,400]]]){fresh();before=state();ring.forEach(p=>click(p));key('Enter');assert.equal(state(),before,'degenerate, backtracking and touching edges are rejected')}
 // Cancellation cannot create objects/history or delete pre-existing components.
 for(const cancel of ['Escape','right','tool','view','floor','document','pointer','selection']){
  fresh();const existing=M.createObject(A.document,'plane',[800,600,0]);A.document.objects.push(existing);A.select(existing.id,false,true);A.setTool('polygon');before=state();history=A.undoCount;triangle.forEach(p=>click(p));
  if(cancel==='Escape')key('Escape');else if(cancel==='right')pointer('contextmenu',[200,200],{button:2});else if(cancel==='tool')A.setTool('plane');else if(cancel==='view')d.querySelector('[data-view="solid"]').click();else if(cancel==='floor')d.querySelector('[data-floor]').click();else if(cancel==='document')d.querySelector('#document-select').dispatchEvent(new w.Event('change',{bubbles:true}));else if(cancel==='selection')A.select(existing.id,false,true);else pointer('pointercancel',[200,200]);
  assert.equal(A.drawing,null,cancel);assert.equal(state(),before,cancel);assert.equal(A.undoCount,history,cancel);
 }
 A.createDocument('curve');assert(d.querySelector('[data-tool="polygon"]').disabled);
 assert.deepEqual(errors,[]);console.log('PASS polygon: click/preview/closure, atomic undo/redo, concavity/winding, floor color/elevation, grid/Ctrl, JSON/three views/export isolation, invalid correction, cancellation and view restrictions.');
}finally{w.close()}
