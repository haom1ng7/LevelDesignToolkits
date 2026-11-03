const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/component-names',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
 w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};
}});
const w=dom.window,M=w.StudioModel,A=w.SpatialEditor,d=w.document,$=s=>d.querySelector(s),same=(a,b,msg)=>assert.equal(JSON.stringify(a),JSON.stringify(b),msg);
function fresh(){const doc=M.createDocument('space');doc.objects=[];doc.counters={};return doc}
function add(doc,type='plane',name){const o=M.createObject(doc,type,[0,0,0]);if(name!==undefined)o.name=name;doc.objects.push(o);return o}
const project=doc=>({format:'level-spatial-editor',version:7,documents:[doc],activeDocument:doc.id});
function load(doc){A.loadProject(project(doc));A.setTool('select')}
function change(value){const input=$('#prop-name');input.value=value;input.dispatchEvent(new w.Event('change',{bubbles:true}))}
const assertNames=doc=>{const names=doc.objects.map(o=>o.name);assert.equal(new Set(names).size,names.length);assert(names.every(n=>n.trim()&&!/[.．。·•・⋅‧…]/u.test(n)),names.join(', '))};
try{
 let doc=fresh();for(const type of Object.keys(M.names)){
  const a=add(doc,type),b=add(doc,type);assert.equal(a.name,M.names[type]+'_001');assert.equal(b.name,M.names[type]+'_002');
 }
 doc=fresh();add(doc,'plane','平面12');add(doc,'text','平面_020');doc.counters.plane=15;assert.equal(add(doc).name,'平面_021','recognize legacy numbering and document-wide collisions');doc.counters.plane='invalid';assert.equal(add(doc).name,'平面_022');
 const removed=add(doc);doc.objects=doc.objects.filter(o=>o!==removed);assert.equal(add(doc).name,'平面_024','deleted creation numbers remain consumed');
 doc=fresh();const host=add(doc,'plane','入口平台'),hole=add(doc,'hole','门.洞');hole.host=host.id;hole.points=[[-10,-10],[10,-10],[10,10],[-10,10]];host.group=hole.group=M.uid();
 let ids=M.duplicate(doc,[host.id]),copies=ids.map(id=>doc.objects.find(o=>o.id===id));same(copies.map(o=>o.name),['入口平台_副本_001','门_洞_副本_001']);assert.equal(copies[1].host,copies[0].id);assert.equal(copies[0].group,copies[1].group);assert.notEqual(copies[0].group,host.group);
 ids=M.duplicate(doc,[copies[0].id]);assert.equal(doc.objects.find(o=>o.id===ids[0]).name,'入口平台_副本_002','copies of copies continue their source sequence');
 // Reserve names across generated batches and treat source names as literals.
 const reserved=new Set(),special={name:'A[1]+(门).入口',type:'plane'};assert.equal(M.derivedName(doc,special,'切割',reserved),'A[1]+(门)_入口_切割_001');assert.equal(M.derivedName(doc,special,'切割',reserved),'A[1]+(门)_入口_切割_002');
 const trailing=add(doc,'plane','尾部_');assert.equal(M.derivedName(doc,trailing),'尾部_副本_001');assert.equal(M.uniqueName(doc,'尾部_'),'尾部_002','numbering merges a trailing separator');
 doc=fresh();let a=add(doc,'plane','平台'),b=add(doc,'plane','平台_切割_001');a.points=[[0,0],[400,0],[400,400],[0,400]];b.position=[1000,0,0];
 ids=M.cutComponents(doc,a.id,[[0,200],[400,200]]);same(ids.map(id=>doc.objects.find(o=>o.id===id).name),['平台_切割_002','平台_切割_003']);a=doc.objects.find(o=>o.id===ids[0]);ids=M.cutComponents(doc,a.id,[[200,0],[200,400]]);assert.equal(ids.length,2);assertNames(doc);assert(doc.objects.every(o=>!/_切割_\d+_切割/.test(o.name)),'repeated cuts do not nest the same suffix');
 for(const mode of ['intersect','difference']){
  doc=fresh();a=add(doc,'plane','平台');b=add(doc,'plane','平台');a.points=b.points=[[0,0],[100,0],[100,100],[0,100]];b.position=[50,0,0];M.setComponents(doc,[a.id,b.id],mode);assertNames(doc);assert(doc.objects.every(o=>new RegExp('_'+(mode==='intersect'?'交集':'差集')+'_\\d{3}$').test(o.name)));M.duplicate(doc,[doc.objects[0].id]);assertNames(doc);assert(doc.objects.every(o=>!o.name.includes('undefined')));
 }
 // Import keeps valid user names, IDs, host links and all non-name fields.
 doc=fresh();a=add(doc,'plane','平台.入口');b=add(doc,'plane','平台_入口');const c=add(doc,'plane','平台 · 入口'),blank=add(doc,'text','  ');hole.name='门洞';hole.host=a.id;hole.floor=a.floor;doc.objects.push(hole);const before=M.clone(doc),sourceProject=project(doc),inputJSON=JSON.stringify(sourceProject),v=M.validate(sourceProject).documents[0];
 assert.equal(JSON.stringify(sourceProject),inputJSON,'validation leaves the caller input untouched');assert.equal(v.objects.find(o=>o.id===b.id).name,'平台_入口');assert.equal(v.objects.find(o=>o.id===a.id).name,'平台_入口_002');assert.equal(v.objects.find(o=>o.id===c.id).name,'平台_入口_003');assert.equal(v.objects.find(o=>o.id===blank.id).name,'文字_002');assertNames(v);
 same(v.objects.map(({name,...o})=>o),before.objects.map(({name,...o})=>o),'normalization preserves identity, geometry, text and host relationships');same(M.validate(project(v)),project(v),'normalization is idempotent');
 // Duplicate and paste share names and one-step history in the actual editor.
 doc=fresh();a=add(doc,'plane','大厅');load(doc);A.select(a.id,false,true);let h=A.undoCount;A.command('duplicate');assert.equal(A.undoCount,h+1);assert.equal(A.document.objects.at(-1).name,'大厅_副本_001');A.command('undo');assert.equal(A.document.objects.length,1);A.command('redo');assert.equal(A.document.objects.at(-1).name,'大厅_副本_001');
 A.select(a.id,false,true);A.command('copy');A.command('paste');assert.equal(A.document.objects.at(-1).name,'大厅_副本_002');A.command('paste');assert.equal(A.document.objects.at(-1).name,'大厅_副本_003');assertNames(A.document);
 h=A.undoCount;const floorId=A.document.activeFloor;A.command('copy-floor');assert.equal(A.undoCount,h+1);assert.notEqual(A.document.activeFloor,floorId);assertNames(A.document);A.command('undo');assert.equal(A.document.activeFloor,floorId);
 A.select(a.id,false,true);h=A.undoCount;change(' 大厅.入口 · A ');assert.equal(A.document.objects.find(o=>o.id===a.id).name,'大厅_入口_A');assert.equal($('#prop-name').value,'大厅_入口_A');A.command('undo');assert.equal(A.document.objects.find(o=>o.id===a.id).name,'大厅');A.command('redo');A.select(a.id,false,true);h=A.undoCount;change('  ');assert.equal(A.undoCount,h);assert.equal(A.document.objects.find(o=>o.id===a.id).name,'大厅_入口_A');
 const other=A.document.objects.find(o=>o.id!==a.id);A.select(a.id,false,true);A.select(other.id,true,true);h=A.undoCount;change('统一.名称');assert.equal(A.undoCount,h+1);same(A.document.objects.filter(o=>[a.id,other.id].includes(o.id)).map(o=>o.name),['统一_名称','统一_名称_002']);A.command('undo');A.command('redo');assertNames(A.document);
 // Inline rename protects IME composition and cancels without history.
 A.select(a.id,false,true);$(`[data-layer="${a.id}"]`).click();$(`[data-layer="${a.id}"]`).click();let input=$('.row-rename');assert(input);input.value=other.name;h=A.undoCount;input.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',isComposing:true,keyCode:229,bubbles:true}));assert($('.row-rename'));input.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert.equal(A.undoCount,h+1);assertNames(A.document);
 const json=JSON.stringify(A.project);A.loadProject(JSON.parse(json));assert.equal(JSON.stringify(A.project),json);for(const mode of ['plan','elevation','solid']){$(`[data-view="${mode}"]`).click();assertNames(A.document)}
 assert.deepEqual(errors,[]);console.log('PASS component names: underscore defaults and legacy counters, source-preserving copies/paste/floor copies, batch collision handling, repeated cuts/booleans, solid copies, literal custom names, import normalization without geometry changes, idempotent JSON, single/batch/IME rename, blank rejection and undo/redo.');
}finally{dom.window.close()}
