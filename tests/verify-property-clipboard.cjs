const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/property-clipboard',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{}}});
const w=dom.window,d=w.document,A=w.SpatialEditor,M=w.StudioModel,$=s=>d.querySelector(s),object=id=>A.document.objects.find(o=>o.id===id);
const near=(a,b,msg='value')=>assert(Math.abs(a-b)<1e-6,`${msg}: ${a} != ${b}`),vector=(a,b,msg)=>a.forEach((v,i)=>near(v,b[i],msg));
const state=()=>JSON.stringify(A.project),objects=()=>JSON.stringify(A.document.objects),group=key=>$('#prop-'+key).closest('.transform-row').querySelector('.transform-label');
function fresh(types=['plane','plane']){A.createDocument('space','属性快捷复制');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];$('#snap').checked=true;return types.map((type,i)=>{const o=M.createObject(A.document,type,[400+i*400,350,20]);A.document.objects.push(o);return o.id})}
function choose(ids){ids.forEach((id,i)=>A.select(id,i>0,true))}
function pointer(kind,target,options={}){const e=new w.MouseEvent(kind,{bubbles:true,cancelable:true,button:0,clientX:100,clientY:100,...options});Object.defineProperties(e,{pointerId:{value:1},pointerType:{value:'mouse'}});target.dispatchEvent(e);return e}
function shortcut(target,button=0){if(typeof target==='string')target=$(target);assert(target,'shortcut target exists');const count=A.undoCount;pointer('pointerdown',target,{button,shiftKey:true});pointer('pointerup',target,{button,shiftKey:true});pointer(button===2?'auxclick':'click',target,{button,shiftKey:true});if(button===2){const menu=pointer('contextmenu',target,{button,shiftKey:true});assert(menu.defaultPrevented,'Shift context menu is consumed');assert.equal(A.undoCount,count,'copy never changes history')}}
const copy=target=>shortcut(target,2),paste=target=>shortcut(target),message=()=>$('#status').textContent;
function change(selector,value,event='change'){const input=$(selector);input.value=String(value);input.dispatchEvent(new w.Event(event,{bubbles:true}))}
function orientation(x,y,z){return M.product(M.product(M.axisRotation([0,0,1],z*Math.PI/180),M.axisRotation([0,1,0],y*Math.PI/180)),M.axisRotation([1,0,0],x*Math.PI/180))}
function dims(o){return ['dimensionX','dimensionY','dimensionZ'].map(key=>+$('#prop-'+key).value)}
try{
 let [a,b]=fresh();choose([b]);let before=state(),count=A.undoCount;paste('#prop-px');assert.match(message(),/请先/);assert.equal(state(),before);assert.equal(A.undoCount,count);
 // Full model precision is copied; scalar paste touches one axis and is one history entry.
 object(a).position=[123.123456789,234.25,35.5];choose([a]);copy('#prop-px');assert.equal($('#prop-px').value,'123.1235');choose([b]);before=objects();count=A.undoCount;paste('#prop-px');near(object(b).position[0],123.123456789);vector(object(b).position.slice(1),[350,20]);assert.equal(A.undoCount,count+1);
 const after=objects();A.command('undo');assert.equal(objects(),before);A.command('redo');assert.equal(objects(),after);choose([b]);count=A.undoCount;paste('#prop-px');assert.equal(A.undoCount,count,'unchanged paste has no history');
 // Repeated pastes and text edits must not merge their undo records.
 change('#prop-py',700,'input');count=A.undoCount;paste('#prop-py');assert.equal(A.undoCount,count+1);near(object(b).position[1],123.123456789);A.command('undo');near(object(b).position[1],700);choose([b]);
 // Transform titles paste complete triples, including rotation through Euler singularities.
 for(const [key,setup] of [['px',()=>object(a).position=[112.25,223.5,34.75]],['rx',()=>{object(a).orientation=orientation(25,90,40);object(b).orientation=orientation(0,0,0)}],['dimensionX',()=>{object(a).points=object(a).points.map(p=>[p[0]*1.25,p[1]*1.5]);object(a).thickness=13.75}]]){
  setup();choose([a]);const expected=key==='px'?[...object(a).position]:key==='rx'?[...object(a).orientation]:dims(object(a));copy(group(key));choose([b]);before=objects();count=A.undoCount;paste(group(key));assert.equal(A.undoCount,count+1);
  vector(key==='px'?object(b).position:key==='rx'?object(b).orientation:dims(object(b)),expected,key+' group');const result=objects();A.command('undo');assert.equal(objects(),before);A.command('redo');assert.equal(objects(),result);choose([b]);
 }
 copy(group('px'));before=state();paste(group('rx'));assert.equal(state(),before);assert.match(message(),/类型不兼容/);paste('#prop-px');assert.equal(state(),before,'triple cannot paste into scalar');
 // Colors, strings, selects (including numeric model values), and flight parameters.
 for(const [type,source,target,value,key] of [
  ['plane','#prop-fill','#prop-stroke','#123456','stroke'],['text','#prop-text','#prop-text','多行\n文本 <>&','text'],
  ['route','#prop-style','#prop-style','dotted','style'],['spiral','#prop-direction','#prop-direction','-1','direction'],
  ['stairs','#flight-end','#flight-start',43.75,'start']
 ]){
  [a,b]=fresh([type,type]);choose([a]);change(source,value);copy($(source).closest('.property').querySelector('label'));choose([b]);before=objects();count=A.undoCount;paste($(target).closest('.property'));assert.equal(A.undoCount,count+1);
  const result=source.startsWith('#flight')?object(b).flights[0][key]:object(b)[key];assert.equal(String(result),String(value));A.command('undo');assert.equal(objects(),before);
 }
 // Invalid selects, incompatible kinds, out-of-range numbers and locked targets are rejected.
 [a,b]=fresh(['text','route']);choose([a]);change('#prop-align','middle');copy('#prop-align');choose([b]);before=state();count=A.undoCount;paste('#prop-style');assert.equal(state(),before);assert.equal(A.undoCount,count);assert.match(message(),/不支持/);
 copy('#prop-color');before=state();paste('#prop-width');assert.equal(state(),before);assert.match(message(),/类型不兼容/);
 [a,b]=fresh();choose([a]);copy('#prop-px');choose([b]);before=state();paste('#prop-opacity');assert.equal(state(),before);assert.match(message(),/有效范围/);
 object(b).locked=true;choose([b]);before=state();paste('#prop-px');assert.equal(state(),before);assert.match(message(),/锁定/);
 // Copying mixed values keeps the prior clipboard; a common value can be copied and pasted in bulk.
 [a,b]=fresh();object(a).position[0]=125;choose([a]);copy('#prop-px');choose([a,b]);before=state();copy('#prop-px');assert.match(message(),/多个值/);assert.equal(state(),before);paste('#prop-py');assert.equal(object(a).position[1],125);assert.equal(object(b).position[1],125);
 choose([a,b]);copy('#prop-py');count=A.undoCount;before=objects();paste('#prop-px');assert.equal(object(a).position[0],125);assert.equal(object(b).position[0],125);assert.equal(A.undoCount,count+1);A.command('undo');assert.equal(objects(),before);
 // Geometry validation rolls back the entire batch, and copying a mixed vector is forbidden.
 [a,b]=fresh(['spiral','spiral']);object(a).outer=120;object(b).outer=70;object(a).inner=80;choose([a]);copy('#prop-inner');choose([a,b]);before=state();count=A.undoCount;paste('#prop-inner');assert.equal(state(),before);assert.equal(A.undoCount,count);assert.match(message(),/旋转楼梯数据不正确/);
 [a,b]=fresh();choose([a,b]);copy(group('px'));assert.match(message(),/多个值/);
 // Host sizes carry holes once; all views share the same model and exact non-grid sizes.
 [a,b]=fresh();const hole=Object.assign(M.createObject(A.document,'hole'),{host:b,floor:object(b).floor,points:[[-20,-20],[20,-20],[20,20],[-20,20]]});A.document.objects.push(hole);object(a).points=object(a).points.map(p=>[p[0]*137.25/240,p[1]]);choose([a]);copy('#prop-dimensionX');
 for(const mode of ['plan','elevation','solid']){
  $(`[data-view="${mode}"]`).click();A.select(b);before=objects();count=A.undoCount;paste('#prop-dimensionX');near(+$('#prop-dimensionX').value,137.25);near(object(hole.id).points[1][0]-object(hole.id).points[0][0],40*137.25/240);assert(M.validHole(A.document,object(hole.id)));assert.equal(A.undoCount,count+1);A.command('undo');assert.equal(objects(),before);
 }
 // Shift held from pointer-down still starts fine scrubbing after moving, rather than pasting.
 choose([b]);count=A.undoCount;const initial=object(b).position[0];pointer('pointerdown',$('#prop-px'),{shiftKey:true});pointer('pointermove',$('#properties'),{shiftKey:true,clientX:120});pointer('pointerup',$('#properties'),{shiftKey:true,clientX:120});near(object(b).position[0],initial+2);assert.equal(A.undoCount,count+1);pointer('click',$('#properties'),{shiftKey:true});
 // Cancellation, release outside, and modifier combinations never paste.
 for(const cancel of ['pointercancel','escape','blur','outside']){
  choose([b]);before=state();const input=$('#prop-px');pointer('pointerdown',input,{shiftKey:true});
  if(cancel==='escape')input.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));else if(cancel==='blur')w.dispatchEvent(new w.Event('blur'));else if(cancel==='pointercancel')pointer('pointercancel',input);
  pointer('pointerup',cancel==='outside'?$('#stage'):input,{shiftKey:true});assert.equal(state(),before,cancel+' does not paste');
 }
 before=state();for(const options of [{},{ctrlKey:true},{altKey:true},{metaKey:true}]){pointer('pointerdown',$('#prop-px'),{shiftKey:!!Object.keys(options).length,...options});pointer('pointerup',$('#prop-px'),options)}assert.equal(state(),before);
 assert(!pointer('contextmenu',$('#prop-px'),{button:2}).defaultPrevented,'ordinary right click is native');
 // Property copy survives document changes and leaves component Ctrl+C/Ctrl+V intact.
 $('[data-view="plan"]').click();choose([a]);A.command('copy');copy('#prop-dimensionX');choose([b]);paste('#prop-dimensionY');const length=A.document.objects.length;A.command('paste');assert.equal(A.document.objects.length,length+1,'component clipboard is independent');
 A.createDocument('space','跨图稿');const next=M.createObject(A.document,'plane');A.document.objects.push(next);choose([next.id]);paste('#prop-dimensionX');near(+$('#prop-dimensionX').value,137.25);const json=state();A.loadProject(JSON.parse(json));assert.equal(JSON.stringify(A.project.documents),JSON.stringify(JSON.parse(json).documents));assert(!json.includes('propertyClipboard'));
 assert.deepEqual(errors,[]);console.log('PASS property clipboard: exact scalar/triple values, all property control kinds, flight scope, three views/host holes, independent atomic history/rollback, mixed/batch values, compatibility/range/locks, Shift fine scrubbing, cancellation and independent cross-document/component clipboards.');
}finally{dom.window.close()}
