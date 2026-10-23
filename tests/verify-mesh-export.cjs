// Load the published page, then read both formats with independent importers.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
async function main(){
 const {FBXLoader}=await import('three/addons/loaders/FBXLoader.js'),{OBJLoader}=await import('three/addons/loaders/OBJLoader.js'),THREE=await import('three');
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/mesh-export.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.TextEncoder=TextEncoder;w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{}}});
 const w=dom.window,M=w.StudioModel,E=w.StudioMeshExport,A=w.SpatialEditor,$=s=>w.document.querySelector(s),out=path.join(__dirname,'../qa/mesh-export');fs.mkdirSync(out,{recursive:true});
 const near=(a,b,msg)=>assert(Math.abs(a-b)<=Math.max(1e-5,Math.abs(b)*1e-7),`${msg}: ${a} != ${b}`);
 const add=(d,type,pos,props={})=>{const o=Object.assign(M.createObject(d,type,pos),props);d.objects.push(o);return o};
 const blank=()=>{const d=M.createDocument('space','中文模型');d.objects=[];return d};
 const read=(model,format)=>{const value=E[format](model);if(format==='obj')return new OBJLoader().parse(value);const bytes=Uint8Array.from(value);assert.equal(Buffer.from(bytes.subarray(0,23)).toString('binary'),'Kaydara FBX Binary  \0\x1a\0');return new FBXLoader().parse(bytes.buffer,'')};
 const meshes=scene=>{const out=[];scene.traverse(o=>{if(o.isMesh)out.push(o)});return out};
 const volume=m=>m.triangles.reduce((s,t)=>{const [a,b,c]=t.map(i=>m.vertices[i]);return s+M.dot(a,M.cross(b,c))/6},0);
 const bounds=points=>[0,1,2].flatMap(i=>[Math.min(...points.map(p=>p[i])),Math.max(...points.map(p=>p[i]))]);
 function check(model){for(const format of ['obj','fbx']){const scene=read(model,format),objects=meshes(scene);assert.equal(objects.length,model.meshes.length);objects.forEach((o,i)=>{const m=model.meshes[i],g=o.geometry;assert.equal(g.getAttribute('position').count,m.triangles.length*3,format+' triangle count');const p=g.getAttribute('position'),n=g.getAttribute('normal'),bb=[];for(let j=0;j<p.count;j++){const q=[p.getX(j),p.getY(j),p.getZ(j)];assert(q.every(Number.isFinite));bb.push(q);near(Math.hypot(n.getX(j),n.getY(j),n.getZ(j)),1,'unit normal')}bounds(bb).forEach((v,j)=>near(v,bounds(m.vertices)[j],format+' bounds'));if(format==='fbx'){near(o.material.opacity,m.opacity,'opacity');assert.equal(o.material.color.getHexString(),m.color.slice(1))}})}}
 try{
  // Multiple holes including a concave opening, a concave outer contour and
  // collinear boundary vertices must stay open after triangle conversion.
  let d=blank(),p=add(d,'plane',[0,0,0],{name:'地板 / 中文',points:[[0,0],[200,0],[400,0],[400,300],[250,300],[250,250],[0,250]],thickness:20,fill:'#aabbcc',opacity:.4});
  add(d,'hole',[0,0,0],{host:p.id,points:[[50,50],[150,50],[150,150],[50,150]]});
  add(d,'hole',[0,0,0],{host:p.id,points:[[200,50],[300,50],[300,100],[250,100],[250,150],[200,150]]});
  assert(M.validGeometry(d));let model=E.build(d),floor=model.meshes[0];near(volume(floor),(107500-10000-7500)*20,'cut volume');check(model);
  for(const format of ['obj','fbx']){const scene=read(model,format);scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.isMesh)o.material.side=THREE.DoubleSide});for(const [x,y,expected] of [[100,100,false],[225,125,false],[275,125,true],[350,200,true],[100,275,false]]){const ray=new THREE.Raycaster(new THREE.Vector3(x,y,100),new THREE.Vector3(0,0,-1));assert.equal(ray.intersectObject(scene,true).length>0,expected,format+' cut ray '+x+','+y)}}
  fs.writeFileSync(path.join(out,'holes.obj'),E.obj(model));fs.writeFileSync(path.join(out,'holes.fbx'),Buffer.from(E.fbx(model)));
  // Wall bores, sampled curves/ellipses, floor offsets and arbitrary rigid
  // rotations use the same geometry as all three editor views.
  d=blank();d.floors.push({id:M.uid(),height:380,name:'二层',visible:true});
  const wall=add(d,'wall',[100,200,30],{thickness:24});add(d,'hole',[0,0,0],{host:wall.id,points:[[-40,50],[40,50],[40,130],[-40,130]],cut:{origin:[0,0,0],r:[1,0,0],d:[0,0,1],n:[.2,-1,0]}});
  add(d,'plane',[600,0,40],{shape:'ellipse'});add(d,'wall',[500,500,0],{wallPath:{points:[[0,0],[180,0],[200,180]],curves:[.3,0],height:170}});
  for(const [i,type] of ['plane','wall','stairs','ladder','spiral'].entries()){const o=add(d,type,[i*300,-400,20],{floor:d.floors[1].id});o.orientation=M.product(M.axisRotation([1,0,0],.37),M.axisRotation([0,1,0],-.48));}
  add(d,'text',[0,0,0]);add(d,'route',[0,0,0]);add(d,'marker',[0,0,0]);add(d,'plane',[9999,0,0],{visible:false});
  const hidden={id:M.uid(),height:9000,visible:false,name:'隐藏楼层'};d.floors.push(hidden);add(d,'wall',[0,0,0],{floor:hidden.id});
  const before=JSON.stringify(d);model=E.build(d);assert.equal(model.meshes.length,8);assert.equal(JSON.stringify(d),before,'export leaves source model intact');
  for(const m of model.meshes){const o=d.objects.find(o=>o.id===m.id),points=M.geometry(d,o).flatMap(f=>f.points);bounds(m.vertices).forEach((v,i)=>near(v,bounds(points)[i],'world geometry bounds'))}check(model);
  fs.writeFileSync(path.join(out,'components.obj'),E.obj(model));fs.writeFileSync(path.join(out,'components.fbx'),Buffer.from(E.fbx(model)));
  // The complete supplied two-storey project also imports through both readers.
  const house=M.validate(JSON.parse(fs.readFileSync(path.join(__dirname,'../data/two-storey-house.json'),'utf8'))).documents[0];check(E.build(house));
  assert.throws(()=>E.build(blank()),/没有可导出的实体/);assert.throws(()=>E.build(M.createDocument('curve')),/仅支持空间图/);
  // Export UI: independent of active floor/view/selection, disabled image-only
  // options, error recovery, curve fallback and stale async downloads.
  A.createDocument('space','UI 模型');A.document.objects=[];add(A.document,'wall',[500,400,0]);A.setTool('select');
  await A.command('export-menu');const history=A.undoCount,project=JSON.stringify(A.project);
  for(const format of ['fbx','obj']){$('#export-format').value=format;$('#export-format').dispatchEvent(new w.Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,0));assert(A.exportPreview.ready);assert(A.exportPreview.model);assert.equal($('#export-range').disabled,true);assert.equal($('#export-model-note').hidden,false);assert.equal($('#export-reference-options').hidden,true);assert.equal($('#export-download').disabled,false);assert($('#export-ready').textContent.includes('个三角面'));}
  assert.equal(A.undoCount,history);assert.equal(JSON.stringify(A.project),project);
  const oldAtlas=w.StudioRender.atlas;let release;w.StudioRender.atlas=()=>new Promise(r=>release=r);$('#export-format').value='svg';$('#export-format').dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal($('#export-download').disabled,true);$('#export-format').value='fbx';$('#export-format').dispatchEvent(new w.Event('change',{bubbles:true}));release(null);await new Promise(r=>setTimeout(r,0));assert.equal(A.exportPreview.format,'fbx','old image preview cannot replace model');w.StudioRender.atlas=oldAtlas;
  let downloads=0;w.HTMLAnchorElement.prototype.click=()=>downloads++;const pending=A.command('export-download');A.command('export-close');await pending;assert.equal(downloads,0,'closing cancels scheduled model download');
  await A.command('export-menu');$('#export-format').value='obj';$('#export-format').dispatchEvent(new w.Event('change',{bubbles:true}));const switched=A.command('export-download');$('#export-format').value='svg';$('#export-format').dispatchEvent(new w.Event('change',{bubbles:true}));await switched;assert.equal(downloads,0,'switching cancels scheduled model download');await new Promise(r=>setTimeout(r,0));assert.equal($('#export-range').disabled,false);assert.equal($('#export-model-note').hidden,true);
  A.command('export-close');A.document.objects=[];await A.command('export-menu');$('#export-format').value='obj';$('#export-format').dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal($('#export-download').disabled,true);assert($('#export-ready').textContent.includes('没有可导出的实体'));
  A.command('export-close');A.createDocument('curve');await A.command('export-menu');assert.equal($('#export-format').value,'png');for(const value of ['fbx','obj'])assert($('#export-format option[value="'+value+'"]').disabled);
  assert.deepEqual(errors,[]);console.log('PASS model export: independent Three.js FBX/OBJ import; triangle counts, normals, world bounds, color/opacity; concave/multiple bores and ray tests; all solids, curves/ellipse, floors, visibility, source isolation; UI/settings, empty/curve cases and async cancellation. Files: qa/mesh-export/.');
 }finally{w.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
