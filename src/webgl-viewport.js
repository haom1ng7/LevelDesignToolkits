// The GPU owns perspective depth/occlusion. SVG retains annotations and edit handles.
let gpuViewport=null,gpuUnavailable=false,perspectivePickKey=null;
function createGPUViewport(){
 if(gpuUnavailable||!window.WebGL2RenderingContext)return null;
 try{const T=window.StudioThree,element=document.createElement('canvas');element.id='solid-webgl';element.setAttribute('aria-hidden','true');stage.prepend(element);
  const renderer=new T.WebGLRenderer({canvas:element,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  const g={T,element,renderer,world:new T.Scene(),camera:new T.PerspectiveCamera(),group:new T.Group(),cache:new Map(),materials:new Map(),edgeMaterial:new T.LineBasicMaterial({vertexColors:true}),doc:null,signature:null,grid:null,width:0,height:0,stats:{backend:'webgl',frames:0,geometryBuilds:0,sceneBuilds:0,pickingBuilds:0,overlayObjects:0,transparentSorts:0,objects:0,drawCalls:0,triangles:0}};g.world.add(g.group);
  element.addEventListener('webglcontextlost',e=>{e.preventDefault();gpuUnavailable=true;drawCanvas()});element.addEventListener('webglcontextrestored',()=>{gpuUnavailable=false;g.signature=null;drawCanvas()});return g;
 }catch{gpuUnavailable=true;$('#solid-webgl')?.remove();return null}
}
function disposeGPUObject(o){o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose()}
function gpuObjectData(d,o,g){
 const signature=JSON.stringify([o,M.floor(d,o)?.height||0,M.holes(d,o)]),prior=g.cache.get(o.id);if(prior?.signature===signature)return prior;
 const {T}=g,positions=[],colors=[],edges=[],edgeColors=[],faces=M.geometry(d,o),edge=new T.Color(o.stroke||'#777777');
 for(const face of faces){const color=new T.Color(R.shade(o.fill||'#cccccc',face.side??1));for(const triangle of window.StudioMeshExport.faceTriangles(face))for(const p of triangle){positions.push(...p);colors.push(color.r,color.g,color.b)}}
 if(o.width!==0)for(const segment of M.boundaryEdges(faces))for(const p of segment){edges.push(...p);edgeColors.push(edge.r,edge.g,edge.b)}
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<positions.length;i+=3)for(let j=0;j<3;j++){min[j]=Math.min(min[j],positions[i+j]);max[j]=Math.max(max[j],positions[i+j])}
 // Cache shared world vertices and face normals for selection projection as well
 // as GPU buffers. Camera motion must not rebuild an SVG solid scene.
 const vertices=[],vertexIds=new Map(),vertexId=p=>{const key=p.join(',');if(!vertexIds.has(key)){vertexIds.set(key,vertices.length);vertices.push(p)}return vertexIds.get(key)};
 const outlineFaces=faces.map(f=>({...f,normal:M.faceNormal(f.points),indices:f.points.map(vertexId)}));
 const data={signature,positions,colors,edges,edgeColors,min,max,vertices,outlineFaces,center:min.map((v,i)=>(v+max[i])/2),opacity:o.opacity??1};g.cache.set(o.id,data);g.stats.geometryBuilds++;return data;
}
function syncGPUGeometry(d,g){
 if((cameraKeys.size||drag?.kind==='orbit')&&g.doc===d.id&&g.signature)return;
 // Annotation edits only change the SVG overlay, not the solid GPU batches.
 g.annotations=d.objects.filter(o=>['text','marker','route'].includes(o.type));
 const signature=JSON.stringify([d.width,d.height,d.floors,d.objects.filter(o=>window.StudioMeshExport.solidTypes.has(o.type)||o.type==='hole')]);if(g.doc===d.id&&g.signature===signature)return;
 if(g.doc!==d.id)g.cache.clear();g.doc=d.id;g.signature=signature;
 for(const child of [...g.group.children]){g.group.remove(child);child.geometry.dispose()}
 const {T}=g,batches=new Map(),edgePositions=[],edgeColors=[],ids=new Set();g.transparent=null;let objects=0,min=[Infinity,Infinity],max=[-Infinity,-Infinity];
 for(const o of d.objects){if(!window.StudioMeshExport.solidTypes.has(o.type)||o.visible===false||M.floor(d,o)?.visible===false)continue;ids.add(o.id);const data=gpuObjectData(d,o,g);if(!data.positions.length)continue;objects++;
  const transparent=data.opacity<1,key=transparent?'transparent':'opaque',batch=batches.get(key)||{positions:[],colors:[],transparent,spans:[]};batch.spans.push({start:batch.positions.length/3,count:data.positions.length/3,center:data.center,order:batch.spans.length});for(const v of data.positions)batch.positions.push(v);
  for(let i=0;i<data.colors.length;i+=3){batch.colors.push(data.colors[i],data.colors[i+1],data.colors[i+2]);if(transparent)batch.colors.push(data.opacity)}batches.set(key,batch);
  for(let i=0;i<data.positions.length;i+=3)for(let j=0;j<2;j++){min[j]=Math.min(min[j],data.positions[i+j]);max[j]=Math.max(max[j],data.positions[i+j])}
  if(data.opacity>=1){for(const v of data.edges)edgePositions.push(v);for(const v of data.edgeColors)edgeColors.push(v)}
 }
 for(const id of g.cache.keys())if(!ids.has(id))g.cache.delete(id);
 const geometry=(positions,colors,colorSize=3)=>{const mesh=new T.BufferGeometry();mesh.setAttribute('position',new T.Float32BufferAttribute(positions,3));mesh.setAttribute('color',new T.Float32BufferAttribute(colors,colorSize));mesh.computeBoundingSphere();return mesh};
 // The legacy horizontal projection reverses winding; BackSide restores outward-face culling.
 for(const batch of batches.values()){let material=g.materials.get(batch.transparent);if(!material){material=new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide,transparent:batch.transparent,depthWrite:!batch.transparent,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});g.materials.set(batch.transparent,material)}const mesh=geometry(batch.positions,batch.colors,batch.transparent?4:3);if(batch.transparent){const index=new T.BufferAttribute(new Uint32Array(batch.positions.length/3),1).setUsage(T.DynamicDrawUsage);mesh.setIndex(index);g.transparent={spans:batch.spans,index,normal:null}}g.group.add(new T.Mesh(mesh,material))}
 const used=new Set([...batches.values()].map(batch=>batch.transparent));for(const [key,material]of g.materials)if(!used.has(key)){material.dispose();g.materials.delete(key)}
 if(edgePositions.length)g.group.add(new T.LineSegments(geometry(edgePositions,edgeColors),g.edgeMaterial));
 g.bounds=objects?{min,max}:{min:[0,0],max:[d.width,d.height]};g.stats.objects=objects;g.stats.sceneBuilds++;
}
function sortGPUTransparency(g,b){
 const t=g.transparent;if(!t||t.normal?.every((v,i)=>v===b.n[i]))return;t.normal=[...b.n];
 // Preserve per-object back-to-front blending, including different opacities,
 // with one RGBA batch. Translation leaves the relative depth order unchanged.
 t.spans.sort((a,c)=>M.dot(a.center,b.n)-M.dot(c.center,b.n)||a.order-c.order);let at=0,changed=false;for(const span of t.spans)for(let i=0;i<span.count;i++){const index=span.start+i;if(t.index.array[at]!==index){t.index.array[at]=index;changed=true}at++}if(changed)t.index.needsUpdate=true;g.stats.transparentSorts++;
}
function syncGPUGrid(d,g,b){
 const step=d.gridSize||100,radius=Math.max(d.width,d.height,b.focal*3),count=Math.min(360,Math.max(20,Math.ceil(radius*2/step))),signature=JSON.stringify([d.gridVisible,step,count]);
 if(signature!==g.gridSignature){if(g.grid){g.world.remove(g.grid);disposeGPUObject(g.grid);g.grid=null}if(d.gridVisible){g.grid=new g.T.GridHelper(count*step,count,0x98a6b6,0x98a6b6);g.grid.rotation.x=Math.PI/2;g.grid.material.transparent=true;g.grid.material.opacity=.28;g.grid.material.depthWrite=false;g.world.add(g.grid)}g.gridSignature=signature}
 if(g.grid)g.grid.position.set(Math.round(b.eye[0]/step)*step,Math.round(b.eye[1]/step)*step,-.5);
}
function drawGPUReferences(d,g,b){
 if(!d.heightReferences)return '';const lo=g.bounds.min.map(v=>v-35),hi=g.bounds.max.map(v=>v+35),color=R.contrast(d.background);let markup='';
 for(const f of d.floors.filter(f=>f.visible!==false)){const points=M.clipPolygon([[lo[0],lo[1],f.height],[hi[0],lo[1],f.height],[hi[0],hi[1],f.height],[lo[0],hi[1],f.height]],b).map(p=>M.project(p,b));if(!points.length)continue;markup+=`<g data-height-references="true" pointer-events="none" opacity=".7"><path d="${R.path(points,true)}" fill="none" stroke="${color}" stroke-width="${pixel()}" stroke-dasharray="${pixel()*6} ${pixel()*5}"/><text x="${points[0][0]}" y="${points[0][1]-pixel()*8}" font-size="${pixel()*14}" fill="${color}">${R.esc(f.name)}：${f.height}</text></g>`}return markup;
}
function gpuSelectionOutlines(d,g,b,overlay){
 const outlines=new Map(overlay.outlines),ids=new Set(selection);
 for(const o of d.objects){
  if(!ids.has(o.id)||o.visible===false||M.floor(d,o)?.visible===false)continue;
  const data=g.cache.get(o.id);if(!data)continue;
  const depth=data.vertices.map(p=>M.cameraDepth(p,b)),projected=data.vertices.map(p=>M.project(p,b)),vertices=new Set(),clipped=[],paths=[],regions=[],material=['plane','wall','solid'].includes(o.type);
  for(const face of data.outlineFaces){
   if(M.dot(face.normal,M.sub(b.eye,face.points[0]))<-1e-6||face.indices.every(i=>depth[i]<b.near))continue;
   const complete=face.indices.every(i=>depth[i]>=b.near),poly=complete?face.indices.map(i=>projected[i]):M.clipPolygon(face.points,b).map(p=>M.project(p,b));
   if(poly.length<3||Math.abs(poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p[0]*q[1]-q[0]*p[1]},0))<.01)continue;
   if(complete)for(const i of face.indices)vertices.add(i);else clipped.push(...poly);
   if(material){const cutouts=face.holes.map(h=>M.clipPolygon(h,b)).filter(h=>h.length>=3).map(h=>h.map(p=>M.project(p,b)));regions.push({poly,cutouts});paths.push([R.path(poly,true),...cutouts.map(h=>R.path(h,true))].join(' '))}
  }
  const points=[...[...vertices].map(i=>projected[i]),...clipped];if(points.length)outlines.set(o.id,{poly:M.hull(points),...(material?{paths,regions}:{})});
 }
 return {...overlay,outlines};
}
function drawGPUViewport(){
 if(view.mode!=='solid'||!view.fly){if(gpuViewport)gpuViewport.element.hidden=true;return false}
 if(gpuUnavailable){if(gpuViewport)gpuViewport.element.hidden=true;return false}
 const g=gpuViewport||(gpuViewport=createGPUViewport());if(!g)return false;
 const d=doc(),b=M.viewBasis(d,view),{T,renderer}=g,r=viewportBounds(),width=Math.max(1,Math.round(r.width)),height=Math.max(1,Math.round(r.height));syncGPUGeometry(d,g);syncGPUGrid(d,g,b);
 if(g.width!==width||g.height!==height){renderer.setSize(width,height,false);g.width=width;g.height=height}
 g.element.hidden=false;g.world.background=new T.Color(d.background);g.camera.position.fromArray(b.eye);g.camera.up.fromArray(M.mul(b.down,-1));g.camera.lookAt(new T.Vector3().fromArray(M.sub(b.eye,b.n)));
 sortGPUTransparency(g,b);const near=b.near,far=1e7;g.camera.projectionMatrix.makePerspective((camera.x-b.offset[0])/b.focal*near,(camera.x+camera.w-b.offset[0])/b.focal*near,(b.offset[1]-camera.y)/b.focal*near,(b.offset[1]-camera.y-camera.h)/b.focal*near,near,far);
 // Match the legacy SVG horizontal handedness so handles and picking share coordinates.
 g.camera.projectionMatrix.elements[0]*=-1;g.camera.projectionMatrixInverse.copy(g.camera.projectionMatrix).invert();renderer.render(g.world,g.camera);g.stats.frames++;g.stats.drawCalls=renderer.info.render.calls;g.stats.triangles=renderer.info.render.triangles;g.stats.geometries=renderer.info.memory.geometries;g.stats.cachedObjects=g.cache.size;
 const options={selection,ghost:false,camera,tolerance:pixel()*8,interactive:true},annotations={...d,objects:g.annotations,gridVisible:false,heightReferences:false};
 const overlay=R.scene(annotations,view,options);scene=overlay;
 // Direct route handles use the annotation scene. Resolve solid surfaces only
 // at the pointer when dragging a node, rather than projecting every solid per frame.
 if(drawing||creationTools.includes(tool))scene=buildScene();
 else if(selection.some(id=>{const o=d.objects.find(o=>o.id===id);return o?.type==='hole'&&!selection.includes(o.host)})){
  const ids=new Set(selection);for(const o of d.objects)if(ids.has(o.id)&&o.host)ids.add(o.host);
  const objects=d.objects.filter(o=>(ids.has(o.id)||ids.has(o.host))&&!['text','marker','route'].includes(o.type));
  if(objects.length){const handles=R.scene({...annotations,objects},view,{...options,handlesOnly:true});scene={...overlay,faces:handles.faces,holeHits:handles.holeHits,outlines:new Map([...overlay.outlines,...handles.outlines])}}
 }else if(selection.length)scene=gpuSelectionOutlines(d,g,b,overlay);
 perspectivePickKey=null;g.stats.overlayObjects=g.annotations.length+selection.length;
 canvas.setAttribute('viewBox',`${camera.x} ${camera.y} ${camera.w} ${camera.h}`);canvas.setAttribute('preserveAspectRatio','none');clearTimeout(atlasTimer);++renderVersion;atlas=null;
 $('#scene').innerHTML=overlay.geom+overlay.normalText+`<g fill="${R.contrast(d.background)}">${overlay.masks.replaceAll('fill="white"','')}</g>`+drawGPUReferences(d,g,b);g.drawingHandles=true;try{drawHandles()}finally{g.drawingHandles=false}return true;
}
function gpuPickDocument(d,g,q){
 const b=M.viewBasis(d,view),ray=M.perspectiveRay(q,b),ids=new Set(selection);
 // Conservative world AABBs include openings and ladder silhouettes. Only the
 // few ray candidates need exact clipping, projected polygons and hole tests.
 for(const [id,data]of g.cache){let lo=b.near/(-M.dot(ray,b.n)),hi=Infinity;for(let i=0;i<3&&lo<=hi;i++){if(Math.abs(ray[i])<1e-12){if(b.eye[i]<data.min[i]||b.eye[i]>data.max[i])hi=-Infinity}else{const a=(data.min[i]-b.eye[i])/ray[i],c=(data.max[i]-b.eye[i])/ray[i];lo=Math.max(lo,Math.min(a,c));hi=Math.min(hi,Math.max(a,c))}}if(lo<=hi)ids.add(id)}
 for(const o of d.objects)if(ids.has(o.id)&&o.host)ids.add(o.host);
 return {...d,objects:d.objects.filter(o=>ids.has(o.id)||ids.has(o.host)||['text','marker','route'].includes(o.type)),gridVisible:false,heightReferences:false};
}
function refreshPerspectivePicking(q=null){if(view.mode==='solid'&&view.fly&&gpuViewport&&!gpuViewport.element.hidden){const key=JSON.stringify([doc(),view,camera,selection,$('#ghost').checked,q]);if(perspectivePickKey!==key){scene=q?buildScene(true,gpuPickDocument(doc(),gpuViewport,q)):buildScene();perspectivePickKey=key;gpuViewport.stats.pickingBuilds++}}}
window.addEventListener('beforeunload',()=>{if(!gpuViewport)return;for(const o of gpuViewport.group.children)o.geometry.dispose();for(const material of gpuViewport.materials.values())material.dispose();gpuViewport.edgeMaterial.dispose();if(gpuViewport.grid)disposeGPUObject(gpuViewport.grid);gpuViewport.renderer.dispose()});
