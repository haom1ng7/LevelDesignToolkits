const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/properties',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{}}});
const w=dom.window,d=w.document,A=w.SpatialEditor,M=w.StudioModel,$=s=>d.querySelector(s),types=['plane','wall','stairs','ladder','spiral'];
const near=(a,b,msg='value')=>assert(Math.abs(a-b)<1e-6,`${msg}: ${a} != ${b}`),vector=(a,b,msg)=>a.forEach((v,i)=>near(v,b[i],msg)),object=id=>A.document.objects.find(o=>o.id===id);
function fresh(kinds=['plane','plane']){A.createDocument('space','属性回归');A.project.documents.splice(0,A.project.documents.length-1);A.document.objects=[];$('#snap').checked=false;return kinds.map((type,i)=>{const o=M.createObject(A.document,type,[400+i*400,350,20]);A.document.objects.push(o);return o.id})}
function choose(ids){ids.forEach((id,i)=>A.select(id,i>0,true))}
function change(selector,value,event='change'){const input=$(selector);assert(input,selector+' exists');input.value=String(value);input.dispatchEvent(new w.Event(event,{bubbles:true}))}
function mixed(selector){assert.equal($(selector).value,'',selector+' blank');assert.equal($(selector).dataset.mixed,'true',selector+' mixed');assert.equal($(selector).placeholder,'多个值')}
function dims(o){const ps=M.geometry(A.document,o).flatMap(f=>f.points.map(p=>M.local(A.document,o,p))),min=[0,1,2].map(i=>Math.min(...ps.map(p=>p[i]))),max=[0,1,2].map(i=>Math.max(...ps.map(p=>p[i])));if(o.type==='stairs'){min[2]=Math.min(...o.flights.flatMap(f=>[f.start,f.end]))-o.thickness;max[2]=Math.max(...o.flights.flatMap(f=>[f.start,f.end]))}if(o.type==='spiral')return [o.outer*2,o.outer*2,o.end-o.start+o.thickness];return M.sub(max,min)}
function orientation(x,y,z){return M.product(M.product(M.axisRotation([0,0,1],z*Math.PI/180),M.axisRotation([0,1,0],y*Math.PI/180)),M.axisRotation([1,0,0],x*Math.PI/180))}
function propertyPointer(kind,x,target=$('#properties'),options={}){const e=new w.MouseEvent(kind,{bubbles:true,cancelable:true,button:0,clientX:x,clientY:100,...options});Object.defineProperties(e,{pointerId:{value:1},pointerType:{value:'mouse'}});target.dispatchEvent(e)}
try{
 let ids=fresh(),[a,b]=ids;object(b).position[1]=425;object(b).orientation=orientation(0,0,30);object(b).thickness=28;object(b).fill='#123456';choose(ids);
 mixed('#prop-name');mixed('#prop-px');mixed('#prop-py');mixed('#prop-rz');mixed('#prop-dimensionZ');assert.equal($('#prop-pz').value,'20');assert.equal($('#prop-rx').value,'0');assert.equal($('#prop-dimensionX').value,'240');assert.equal($('#prop-fill').dataset.mixed,'true');assert.equal($('#prop-fill').closest('.mixed-color').textContent,'多个值');
 const summary=$('#properties').innerHTML;choose([...ids].reverse());assert.equal($('#properties').innerHTML,summary,'primary selection cannot change aggregated values');
 let before=JSON.stringify(A.document.objects),count=A.undoCount;change('#prop-px','');assert.equal(JSON.stringify(A.document.objects),before,'blank mixed input does not set zero');assert.equal(A.undoCount,count);
 const ys=ids.map(id=>object(id).position[1]);change('#prop-px',600);ids.forEach((id,i)=>{near(object(id).position[0],600);near(object(id).position[1],ys[i]);near(object(id).position[2],20)});assert.equal($('#prop-px').value,'600');assert.equal(A.undoCount,count+1);A.command('undo');assert.equal(JSON.stringify(A.document.objects),before);A.command('redo');choose(ids);
 count=A.undoCount;change('#prop-rx',25,'input');change('#prop-rx',25);assert.equal(A.undoCount,count+1,'rotation input and native commit are one undo');vector(object(a).orientation,orientation(25,0,0),'first own Euler axes');vector(object(b).orientation,orientation(25,0,30),'second keeps Y/Z');mixed('#prop-rz');assert.equal($('#prop-rx').value,'25');
 change('#prop-fill','#789abc');assert(ids.every(id=>object(id).fill==='#789abc'));assert(!$('#prop-fill').closest('.mixed-color'));
 count=A.undoCount;change('#prop-name','批量','input');change('#prop-name','批量名称','input');assert.equal(A.undoCount,count+1,'typing is one batch undo');assert(ids.every(id=>object(id).name==='批量名称'));A.command('undo');assert(ids.every(id=>object(id).name!=='批量名称'));A.command('redo');choose(ids);
 before=JSON.stringify(A.document.objects);change('#prop-name','');assert(ids.every(id=>object(id).name===''),'empty common text is intentional');A.command('undo');choose(ids);
 // Each entity uses its local physical dimensions, with rotation and origin retained.
 for(const type of types)for(let axis=0;axis<3;axis++){
  ids=fresh([type]);a=ids[0];$('#snap').checked=true;const o=object(a);o.orientation=orientation(20,15,35);choose(ids);const original=dims(o),origin=[...o.position],matrix=[...o.orientation],value=original[axis]*1.25+.375;
  count=A.undoCount;change('#prop-dimension'+'XYZ'[axis],value,'input');change('#prop-dimension'+'XYZ'[axis],value);assert.equal(A.undoCount,Math.min(80,count+1),'dimension input and native commit are one undo');const next=object(a);near(dims(next)[axis],value,type+' local dimension');vector(next.position,origin,'numeric size keeps origin');vector(next.orientation,matrix,'numeric size keeps rotation');
  for(let j=0;j<3;j++)if(j!==axis&&!(type==='spiral'&&axis<2&&j<2))near(dims(next)[j],original[j],type+' untouched size');M.validate(A.project);
 }
 ids=fresh(['plane','wall']);choose(ids);assert(!$('#flight-end'));assert(!$('#prop-span'));change('#prop-dimensionZ',220);assert(ids.every(id=>Math.abs(dims(object(id))[2]-220)<1e-6),'different entity types share physical height');
 // Dependent holes follow their host once and do not suppress the host transform fields.
 ids=fresh(['plane']);a=ids[0];let hole=Object.assign(M.createObject(A.document,'hole'),{host:a,floor:object(a).floor,points:[[-20,-20],[20,-20],[20,20],[-20,20]]});A.document.objects.push(hole);A.select(a);assert.equal(A.selection.ids.length,2);assert($('#prop-rx'));before=JSON.stringify(hole.points);change('#prop-dimensionX',480);hole=object(hole.id);near(hole.points[1][0]-hole.points[0][0],80);change('#prop-pz',85);near(object(a).position[2],85);assert(M.validHole(A.document,hole));
 // Invalid batch changes roll back every target and leave history intact.
 ids=fresh(['spiral','spiral']);object(ids[0]).outer=120;object(ids[1]).outer=70;choose(ids);before=JSON.stringify(A.document.objects);count=A.undoCount;change('#prop-inner',80);assert.equal(JSON.stringify(A.document.objects),before);assert.equal(A.undoCount,count);
 ids=fresh(['stairs','stairs']);object(ids[1]).countMode='manual';choose(ids);assert.equal($('#prop-countMode').value,'');assert.equal($('#prop-countMode').selectedOptions[0].textContent,'多个值');change('#flight-steps',17,'input');assert(ids.every(id=>object(id).flights[0].steps===17&&object(id).countMode==='manual'));assert.equal($('#prop-countMode').value,'manual','dependent select refreshes while typing');
 ids=fresh(['text','text']);object(ids[1]).text='另一个文本';choose(ids);mixed('#prop-text');change('#prop-text','共同文字','input');assert(ids.every(id=>object(id).text==='共同文字'));
 ids=fresh(['plane','text']);choose(ids);assert($('#prop-px'));assert(!$('#prop-rx'));assert(!$('#prop-dimensionX'));assert(!$('#prop-thickness'));assert(!$('#prop-fill'),'only common fields appear');
 ids=fresh();object(ids[1]).locked=true;choose(ids);before=JSON.stringify(A.document.objects);assert([...d.querySelectorAll('#properties input,#properties select')].every(i=>i.disabled));change('#prop-px',10);assert.equal(JSON.stringify(A.document.objects),before,'any locked component prevents the batch');
 // Numeric properties are exact even with snapping enabled, including sub-grid sizes.
 for(const step of [75,100])for(const type of types)for(let axis=0;axis<3;axis++){
  ids=fresh([type,type]);A.document.gridSize=step;$('#snap').checked=true;object(ids[1]).orientation=orientation(20,15,35);choose(ids);
  before=JSON.stringify(A.document.objects);count=A.undoCount;const key='#prop-dimension'+'XYZ'[axis],value=axis===2?37.25:137.25;
  change(key,value,'input');change(key,value);ids.forEach(id=>near(dims(object(id))[axis],value,type+' batch exact size on '+step+' grid'));
  assert.equal(A.undoCount,Math.min(80,count+1));const after=JSON.stringify(A.document.objects);A.command('undo');assert.equal(JSON.stringify(A.document.objects),before);A.command('redo');assert.equal(JSON.stringify(A.document.objects),after);
 }
 // Parameter edits must not quantize the edited value or unrelated dimensions.
 for(const [type,scope,key,value] of [['wall','prop','thickness',13.75],['stairs','prop','thickness',13.75],['ladder','prop','span',87.25],['ladder','prop','thickness',7.5],['spiral','prop','inner',31.25],['spiral','prop','outer',142.75],['spiral','prop','start',23.75],['spiral','prop','end',243.25],['stairs','flight','start',23.75],['stairs','flight','end',243.25]]){
  ids=fresh([type,type]);choose(ids);const original=JSON.stringify(A.project);change('#'+scope+'-'+key,value);const expected=JSON.stringify(A.document.objects);
  A.loadProject(JSON.parse(original));choose(ids);$('#snap').checked=true;change('#'+scope+'-'+key,value);assert.equal(JSON.stringify(A.document.objects),expected,type+' '+key+' independent of grid');
 }
 // Circular coupling and host holes still follow exact dimensions below one grid cell.
 ids=fresh(['spiral']);a=ids[0];choose(ids);$('#snap').checked=true;change('#prop-dimensionX',37.25);vector(dims(object(a)).slice(0,2),[37.25,37.25],'exact circular coupling');
 ids=fresh(['plane']);a=ids[0];hole=Object.assign(M.createObject(A.document,'hole'),{host:a,floor:object(a).floor,points:[[-20,-20],[20,-20],[20,20],[-20,20]]});A.document.objects.push(hole);choose(ids);$('#snap').checked=true;change('#prop-dimensionX',137.25);near(object(hole.id).points[1][0]-object(hole.id).points[0][0],40*137.25/240);assert(M.validHole(A.document,object(hole.id)));
 // Euler singularities remain finite and round trip without changing the matrix.
 for(const y of [-90,-89.999,0,89.999,90]){ids=fresh();a=ids[0];object(a).orientation=orientation(25,y,40);choose([a]);const original=[...object(a).orientation];change('#prop-ry',+$('#prop-ry').value);vector(object(a).orientation,original,'singular Euler round trip')}
 const json=JSON.stringify(A.project);A.loadProject(JSON.parse(json));assert.equal(JSON.stringify(A.project),json,'JSON retains physical transforms');
 for(const mode of ['plan','elevation','solid']){$(`[data-view="${mode}"]`).click();choose([a]);assert.equal(d.querySelectorAll('.transform-row').length,3);assert.equal(d.querySelectorAll('.transform-values input').length,9)}
 // Horizontal scrubbing previews all nine values and commits one atomic edit.
 for(const key of ['px','py','pz','rx','ry','rz','dimensionX','dimensionY','dimensionZ']){
  ids=fresh(['plane']);a=ids[0];choose(ids);$('#snap').checked=true;const initial=+$('#prop-'+key).value,original=JSON.stringify(A.document.objects);count=A.undoCount;
  propertyPointer('pointerdown',100,$('#prop-'+key));propertyPointer('pointermove',112);propertyPointer('pointermove',125);assert.equal(A.undoCount,count,'preview does not create history');near(+$('#prop-'+key).value,initial+25,key+' scrub');propertyPointer('pointerup',125);assert.equal(A.undoCount,Math.min(80,count+1),'one scrub is one undo');A.command('undo');assert.equal(JSON.stringify(A.document.objects),original,'scrub undo restores exact geometry');
 }
 ids=fresh();choose(ids);before=JSON.stringify(A.document.objects);count=A.undoCount;propertyPointer('pointerdown',100,$('#prop-px'));propertyPointer('pointermove',120,$('#properties'),{shiftKey:true});
 propertyPointer('pointercancel',120);assert.equal(JSON.stringify(A.document.objects),before);assert.equal(A.undoCount,count,'cancel does not create history');
 ids=fresh();choose(ids);propertyPointer('pointerdown',100,$('#prop-px'));propertyPointer('pointermove',120);propertyPointer('pointerup',120);ids.forEach((id,i)=>near(object(id).position[0],420+i*400,'mixed scrub preserves differences'));
 ids=fresh();object(ids[1]).points=object(ids[1]).points.map(p=>[p[0]*1.5,p[1]]);choose(ids);$('#snap').checked=true;before=JSON.stringify(A.document.objects);count=A.undoCount;
 propertyPointer('pointerdown',100,$('#prop-dimensionX'));propertyPointer('pointermove',125,$('#properties'),{shiftKey:true});ids.forEach((id,i)=>near(dims(object(id))[0],(i?360:240)+2.5,'fine size scrub preserves mixed differences with grid enabled'));propertyPointer('pointerup',125);assert.equal(A.undoCount,Math.min(80,count+1));A.command('undo');assert.equal(JSON.stringify(A.document.objects),before);
 choose(ids);propertyPointer('pointerdown',100,$('#prop-dimensionX'));propertyPointer('pointermove',125);propertyPointer('pointercancel',125);assert.equal(JSON.stringify(A.document.objects),before,'cancel exact batch size');
 assert.deepEqual(errors,[]);console.log('PASS property inspector: per-axis mixed values, shared input kinds, exact single/batch dimensions and parameters on 75/100 grids, five rotated entity types, atomic history, circular coupling, host holes, rollback, locks, Euler/JSON/three views, all nine scrub values and fine mixed size scrubbing with grid enabled.');
}finally{dom.window.close()}
