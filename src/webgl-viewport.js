// The GPU owns perspective depth/occlusion. SVG retains annotations and edit handles.
let gpuViewport=null,gpuUnavailable=false;
function createGPUViewport(){
 if(gpuUnavailable||!window.WebGL2RenderingContext)return null;
 try{const T=window.StudioThree,element=document.createElement('canvas');element.id='solid-webgl';element.setAttribute('aria-hidden','true');stage.prepend(element);
  const renderer=new T.WebGLRenderer({canvas:element,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  const g={T,element,renderer,world:new T.Scene(),camera:new T.PerspectiveCamera(),group:new T.Group(),cache:new Map(),materials:new Map(),edgeMaterial:new T.LineBasicMaterial({vertexColors:true}),doc:null,signature:null,grid:null,width:0,height:0,stats:{backend:'webgl',frames:0,geometryBuilds:0,sceneBuilds:0,objects:0,drawCalls:0,triangles:0}};g.world.add(g.group);
  element.addEventListener('webglcontextlost',e=>{e.preventDefault();gpuUnavailable=true;drawCanvas()});element.addEventListener('webglcontextrestored',()=>{gpuUnavailable=false;g.signature=null;drawCanvas()});return g;
 }catch{gpuUnavailable=true;$('#solid-webgl')?.remove();return null}
}
function disposeGPUObject(o){o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose()}
function gpuObjectData(d,o,g){
 const signature=JSON.stringify([o,M.floor(d,o)?.height||0,M.holes(d,o)]),prior=g.cache.get(o.id);if(prior?.signature===signature)return prior;
 const {T}=g,positions=[],colors=[],edges=[],edgeColors=[],faces=M.geometry(d,o),edge=new T.Color(o.stroke||'#777777');
 for(const face of faces){const color=new T.Color(R.shade(o.fill||'#cccccc',face.side??1));for(const triangle of window.StudioMeshExport.faceTriangles(face))for(const p of triangle){positions.push(...p);colors.push(color.r,color.g,color.b)}}
 if(o.width!==0)for(const segment of M.boundaryEdges(faces))for(const p of segment){edges.push(...p);edgeColors.push(edge.r,edge.g,edge.b)}
 const data={signature,positions,colors,edges,edgeColors,opacity:o.opacity??1};g.cache.set(o.id,data);g.stats.geometryBuilds++;return data;
}
function syncGPUGeometry(d,g){
 if((cameraKeys.size||drag?.kind==='orbit')&&g.doc===d.id&&g.signature)return;
 const signature=JSON.stringify(d);if(g.doc===d.id&&g.signature===signature)return;
 if(g.doc!==d.id)g.cache.clear();g.doc=d.id;g.signature=signature;
 for(const child of [...g.group.children]){g.group.remove(child);child.geometry.dispose()}
 const {T}=g,batches=new Map(),edgePositions=[],edgeColors=[],ids=new Set();let objects=0,min=[Infinity,Infinity],max=[-Infinity,-Infinity];
 for(const o of d.objects){if(!window.StudioMeshExport.solidTypes.has(o.type)||o.visible===false||M.floor(d,o)?.visible===false)continue;ids.add(o.id);const data=gpuObjectData(d,o,g);if(!data.positions.length)continue;objects++;
  const key=data.opacity>=1?'opaque':o.id,batch=batches.get(key)||{positions:[],colors:[],opacity:data.opacity};for(const v of data.positions)batch.positions.push(v);for(const v of data.colors)batch.colors.push(v);batches.set(key,batch);
  for(let i=0;i<data.positions.length;i+=3)for(let j=0;j<2;j++){min[j]=Math.min(min[j],data.positions[i+j]);max[j]=Math.max(max[j],data.positions[i+j])}
  if(data.opacity>=1){for(const v of data.edges)edgePositions.push(v);for(const v of data.edgeColors)edgeColors.push(v)}
 }
 for(const id of g.cache.keys())if(!ids.has(id))g.cache.delete(id);
 const geometry=(positions,colors)=>{const mesh=new T.BufferGeometry();mesh.setAttribute('position',new T.Float32BufferAttribute(positions,3));mesh.setAttribute('color',new T.Float32BufferAttribute(colors,3));mesh.computeBoundingSphere();return mesh};
 // The legacy horizontal projection reverses winding; BackSide restores outward-face culling.
 for(const batch of batches.values()){let material=g.materials.get(batch.opacity);if(!material){material=new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide,transparent:batch.opacity<1,opacity:batch.opacity,depthWrite:batch.opacity>=1,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});g.materials.set(batch.opacity,material)}g.group.add(new T.Mesh(geometry(batch.positions,batch.colors),material))}
 const used=new Set([...batches.values()].map(batch=>batch.opacity));for(const [opacity,material]of g.materials)if(!used.has(opacity)){material.dispose();g.materials.delete(opacity)}
 if(edgePositions.length)g.group.add(new T.LineSegments(geometry(edgePositions,edgeColors),g.edgeMaterial));
 g.bounds=objects?{min,max}:{min:[0,0],max:[d.width,d.height]};g.stats.objects=objects;g.stats.sceneBuilds++;
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
function drawGPUViewport(){
 if(view.mode!=='solid'||!view.fly){if(gpuViewport)gpuViewport.element.hidden=true;return false}
 if(gpuUnavailable){if(gpuViewport)gpuViewport.element.hidden=true;return false}
 const g=gpuViewport||(gpuViewport=createGPUViewport());if(!g)return false;
 const d=doc(),b=M.viewBasis(d,view),{T,renderer}=g,r=stage.getBoundingClientRect(),width=Math.max(1,Math.round(r.width)),height=Math.max(1,Math.round(r.height));syncGPUGeometry(d,g);syncGPUGrid(d,g,b);
 if(g.width!==width||g.height!==height){renderer.setSize(width,height,false);g.width=width;g.height=height}
 g.element.hidden=false;g.world.background=new T.Color(d.background);g.camera.position.fromArray(b.eye);g.camera.up.fromArray(M.mul(b.down,-1));g.camera.lookAt(new T.Vector3().fromArray(M.sub(b.eye,b.n)));
 const near=b.near,far=1e7;g.camera.projectionMatrix.makePerspective((camera.x-b.offset[0])/b.focal*near,(camera.x+camera.w-b.offset[0])/b.focal*near,(b.offset[1]-camera.y)/b.focal*near,(b.offset[1]-camera.y-camera.h)/b.focal*near,near,far);
 // Match the legacy SVG horizontal handedness so handles and picking share coordinates.
 g.camera.projectionMatrix.elements[0]*=-1;g.camera.projectionMatrixInverse.copy(g.camera.projectionMatrix).invert();renderer.render(g.world,g.camera);g.stats.frames++;g.stats.drawCalls=renderer.info.render.calls;g.stats.triangles=renderer.info.render.triangles;
 const options={selection,ghost:false,camera,tolerance:pixel()*8,interactive:true},annotations={...d,objects:d.objects.filter(o=>['text','marker','route'].includes(o.type)),gridVisible:false,heightReferences:false};
 const overlay=R.scene(annotations,view,options);scene=selection.length||drawing?R.scene(d,view,options):overlay;
 canvas.setAttribute('viewBox',`${camera.x} ${camera.y} ${camera.w} ${camera.h}`);canvas.setAttribute('preserveAspectRatio','none');clearTimeout(atlasTimer);++renderVersion;atlas=null;
 $('#scene').innerHTML=overlay.geom+overlay.normalText+`<g fill="${R.contrast(d.background)}">${overlay.masks.replaceAll('fill="white"','')}</g>`+drawGPUReferences(d,g,b);drawHandles();$('#zoom-label').textContent='透视';return true;
}
function refreshPerspectivePicking(){if(view.mode==='solid'&&view.fly&&gpuViewport&&!gpuViewport.element.hidden)scene=buildScene()}
window.addEventListener('beforeunload',()=>{if(!gpuViewport)return;for(const o of gpuViewport.group.children)o.geometry.dispose();for(const material of gpuViewport.materials.values())material.dispose();gpuViewport.edgeMaterial.dispose();if(gpuViewport.grid)disposeGPUObject(gpuViewport.grid);gpuViewport.renderer.dispose()});
