const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/stair-triangles.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{}}});
const w=dom.window,M=w.StudioModel,R=w.StudioRender,A=w.SpatialEditor,near=(a,b,label)=>assert(Math.abs(a-b)<1e-6,`${label}: ${a} != ${b}`),area=ps=>Math.abs(ps.reduce((n,p,i)=>{const q=ps[(i+1)%ps.length];return n+p[0]*q[1]-p[1]*q[0]},0))/2;
function check(d,o,label){
 const f=o.flights[0],faces=M.geometry(d,o),tops=faces.filter(face=>face.side===1).map(face=>face.points.map(p=>M.local(d,o,p)));
 assert.equal(tops.length,f.steps,label+' keeps step count');
 const ys=f.points.map(p=>p[1]),lo=Math.min(...ys),hi=Math.max(...ys),bands=[];
 for(const top of tops){
  assert(top.every(p=>p.every(Number.isFinite)),label+' finite coordinates');
  assert(top.every(p=>Math.abs(p[2]-top[0][2])<1e-6),label+' horizontal top');
  const min=Math.min(...top.map(p=>p[1])),max=Math.max(...top.map(p=>p[1]));
  near(max-min,(hi-lo)/f.steps,label+' uniform run');
  assert(top.every(p=>Math.abs(p[1]-min)<1e-6||Math.abs(p[1]-max)<1e-6),label+' parallel tread edges');
  bands.push(min);assert(area(top)>0,label+' positive tread area');
 }
 bands.sort((a,b)=>a-b).forEach((v,i)=>near(v,lo+(hi-lo)*i/f.steps,label+' contiguous bands'));
 near(tops.reduce((n,p)=>n+area(p),0),area(f.points),label+' footprint area');
 assert(faces.every(face=>Math.hypot(...M.faceNormal(face.points))>.99),label+' no degenerate faces');
 for(const view of [{mode:'plan'},{mode:'elevation',side:'left'},{mode:'solid',azimuth:35,elevation:35}])assert(R.scene(d,view,{ghost:true}).faces.length,label+' visible '+view.mode);
 const controls=M.controls(d,o,'elevation');
 for(let i=0;i<4;i++)for(let j=0;j<i;j++)if(Math.hypot(...M.sub(f.points[i],f.points[j]))<1e-6)near(Math.hypot(...M.sub(controls[i].point,controls[j].point)),0,label+' coincident corner heights');
 const markup=new JSDOM('<svg>'+R.scene(d,{mode:'plan'},{ghost:true}).geom+'</svg>');
 const line=markup.window.document.querySelector('[data-stair-arrows] path'),ps=[...line.getAttribute('d').matchAll(/(?:M|L)\s+([-\d.e+]+)\s+([-\d.e+]+)/g)].map(m=>[+m[1],+m[2]]);
 const footprint=M.hull(f.points.map(p=>M.project(M.world(d,o,[...p,0]),M.viewBasis(d,{mode:'plan'}))));
 for(const p of ps)assert(M.inside(p,footprint),label+' arrow inside footprint');
 markup.window.close();
}
try{
 let cases=0;
 for(let from=0;from<4;from++)for(const to of [(from+3)%4,(from+1)%4])for(const angle of [0,.37])for(const descending of [false,true]){
  const d=M.createDocument('space','三角楼梯'),o=M.createObject(d,'stairs',[500,350,25]);d.objects=[o];d.floors[0].height=100;
  o.countMode='manual';const f=o.flights[0];f.steps=12;f.points=[[-50,-100],[50,-100],[50,100],[-50,100]];f.points[from]=[...f.points[to]];if(descending)[f.start,f.end]=[f.end,f.start];o.orientation=M.axisRotation([0,0,1],angle);
  const original=JSON.stringify(f.points),label=`${from}->${to}, angle ${angle}, descending ${descending}`;check(d,o,label);assert.equal(JSON.stringify(f.points),original,'render preserves stored corners');
  const restored=M.validate(JSON.parse(JSON.stringify({format:'level-spatial-editor',version:7,documents:[d],activeDocument:d.id}))).documents[0];check(restored,restored.objects[0],label+' JSON');
  o.countMode='auto';M.updateCounts(o);check(d,o,label+' auto');
  const before=M.geometry(d,o).flatMap(f=>f.points),pivot=M.origin(d,o),rotation=M.axisRotation([0,0,1],.43);M.rotate(d,[o.id],[0,0,1],.43,pivot);const after=M.geometry(d,o).flatMap(f=>f.points);assert.equal(after.length,before.length,label+' planar rotation topology');after.forEach((p,i)=>p.forEach((v,j)=>near(v,M.add(pivot,M.mat(rotation,M.sub(before[i],pivot)))[j],label+' planar rotation')));cases++;
 }
 // A tilted triangle remains a rigid solid when rotated again.
 const d=M.createDocument('space','旋转三角楼梯'),o=M.createObject(d,'stairs',[500,350,0]);d.objects=[o];o.flights[0].points[1]=[...o.flights[0].points[2]];
 o.orientation=M.axisRotation([1,0,0],.4);const before=M.geometry(d,o).flatMap(f=>f.points),pivot=M.origin(d,o),rotation=M.axisRotation([0,0,1],.5);M.rotate(d,[o.id],[0,0,1],.5,pivot);const after=M.geometry(d,o).flatMap(f=>f.points);assert.equal(after.length,before.length);after.forEach((p,i)=>p.forEach((v,j)=>near(v,M.add(pivot,M.mat(rotation,M.sub(before[i],pivot)))[j],'rigid triangle rotation')));
 // Zero steps is a continuous slab, including every supported triangular outline.
 let ramps=0;
 for(const collapse of [null,...Array.from({length:4},(_,i)=>[[i,(i+1)%4],[i,(i+3)%4]]).flat()])for(const end of [160,-160,0]){
  const d=M.createDocument('space','斜面'),o=M.createObject(d,'stairs',[500,350,25]);d.objects=[o];d.floors[0].height=100;o.countMode='manual';
  const f=o.flights[0];f.steps=0;f.start=0;f.end=end;if(collapse)f.points[collapse[0]]=[...f.points[collapse[1]]];o.orientation=M.product(M.axisRotation([1,0,0],.3),M.axisRotation([0,0,1],.37));
  const faces=M.geometry(d,o),tops=faces.filter(face=>face.side===1),top=tops[0].points.map(p=>M.local(d,o,p)),profile=M.stairProfile(f);
  assert.equal(tops.length,1,'one continuous ramp top');assert.equal(faces.length,collapse?5:6,'closed slab without internal risers');near(area(top),area(f.points),'ramp footprint');
  for(const [i,p] of profile.points.entries())assert(top.some(q=>Math.hypot(...M.sub(q,[...p,i<2?f.start:f.end]))<1e-6),'ramp meets endpoint height');
  assert(faces.every(face=>face.points.every(p=>p.every(Number.isFinite))&&Math.hypot(...M.faceNormal(face.points))>.99),'finite nondegenerate ramp faces');
  const controls=M.controls(d,o,'elevation');for(const c of controls)assert(top.some(p=>Math.hypot(...M.sub(c.point,M.world(d,o,p)))<1e-6),'controls lie on ramp');
  for(const view of [{mode:'plan'},{mode:'elevation',side:'left'},{mode:'solid',azimuth:35,elevation:35}])assert(R.scene(d,view,{ghost:true}).faces.length,'ramp visible '+view.mode);
  const saved={format:'level-spatial-editor',version:7,documents:[d],activeDocument:d.id},restored=M.validate(JSON.parse(JSON.stringify(saved))).documents[0];assert.equal(restored.objects[0].flights[0].steps,0);assert.equal(JSON.stringify(M.geometry(restored,restored.objects[0]).map(f=>f.points)),JSON.stringify(faces.map(f=>f.points)),'JSON keeps ramp geometry');
  ramps++;
 }
 A.loadProject({format:'level-spatial-editor',version:7,documents:[d],activeDocument:d.id});assert(!A.renderSVG().includes('data-vertex'));
 A.select(o.id,false,true);const input=()=>w.document.querySelector('#flight-steps'),change=value=>{A.select(o.id,false,true);input().value=String(value);input().dispatchEvent(new w.Event('change',{bubbles:true}))};
 assert.equal(input().min,'0');const oldSteps=A.document.objects[0].flights[0].steps,history=A.undoCount;change(0);assert.equal(A.document.objects[0].flights[0].steps,0);assert.equal(A.document.objects[0].countMode,'manual');assert.equal(A.undoCount,history+1);assert.equal(M.geometry(A.document,A.document.objects[0]).filter(f=>f.side===1).length,1);
 A.command('undo');assert.equal(A.document.objects[0].flights[0].steps,oldSteps);A.command('redo');assert.equal(A.document.objects[0].flights[0].steps,0);
 for(const invalid of [-1,.5,101]){const p=M.clone(A.project);p.documents[0].objects[0].flights[0].steps=invalid;assert.throws(()=>M.validate(p),/楼梯数据/)}
 for(const steps of [1,2,100]){change(steps);assert.equal(A.document.objects[0].flights[0].steps,steps);assert.equal(M.geometry(A.document,A.document.objects[0]).filter(f=>f.side===1).length,steps,'positive counts remain treads')}
 assert.deepEqual(errors,[]);console.log(`PASS stairs: ${cases} triangular tread cases and ${ramps} zero-step ramps; endpoint heights, closed slabs, three views, JSON, property input, undo/redo and count validation.`);
}finally{dom.window.close()}
