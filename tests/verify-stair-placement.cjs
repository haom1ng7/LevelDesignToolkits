const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/spatial-update.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{}}});
const w=dom.window,d=w.document,A=w.SpatialEditor,M=w.StudioModel,R=w.StudioRender,S=w.StudioSnapping,c=d.querySelector('#canvas');
const near=(a,b,msg)=>assert(Math.abs(a-b)<1e-5,`${msg||''}: ${a} != ${b}`);
function add(doc,type,pos,props={}){const o=Object.assign(M.createObject(doc,type,pos),props);doc.objects.push(o);return o}
function blank(){A.createDocument('space');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];A.setTool('select');d.querySelector('#snap').checked=false;return A.document}
function pointer(type,p,props={}){const a=A.camera;c.dispatchEvent(new w.MouseEvent(type,{bubbles:true,button:0,clientX:(p[0]-a.x)/a.w*1000,clientY:(p[1]-a.y)/a.h*700,...props}))}
function drag(a,b,props={}){pointer('pointerdown',a,props);pointer('pointermove',b,props);pointer('pointerup',b,props)}
function tap(a){pointer('pointerdown',a);pointer('pointerup',a)}
function refresh(){A.setTool(A.tool)}
function pick(q){return R.pickAll(q,A.scene,A.document,A.view)[0]?.id}
function solve(doc,src,total,mode='plan'){const view={mode,side:'front',scope:'all'},cache=S.prepare(doc,[src.id],M.viewBasis(doc,view),view,false);return S.solve(cache,total,1)}
try{
 // Drag placement shares the plane gesture, with circular spiral footprints.
 for(const type of ['stairs','ladder','spiral'])for(const delta of [[230,140],[-230,140],[230,-140],[-230,-140]]){
  const doc=blank();doc.floors[0].height=350;A.setTool(type);const history=A.undoCount,start=[500,450],end=M.add(start,delta);
  pointer('pointermove',start);assert(!d.querySelector('[data-placement-ghost]'));pointer('pointerdown',start,{ctrlKey:true});assert.equal(doc.objects.length,0);
  pointer('pointermove',end,{ctrlKey:true});assert(d.querySelector('[data-create-preview]'));pointer('pointerup',end,{ctrlKey:true});
  const o=A.document.objects[0],ps=o.type==='spiral'?[[o.position[0]-o.outer,o.position[1]-o.outer,0],[o.position[0]+o.outer,o.position[1]+o.outer,0]]:M.geometry(A.document,o).flatMap(f=>f.points),min=[0,1,2].map(i=>Math.min(...ps.map(p=>p[i]))),max=[0,1,2].map(i=>Math.max(...ps.map(p=>p[i]))),width=230,depth=type==='spiral'?230:140;
  assert.equal(o.type,type);assert.equal(A.tool,type);assert.equal(A.selection.id,o.id);assert.equal(A.undoCount,Math.min(80,history+1));near(min[0],delta[0]<0?270:500);near(min[1],delta[1]<0?450-depth:450);near(max[0]-min[0],width);near(max[1]-min[1],depth);near(M.origin(A.document,o)[2],350,'floor origin');if(type==='spiral')near(o.inner/o.outer,2/9);
  const after=JSON.stringify(A.document.objects);A.command('undo');assert.equal(A.document.objects.length,0);A.command('redo');assert.equal(JSON.stringify(A.document.objects),after);assert.equal(JSON.stringify(M.validate(A.project).documents.at(-1).objects),after);
 }
 for(const type of ['stairs','ladder','spiral']){
  blank();A.setTool(type);drag([200,200],[400,310],{ctrlKey:true,shiftKey:true});const first=A.document.objects[0],ps=first.type==='spiral'?[[0,0,0],[first.outer*2,first.outer*2,0]]:M.geometry(A.document,first).flatMap(f=>f.points);near(Math.max(...ps.map(p=>p[0]))-Math.min(...ps.map(p=>p[0])),Math.max(...ps.map(p=>p[1]))-Math.min(...ps.map(p=>p[1])),'square constraint');
  drag([650,200],[850,350],{ctrlKey:true});assert.equal(A.document.objects.length,2,'continuous drag creates next component');const before=JSON.stringify(A.project),count=A.undoCount;
  for(const cancel of ['pointercancel','escape','right','tool','view','floor']){
   A.setTool(type);pointer('pointerdown',[200,550]);pointer('pointermove',[400,750]);
   if(cancel==='pointercancel')pointer('pointercancel',[400,750]);
   if(cancel==='escape')c.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
   if(cancel==='right')pointer('contextmenu',[400,750],{button:2});
   if(cancel==='tool')A.setTool('plane');
   if(cancel==='view')d.querySelector('[data-view="elevation"]').click();
   if(cancel==='floor')d.querySelector('[data-floor]').click();
   pointer('pointerup',[400,750]);assert.equal(JSON.stringify(A.project),before,cancel+' cancels creation');assert.equal(A.undoCount,count);assert(!d.querySelector('[data-create-preview]'));d.querySelector('[data-view="plan"]').click();
  }
  A.setTool(type);tap([1100,750]);assert.equal(A.tool,'select');assert.equal(A.document.objects.length,2,'click does not place a default object');
 }
 // Side elevations retain the screen width, rise and floor-relative position.
 for(const side of ['left','right'])for(const type of ['stairs','ladder','spiral']){
  const doc=blank();doc.floors[0].height=350;d.querySelector('[data-view="elevation"]').click();d.querySelector('[data-side="'+side+'"]').click();A.setTool(type);drag([200,200],[500,400],{ctrlKey:true});const o=A.document.objects[0];assert.equal(o?.type,type);const ps=type==='spiral'?[-o.outer,o.outer].map(x=>M.world(doc,o,[x,0,0])):M.geometry(doc,o).flatMap(f=>f.points),xs=ps.map(p=>M.project(p,A.scene.basis)[0]);near(Math.max(...xs)-Math.min(...xs),300,side+' width');near(type==='stairs'?o.flights[0].end-o.flights[0].start:o.end-o.start,200,side+' rise');const expected=M.unproject([350,400],A.scene.basis,[doc.width/2,doc.height/2,350]);M.origin(doc,o).forEach((n,i)=>near(n,expected[i],side+' floor position'));M.validate(A.project);
 }
 assert.deepEqual(errors,[]);console.log('PASS stair placement: rectangular stairs/ladders and circular spirals; four directions, Shift, floor height, previews, continuous creation, grid-independent dimensions, pointer/Escape/right/tool/view/floor cancellation, click-to-select, undo/redo, JSON and left/right elevation width/rise/position.');
}finally{w.close()}
