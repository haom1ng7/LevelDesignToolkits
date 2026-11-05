const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/freehand',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{}}});
const w=dom.window,d=w.document,A=w.SpatialEditor,M=w.StudioModel,c=d.querySelector('#canvas');
const state=()=>JSON.stringify(A.project),world=o=>JSON.parse(JSON.stringify(o.points.map(p=>M.world(A.document,o,[...p,0]).map(v=>Math.round(v*1e6)/1e6))));
function pointer(type,p,props={}){const a=A.camera,e=new w.MouseEvent(type,{bubbles:true,button:0,clientX:(p[0]-a.x)/a.w*1000,clientY:(p[1]-a.y)/a.h*700,...props});Object.defineProperty(e,'pointerId',{value:props.pointerId??1});c.dispatchEvent(e)}
function key(key,props={}){c.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,...props}))}
function fresh(grid=true,height=0){const doc=M.createDocument('space','自由绘图验证');doc.objects=[];doc.floors[0].height=height;A.loadProject({format:'level-spatial-editor',version:7,documents:[doc],activeDocument:doc.id});d.querySelector('#snap').checked=grid;A.setTool('freehand')}
function stroke(points,close=true){pointer('pointerdown',points[0]);for(const p of points.slice(1))pointer('pointermove',p);if(close)pointer('pointerup',points.at(-1))}
const ring=[[113,117],[513,117],[513,417],[313,267],[113,417]];
try{
 assert(d.querySelector('[data-tool="freehand"]').disabled);
 fresh(true,275.5);let before=state(),history=A.undoCount;
 assert.equal(A.tool,'freehand');assert.equal(c.style.cursor,'crosshair');assert.match(d.querySelector('#drawing-label').textContent,/松开自动闭合/);assert(d.querySelector('#drawing-hint [data-action="finish"]').hidden);
 pointer('pointermove',ring[1]);assert.equal(A.drawing.points.length,0,'hover never draws');
 stroke(ring,false);assert.equal(state(),before,'draft stays outside the model');assert.equal(A.undoCount,history);assert(d.querySelector('[data-freehand-preview]'));assert(!A.renderSVG().includes('data-freehand-preview'));
 pointer('pointerup',ring.at(-1));assert.equal(A.document.objects.length,1);assert.equal(A.undoCount,history+1);assert.equal(A.tool,'freehand');assert.equal(A.drawing.points.length,0);
 let o=A.document.objects[0];assert.equal(o.type,'plane');assert.equal(o.fill,A.document.floors[0].componentColor);assert.equal(o.position[2],0);assert.equal(A.selection.id,o.id);
 assert.deepEqual(world(o),ring.map(p=>[...p,275.5]),'grid does not distort a freehand stroke');assert(M.validGeometry(A.document));
 let saved=state();A.command('undo');assert.equal(state(),before);A.command('redo');assert.equal(state(),saved);A.loadProject(JSON.parse(saved));assert.equal(state(),saved);
 for(const mode of ['solid','elevation','plan']){d.querySelector(`[data-view="${mode}"]`).click();assert(A.scene.faces.length>0);assert(M.validGeometry(A.document));assert.equal(d.querySelector('[data-tool="freehand"]').disabled,mode!=='plan')}
 // Closed strokes in either direction, repeated samples, and a release-only final corner.
 for(const points of [ring,[...ring].reverse()]){fresh();stroke([...points,points[0],points[0]]);assert.equal(A.document.objects.length,1);assert.deepEqual(world(A.document.objects[0]),points.map(p=>[...p,0]))}
 fresh();pointer('pointerdown',[100,100]);pointer('pointermove',[500,100]);pointer('pointerup',[300,400]);assert.equal(A.document.objects[0].points.length,3,'release location is sampled');
 // A dense smooth outline is simplified without losing its size or becoming invalid.
 fresh();const circle=Array.from({length:721},(_,i)=>{const a=i*Math.PI/360;return [400+220*Math.cos(a),350+180*Math.sin(a)]});stroke(circle);o=A.document.objects[0];assert(o);assert(o.points.length<100&&o.points.length>12);assert(M.validGeometry(A.document));
 const ps=world(o);for(const axis of [0,1])assert(Math.abs(Math.max(...ps.map(p=>p[axis]))-Math.min(...ps.map(p=>p[axis]))-[440,360][axis])<4);
 // Continuous strokes commit once each; degenerate and intersecting strokes cannot alter history.
 history=A.undoCount;stroke(ring);assert.equal(A.document.objects.length,2);assert.equal(A.undoCount,history+1);
 for(const invalid of [[[100,100]],[[100,100],[300,100],[500,100]],[[100,100],[500,400],[100,400],[500,100]],[[100,100],[500,100],[300,100],[300,400]]]){fresh();before=state();history=A.undoCount;stroke(invalid);assert.equal(state(),before);assert.equal(A.undoCount,history);assert.equal(A.drawing.points.length,0)}
 // Every cancellation restores the previous component, with no partial plane or history.
 for(const cancel of ['Escape','right','tool','view','floor','document','pointer','capture','blur','selection','undo','button']){
  fresh();const existing=M.createObject(A.document,'plane',[800,600,0]);A.document.objects.push(existing);A.select(existing.id,false,true);A.setTool('freehand');before=state();history=A.undoCount;stroke(ring,false);
  if(cancel==='Escape')key('Escape');else if(cancel==='right')pointer('contextmenu',[200,200],{button:2});else if(cancel==='tool')A.setTool('plane');else if(cancel==='view')d.querySelector('[data-view="solid"]').click();else if(cancel==='floor')d.querySelector('[data-floor]').click();else if(cancel==='document')d.querySelector('#document-select').dispatchEvent(new w.Event('change',{bubbles:true}));else if(cancel==='blur')w.dispatchEvent(new w.Event('blur'));else if(cancel==='selection')A.select(existing.id,false,true);else if(cancel==='undo')A.command('undo');else if(cancel==='button')A.command('cancel');else pointer(cancel==='capture'?'lostpointercapture':'pointercancel',[200,200]);
  pointer('pointerup',[100,100]);assert.equal(A.drawing,null,cancel);assert.equal(state(),before,cancel);assert.equal(A.undoCount,history,cancel);
 }
 fresh();before=state();pointer('pointerdown',ring[0],{button:2});pointer('pointermove',ring[1]);pointer('pointerup',ring[2],{button:2});assert.equal(state(),before);assert.equal(A.drawing.points.length,0,'right button never draws');
 stroke(ring,false);pointer('pointerdown',[900,600],{pointerId:2});pointer('pointermove',[900,600],{pointerId:2});pointer('pointerup',[900,600],{pointerId:2});assert.equal(A.document.objects.length,0,'other pointers cannot commit the stroke');pointer('pointerup',ring.at(-1));assert.equal(A.document.objects.length,1);
 A.createDocument('curve');assert(d.querySelector('[data-tool="freehand"]').disabled);
 assert.deepEqual(errors,[]);console.log('PASS freehand: drag/release closure, pixel sampling/simplification, concavity/winding, continuous drawing, color/elevation, grid independence, atomic history, JSON/three views, export isolation, invalid strokes, pointer ownership and cancellation.');
}finally{w.close()}
