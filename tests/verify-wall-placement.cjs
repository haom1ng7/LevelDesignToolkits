const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/wall-placement.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};}});
const w=dom.window,d=w.document,A=w.SpatialEditor,M=w.StudioModel,R=w.StudioRender,c=d.querySelector('#canvas');
const near=(a,b)=>assert(Math.abs(a-b)<1e-5,`${a} != ${b}`),same=(a,b)=>a.forEach((v,i)=>near(v,b[i]));
function pointer(kind,p,props={}){const a=A.camera;c.dispatchEvent(new w.MouseEvent(kind,{bubbles:true,button:0,clientX:(p[0]-a.x)/a.w*1000,clientY:(p[1]-a.y)/a.h*700,...props}))}
function tap(p,props={}){pointer('pointerdown',p,props);pointer('pointerup',p,props)}
function add(type='plane',pos=[430,350,25],props={}){const o=Object.assign(M.createObject(A.document,type,pos),props);A.document.objects.push(o);return o}
function fresh(){A.createDocument('space');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];Object.assign(A.camera,{x:0,y:0,w:1000,h:700});d.querySelector('#snap').checked=true;return add()}
function edge(o,i=0){const a=M.world(A.document,o,[...o.points[i],0]),b=M.world(A.document,o,[...o.points[(i+1)%o.points.length],0]);return {a,b,q:M.project(M.mul(M.add(a,b),.5),A.scene.basis)}}
function arm(){A.setTool('wall')}
try{
 // All rectangle sides, arbitrary yaw and tilted surfaces retain exact endpoints.
 for(const rotation of [0,.37])for(let i=0;i<4;i++){
  const host=fresh();A.document.floors[0].height=350;host.orientation=M.product(M.axisRotation([0,0,1],rotation),M.axisRotation([1,0,0],.15));arm();
  const e=edge(host,i),before=JSON.stringify(A.project),history=A.undoCount;
  pointer('pointermove',e.q);assert.equal(d.querySelector('[data-wall-edge]')?.getAttribute('data-wall-edge'),host.id);assert.equal(JSON.stringify(A.project),before,'hover does not change model');assert.equal(A.undoCount,history);assert(!A.renderSVG().includes('data-wall-edge='),'export omits highlight');
  pointer('pointerdown',e.q);assert.equal(A.document.objects.length,1,'press waits for release');pointer('pointerup',e.q);
  const wall=A.document.objects.at(-1);assert.equal(wall.type,'wall');assert.equal(A.tool,'wall');assert.equal(A.selection.id,wall.id);assert.equal(A.undoCount,history+1);near(wall.thickness,18);same(M.world(A.document,wall,[wall.points[0][0],0,wall.points[0][1]]),e.a);same(M.world(A.document,wall,[wall.points[1][0],0,wall.points[1][1]]),e.b);near(wall.points[3][1]-wall.points[0][1],180);assert.equal(wall.floor,host.floor);assert.equal(wall.fill,host.fill);
  const after=JSON.stringify(A.project);M.validate(JSON.parse(after));for(const mode of ['plan','elevation','solid'])assert(R.scene(A.document,{mode,side:'front',azimuth:35,elevation:35},{ghost:false}).faces.some(f=>f.owner.id===wall.id),'created wall renders in '+mode);A.command('undo');assert.equal(JSON.stringify(A.project),before);A.command('redo');assert.equal(JSON.stringify(A.project),after);
 }
 // Concave polygon edges are used directly; no convex-hull substitution.
 let host=fresh();host.points=[[0,0],[260,0],[260,70],[90,70],[90,230],[0,230]];arm();let e=edge(host,3);tap(e.q,{ctrlKey:true});let wall=A.document.objects.at(-1);near(wall.points[1][0]-wall.points[0][0],160);
 // Continuous placement and blanks/interiors must keep the tool armed.
 host=fresh();arm();tap(edge(host,0).q);tap(edge(host,2).q);assert.equal(A.document.objects.length,3);const count=A.undoCount,objects=JSON.stringify(A.document.objects);tap([920,620]);tap([430,350]);assert.equal(A.tool,'wall');assert.equal(JSON.stringify(A.document.objects),objects);assert.equal(A.undoCount,count);assert(!d.querySelector('[data-create-preview]'));
 // Screen-pixel hover tolerance is stable when zooming.
 for(const width of [400,1000,5000]){host=fresh();A.camera.w=width;A.camera.h=width*.7;arm();e=edge(host);pointer('pointermove',[e.q[0],e.q[1]+8*width/1000]);assert(d.querySelector('[data-wall-edge]'));pointer('pointermove',[e.q[0],e.q[1]-12*width/1000]);assert(!d.querySelector('[data-wall-edge]'))}
 // Ineligible source components and floors never highlight or create.
 for(const mode of ['hidden','locked','other-floor','hidden-floor','ellipse','curved']){
  host=fresh();if(mode==='hidden')host.visible=false;if(mode==='locked')host.locked=true;if(mode==='other-floor'){const f={...A.document.floors[0],id:M.uid(),height:100};A.document.floors.push(f);host.floor=f.id}if(mode==='hidden-floor')A.document.floors[0].visible=false;if(mode==='ellipse')host.shape='ellipse';if(mode==='curved')host.curves=[.3,0,0,0];arm();e=edge(host);const before=JSON.stringify(A.project),history=A.undoCount;pointer('pointermove',e.q);assert(!d.querySelector('[data-wall-edge]'),mode);tap(e.q);assert.equal(JSON.stringify(A.project),before,mode);assert.equal(A.undoCount,history);
 }
 host=fresh();add('plane',[430,350,100],{points:[[-200,-150],[200,-150],[200,150],[-200,150]]});arm();pointer('pointermove',edge(host).q);assert(!d.querySelector('[data-wall-edge]'),'covered edge is not selectable');
 // Overlapping edges select the visible upper surface.
 host=fresh();const upper=add('plane',[430,350,100]);arm();pointer('pointermove',edge(host).q);assert.equal(d.querySelector('[data-wall-edge]').getAttribute('data-wall-edge'),upper.id);tap(edge(host).q);near(M.origin(A.document,A.document.objects.at(-1))[2],100);
 // Walls and stairs also provide existing component edges.
 for(const type of ['wall','stairs','ladder','spiral','solid']){
  fresh();A.document.objects=[];
  if(type==='solid'){add();add('plane',[470,350,25]);M.setComponents(A.document,A.document.objects.map(o=>o.id),'intersect');host=A.document.objects[0]}else host=add(type);
  arm();const candidate=w.StudioSnapping.features(A.document,host).find(f=>Math.hypot(f.b[0]-f.a[0],f.b[1]-f.a[1])>20),q=M.project(M.mul(M.add(candidate.a,candidate.b),.5),A.scene.basis);tap(q);assert.equal(A.document.objects.length,2,type);assert.equal(A.document.objects.at(-1).type,'wall');M.validate(A.project);
 }
 // Every cancellation leaves model and history unchanged and removes the highlight.
 for(const cancel of ['escape','right','pointercancel','lostcapture','blur','tool','view','floor','document','move']){
  host=fresh();arm();e=edge(host);const before=JSON.stringify(A.document.objects),history=A.undoCount;pointer('pointermove',e.q);pointer('pointerdown',e.q);
  if(cancel==='escape')c.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  if(cancel==='right')pointer('contextmenu',e.q,{button:2});
  if(cancel==='pointercancel')pointer('pointercancel',e.q);
  if(cancel==='lostcapture')pointer('lostpointercapture',e.q);
  if(cancel==='blur')w.dispatchEvent(new w.Event('blur'));
  if(cancel==='tool')A.setTool('plane');
  if(cancel==='view')d.querySelector('[data-view="elevation"]').click();
  if(cancel==='floor')d.querySelector('[data-floor]').click();
  if(cancel==='document')A.loadProject(JSON.parse(JSON.stringify(A.project)));
  if(cancel==='move')pointer('pointermove',M.add(e.q,[60,50]));
  pointer('pointerup',e.q);assert.equal(JSON.stringify(A.document.objects),before,cancel);assert.equal(A.undoCount,history,cancel);assert(!d.querySelector('[data-wall-edge]'),cancel);assert(!d.querySelector('[data-create-preview]'));
 }
 host=fresh();arm();pointer('pointermove',edge(host).q);pointer('pointerleave',edge(host).q);assert(!d.querySelector('[data-wall-edge]'));
 // A validation failure rolls back the wall and leaves the previous history intact.
 arm();e=edge(host);const before=JSON.stringify(A.project),history=A.undoCount,validate=M.validate;M.validate=()=>{throw Error('wall rollback fixture')};tap(e.q);M.validate=validate;assert.equal(JSON.stringify(A.project),before);assert.equal(A.undoCount,history);assert.equal(A.selection.ids.length,0);
 tap(e.q);const priorId=A.selection.id,priorObjects=JSON.stringify(A.document.objects),priorHistory=A.undoCount;M.validate=()=>{throw Error('wall rollback fixture')};tap(edge(host,2).q);M.validate=validate;assert.equal(JSON.stringify(A.document.objects),priorObjects);assert.equal(A.undoCount,priorHistory);assert.equal(A.selection.id,priorId);c.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(A.selection.id,priorId,'failed placement preserves the last wall on exit');
 assert.deepEqual(errors,[]);console.log('PASS wall placement: hover/click, four edges, yaw/tilt, concave outline, floor/color, exact geometry with grid, continuity, occlusion, eligibility, zoom tolerance, source types, cancellation, undo/redo, JSON, export exclusion and rollback.');
}finally{w.close()}
