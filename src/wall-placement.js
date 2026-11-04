// Walls use an existing component edge, without rounding that edge to the grid.
function wallPlacementEdges(d,o){
 if(o.type==='plane'){
  if(o.shape==='ellipse')return [];
  return o.points.flatMap((p,i)=>Math.abs(o.curves?.[i]||0)>1e-7?[]:[{a:M.world(d,o,[...p,0]),b:M.world(d,o,[...o.points[(i+1)%o.points.length],0]),owner:o}]);
 }
 if(o.wallPath?.curves?.some(v=>Math.abs(v)>1e-7))return [];
 return MoveSnapping.features(d,o);
}
function wallPlacementTarget(q){
 const d=doc();if(tool!=='wall'||!q||d?.type!=='space'||view.mode!=='plan')return null;
 const rect=stage.getBoundingClientRect(),sx=Math.max(1,rect.width)/camera.w,sy=Math.max(1,rect.height)/camera.h,toScreen=p=>[p[0]*sx,p[1]*sy],pointer=toScreen(q);
 let best=null;
 for(const o of d.objects){
  if(!['plane','wall','stairs','ladder','spiral','solid'].includes(o.type)||o.visible===false||o.locked||o.floor!==d.activeFloor||M.floor(d,o)?.visible===false)continue;
  for(const edge of wallPlacementEdges(d,o)){
   const {a,b}=edge;if(Math.hypot(b[0]-a[0],b[1]-a[1])<1)continue;
   const p=M.project(a,scene.basis),r=M.project(b,scene.basis),u=toScreen(p),v=M.sub(toScreen(r),u),t=clamp(M.dot(M.sub(pointer,u),v)/(M.dot(v,v)||1),0,1),distance=Math.hypot(...M.sub(pointer,M.add(u,M.mul(v,t))));
   if(distance>10)continue;
   const world=M.add(a,M.mul(M.sub(b,a),t)),at=M.project(world,scene.basis),depth=M.dot(world,scene.basis.n);
   // Covered edges cannot receive a wall through the component above them.
   if(scene.faces.some(f=>!f.ghost&&f.owner.id!==o.id&&M.inside(at,f.poly)&&!f.cutouts.some(h=>M.inside(at,h))&&M.dot(M.unproject(at,scene.basis,f.points[0],M.faceNormal(f.points)),scene.basis.n)>depth+1e-5))continue;
   if(!best||distance<best.distance-1e-6||Math.abs(distance-best.distance)<1e-6&&depth>best.depth)best={id:o.id,a:[...a],b:[...b],p,r,distance,depth};
  }
 }
 return best;
}
function wallPlacementMarkup(){
 const edge=drag?.kind==='place-wall'?(drag.moved?null:drag.edge):!drag?wallPlacementTarget(hoverPoint):null;
 if(tool!=='wall'||!edge)return '';
 const px=pixel(),path=R.path([edge.p,edge.r]);
 return `<g data-wall-edge="${edge.id}" pointer-events="none"><path d="${path}" fill="none" stroke="#18212b" stroke-width="${px*7}" stroke-linecap="round"/><path d="${path}" fill="none" stroke="#fff64b" stroke-width="${px*3}" stroke-linecap="round"/>${[edge.p,edge.r].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="${px*4}" fill="#fff64b" stroke="#18212b" stroke-width="${px*1.5}"/>`).join('')}</g>`;
}
function beginWallPlacement(e,q){
 if(tool!=='wall')return false;
 hoverPoint=q;const edge=wallPlacementTarget(q);
 if(!edge){status('将鼠标移到当前楼层可见且未锁定的组件直边，再点击放置墙壁');drawHandles();return true}
 drag={kind:'place-wall',start:q,edge,moved:false};capture(e);drawHandles();return true;
}
function finishWallPlacement(edge){
 if(tool!=='wall'||view.mode!=='plan')return;
 const host=doc().objects.find(o=>o.id===edge.id);
 if(!host||host.locked||host.visible===false||host.floor!==doc().activeFloor||M.floor(doc(),host)?.visible===false)return;
 const previous={selection:[...selection],primary,lastCreated};
 const success=mutate(()=>{
  const d=doc(),{a,b}=edge,center=M.mul(M.add(a,b),.5),length=Math.hypot(b[0]-a[0],b[1]-a[1]),o=M.createObject(d,'wall',M.sub(center,[0,0,M.floor(d,host)?.height||0]));
  o.floor=host.floor;o.orientation=M.axisRotation([0,0,1],Math.atan2(b[1]-a[1],b[0]-a[0]));
  const za=a[2]-center[2],zb=b[2]-center[2];o.points=[[-length/2,za],[length/2,zb],[length/2,zb+180],[-length/2,za+180]];
  d.objects.push(o);lastCreated={doc:current,id:o.id};selection=[o.id];primary=o.id;eventId=null;floorSelection=null;vertexIndex=null;curveSelected=false;
 },'已沿边缘放置墙壁 · 可继续点击其他边缘 · Esc / 右键退出');
 if(success){panel='properties';render()}else{selection=previous.selection;primary=previous.primary;lastCreated=previous.lastCreated;prune();render()}
}
canvas.addEventListener('lostpointercapture',()=>{if(drag?.kind==='place-wall')endDrag(true)});
