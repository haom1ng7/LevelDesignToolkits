const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://qa.local/result-boundaries',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:700});w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}}});
const w=dom.window,M=w.StudioModel,S=w.StudioSnapping,R=w.StudioRender,A=w.SpatialEditor;
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-5,`${label}: ${a} != ${b}`);
const fresh=()=>{const d=M.createDocument('space');d.objects=[];return d};
function box(d,x=0,y=0,width=100,length=100){const o=Object.assign(M.createObject(d,'plane',[x,y,0]),{points:[[0,0],[width,0],[width,length],[0,length]],thickness:20});d.objects.push(o);return o}
function solid(d,x=0,y=0,width=100,length=100){const a=box(d,x,y,width,length),b=box(d,x,y,width,length);M.setComponents(d,[a.id,b.id],'intersect');return d.objects.find(o=>o.id===a.id)}
function cache(d,o,view={mode:'plan'}){return S.prepare(d,[o.id],M.viewBasis(d,view),view,false)}
try{
 // The union boundary is independent of face starts, subdivisions, overlaps
 // and winding. Only complete material contours may restart the dash pattern.
 const area=r=>r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-p[1]*q[0]},0)/2;
 const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
 const strips=Array.from({length:48},(_,i)=>({poly:rect(0,i*4,100,4).slice(i%4).concat(rect(0,i*4,100,4).slice(0,i%4)),cutouts:[]}));
 let contours=R.materialContours(strips);assert.equal(contours.length,1,'48 face partitions become one contour');assert.equal(contours[0].length,4,'collinear partitions do not restart dashes');near(area(contours[0]),19200,'partitioned material area');
 for(const regions of [
  [{poly:rect(0,0,100,100),cutouts:[rect(30,30,40,40)]}],
  [{poly:rect(0,0,100,100),cutouts:[rect(30,30,40,40)]},{poly:rect(50,10,70,80).reverse(),cutouts:[]}],
  [{poly:rect(0,0,40,40),cutouts:[]},{poly:rect(40,40,40,40),cutouts:[]}],
  [{poly:[[0,0],[100,20],[50,110]],cutouts:[]},{poly:[[20,10],[120,80],[0,90]],cutouts:[]}]
 ]){
  contours=R.materialContours(regions);assert(contours.length,'union retains material');
  for(let x=-5.37;x<125;x+=7.3)for(let y=-5.63;y<125;y+=8.1){const p=[x,y],expected=regions.some(f=>M.inside(p,f.poly)&&!f.cutouts.some(h=>M.inside(p,h))),actual=contours.reduce((n,r)=>n+(M.inside(p,r)?Math.sign(area(r)):0),0)>0;assert.equal(actual,expected,'silhouette union agrees at '+p)}
 }
 // Both directions and solid-to-solid must actually correct a nearby edge.
 for(const sourceSolid of [false,true])for(const targetSolid of [false,true]){
  const d=fresh(),o=(sourceSolid?solid:box)(d,0,25,20,30);(targetSolid?solid:box)(d,100,0);
  const hit=S.solve(cache(d,o),[75,0,0],1);near(hit.delta[0],80,'result edge contact');assert(hit.guides.length);
  near(S.solve(cache(d,o),[75,0,0],1,true).delta[0],75,'Ctrl bypass');
 }
 // Results remain targets for the stair/ladder placement contacts as well.
 for(const type of ['stairs','ladder','spiral']){
  const d=fresh(),o=M.createObject(d,type,type==='stairs'?[350,340,0]:[0,0,0]);d.objects.push(o);
  if(type==='stairs')solid(d,400,250,200,180);else solid(d,100,-100,100,200);
  const raw=type==='stairs'?[0,0,0]:type==='ladder'?[62,0,0]:[5,0,0],expected=type==='stairs'?5:type==='ladder'?67:10;
  near(S.solve(cache(d,o),raw,1).delta[0],expected,type+' to solid');
 }
 // Size and rotation use the same solid features as movement.
 {
  const d=fresh(),o=solid(d,150,150),target=solid(d,250,150),pivot=[200,200,0],theta=Math.PI/6,raw=28.8*Math.PI/180;
  M.rotate(d,[target.id],[0,0,1],theta,pivot);const c=cache(d,o);c.transform=true;M.rotate(d,[o.id],[0,0,1],raw,pivot);
  const projected=()=>S.features(d,o).map(e=>({...e,a2:M.project(e.a,c.basis),b2:M.project(e.b,c.basis)}));
  const hit=w.StudioTransformSnapping.rotation(c,projected(),[200,200],1,raw);assert(hit,'solid rotation contact');near(hit.value,theta-raw,'solid rotation correction');
  M.rotate(d,[o.id],[0,0,1],hit.value,pivot);assert(w.StudioTransformSnapping.guide(hit,projected(),1),'rotation guide follows actual contact');
 }
 {
  const d=fresh(),o=solid(d,0,25,95,30);solid(d,100,0);const c=cache(d,o);c.transform=true;
  const projected=()=>S.features(d,o).map(e=>({...e,a2:M.project(e.a,c.basis),b2:M.project(e.b,c.basis)})),before=projected();o.mesh=o.mesh.map(r=>r.map(p=>[p[0]*94/95,p[1],p[2]]));
  const hit=w.StudioTransformSnapping.resize(c,before,projected(),-1,1);assert(hit,'solid resize contact');near(hit.value,6,'solid resize correction');
 }
 // The actual sloping wall profile has no corner at its rectangular maximum.
 let d=fresh(),wall=Object.assign(M.createObject(d,'wall'),{position:[0,0,0],points:[[0,0],[100,0],[60,100],[0,100]],thickness:20});d.objects.push(wall);
 const edges=S.features(d,wall),local=edges.flatMap(e=>[e.a,e.b]).map(p=>M.local(d,wall,p));
 assert(!local.some(p=>Math.abs(p[0]-100)<1e-5&&Math.abs(p[2]-100)<1e-5),'no fabricated bounding-box corner');
 assert(edges.some(e=>Math.abs(e.a[0]-e.b[0])>39&&Math.abs(e.a[2]-e.b[2])>99),'slope is a snapping edge');
 // A closed cut provides its inner boundary as both source and target.
 d=fresh();let host=box(d,0,0,400,400);M.cutComponents(d,host.id,[[100,100],[300,100],[300,300],[100,300],[100,100]]);
 host=d.objects.find(o=>o.cutouts);d.objects=[host];let o=box(d,60,125,35,50);
 near(S.solve(cache(d,o),[0,0,0],1).delta[0],5,'cutout target');
 near(S.solve(cache(d,host),[0,0,0],1).delta[0],-5,'cutout source');
 // The same real boundary is available to creation, resizing and rotation.
 const view={mode:'plan'},c=cache(d,o),basis=c.basis;c.transform=true;
 const before=S.features(d,o).map(e=>({...e,a2:M.project(e.a,basis),b2:M.project(e.b,basis)}));
 o.points=o.points.map(p=>[p[0]*34/35,p[1]]);const after=S.features(d,o).map(e=>({...e,a2:M.project(e.a,basis),b2:M.project(e.b,basis)}));
 assert(w.StudioTransformSnapping.resize(c,before,after,-1,1),'resize contacts the cutout');
 // Visibility, floor scope, elevation depth and pixel tolerance remain effective.
 d=fresh();o=box(d,0,25,20,30);host=solid(d,100,0);host.visible=false;assert.equal(cache(d,o).targets.length,0);host.visible=true;
 assert(!S.solve(cache(d,o),[75,0,0],.5).guides.length,'screen-space tolerance');
 host.position[1]=2000;assert(!S.solve(cache(d,o,{mode:'elevation',side:'front',scope:'all'}),[75,0,0],1).guides.length,'separated elevation depth');
 host.floor=M.uid();d.floors.push({...M.clone(d.floors[0]),id:host.floor});assert.equal(cache(d,o).targets.length,0,'floor scope');
 // Concave, holed and disconnected results use projected material faces,
 // preserving the same silhouette in all three views instead of a convex hull.
 for(const shape of ['notch','hole','split']){
  d=fresh();host=box(d,0,0,400,400);const cutter=shape==='notch'?box(d,200,200,300,300):shape==='hole'?box(d,100,100,200,200):box(d,150,-50,100,500);
  M.setComponents(d,[host.id,cutter.id],'difference');host=d.objects.find(o=>o.id===host.id);d.objects=[host];
  for(const view of [{mode:'plan'},{mode:'elevation',side:'front'},{mode:'solid',azimuth:35,elevation:35}]){
   const s=R.scene(d,view,{ghost:false,selection:[host.id]}),outline=s.outlines.get(host.id);
   assert(outline.paths?.length,shape+' has material silhouette in '+view.mode);
   assert.equal(outline.paths.length,s.faces.filter(f=>f.owner.id===host.id).length,'each visible material face participates');
   if(shape==='hole'&&view.mode==='plan'){
    const svg=w.document.createElementNS('http://www.w3.org/2000/svg','svg');svg.innerHTML=s.geom;
    const internal=Array.from(svg.querySelectorAll('[data-wall-edges] path')).map(p=>(p.getAttribute('d').match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)||[]).map(Number)).filter(ps=>ps.length===4&&ps.every(v=>v>=100-1e-5&&v<=300+1e-5));
    near(internal.reduce((sum,p)=>sum+Math.hypot(p[2]-p[0],p[3]-p[1]),0),800,'actual hole border is drawn');
   }
  }
  A.loadProject({format:'level-spatial-editor',version:7,documents:[d],activeDocument:d.id});A.select(host.id,false,true);
  assert(w.document.querySelector('[data-material-selection] mask'),'selection uses material union mask');
  assert(!A.renderSVG().includes('data-material-selection'),'selection stays out of exports');
 }
 assert.deepEqual(errors,[]);console.log('PASS result boundaries: bidirectional solid contacts, actual wall slopes, cutout source/target/resize, Ctrl/zoom/visibility/depth/floor, three-view concave/holed/disconnected material selection and export exclusion.');
}finally{w.close()}
