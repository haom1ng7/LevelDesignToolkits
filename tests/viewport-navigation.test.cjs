const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole(),frames=new Map();let nextFrame=0;
vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/viewport.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
 w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});
 w.requestAnimationFrame=fn=>{frames.set(++nextFrame,fn);return nextFrame};w.cancelAnimationFrame=id=>frames.delete(id);
}});
const w=dom.window,A=w.SpatialEditor,M=w.StudioModel,R=w.StudioRender,d=w.document,c=d.querySelector('#canvas');
const same=(a,b,message)=>assert.equal(JSON.stringify(a),JSON.stringify(b),message),tick=()=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(0))};
const pointer=(type,props={})=>c.dispatchEvent(new w.MouseEvent(type,{clientX:300,clientY:300,button:1,buttons:4,bubbles:true,cancelable:true,...props}));
const wheel=()=>c.dispatchEvent(new w.WheelEvent('wheel',{clientX:300,clientY:300,deltaY:-100,bubbles:true,cancelable:true}));
try{
 const doc=M.createDocument('space','Navigation regression'),plane=M.createObject(doc,'plane',[450,350,40]),spiral=M.createObject(doc,'spiral',[800,500,0]);
 const hole=Object.assign(M.createObject(doc,'hole'),{host:plane.id,floor:plane.floor,points:[[-20,-20],[20,-20],[20,20],[-20,20]]});doc.objects=[plane,hole,spiral];
 A.loadProject({format:'level-spatial-editor',version:7,documents:[doc],activeDocument:doc.id});
 let scenes=0,geometry=0;const originalScene=R.scene,originalGeometry=M.geometry;
 R.scene=(...args)=>{scenes++;return originalScene(...args)};M.geometry=(...args)=>{geometry++;return originalGeometry(...args)};
 for(const mode of ['plan','elevation']){
  d.querySelector(`[data-view="${mode}"]`).click();A.setTool('select');
  const scene=A.scene,art=d.querySelector('[data-viewport-layer="artwork"] [data-object]'),before=JSON.stringify(A.project),undo=A.undoCount;
  scenes=geometry=0;const viewBox=c.getAttribute('viewBox');pointer('pointerdown');
  for(let i=0;i<100;i++)pointer('pointermove',{clientX:300+i,clientY:300+i/2});
  assert.equal(frames.size,1,'high-rate pan coalesces to one display callback');assert.equal(c.getAttribute('viewBox'),viewBox,'painting waits for display frame');tick();
  assert.equal(scenes,0);assert.equal(geometry,0);assert.strictEqual(A.scene,scene);assert(art.isConnected);assert.notEqual(c.getAttribute('viewBox'),viewBox);
  pointer('pointerup');assert.equal(scenes,0,'release does not rebuild drafting projection');
  for(let i=0;i<8;i++)wheel();assert.equal(frames.size,1,'wheel burst coalesces');tick();assert.equal(scenes,0);assert.equal(geometry,0);assert(art.isConnected);
  assert.equal(d.querySelector('#zoom-label').textContent,Math.round(A.document.width/A.camera.w*100)+'%');
  const projected=M.project(M.origin(A.document,A.document.objects[0]),A.scene.basis),reference=originalScene(A.document,A.view,{camera:A.camera,tolerance:A.scene.tolerance});
  same(R.pickAll(projected,A.scene,A.document,A.view).map(h=>h.id),R.pickAll(projected,reference,A.document,A.view).map(h=>h.id),'cached picking matches a fresh scene');
  assert.equal(JSON.stringify(A.project),before);assert.equal(A.undoCount,undo);
 }
 d.querySelector('[data-view="plan"]').click();A.select(plane.id,false,true);const oldArtwork=d.querySelector('[data-viewport-layer="artwork"]');
 A.command('duplicate');assert(!oldArtwork.isConnected,'model edits invalidate artwork');const duplicated=JSON.stringify(A.document.objects);A.command('undo');assert.equal(A.document.objects.length,3);A.command('redo');assert.equal(JSON.stringify(A.document.objects),duplicated);
 const artwork=d.querySelector('[data-viewport-layer="artwork"]');wheel();assert.equal(frames.size,1);A.createDocument('space','Replacement');tick();assert(!artwork.isConnected);assert.equal(A.document.name,'Replacement');assert(A.scene.faces.every(f=>A.document.objects.some(o=>o.id===f.owner.id)),'pending navigation cannot restore an old document');
 wheel();d.querySelector('[data-view="elevation"]').click();tick();same(A.scene.basis,M.viewBasis(A.document,A.view),'view switch cancels pending old projection');
 // First-occurrence epsilon chains matter: a rejected point can still suppress
 // a later point. Compare the optimized hull with the legacy algorithm.
 function legacyHull(points){const eps=1e-7,p=points.filter((v,i,a)=>a.findIndex(q=>Math.hypot(q[0]-v[0],q[1]-v[1])<eps)===i).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(p.length<3)return p;const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),half=a=>{const out=[];for(const v of a){while(out.length>1&&cross(out.at(-2),out.at(-1),v)<=eps)out.pop();out.push(v)}return out};return [...half(p).slice(0,-1),...half([...p].reverse()).slice(0,-1)]}
 let random=20261106;const rand=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/2**32};
 for(let i=0;i<50;i++){const points=[];for(let j=0;j<80;j++){const p=[Math.floor(rand()*10)*100-500,Math.floor(rand()*10)*100-500];points.push(p,[...p],[p[0]+.8e-7,p[1]],[p[0]+1.6e-7,p[1]])}same(M.hull(points),legacyHull(points),'epsilon hull equivalence '+i)}
 assert.deepEqual(errors,[]);console.log('PASS viewport navigation: coalesced pan/wheel, retained projection/DOM, picking, zoom labels, history/model isolation, edit/undo/redo/document/view invalidation and 50 legacy epsilon-hull comparisons.');
}finally{w.close()}
