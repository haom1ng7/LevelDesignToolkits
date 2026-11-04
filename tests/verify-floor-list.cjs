const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/floors',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 w.HTMLElement.prototype.getBoundingClientRect=function(){const rows=[...w.document.querySelectorAll('#floors .floor-row')],i=rows.indexOf(this);if(i>=0)return {left:10,right:250,top:200+i*36,bottom:236+i*36,width:240,height:36};if(this.id==='floors')return {left:10,right:250,top:200,bottom:200+rows.length*36,width:240,height:rows.length*36};return {left:0,right:1000,top:0,bottom:1000,width:1000,height:1000}};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
}});
const w=dom.window,d=w.document,A=w.SpatialEditor,M=w.StudioModel,$=s=>d.querySelector(s),same=(a,b,m)=>assert.equal(JSON.stringify(a),JSON.stringify(b),m),rows=()=>[...d.querySelectorAll('#floors [data-floor]')].map(el=>el.dataset.floor);
function fresh(count=5){A.createDocument('space','楼层操作');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];for(let i=1;i<count;i++)A.document.floors.push({id:M.uid(),name:'测试层 '+(i+1),height:i*180,visible:i!==2});for(const f of A.document.floors){A.document.activeFloor=f.id;const o=M.createObject(A.document,'plane',[500,350,0]);A.document.objects.push(o);const hole=Object.assign(M.createObject(A.document,'hole'),{host:o.id,floor:f.id,points:[[-15,-15],[15,-15],[15,15],[-15,15]]});A.document.objects.push(hole)}A.document.activeFloor=A.document.floors[0].id;A.setTool('select');return rows()}
function key(key,mods={},target=$('#canvas')){const e=new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...mods});target.dispatchEvent(e);return e}
function pointer(target,type,x,y){const e=new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:x,clientY:y});Object.defineProperty(e,'pointerId',{value:1});target.dispatchEvent(e)}
function start(id,target,after=false){const source=$(`[data-floor="${id}"]`).closest('.floor-row').getBoundingClientRect(),b=$(`[data-floor="${target}"]`).closest('.floor-row').getBoundingClientRect(),y=after?b.bottom-2:b.top+2;pointer($(`[data-floor="${id}"]`),'pointerdown',60,source.top+18);pointer(d,'pointermove',60,y);return y}
function drop(y,x=60){pointer(d,'pointerup',x,y);$('#floors').dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,detail:1}))}
const contents=()=>({objects:JSON.stringify(A.document.objects),floors:Object.fromEntries(A.document.floors.map(f=>[f.id,JSON.stringify(f)]).sort(([a],[b])=>a.localeCompare(b))),active:A.document.activeFloor,selection:JSON.stringify(A.selection)});
const floorSelectionIds=()=>[...d.querySelectorAll('#floors [aria-pressed="true"]')].map(el=>el.dataset.floor);
function clickFloor(id,mods={}){$(`[data-floor="${id}"]`).dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,...mods}))}
try{
 let ids=fresh(10),h=A.undoCount;
 for(let i=0;i<10;i++){const digit=String((i+1)%10);assert.equal(key(digit,{code:'Digit'+digit}).defaultPrevented,true);assert.equal(A.document.activeFloor,ids[i]);assert.equal(A.selection.floor,ids[i]);same(A.selection.ids,A.document.objects.filter(o=>o.floor===ids[i]).map(o=>o.id));assert.equal($(`[data-floor="${ids[i]}"]`).getAttribute('aria-keyshortcuts'),digit)}
 assert.equal(A.undoCount,h,'switching does not create edit history');key('2',{code:'Numpad2'});assert.equal(A.document.activeFloor,ids[1]);
 for(const mods of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{isComposing:true},{keyCode:229},{repeat:true}]){key('4',mods);assert.equal(A.document.activeFloor,ids[1])}
 for(const selector of ['input','textarea','select','[contenteditable="true"]','[role="textbox"]']){const el=d.createElement(selector.startsWith('[')?'div':selector);if(selector.includes('contenteditable'))el.setAttribute('contenteditable','true');if(selector.includes('role'))el.setAttribute('role','textbox');d.body.append(el);key('4',{},el);el.remove();assert.equal(A.document.activeFloor,ids[1])}
 $('#help-dialog').showModal();key('4');assert.equal(A.document.activeFloor,ids[1]);$('#help-dialog').close();
 ids=fresh(3);key('0');key('9');assert.equal(A.document.activeFloor,ids[0],'missing floors do nothing');key('End',{code:'Numpad1'});assert.equal(A.document.activeFloor,ids[0]);
 for(const mode of ['plan','elevation','solid']){$(`[data-view="${mode}"]`).click();key('2');assert.equal(A.document.activeFloor,ids[1]);assert.equal(A.view.mode,mode);key('1')}
 // Ctrl/Shift select floors for simultaneous display and stable batch ordering.
 ids=fresh();let [sa,sb,sc,sd,se]=ids;key('2');let initial=contents();h=A.undoCount;
 clickFloor(sd,{ctrlKey:true});same(floorSelectionIds(),[sb,sd]);same(contents(),initial);clickFloor(sb,{ctrlKey:true});same(floorSelectionIds(),[sd]);clickFloor(sa,{shiftKey:true});same(floorSelectionIds(),[sa,sb]);clickFloor(se,{ctrlKey:true,shiftKey:true});same(floorSelectionIds(),[sa,sb,sc,sd,se]);assert.equal(A.undoCount,h);
 clickFloor(sd);clickFloor(sb,{shiftKey:true});same(floorSelectionIds(),[sb,sc,sd]);clickFloor(sc,{shiftKey:true});same(floorSelectionIds(),[sc,sd],'range contracts from the original anchor');clickFloor(se,{metaKey:true});same(floorSelectionIds(),[sc,sd,se]);key('1');same(floorSelectionIds(),[sa],'digit shortcuts collapse list selection');
 clickFloor(sb,{ctrlKey:true});clickFloor(sd,{ctrlKey:true});initial=contents();h=A.undoCount;drop(start(sd,se,true));same(rows(),[sc,se,sa,sb,sd],'disjoint batch retains its original order');same(floorSelectionIds(),[sa,sb,sd]);same(contents(),initial);assert.equal(A.undoCount,h+1);A.command('undo');same(rows(),ids);A.command('redo');same(rows(),[sc,se,sa,sb,sd]);
 key('1');clickFloor(sc,{ctrlKey:true});same(floorSelectionIds(),[],'Ctrl can deselect the last selected row');clickFloor(sb);same(floorSelectionIds(),[sb]);assert(!$('#floors kbd,.floor-name'),'original floor markup has no numeric badges or layout wrappers');
 // Reordering must preserve floor data, geometry, host links, visibility, active floor and selection.
 ids=fresh();const [a,b,c,e,f]=ids;key('3');let before=contents();h=A.undoCount;let y=start(f,b);assert($('.floor-drag-ghost'));assert.equal($('.floor-insertion-line').hidden,false);same(rows(),ids);same(contents(),before,'preview has no model effects');drop(y);same(rows(),[a,f,b,c,e]);same(contents(),before);assert.equal(A.undoCount,h+1);assert(!$('.floor-drag-ghost,.floor-insertion-line,.floor-dragging'));A.command('undo');same(rows(),ids);A.command('redo');same(rows(),[a,f,b,c,e]);key('2');assert.equal(A.document.activeFloor,f,'shortcuts follow the new order');
 before=contents();h=A.undoCount;drop(start(a,e,true));same(rows(),[f,b,c,e,a]);same(contents(),before);assert.equal(A.undoCount,h+1);h=A.undoCount;drop(start(c,b,true));assert.equal(A.undoCount,h,'same slot is a no-op');
 const stable=rows();h=A.undoCount;
 for(const cancel of [()=>key('Escape'),()=>key('z',{ctrlKey:true}),()=>pointer(d,'pointercancel',60,y),()=>w.dispatchEvent(new w.Event('blur')),()=>w.dispatchEvent(new w.Event('resize')),()=>$('#floors').dispatchEvent(new w.Event('lostpointercapture'))]){y=start(a,f);cancel();drop(y);same(rows(),stable);assert.equal(A.undoCount,h);assert(!$('.floor-drag-ghost'))}
 y=start(a,f);drop(y,500);same(rows(),stable,'outside release cancels');assert.equal(A.undoCount,h);
 const validate=M.validate;M.validate=()=>{throw Error('test validation failure')};drop(start(a,f));M.validate=validate;same(rows(),stable,'validation failure restores order');assert.equal(A.undoCount,h);
 const json=JSON.stringify(A.project);A.loadProject(JSON.parse(json));same(JSON.stringify(A.project),json,'JSON round trip keeps floor order and associations');
 // Visibility and rename controls stay separate from drag; numeric input remains editable.
 pointer($(`[data-floor-visible="${a}"]`),'pointerdown',220,220);pointer(d,'pointermove',220,270);assert(!$('.floor-drag-ghost'));const visible=A.document.floors.find(f=>f.id===a).visible;$(`[data-floor-visible="${a}"]`).click();assert.equal(A.document.floors.find(f=>f.id===a).visible,!visible);
 $(`[data-floor="${b}"]`).click();$(`[data-floor="${b}"]`).click();assert($('.row-rename'));key('9',{},$('.row-rename'));assert.equal(A.document.activeFloor,b);key('Escape',{},$('.row-rename'));
 y=start(a,f);const old=A.document,oldOrder=rows();A.createDocument('space','另一图稿');drop(y);same(old.floors.map(f=>f.id),oldOrder,'switching documents cancels old drag');assert(!$('.floor-drag-ghost'));A.createDocument('curve','曲线');before=JSON.stringify(A.project);key('1');key('0');same(JSON.stringify(A.project),before,'curve documents ignore floor keys');
 // The selected floor scope must reach geometry, annotations, holes and picking.
 ids=fresh(3);$('[data-view="plan"]').click();$('#ghost').checked=false;
 const types=['wall','stairs','ladder','spiral','text','marker','route'];
 for(const [i,f] of A.document.floors.entries()){
  A.document.activeFloor=f.id;
  for(const [j,type] of types.entries()){const o=M.createObject(A.document,type,[200+i*600,200+j*250,0]);A.document.objects.push(o)}
  const p=A.document.objects.find(o=>o.floor===f.id&&o.type==='plane');p.shape='ellipse';p.position[0]=200+i*600;
 }
 A.document.activeFloor=ids[0];key('1');const original=JSON.stringify(A.project);h=A.undoCount;
 const planeAt=i=>A.document.objects.find(o=>o.floor===ids[i]&&o.type==='plane');
 const shownFloors=()=>[...new Set(A.scene.faces.filter(f=>!f.ghost).map(f=>f.owner.floor))].sort();
 const expected=(...indexes)=>indexes.map(i=>ids[i]).sort();
 same(shownFloors(),expected(0));clickFloor(ids[1],{ctrlKey:true});same(shownFloors(),expected(0,1),'Ctrl-selected floor has real geometry rather than ghost geometry');
 same(floorSelectionIds(),ids.slice(0,2),'shell accessibility state matches multiple active rows');
 const snaps=w.StudioSnapping.prepare(A.document,[planeAt(0).id],A.scene.basis,A.view,false);
 assert(snaps.targets.some(t=>t.owner.floor===ids[1]),'selected non-current floors participate in snapping');
 assert(!snaps.targets.some(t=>t.owner.floor===ids[2]),'hidden floors do not participate in snapping');
 for(const o of A.document.objects.filter(o=>o.floor===ids[1])){
  assert(A.scene.outlines.has(o.id),'selected floor outline: '+o.type);
  if(o.type==='hole')assert(A.scene.holeHits.some(h=>h.id===o.id),'selected floor hole is pickable');
  if(['text','marker','route'].includes(o.type))assert(A.scene.hits.some(h=>h.id===o.id),'selected annotation is pickable: '+o.type);
  assert($(`[data-layer="${o.id}"]`),'selected floor is listed: '+o.type);
 }
 assert(A.scene.faces.filter(f=>f.owner.floor===ids[1]).every(f=>f.opacity===f.owner.opacity),'selected floor keeps full opacity');
 clickFloor(ids[2],{shiftKey:true});same(shownFloors(),expected(1),'hidden floors remain hidden during range selection');
 $('#ghost').checked=true;A.setTool('select');same(shownFloors(),expected(1));assert(A.scene.faces.some(f=>f.owner.floor===ids[0]&&f.ghost),'unselected visible floor stays a ghost');
 $('#ghost').checked=false;A.setTool('select');A.select(planeAt(1).id);assert.equal(A.selection.id,planeAt(1).id,'canvas selection accepts a selected non-current floor');same(floorSelectionIds(),ids.slice(1));same(shownFloors(),expected(1));
 clickFloor(ids[0],{ctrlKey:true});clickFloor(ids[1],{ctrlKey:true});clickFloor(ids[2],{ctrlKey:true});same(shownFloors(),expected(0),'deselected floors disappear immediately');
 clickFloor(ids[0],{ctrlKey:true});same(shownFloors(),[],'empty floor selection has no regular geometry');
 assert.equal(JSON.stringify(A.project),original,'floor display selection never changes project JSON');assert.equal(A.undoCount,h);
 key('2');same(shownFloors(),expected(1),'digit shortcut restores one floor');
 clickFloor(ids[0],{metaKey:true});for(const mode of ['elevation','solid','plan']){$(`[data-view="${mode}"]`).click();same(floorSelectionIds(),ids.slice(0,2));if(mode==='plan')same(shownFloors(),expected(0,1))}
 key('1');$('[data-view="elevation"]').click();A.select(planeAt(1).id);$('[data-view="plan"]').click();same(shownFloors(),expected(1),'selecting another floor in elevation keeps that floor visible on return');
 const destination=$('#prop-floor');destination.value=ids[0];destination.dispatchEvent(new w.Event('change',{bubbles:true}));same(shownFloors(),expected(0),'moving a component to another floor keeps the destination visible');
 A.createDocument('space','新图稿');assert.equal(A.view.floorIds.length,1,'new documents reset floor scope');
 assert.deepEqual(errors,[]);console.log('PASS floor list: shortcuts, batch reorder/history/cancel/JSON, Ctrl/Shift simultaneous floor geometry and annotations, full opacity and picking, hidden/ghost/empty scopes, component list/accessibility, selection and view/document switching.');
}finally{dom.window.close()}
