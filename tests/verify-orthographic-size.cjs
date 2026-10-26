const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/orthographic-size.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};}});
const w=dom.window,d=w.document,A=w.SpatialEditor,M=w.StudioModel,c=d.querySelector('#canvas'),near=(a,b,msg='')=>assert(Math.abs(a-b)<1e-5,`${msg}: ${a} != ${b}`);
function fresh(mode='plan',grid=false){A.createDocument('space');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];A.document.floors[0].height=70;d.querySelector(`[data-view="${mode}"]`).click();d.querySelector('#snap').checked=grid;d.querySelector('#move-snap').checked=false;}
function add(type,props={}){const o=Object.assign(M.createObject(A.document,type,[400,350,30]),props);A.document.objects.push(o);return o}
function object(id){return A.document.objects.find(o=>o.id===id)}
function select(id){A.select(id,false,true);A.setTool('size')}
function state(){return JSON.stringify(A.document.objects)}
function pointer(kind,p,target=c,props={}){const a=A.camera;target.dispatchEvent(new w.MouseEvent(kind,{bubbles:true,button:0,clientX:(p[0]-a.x)/a.w*1000,clientY:(p[1]-a.y)/a.h*700,...props}))}
function corner(index=2){const el=d.querySelector(`[data-size-corner="${index}"]`);assert(el,`corner ${index}`);return {el,p:[+el.getAttribute('cx'),+el.getAttribute('cy')]}}
function move(h,delta,props={},end='pointerup'){const q=M.add(h.p,delta);pointer('pointerdown',h.p,h.el,props);pointer('pointermove',q,c,props);const guides=d.querySelectorAll('[data-move-snap-guide]').length;pointer(end,q,c,props);return guides}
function projected(delta,o){const b=A.scene.basis,v=M.mat(o.orientation,delta);return [M.dot(v,b.r),M.dot(v,b.down)]}
function bounds(o){const ps=M.geometry(A.document,o).flatMap(f=>f.points).map(p=>M.local(A.document,o,p));return {min:[0,1,2].map(i=>Math.min(...ps.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...ps.map(p=>p[i])))}}
function extent(o){const b=bounds(o);return M.sub(b.max,b.min)}
try{
 // The original bug: a horizontal corner drag changed both dimensions.
 for(const mode of ['plan','elevation'])for(const index of [0,1,2,3])for(const changed of [0,1]){
  fresh(mode);const polygon=mode==='plan',o=add(polygon?'plane':'wall',{points:[[0,0],[200,0],[200,120],[0,120]]}),id=o.id,axis=polygon?changed:changed===0?0:2;
  select(id);const before=extent(o),fixed=M.world(A.document,o,polygon?[...o.points[(index+2)%4],0]:[o.points[(index+2)%4][0],0,o.points[(index+2)%4][1]]),delta=[0,0,0];delta[axis]=40;
  move(corner(index),projected(delta,o));const result=object(id),after=extent(result),sign=changed===0?(index===1||index===2?1:-1):(index>=2?1:-1);
  after.forEach((n,i)=>near(n,before[i]+(i===axis?sign*40:0),`${mode} corner ${index}, only axis ${axis}`));
  M.world(A.document,result,polygon?[...result.points[(index+2)%4],0]:[result.points[(index+2)%4][0],0,result.points[(index+2)%4][1]]).forEach((n,i)=>near(n,fixed[i],'opposite corner fixed'));M.validate(A.project);
 }
 // Non-square, rotated and tilted faces use local coordinates, including oblique elevation.
 for(const [mode,type,rotation] of [['plan','plane',M.axisRotation([0,0,1],.45)],['plan','plane',M.axisRotation([1,0,0],.5)],['elevation','wall',M.axisRotation([0,0,1],.6)]]){
  fresh(mode);const o=add(type,{points:[[0,0],[200,0],[200,120],[0,120]],orientation:rotation}),id=o.id;select(id);const h=corner(),delta=projected(type==='plane'?[70,30,0]:[70,0,30],o),goal=M.add(h.p,delta);move(h,delta);const result=object(id),e=extent(result);near(e[0],270,'local width');near(e[type==='plane'?1:2],150,'local second dimension');corner().p.forEach((n,i)=>near(n,goal[i],'corner follows pointer'));M.validate(A.project);
 }
 // Bounding-box handles cover the remaining solid kinds and the plane thickness view.
 for(const [mode,type,axis] of [['plan','wall',0],['plan','stairs',0],['plan','ladder',0],['elevation','plane',2],['elevation','stairs',0],['elevation','ladder',2],['elevation','spiral',2]]){
  fresh(mode);const o=add(type),id=o.id;select(id);const before=extent(o),delta=[0,0,0];delta[axis]=40;move(corner(),projected(delta,o));const after=extent(object(id));assert(Math.abs(after[axis]-before[axis])>10,`${mode} ${type}: edited axis changes`);for(let i=0;i<3;i++)if(i!==axis)near(after[i],before[i],`${type}: other axis ${i} unchanged`);M.validate(A.project);
 }
 // Host holes follow each dimension; standalone cutouts leave the host untouched.
 for(const mode of ['plan','elevation']){
  fresh(mode);let host=add(mode==='plan'?'plane':'wall',{points:[[0,0],[400,0],[400,300],[0,300]]}),hole=add('hole',{host:host.id,floor:host.floor,points:[[40,40],[80,40],[80,80],[40,80]]}),hostId=host.id,holeId=hole.id;select(hostId);
  move(corner(),projected(mode==='plan'?[100,0,0]:[100,0,0],host));near(object(holeId).points[0][0],50,'host carries hole along edited axis');near(object(holeId).points[0][1],40,'hole other dimension fixed');const hostBefore=JSON.stringify(object(hostId));
  select(holeId);move(corner(),projected([20,0,0],host));near(object(holeId).points[2][0],120,'independent hole width');near(object(holeId).points[2][1],80,'independent hole height unchanged');assert.equal(JSON.stringify(object(hostId)),hostBefore);assert(M.validGeometry(A.document));
 }
 // Cut frames can have non-unit axes after a host resize.
 fresh('elevation');let host=add('wall',{points:[[0,0],[500,0],[500,400],[0,400]],orientation:M.axisRotation([0,0,1],.5)}),hole=add('hole',{host:host.id,floor:host.floor,points:[[20,20],[60,20],[60,60],[20,60]],cut:{origin:[0,0,0],r:[2,0,0],d:[0,0,1.5],n:[0,-1,0]}});select(hole.id);move(corner(),projected([40,0,0],host));near(object(hole.id).points[2][0],80,'scaled cut frame coordinates');near(object(hole.id).points[2][1],60,'cut frame independent height');assert(M.validGeometry(A.document));
 // Shift can be pressed and released during a single drag without accumulating changes.
 fresh();let o=add('plane',{points:[[0,0],[200,0],[200,120],[0,120]]}),id=o.id;select(id);let h=corner(),q=M.add(h.p,[80,0]),before=state(),undo=A.undoCount;
 pointer('pointerdown',h.p,h.el);pointer('pointermove',q);near(extent(object(id))[1],120);pointer('pointermove',q,c,{shiftKey:true});near(extent(object(id))[0]/extent(object(id))[1],200/120,'Shift keeps ratio');pointer('pointermove',q);near(extent(object(id))[0],280);near(extent(object(id))[1],120);pointer('pointerup',q);assert.equal(A.undoCount,undo+1);const after=state();A.command('undo');assert.equal(state(),before);A.command('redo');assert.equal(state(),after);
 for(const cancel of ['pointercancel','escape','tool','view']){
  d.querySelector('[data-view="plan"]').click();select(id);before=state();undo=A.undoCount;h=corner();q=M.add(h.p,[60,20]);pointer('pointerdown',h.p,h.el);pointer('pointermove',q);if(cancel==='pointercancel')pointer('pointercancel',q);else if(cancel==='escape')c.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));else if(cancel==='tool')A.setTool('move');else d.querySelector('[data-view="elevation"]').click();assert.equal(state(),before,cancel);assert.equal(A.undoCount,undo,cancel+' history');
 }
 // Grid rounds only edited dimensions. Ctrl bypasses it; Shift keeps off-grid proportions.
 for(const mode of ['plan','elevation'])for(const ctrlKey of [false,true]){
  fresh(mode,true);o=add(mode==='plan'?'plane':'wall',{points:[[0,0],[200,0],[200,120],[0,120]]});id=o.id;select(id);move(corner(),projected([63,0,0],o),{ctrlKey});const e=extent(object(id));near(e[0],ctrlKey?263:300);near(e[mode==='plan'?1:2],120,'grid leaves unedited dimension alone');
 }
 fresh('plan',true);o=add('plane',{points:[[0,0],[200,0],[200,120],[0,120]]});id=o.id;select(id);move(corner(),[80,0],{shiftKey:true});near(extent(object(id))[0],300,'Shift grid rounds width');near(extent(object(id))[1],180,'Shift grid keeps ratio');
 // Component snapping follows a horizontal corner drag without changing height.
 fresh();o=add('plane',{points:[[0,0],[200,0],[200,120],[0,120]]});id=o.id;add('plane',{position:[700,350,30],points:[[0,0],[80,0],[80,300],[0,300]]});d.querySelector('#move-snap').checked=true;select(id);assert(move(corner(),[95,0])>0);near(extent(object(id))[0],300);near(extent(object(id))[1],120,'component snap leaves height fixed');
 // Circular arcs still use a common radial factor.
 fresh();o=add('plane',{points:[[0,0],[200,0],[200,120],[0,120]],curves:[.2,0,0,0]});id=o.id;select(id);move(corner(),[80,0]);o=object(id);near((o.points[2][0]-o.points[0][0])/(o.points[2][1]-o.points[0][1]),200/120);M.validate(A.project);
 const saved=JSON.stringify(A.project);A.loadProject(JSON.parse(saved));assert.equal(JSON.stringify(A.project),saved);for(const mode of ['plan','elevation','solid']){d.querySelector(`[data-view="${mode}"]`).click();assert(M.validGeometry(A.document));assert(!/data-size-corner|data-size-edge|data-solid-corner/.test(A.renderSVG()));}assert.deepEqual(errors,[]);
 console.log('PASS orthographic size: all corner directions; independent local dimensions in plan/elevation; rotated/tilted faces; solids and holes/cut frames; Shift/grid/Ctrl/component snaps; fixed anchor, history/cancellation, JSON and three-view consistency.');
}finally{dom.window.close()}
