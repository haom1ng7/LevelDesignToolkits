const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/empty-project.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
 w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};
}});
const w=dom.window,d=w.document,A=w.SpatialEditor,R=w.StudioRender,canvas=d.querySelector('#canvas');
const same=(a,b,msg)=>assert.equal(JSON.stringify(a),JSON.stringify(b),msg),delay=ms=>new Promise(r=>setTimeout(r,ms));
function empty(){
 assert.equal(A.project.documents.length,0);assert.equal(A.document,undefined);assert(canvas.hasAttribute('hidden'),'SVG visibility must use an attribute');assert.equal(w.getComputedStyle(canvas).display,'none');
 assert.equal(d.querySelector('#welcome').hidden,false);assert.equal(d.querySelector('#scene').childElementCount,0);assert.equal(d.querySelector('#handles').childElementCount,0);
 assert.equal(d.querySelector('#drawing-hint').hidden,true);assert.equal(d.querySelector('#view-controls').hidden,true);assert.equal(A.drawing,null);assert.equal(A.tool,'select');assert.equal(A.scene,null);
 same(A.selection.ids,[]);for(const action of ['delete-document','duplicate-document','export-menu'])assert(d.querySelector(`[data-action="${action}"]`).disabled);
}
function create(type){d.querySelector(`#welcome [data-template="${type}"]`).click();assert.equal(A.document.type,type);assert(!canvas.hasAttribute('hidden'));assert(d.querySelector('#welcome').hidden)}
(async()=>{try{
 empty();
 for(const type of ['space','curve']){
  create(type);const id=A.document.id;if(A.document.objects.length)A.select(A.document.objects[0].id,false,true);A.setTool('route');const before=JSON.stringify(A.project),h=A.undoCount;
  await A.command('delete-document');empty();assert.equal(A.undoCount,h+1);
  await A.command('undo');assert.equal(A.document.id,id);assert.equal(JSON.stringify(A.project),before);assert(!canvas.hasAttribute('hidden'));
  await A.command('redo');empty();
 }
 create('space');A.createDocument('curve','曲线');await A.command('delete-document');assert.equal(A.document.type,'space');await A.command('delete-document');empty();
 create('space');const saved=JSON.stringify(A.project);A.loadProject({format:'level-spatial-editor',version:7,documents:[]});empty();A.loadProject(JSON.parse(saved));assert.equal(A.document.type,'space');assert(!canvas.hasAttribute('hidden'));
 // A render that has already started must not put the deleted drawing back into the SVG.
 let complete,started=false;const atlas=R.atlas;R.atlas=()=>{started=true;return new Promise(resolve=>complete=resolve)};
 A.document.background='#f5efdc';A.setTool('select');await delay(100);assert(started,'the deferred atlas started');await A.command('delete-document');empty();complete(null);await delay(0);empty();
 // A render still waiting in the timer queue must not start after deletion either.
 let calls=0;R.atlas=async()=>{calls++;return null};create('space');await A.command('delete-document');await delay(100);assert.equal(calls,0);empty();R.atlas=atlas;
 await A.command('autosave');const restored=JSON.parse(w.localStorage.getItem('spatial-studio-v9:'+w.location.pathname));assert.equal(restored.documents.length,0);assert.equal(restored.activeDocument,null);A.loadProject(restored);empty();
 assert.deepEqual(errors,[]);console.log('PASS empty project: SVG hidden attribute, both welcome cards, final/multiple deletion, one undo/redo, JSON/empty autosave, cleared scene/handles/drawing, canceled pending and in-flight atlas.');
}finally{dom.window.close()}})().catch(e=>{console.error(e);process.exitCode=1});
