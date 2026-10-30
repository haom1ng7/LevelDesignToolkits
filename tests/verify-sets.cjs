const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/sets',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{}}});
const w=dom.window,M=w.StudioModel,E=w.StudioMeshExport,A=w.SpatialEditor,d=w.document;
const near=(a,b,msg='')=>assert(Math.abs(a-b)<Math.max(1e-4,b*1e-7),`${msg}: ${a} != ${b}`);
const volume=doc=>doc.objects.length?E.build(doc).meshes.reduce((s,m)=>s+Math.abs(m.triangles.reduce((v,t)=>{const [a,b,c]=t.map(i=>m.vertices[i]);return v+M.dot(a,M.cross(b,c))/6},0)),0):0;
function fresh(){const doc=M.createDocument('space');doc.objects=[];return doc}
function box(doc,x=0,y=0,z=0,width=100,length=100,height=20){const o=Object.assign(M.createObject(doc,'plane',[x,y,z]),{points:[[0,0],[width,0],[width,length],[0,length]],thickness:height});doc.objects.push(o);return o}
const apply=(doc,mode)=>M.setComponents(doc,doc.objects.map(o=>o.id),mode);
const project=doc=>({format:'level-spatial-editor',version:7,documents:[doc],activeDocument:doc.id});
function load(doc){A.loadProject(project(doc));for(const [i,o] of A.document.objects.entries())if(o.type!=='hole')A.select(o.id,i>0,true)}
try{
 let doc=fresh();box(doc);box(doc,50);apply(doc,'intersect');assert.equal(doc.objects.length,1);assert.equal(doc.objects[0].type,'solid');near(volume(doc),100000,'intersection');assert(M.validGeometry(doc));
 const save=JSON.stringify(project(doc));assert.deepEqual(JSON.parse(JSON.stringify(M.validate(JSON.parse(save)))),JSON.parse(save),'JSON preserves mesh');
 doc=fresh();box(doc);box(doc,50);apply(doc,'difference');assert.equal(doc.objects.length,2);near(volume(doc),200000,'symmetric difference');
 for(const o of doc.objects)near(volume({...doc,objects:[o]}),100000);
 // Partial depth, disjoint heights and shared faces have physical volume semantics.
 doc=fresh();box(doc);box(doc,50,0,10);apply(doc,'intersect');near(volume(doc),50000);
 doc=fresh();box(doc);box(doc,0,0,20);const touching=JSON.stringify(doc);apply(doc,'difference');assert.equal(JSON.stringify(doc),touching,'touching faces do not subtract');apply(doc,'intersect');assert.equal(doc.objects.length,0);
 doc=fresh();box(doc);box(doc,0,0,100);apply(doc,'intersect');assert.equal(doc.objects.length,0,'projection overlap is not volume');
 doc=fresh();box(doc);box(doc,200);const disjoint=JSON.stringify(doc);apply(doc,'difference');assert.equal(JSON.stringify(doc),disjoint);
 doc=fresh();box(doc,0,0,0,.02,.02,.02);box(doc,.01,0,0,.02,.02,.02);apply(doc,'intersect');assert.equal(doc.objects.length,1,'small valid volumes survive');near(volume(doc),.000004);
 // Enclosed inner pieces disappear while the complete outer source survives.
 for(const reverse of [false,true]){doc=fresh();const outer=box(doc,0,0,0,100,100,100),inner=box(doc,20,20,-20,20,20,20),before=JSON.stringify(outer);if(reverse)doc.objects.reverse();apply(doc,'difference');assert.equal(doc.objects.length,1);assert.equal(doc.objects[0].id,outer.id);assert.equal(JSON.stringify(doc.objects[0]),before);near(volume(doc),1000000)}
 doc=fresh();box(doc);box(doc);apply(doc,'difference');assert.equal(doc.objects.length,0,'identical solids cancel');
 doc=fresh();box(doc);box(doc);apply(doc,'intersect');near(volume(doc),200000);
 // Multi-selection intersection uses all operands; difference removes all pair overlaps.
 doc=fresh();box(doc);box(doc,25);box(doc,50);apply(doc,'intersect');near(volume(doc),100000);
 doc=fresh();box(doc);box(doc,25);box(doc,50);apply(doc,'difference');near(volume(doc),100000,'triple overlap is removed once from every operand');
 for(const reverse of [false,true]){doc=fresh();box(doc);box(doc,50);box(doc,100);if(reverse)doc.objects.reverse();apply(doc,'difference');near(volume(doc),200000);assert.equal(doc.objects.length,2)}
 // Independent interval arithmetic checks clipping with non-integer coordinates.
 let randomState=2749;const rand=()=>((randomState=(randomState*1664525+1013904223)>>>0)/4294967296);
 for(let sample=0;sample<12;sample++){
  const lo=[0,1,2].map(()=>rand()*100-50),hi=lo.map(v=>v+10+rand()*80),otherLo=lo.map(v=>v-20+rand()*60),otherHi=otherLo.map(v=>v+10+rand()*80),size=(a,b)=>a.reduce((s,v,i)=>s*(b[i]-v),1),va=size(lo,hi),vb=size(otherLo,otherHi),iv=lo.reduce((s,v,i)=>s*Math.max(0,Math.min(hi[i],otherHi[i])-Math.max(v,otherLo[i])),1),insideA=lo.every((v,i)=>v>=otherLo[i]&&hi[i]<=otherHi[i]),insideB=otherLo.every((v,i)=>v>=lo[i]&&otherHi[i]<=hi[i]);
  for(const mode of ['intersect','difference']){doc=fresh();for(const [a,b] of [[lo,hi],[otherLo,otherHi]])box(doc,a[0],a[1],b[2],b[0]-a[0],b[1]-a[1],b[2]-a[2]);apply(doc,mode);near(volume(doc),mode==='intersect'?iv:insideA?vb:insideB?va:va+vb-2*iv,'interval oracle '+sample+'/'+mode)}
 }
 // A central cutter can split one result into disconnected volumes.
 doc=fresh();box(doc,0,0,0,300,100,20);box(doc,100,-50,10,100,200,40);apply(doc,'difference');near(volume(doc),1000000);assert(M.validGeometry(doc));
 // Existing bores and curved/concave profiles participate as material, not boxes.
 doc=fresh();let host=box(doc,0,0,0,100,100,20),hole=Object.assign(M.createObject(doc,'hole'),{host:host.id,points:[[30,30],[70,30],[70,70],[30,70]]});doc.objects.push(hole);box(doc,0,0,0,100,100,20);apply(doc,'intersect');near(volume(doc),168000);assert.equal(doc.objects.length,1);
 doc=fresh();host=box(doc);host.shape='ellipse';const round=volume(doc);box(doc,-10,-10,10,120,120,40);apply(doc,'intersect');near(volume(doc),round);
 doc=fresh();host=box(doc);host.points=[[0,0],[100,0],[100,30],[30,30],[30,100],[0,100]];box(doc,20,20);apply(doc,'intersect');near(volume(doc),30000);
 // Rotated walls and transformed floors share the same world-space operation.
 doc=fresh();host=box(doc,0,0,0,100,100,100);const wall=Object.assign(M.createObject(doc,'wall',[50,50,-100]),{thickness:20,points:[[-100,0],[100,0],[100,100],[-100,100]],orientation:M.axisRotation([0,0,1],Math.PI/4)});doc.objects.push(wall);apply(doc,'intersect');assert(volume(doc)>200000&&volume(doc)<300000);assert(M.validGeometry(doc));
 doc=fresh();box(doc);const high=box(doc,0,0,-100);const f={...M.clone(doc.floors[0]),id:M.uid(),height:100};doc.floors.push(f);high.floor=f.id;apply(doc,'intersect');near(volume(doc),200000);
 // All five source primitives yield closed volumes, including stepped assemblies.
 for(const type of ['stairs','ladder','spiral']){doc=fresh();const o=M.createObject(doc,type,[0,0,0]);o.countMode='manual';if(type==='stairs')o.flights[0].steps=4;if(type==='spiral')o.steps=8;doc.objects.push(o);const expected=volume(doc);box(doc,-500,-500,500,1000,1000,1000);apply(doc,'intersect');near(volume(doc),expected,type);assert.equal(doc.objects.length,1);assert(M.validGeometry(doc))}
 // Commands are immediate and atomic in every view, and selection follows survivors.
 for(const mode of ['plan','elevation','solid']){doc=fresh();box(doc);box(doc,50);load(doc);d.querySelector(`[data-view="${mode}"]`).click();assert(!d.querySelector('[data-tool-group="sets"]').disabled);assert(!d.querySelector('[data-tool="intersect"]').disabled);const before=JSON.stringify(A.project),n=A.undoCount;d.querySelector('[data-tool="intersect"]').click();near(volume(A.document),100000);assert.equal(A.undoCount,n+1);assert.equal(A.selection.ids.length,1);assert.equal(A.tool,'select');assert(d.querySelector('[data-tool-group="sets"]').disabled);const after=JSON.stringify(A.project);A.command('undo');assert.equal(JSON.stringify(A.project),before);A.command('redo');assert.equal(JSON.stringify(A.project),after);assert(A.renderSVG().includes('data-object='))}
 doc=fresh();box(doc);box(doc,50);load(doc);A.command('difference');near(volume(A.document),200000);assert.equal(A.selection.ids.length,2);
 // Set solids remain editable through real inspector fields and rigid operations.
 A.select(A.selection.ids[0],false,true);const id=A.selection.id,v=volume({...A.document,objects:[A.document.objects.find(o=>o.id===id)]}),input=d.querySelector('#prop-dimensionX'),old=+input.value;input.value=old*2;input.dispatchEvent(new w.Event('change',{bubbles:true}));near(volume({...A.document,objects:[A.document.objects.find(o=>o.id===id)]}),v*2);A.command('undo');
 const o=A.document.objects.find(o=>o.id===id);const prior=volume({...A.document,objects:[o]});M.rotate(A.document,[id],[1,0,0],.7,M.origin(A.document,o));M.move(A.document,[id],[100,50,80]);near(volume({...A.document,objects:[o]}),prior);A.select(id,false,true);A.command('duplicate');assert.equal(A.document.objects.length,3);assert(M.validGeometry(A.document));const saved=JSON.stringify(A.project);A.loadProject(JSON.parse(saved));assert.equal(JSON.stringify(A.project.documents),JSON.stringify(JSON.parse(saved).documents));assert(E.obj(E.build(A.document)).includes('f '));assert(E.fbx(E.build(A.document)).length>1000);
 // Unselected/grouped annotations survive; only changed hosts consume their holes.
 doc=fresh();host=box(doc);const other=box(doc,50),label=M.createObject(doc,'text');host.group=other.group=label.group=M.uid();doc.objects.push(label);load(doc);A.select(host.id);A.setTool('intersect');assert(A.document.objects.some(o=>o.id===label.id));assert(!A.document.objects.find(o=>o.type==='solid').group);
 doc=fresh();host=box(doc);box(doc,50);hole=Object.assign(M.createObject(doc,'hole'),{host:host.id,visible:false,points:[[10,10],[20,10],[20,20],[10,20]]});doc.objects.push(hole);const blocked=JSON.stringify(doc);assert.throws(()=>apply(doc,'difference'),/空洞/);assert.equal(JSON.stringify(doc),blocked);
 // Invalid/locked/hidden/curve selections cannot edit history or geometry.
 for(const state of ['locked','hidden','floor']){doc=fresh();host=box(doc);box(doc,50);if(state==='locked')host.locked=true;if(state==='hidden')host.visible=false;if(state==='floor')doc.floors[0].visible=false;load(doc);const before=JSON.stringify(A.project),n=A.undoCount;A.command('intersect');assert.equal(JSON.stringify(A.project),before);assert.equal(A.undoCount,n);assert(d.querySelector('[data-tool-group="sets"]').disabled)}
 A.createDocument('curve');assert(d.querySelector('[data-tool-group="sets"]').disabled);
 const malformed=JSON.parse(save);malformed.documents[0].objects[0].mesh[0][0][0]=null;assert.throws(()=>M.validate(malformed),/集合实体/);
 assert.deepEqual(errors,[]);console.log('PASS sets: volumetric intersection/difference, containment, identical/disjoint/touching, 3+ operands, holes/curves/concavity, five primitives, rotated walls/floors, all views, atomic undo/redo, mesh editing/JSON/OBJ/FBX, annotations and restrictions.');
}finally{w.close()}
