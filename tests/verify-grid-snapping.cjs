const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/grid.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};}});
const w=dom.window,d=w.document,A=w.SpatialEditor,M=w.StudioModel,R=w.StudioRender,c=d.querySelector('#canvas'),near=(a,b,msg='')=>assert(Math.abs(a-b)<1e-5,`${msg}: ${a} != ${b}`),multiple=(n,step=100)=>near(n/step,Math.round(n/step),'whole grid');
function fresh(mode='plan',step=100){A.createDocument('space');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];A.document.gridSize=step;d.querySelector(`[data-view="${mode}"]`).click();d.querySelector('#snap').checked=true;d.querySelector('#move-snap').checked=true;A.setTool('select')}
function pointer(kind,p,target=c,props={}){const a=A.camera;target.dispatchEvent(new w.MouseEvent(kind,{bubbles:true,button:0,clientX:(p[0]-a.x)/a.w*1000,clientY:(p[1]-a.y)/a.h*700,...props}))}
function at(p){return M.project(p,A.scene.basis)}
function drag(p,q,target=c,props={},cancel=false){pointer('pointerdown',p,target,props);pointer('pointermove',q,c,props);pointer(cancel?'pointercancel':'pointerup',q,c,props)}
function add(type,p=[453,347,20]){const o=M.createObject(A.document,type,p);A.document.objects.push(o);return o}
function box(o,local=false){if(o.type==='stairs'||o.type==='spiral'){const ps=M.geometry(A.document,o).flatMap(f=>f.points).map(p=>M.local(A.document,o,p)),min=[0,1,2].map(i=>Math.min(...ps.map(p=>p[i]))),max=[0,1,2].map(i=>Math.max(...ps.map(p=>p[i])));min[2]=(o.type==='stairs'?Math.min(...o.flights.flatMap(f=>[f.start,f.end])):o.start)-o.thickness;max[2]=o.type==='stairs'?Math.max(...o.flights.flatMap(f=>[f.start,f.end])):o.end;if(o.type==='spiral'){min[0]=min[1]=-o.outer;max[0]=max[1]=o.outer}if(local)return {min,max};const world=Array.from({length:8},(_,n)=>M.world(A.document,o,[0,1,2].map(i=>(n>>i)&1?max[i]:min[i])));return {min:[0,1,2].map(i=>Math.min(...world.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...world.map(p=>p[i])))}}const ps=M.geometry(A.document,o).flatMap(f=>f.points).map(p=>local?M.local(A.document,o,p):p);return {min:[0,1,2].map(i=>Math.min(...ps.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...ps.map(p=>p[i])))}}
function change(selector,value){const input=d.querySelector(selector);assert(input,selector);input.value=String(value);input.dispatchEvent(new w.Event('change',{bubbles:true}))}
function worldMove(axis,amount,props={},cancel=false){const g=d.querySelector(`[data-world-handle="${axis}"]`),p=g.querySelector('.gizmo-axis').getAttribute('d').match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number),start=[p[0]*.3+p[2]*.7,p[1]*.3+p[3]*.7],delta=[0,0,0];delta[axis]=amount;drag(start,M.add(start,M.sub(at(delta),at([0,0,0]))),g,props,cancel)}
try{
 fresh();assert.equal(M.createDocument('space').gridSize,100);
 let saved=JSON.parse(JSON.stringify(A.project));delete saved.documents[0].gridSize;assert.equal(M.validate(saved).documents[0].gridSize,100);
 for(const value of [0,-1,25.5,10001,'100']){saved.documents[0].gridSize=value;assert.throws(()=>M.validate(saved),/网格大小/)}
 const initial=JSON.stringify(A.project),undo=A.undoCount;change('#doc-gridSize',250);assert.equal(A.document.gridSize,250);assert.equal(A.undoCount,undo+1);A.command('undo');assert.equal(JSON.stringify(A.project),initial);A.command('redo');assert.equal(A.document.gridSize,250);assert.equal(M.validate(JSON.parse(JSON.stringify(A.project))).documents[0].gridSize,250);
 // Every visible line stays on exactly the same world lattice at different zooms.
 for(const mode of ['plan','elevation','solid'])for(const width of [400,1200,5000,19000]){
  const view={mode,side:'left',azimuth:35,elevation:35},basis=M.viewBasis(A.document,view),grid=R.viewportGrid(A.document,view,basis,{x:-713,y:-321,w:width,h:width*.7});
  assert(!/NaN|Infinity/.test(grid));let count=0;
  for(const match of grid.matchAll(/d="M ([^ ]+) ([^ ]+) L ([^ ]+) ([^"]+)"/g)){
   count++;const a=[+match[1],+match[2]],b=[+match[3],+match[4]];
   if(mode==='solid'){const p=M.unproject(a,basis,[0,0,0],[0,0,1]),q=M.unproject(b,basis,[0,0,0],[0,0,1]),i=Math.abs(p[0]-q[0])<1e-5?0:1;multiple(p[i],250)}
   else{const origin=M.project([0,0,0],basis),i=Math.abs(a[0]-b[0])<1e-5?0:1;multiple(a[i]-origin[i],250)}
  }assert(count>2);
 }
 fresh();A.setTool('plane');drag([23,67],[486,328]);let o=A.document.objects.at(-1),b=box(o);assert.equal(o.type,'plane');[...b.min,...b.max].forEach(n=>multiple(n));near(b.max[0]-b.min[0],500);near(b.max[1]-b.min[1],200);near(o.thickness,100);near(b.max[2],0,'plane surface stays at floor');
 const id=o.id;A.command('undo');assert.equal(A.document.objects.length,0);A.command('redo');assert.equal(A.document.objects[0].id,id);
 // Placement must render the sampled contour on its first frame, before a move.
 for(const snapping of [true,false])for(const circle of [false,true]){
  fresh();d.querySelector('#snap').checked=snapping;A.setTool('ellipse');
  drag([200,200],[500,400],c,{shiftKey:circle});o=A.document.objects.at(-1);assert.equal(o.shape,'ellipse');
  const firstFace=A.scene.faces.find(f=>f.owner.id===o.id);assert.equal(firstFace?.points.length,32,`${circle?'circle':'ellipse'} renders curved immediately, grid ${snapping}`);
  const corner=at(M.world(A.document,o,[o.points[0][0]+1,o.points[0][1]+1,0]));assert(!R.pickAll(corner,A.scene,A.document,A.view).some(h=>h.id===o.id),'outside ellipse corner is not filled or pickable');
  const center=at(M.origin(A.document,o));assert(R.pickAll(center,A.scene,A.document,A.view).some(h=>h.id===o.id));
  const mesh=JSON.stringify(M.geometry(A.document,o).map(f=>f.points));A.command('undo');assert.equal(A.document.objects.length,0);A.command('redo');o=A.document.objects[0];assert.equal(JSON.stringify(M.geometry(A.document,o).map(f=>f.points)),mesh,'redo keeps curved geometry');
 }
 fresh();A.setTool('plane');
 // Neighbor edges at 497 must not pull a grid rectangle away from 500.
 add('plane',[617,600,0]);A.setTool('plane');drag([12,412],[497,695]);o=A.document.objects.at(-1);b=box(o);multiple(b.max[0]);
 // Ghosts and committed placements share constraints in all three views.
 for(const mode of ['plan','elevation'])for(const type of ['stairs','ladder','spiral']){
  fresh(mode);A.setTool(type);const p=at([453,347,0]);pointer('pointermove',p);assert(d.querySelector('[data-placement-ghost]'));pointer('pointerdown',p);pointer('pointerup',p);o=A.document.objects.at(-1);assert(o,type+' placed in '+mode);b=box(o);for(let i=0;i<3;i++){multiple(b.max[i]-b.min[i]);if(i<2||mode!=='plan')multiple(b.min[i])}M.validate(A.project);
 }
 fresh();A.setTool('stairs');pointer('pointerdown',[453,347],c,{ctrlKey:true});pointer('pointerup',[453,347],c,{ctrlKey:true});o=A.document.objects.at(-1);near(o.position[0],453);near(o.flights[0].points[1][0]-o.flights[0].points[0][0],90,'Ctrl uses original size');
 for(const step of [1,10,75,250,1000])for(const type of ['stairs','ladder','spiral']){
  fresh('plan',step);A.setTool(type);pointer('pointerdown',[453,347]);pointer('pointerup',[453,347]);o=A.document.objects.at(-1);assert(o,`${type} on ${step} UU grid`);b=box(o);for(let i=0;i<3;i++)multiple(b.max[i]-b.min[i],step);M.validate(A.project);
 }
 fresh();A.setTool('plane');drag([0,0],[800,800]);const hostId=A.document.objects[0].id;A.setTool('hole');drag([123,123],[287,287]);assert.equal(A.document.objects.length,2);o=A.document.objects.at(-1);assert.equal(o.host,hostId);assert(M.validGeometry(A.document));o.points.flat().forEach(n=>multiple(n));const holeSnapshot=JSON.stringify(A.document.objects);A.setTool('hole');drag([187,187],[320,320]);assert.equal(JSON.stringify(A.document.objects),holeSnapshot,'overlapping grid hole rolls back');
 // Both projected boundaries must be reachable for off-grid sizes, in either direction.
 for(const config of [{mode:'plan'},{mode:'elevation'},{mode:'elevation',side:'right'},{mode:'solid',axis:0},{mode:'solid',axis:1},{mode:'solid',axis:2},{mode:'plan',angle:.37,step:75}])for(const negative of [false,true])for(const end of ['min','max']){
  const {mode,axis:axisIndex=0,angle=0,step=100}=config;fresh(mode,step);if(config.side)d.querySelector(`[data-side="${config.side}"]`).click();o=add('plane',negative?[-853,-747,-620]:[153,247,420]);o.points=[[0,0],[260,0],[260,160],[0,160]];o.thickness=160;o.orientation=M.axisRotation([0,0,1],angle);A.select(o.id,false,true);
  const oldBox=box(o),before=JSON.stringify(A.document.objects),history=A.undoCount,axes=mode==='solid'?[[0,1,2].map(i=>i===axisIndex?1:0)]:[A.scene.basis.r,A.scene.basis.down],raw=[0,0,0],targets=[];
  for(const axis of axes){const ps=M.geometry(A.document,o).flatMap(f=>f.points).map(p=>M.dot(p,axis)),value=Math[end](...ps),target=(Math.round(value/step)+(negative?-2:2))*step;targets.push(target);raw.forEach((_,i)=>raw[i]+=axis[i]*(target-value+(negative?-1:1)*(angle?.01:3)))}
  if(mode==='solid')worldMove(axisIndex,raw[axisIndex]);else{const p=at(M.world(A.document,o,[130,80,-80]));drag(p,M.add(p,[M.dot(raw,A.scene.basis.r),M.dot(raw,A.scene.basis.down)]))}
  o=A.document.objects.find(x=>x.id===o.id);b=box(o);
  axes.forEach((axis,i)=>near(Math[end](...M.geometry(A.document,o).flatMap(f=>f.points).map(p=>M.dot(p,axis))),targets[i],`${mode} ${end} boundary, negative ${negative}`));
  b.max.forEach((v,i)=>near(v-b.min[i],oldBox.max[i]-oldBox.min[i],'move preserves size'));if(mode==='solid')o.position.forEach((v,i)=>{if(i!==axisIndex)near(v,JSON.parse(before)[0].position[i],'constrained move preserves other axes')});assert.equal(A.undoCount,Math.min(80,history+1));A.command('undo');assert.equal(JSON.stringify(A.document.objects),before);A.command('redo');M.validate(A.project);
 }
 // An off-grid existing component aligns absolutely, including negative coordinates.
 for(const mode of ['plan','elevation','solid']){
  fresh(mode);o=add('plane',[-453,347,20]);A.select(o.id,false,true);const before=JSON.stringify(A.document.objects),history=A.undoCount;
  if(mode==='solid')worldMove(0,24);else{const p=at(M.origin(A.document,o));drag(p,M.add(p,[24,0]))}
  o=A.document.objects.find(x=>x.id===o.id);b=box(o);multiple(b.max[0]);if(mode==='plan')multiple(b.max[1]);assert.equal(A.undoCount,Math.min(80,history+1));A.command('undo');assert.equal(JSON.stringify(A.document.objects),before);A.command('redo');M.validate(A.project);
 }
 // Keyboard moves use the same nearest boundary and leave the other axis untouched.
 for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown']){
  fresh();o=add('plane',[153,247,20]);o.points=[[0,0],[260,0],[260,160],[0,160]];A.select(o.id,false,true);const before=[...o.position],axis=key==='ArrowLeft'||key==='ArrowRight'?0:1;
  c.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true}));o=A.document.objects.find(x=>x.id===o.id);b=box(o);multiple(b.max[axis]);near(o.position[1-axis],before[1-axis],'keyboard preserves other axis');
  A.command('undo');A.select(o.id,false,true);c.dispatchEvent(new w.KeyboardEvent('keydown',{key,ctrlKey:true,bubbles:true}));o=A.document.objects.find(x=>x.id===o.id);near(o.position[axis],before[axis]+(['ArrowLeft','ArrowUp'].includes(key)?-1:1),'Ctrl keyboard bypasses grid');
 }
 fresh('solid');o=add('plane');const h=M.createObject(A.document,'hole');h.host=o.id;h.points=[[-20,-20],[20,-20],[20,20],[-20,20]];A.document.objects.push(h);const label=add('text',o.position);o.group=label.group=M.uid();A.select(o.id);const source=JSON.stringify(A.document.objects);worldMove(0,44,{altKey:true},true);assert.equal(JSON.stringify(A.document.objects),source);worldMove(0,44,{altKey:true});assert.equal(A.document.objects.length,6);assert(M.validGeometry(A.document));A.command('undo');assert.equal(JSON.stringify(A.document.objects),source);
 fresh('solid');o=add('plane');A.select(o.id,false,true);const rawX=o.position[0];worldMove(0,24,{ctrlKey:true});near(A.document.objects.find(x=>x.id===o.id).position[0],rawX+24,'Ctrl bypasses absolute grid');A.document.floors[0].height=35;d.querySelector(`[data-floor="${A.document.activeFloor}"]`).click();worldMove(2,24);near(A.document.floors[0].height,100,'whole floor aligns its base');near(A.document.objects[0].position[2],20,'floor move retains relative height');
 // A size gesture rounds the resulting dimension and preserves its opposite corner.
 fresh('solid',75);o=add('plane');A.select(o.id,false,true);A.setTool('size');let g=d.querySelector('[data-solid-size-axis="0"]'),p=d.querySelector('[data-solid-corner="7"] circle'),start=[+p.getAttribute('cx'),+p.getAttribute('cy')],before=box(o,true),fixed=M.world(A.document,o,before.min);drag(start,M.add(start,M.sub(at([24,0,0]),at([0,0,0]))),g);o=A.document.objects.find(x=>x.id===o.id);b=box(o,true);near(b.max[0]-b.min[0],300);M.world(A.document,o,b.min).forEach((n,i)=>near(n,fixed[i]));A.command('undo');
 // Canvas resizing uses the document step; numeric properties stay exact.
 fresh();o=add('plane');A.select(o.id,false,true);A.setTool('size');g=d.querySelector('[data-size-edge="1"]');p=A.scene.basis;const ps=o.points.map(v=>at(M.world(A.document,o,[...v,0]))),edge=M.mul(M.add(ps[1],ps[2]),.5);drag(edge,M.add(edge,[63,0]),g);o=A.document.objects.find(x=>x.id===o.id);b=box(o,true);multiple(b.max[0]-b.min[0]);change('#prop-dimensionZ',137.25);o=A.document.objects.find(x=>x.id===o.id);near(o.thickness,137.25,'numeric size bypasses grid');M.validate(A.project);
 // Showing the grid is independent of enabling snapping; curves retain their own units.
 const geometry=JSON.stringify(A.document.objects);d.querySelector('#snap').checked=false;d.querySelector('#snap').dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(JSON.stringify(A.document.objects),geometry);A.createDocument('curve');assert(!d.querySelector('#doc-gridSize'));assert.deepEqual(errors,[]);
 console.log('PASS grid: defaults/migration/validation/history/JSON; fixed world lattice across views and zooms; rectangle and three placement types in plan/elevation; whole-grid dimensions, both boundaries across views/XYZ/negative coordinates/rotation/75 cm grid, keyboard, component priority, Ctrl, Alt host/hole/group copy and cancel, fixed-corner 3D size, 2D size and properties, curve isolation.');
}finally{dom.window.close()}
