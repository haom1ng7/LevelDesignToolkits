const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole(),frames=new Map();let now=0,nextFrame=0;
vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/camera.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
 w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};
 w.performance.now=()=>now;w.requestAnimationFrame=fn=>{frames.set(++nextFrame,fn);return nextFrame};w.cancelAnimationFrame=id=>frames.delete(id);
}});
const w=dom.window,d=w.document,A=w.SpatialEditor,M=w.StudioModel,c=d.querySelector('#canvas');
const near=(a,b,msg)=>assert(Math.abs(a-b)<1e-6,`${msg}: ${a} != ${b}`),camera=()=>({...A.camera,eye:A.view.fly?[...A.view.fly.eye]:null}),same=(a,b,msg)=>assert.equal(JSON.stringify(a),JSON.stringify(b),msg);
function key(type,k,target=c,props={}){const e=new w.KeyboardEvent(type,{key:k,code:'Key'+k.toUpperCase(),bubbles:true,cancelable:true,...props});target.dispatchEvent(e);return e}
function tick(ms=50){now+=ms;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now))}
function pointer(type,props={}){c.dispatchEvent(new w.MouseEvent(type,{bubbles:true,cancelable:true,clientX:990,clientY:10,button:2,...props}))}
function wheel(deltaY,props={}){c.dispatchEvent(new w.WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY,...props}))}
function perspective(){if(A.view.fly)return;const el=d.querySelector('#solid-projection');el.value='perspective';el.dispatchEvent(new w.Event('change',{bubbles:true}));c.focus()}
function travel(keys){perspective();const before=camera(),b=M.viewBasis(A.document,A.view);for(const k of keys)key('keydown',k);tick();for(const k of keys)key('keyup',k);const delta=M.sub(A.view.fly.eye,before.eye);same(A.camera,{x:before.x,y:before.y,w:before.w,h:before.h},'travel never pans or scales the 2D viewport');return [M.dot(delta,b.r),M.dot(delta,b.down),M.dot(delta,b.n)]}
function rightSince(before){return M.dot(M.sub(A.view.fly.eye,before.eye),M.viewBasis(A.document,A.view).r)}
function still(action,msg){const before=camera();action();tick();same(camera(),before,msg)}
function exportGeometry(){const svg=new w.DOMParser().parseFromString(A.renderSVG(),'image/svg+xml');return {viewBox:svg.documentElement.getAttribute('viewBox'),objects:[...svg.querySelectorAll('[data-object]')].map(g=>g.outerHTML)}}
try{
 A.createDocument('space');A.document.objects=[M.createObject(A.document,'plane',[400,300,0])];d.querySelector('[data-view="solid"]').click();c.focus();
 const initial=JSON.stringify(A.project),undo=A.undoCount,exportBefore=exportGeometry();
 assert(!d.querySelector('[data-tool="select"] kbd'),'selection no longer advertises Q');
 // Equal geometry changes size with depth, and rays round-trip to world planes.
 const probe=M.clone(A.document),pv={mode:'solid',azimuth:0,elevation:0,fly:{eye:[0,200,80],center:[600,400],focal:900}},pb=M.viewBasis(probe,pv),span=y=>{const a=M.project([-20,y,80],pb),b=M.project([20,y,80],pb);return b[0]-a[0]};near(span(100)/span(0),2,'near geometry is twice the size at half the distance');
 for(const p of [[0,0,80],[30,-100,35],[-50,100,120]]){const back=M.unproject(M.project(p,pb),pb,p,[0,1,0]);back.forEach((v,i)=>near(v,p[i],'perspective ray round trip'))}
 const axisDelta=M.dragAxes(M.project([35,0,80],pb),M.project([10,0,80],pb),[0,0,80],[[1,0,0]],pb);near(axisDelta[0],25,'perspective axis drag is exact');const planeDelta=M.dragAxes(M.project([35,0,105],pb),M.project([10,0,80],pb),[0,0,80],[[1,0,0],[0,0,1]],pb);near(planeDelta[0],25,'perspective plane drag X');near(planeDelta[1],25,'perspective plane drag Z');
 const clipped=M.clipPolygon([[-10,190,70],[10,190,90],[0,210,80]],pb);assert.equal(clipped.length,4);assert(clipped.every(p=>M.cameraDepth(p,pb)>=pb.near-1e-7));assert.equal(M.clipSegment([0,210,80],[0,220,80],pb).length,0,'behind-camera lines are clipped');
 probe.gridVisible=false;probe.heightReferences=false;const front=M.createObject(probe,'wall',[0,0,0]),far=M.createObject(probe,'wall',[0,-300,0]),behind=M.createObject(probe,'wall',[0,400,0]);probe.objects=[front,far,behind];const ps=w.StudioRender.scene(probe,pv,{camera:A.camera});assert(ps.faces.every(f=>f.owner.id!==behind.id&&f.points.every(p=>M.cameraDepth(p,pb)>=1-1e-7)),'behind-camera surfaces are excluded');assert.equal(w.StudioRender.pickAll(M.project([0,0,80],pb),ps,probe,pv)[0].id,front.id,'perspective ray picks the front surface');
 key('keydown','w');tick();key('keyup','w');assert(A.view.fly,'W automatically enters perspective');assert.equal(d.querySelector('#solid-projection').value,'perspective');const eye=[...A.view.fly.eye],forward=M.viewBasis(A.document,A.view).n;key('keydown','w');tick();key('keyup','w');near(M.dot(M.sub(A.view.fly.eye,eye),forward),-30,'W travels into screen depth');
 // Real eye positions include depth travel; the SVG viewport remains unchanged.
 for(const azimuth of [0,35,90,180,270])for(const elevation of [-90,-35,0,.5,35,90]){
  A.view.azimuth=azimuth;A.view.elevation=elevation;A.command('fit');
  const a=azimuth*Math.PI/180,b=M.viewBasis(A.document,A.view),vectors={w:M.mul(b.n,-1),s:b.n,a:M.mul(b.r,-1),d:b.r,q:[0,0,-1],e:[0,0,1]};
  for(const [k,v]of Object.entries(vectors)){const delta=travel([k]);near(delta[0],M.dot(v,b.r)*30,`${k} X at ${azimuth}/${elevation}`);near(delta[1],M.dot(v,b.down)*30,`${k} Y at ${azimuth}/${elevation}`);near(delta[2],M.dot(v,b.n)*30,`${k} depth at ${azimuth}/${elevation}`)}
 }
 A.view.azimuth=35;A.view.elevation=35;A.command('fit');
 const b=M.viewBasis(A.document,A.view),diagonal=travel(['w','d','e']),direction=M.add(M.sub(b.r,b.n),[0,0,1]),v=M.mul(M.unit(direction),30);near(diagonal[0],M.dot(v,b.r),'normalized diagonal X');near(diagonal[1],M.dot(v,b.down),'normalized diagonal Y');
 const opposed=travel(['w','s','a','d','q','e']);opposed.forEach(n=>near(n,0,'opposing keys cancel'));
 let start=camera();key('keydown','d');tick(25);key('keydown','d',c,{repeat:true});tick(25);key('keyup','d');near(rightSince(start),30,'speed is elapsed-time based and repeat independent');still(()=>tick(),'release stops');
 d.querySelector('[data-view="solid"]').focus();key('keydown','d');tick();start=camera();c.focus();tick();near(rightSince(start),30,'focusing canvas to orbit preserves held travel');key('keyup','d');
 key('keydown','d');tick();w.dispatchEvent(new w.Event('blur'));still(()=>key('keydown','d',c,{repeat:true}),'blur stops; held-key repeat cannot restart');key('keyup','d');
 key('keydown','d');tick();Object.defineProperty(d,'hidden',{configurable:true,value:true});d.dispatchEvent(new w.Event('visibilitychange'));still(()=>{},'hidden document stops');Object.defineProperty(d,'hidden',{configurable:true,value:false});key('keyup','d');
 key('keydown','d');tick();pointer('pointercancel');still(()=>{},'pointer cancel stops');key('keyup','d');
 key('keydown','d');tick();key('keydown','Escape',c,{code:'Escape'});still(()=>{},'Escape stops');key('keyup','d');
 const id=A.document.objects[0].id;key('keydown','d');tick();A.select(id,false,true);A.select(id,true,true);still(()=>{},'selection stops even if immediately deselected');key('keyup','d');
 key('keydown','d');tick();d.querySelector('[data-view="plan"]').click();d.querySelector('[data-view="solid"]').click();still(()=>{},'view switch clears held keys');key('keyup','d');
 for(const modifier of ['ctrlKey','metaKey','altKey'])still(()=>{key('keydown','w',c,{[modifier]:true});key('keyup','w')},modifier+' bypasses camera');
 still(()=>{key('keydown','Process',c,{code:'KeyW',isComposing:true,keyCode:229});key('keyup','w')},'IME is protected');
 const input=d.querySelector('#layer-filter');key('keydown','d');tick();input.focus();still(()=>{key('keydown','d',input);key('keyup','d',input)},'focus and text input stop');c.focus();
 d.querySelector('#help-dialog').showModal();still(()=>{key('keydown','d');key('keyup','d')},'dialog protects keys');d.querySelector('#help-dialog').close();
 A.select(id,false,true);start=camera();key('keydown','w');assert.equal(A.tool,'move');key('keyup','w');key('keydown','e');assert.equal(A.tool,'rotate');key('keyup','e');key('keydown','q');assert.equal(A.tool,'rotate','Q never selects');key('keyup','q');tick();same(camera(),start,'selected component keeps transform keys');A.select(id,true,true);A.setTool('select');
 // Tuning speed consumes wheel input and does not turn a right click into a menu.
 start=camera();pointer('pointerdown');wheel(-100,{buttons:2});pointer('pointerup');same(camera(),start,'rate wheel never zooms');assert(d.querySelector('#context-menu').hidden,'rate wheel suppresses menu');assert(d.querySelector('#status').textContent.includes('750 cm/s'));
 near(travel(['d'])[0],37.5,'accelerated rate');pointer('pointerdown');wheel(100,{buttons:2});pointer('pointerup');near(travel(['d'])[0],30,'decelerated rate');
 pointer('pointerdown');pointer('pointerup');assert(!d.querySelector('#context-menu').hidden,'plain right click still opens menu');key('keydown','Escape',c,{code:'Escape'});
 perspective();const azimuth=A.view.azimuth,eyeBeforeOrbit=[...A.view.fly.eye];pointer('pointerdown');wheel(-100,{buttons:2});pointer('pointermove',{clientX:940,clientY:35,buttons:2});pointer('pointerup',{clientX:940,clientY:35});assert.notEqual(A.view.azimuth,azimuth,'look still works after rate adjustment');same(A.view.fly.eye,eyeBeforeOrbit,'right look rotates in place');
 start=camera();const optics=JSON.stringify(A.view.fly);wheel(-100);same(camera(),start,'perspective ordinary wheel is disabled');assert.equal(JSON.stringify(A.view.fly),optics,'wheel preserves perspective optics');assert(d.querySelector('[data-action="zoom-in"]').disabled);d.querySelector('#solid-projection').value='orthographic';d.querySelector('#solid-projection').dispatchEvent(new w.Event('change',{bubbles:true}));start=camera();wheel(-100);assert(A.camera.w<start.w,'orthographic wheel still zooms');perspective();
 pointer('pointerdown');wheel(100,{buttons:2});wheel(-6.25,{buttons:2,deltaMode:1});pointer('pointerup');near(travel(['d'])[0],37.5,'line-mode wheel detent');pointer('pointerdown');wheel(6.25,{buttons:2,deltaMode:1});wheel(-.125,{buttons:2,deltaMode:2});pointer('pointerup');near(travel(['d'])[0],37.5,'page-mode wheel detent');
 pointer('pointerdown');for(let i=0;i<100;i++)wheel(-1e9,{buttons:2});assert(d.querySelector('#status').textContent.includes('100000 cm/s'),'upper rate bound');for(let i=0;i<100;i++)wheel(1e9,{buttons:2});pointer('pointerup');assert(d.querySelector('#status').textContent.includes('10 cm/s'),'lower rate bound');near(travel(['d'])[0],.5,'minimum rate remains usable');
 same(A.project,JSON.parse(initial),'navigation leaves project untouched');assert.equal(A.undoCount,undo,'navigation adds no undo history');A.view.azimuth=35;A.view.elevation=35;d.querySelector('#solid-projection').value='orthographic';d.querySelector('#solid-projection').dispatchEvent(new w.Event('change',{bubbles:true}));same(exportGeometry(),exportBefore,'export geometry and full drawing bounds are unchanged');assert.deepEqual(errors,[]);
 console.log('PASS perspective camera navigation: 180 eye-position heading/pitch/key cases, normalized chords, elapsed time, release/repeat/cancel/focus/IME/modifiers/dialogs/selection/view guards, transform keys, Q removal, right-wheel rate without zoom/menu, in-place look, disabled perspective zoom and retained orthographic zoom, project/history/export isolation.');
}finally{w.close()}
