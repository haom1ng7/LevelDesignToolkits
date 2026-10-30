// Solid rotation is rigid; size handles edit local dimensions around a fixed corner.
const solidTypes=['plane','wall','stairs','ladder','spiral','solid'];
let solidCorner=null;
function solidRoots(){return selected().filter(o=>solidTypes.includes(o.type))}
function solidRotationAvailable(){return worldMovable()&&solidRoots().length>0}
function solidSizeAvailable(){return solidRotationAvailable()&&!floorSelection&&solidRoots().length===1}
function bounds3(points){const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const p of points)for(let i=0;i<3;i++){min[i]=Math.min(min[i],p[i]);max[i]=Math.max(max[i],p[i])}return {min,max}}
function solidCenter(){const b=bounds3(solidRoots().flatMap(o=>M.geometry(doc(),o).flatMap(f=>f.points)));return M.mul(M.add(b.min,b.max),.5)}
function solidRing(axis,center=solidCenter(),basis=scene.basis,radius=pixel()*76){
 const u=worldAxes[(axis+1)%3],v=worldAxes[(axis+2)%3],p=M.project(center,basis),project=a=>M.projectVector(a,basis,center);
 return {axis,center,p,u,v,pu:project(u),pv:project(v),radius,basis,worldRadius:basis.eye?radius*M.cameraDepth(center,basis)/basis.focal:radius};
}
function solidRingPoint(r,angle){if(r.basis.eye)return M.project(M.add(r.center,M.mul(M.add(M.mul(r.u,Math.cos(angle)),M.mul(r.v,Math.sin(angle))),r.worldRadius)),r.basis);return M.add(r.p,M.mul(M.add(M.mul(r.pu,Math.cos(angle)),M.mul(r.pv,Math.sin(angle))),r.radius))}
function solidRingAngle(r,q){if(r.basis.eye){if(Math.abs(M.dot(worldAxes[r.axis],M.perspectiveRay(q,r.basis)))<1e-4)return null;const v=M.sub(M.unproject(q,r.basis,r.center,worldAxes[r.axis]),r.center);return Math.atan2(M.dot(v,r.v),M.dot(v,r.u))}const d=M.sub(q,r.p),det=r.pu[0]*r.pv[1]-r.pu[1]*r.pv[0];return Math.abs(det)<.08?null:Math.atan2((r.pu[0]*d[1]-r.pu[1]*d[0])/det,(d[0]*r.pv[1]-d[1]*r.pv[0])/det)}
function solidLocalBounds(o,d=doc()){
 const b=bounds3(M.geometry(d,o).flatMap(f=>f.points.map(p=>M.local(d,o,p))));
 // Parametric stairs keep their start/end levels even as automatic step counts change.
 if(o.type==='stairs'){b.min[2]=Math.min(...o.flights.flatMap(f=>[f.start,f.end]))-o.thickness;b.max[2]=Math.max(...o.flights.flatMap(f=>[f.start,f.end]))}
 if(o.type==='spiral'){b.min=[-o.outer,-o.outer,o.start-o.thickness];b.max=[o.outer,o.outer,o.end]}
 return b;
}
function solidResizeInfo(){
 if(!solidSizeAvailable())return null;const o=solidRoots()[0],b=solidLocalBounds(o),axes=worldAxes.map(a=>M.mat(o.orientation,a)),vectors=axes.map(a=>[M.dot(a,scene.basis.r),M.dot(a,scene.basis.down)]),corners=Array.from({length:8},(_,n)=>[0,1,2].map(i=>(n>>i)&1?b.max[i]:b.min[i]));
 const index=solidCorner?.id===o.id?solidCorner.index:7;
 return {id:o.id,b,axes,vectors:axes.map(a=>M.projectVector(a,scene.basis,M.world(doc(),o,corners[index]))),corners,index,world:corners.map(p=>M.world(doc(),o,p))};
}
function solidPair(vectors){let axes=[0,1],best=0;for(const pair of [[0,1],[0,2],[1,2]]){const [a,b]=pair.map(i=>vectors[i]),det=Math.abs(a[0]*b[1]-a[1]*b[0]);if(det>best){best=det;axes=pair}}return axes}
function solidSizeDelta(axes,delta,vectors){
 const out=[0,0,0];if(axes.length===1){const i=axes[0],v=vectors[i],length=M.dot(v,v);if(length<.035)return null;out[i]=M.dot(delta,v)/length}
 else{const [i,j]=axes,a=vectors[i],b=vectors[j],det=a[0]*b[1]-a[1]*b[0];if(Math.abs(det)<.08)return null;out[i]=(delta[0]*b[1]-delta[1]*b[0])/det;out[j]=(a[0]*delta[1]-a[1]*delta[0])/det}return out;
}
function solidTransformMarkup(){
 const k=pixel();let s='';
 if(tool==='rotate'&&solidRotationAvailable()){
  const center=drag?.kind==='solid-rotate'?drag.center:solidCenter();if(scene.basis.eye&&M.cameraDepth(center,scene.basis)<scene.basis.near)return '';s='<g class="world-gizmo" data-solid-transform="rotate">';
  for(let i=0;i<3;i++){const r=solidRing(i,center),points=Array.from({length:97},(_,j)=>solidRingPoint(r,j*Math.PI/48)),path=R.path(points),active=drag?.kind==='solid-rotate'&&drag.axis===i;
   s+=`<g data-world-rotate="${i}" role="button" aria-label="绕 ${worldNames[i]} 轴旋转" class="${active?'active':''}" style="--gizmo-color:${worldColors[i]};cursor:grab"><title>拖动绕 ${worldNames[i]} 轴旋转；Shift 每次 15°，Ctrl 暂停吸附</title><path d="${path}" fill="none" stroke="white" stroke-width="${k*5}" pointer-events="none"/><path class="gizmo-axis" d="${path}" fill="none" stroke-width="${k*2.5}"/><path class="gizmo-ring-hit" d="${path}" fill="none" stroke="transparent" stroke-width="${k*12}"/></g>`;
   const p=solidRingPoint(r,Math.PI*.22+i*.7);s+=`<text x="${p[0]+k*6}" y="${p[1]-k*6}" fill="${worldColors[i]}" stroke="white" stroke-width="${k*3}" paint-order="stroke" font-size="${k*12}" pointer-events="none">${worldNames[i]}</text>`;
  }
  if(drag?.kind==='solid-rotate')s+=`<text x="${M.project(center,scene.basis)[0]}" y="${M.project(center,scene.basis)[1]+k*18}" text-anchor="middle" fill="${R.contrast(doc().background)}" font-size="${k*13}" pointer-events="none">${(drag.angle*180/Math.PI).toFixed(1)}°</text>`;
  return s+'</g>';
 }
 if(tool!=='size')return '';const info=solidResizeInfo();if(!info)return '';const {world,index,vectors}=info;if(scene.basis.eye&&M.cameraDepth(world[index],scene.basis)<scene.basis.near)return '';const points=world.map(p=>M.project(p,scene.basis)),active=points[index];
 s='<g class="world-gizmo" data-solid-transform="size">';
 for(let n=0;n<8;n++)for(let i=0;i<3;i++)if(!(n&(1<<i)))s+=`<path d="${R.path([points[n],points[n|(1<<i)]])}" fill="none" stroke="${R.contrast(doc().background)}" stroke-opacity=".55" stroke-width="${k}" stroke-dasharray="${k*4} ${k*3}" pointer-events="none"/>`;
 for(let i=0;i<3;i++){
  const available=!!solidSizeDelta([i],[0,0],vectors),p=M.add(active,M.mul(vectors[i],k*66)),label=M.add(p,M.mul(vectors[i],k*15));
  s+=`<g ${available?`data-solid-size-axis="${i}" role="button" aria-label="调整本地 ${worldNames[i]} 尺寸"`:'opacity=".25" pointer-events="none"'} class="${drag?.kind==='solid-size'&&drag.axes.length===1&&drag.axes[0]===i?'active':''}" style="--gizmo-color:${worldColors[i]};cursor:ew-resize"><title>拖动只调整本地 ${worldNames[i]} 尺寸，对角点固定</title><path d="${R.path([active,p])}" stroke="white" stroke-width="${k*5}"/><path class="gizmo-axis" d="${R.path([active,p])}" stroke-width="${k*2.5}"/><rect class="gizmo-tip" x="${p[0]-k*4}" y="${p[1]-k*4}" width="${k*8}" height="${k*8}" stroke="white" stroke-width="${k}"/><path class="gizmo-size-hit" d="${R.path([active,p])}" stroke="transparent" stroke-width="${k*12}"/><text x="${label[0]}" y="${label[1]+k*4}" text-anchor="middle" fill="${worldColors[i]}" stroke="white" stroke-width="${k*3}" paint-order="stroke" font-size="${k*12}" pointer-events="none">${worldNames[i]}</text></g>`;
 }
 // Paint nearer corners last so a top/front view still has reachable handles.
 const order=Array.from({length:8},(_,i)=>i).sort((a,b)=>M.dot(world[a],scene.basis.n)-M.dot(world[b],scene.basis.n));
 for(const n of order){if(scene.basis.eye&&M.cameraDepth(world[n],scene.basis)<scene.basis.near)continue;const p=points[n];s+=`<g data-solid-corner="${n}" role="button" aria-label="拖动角点 ${n+1} 调整尺寸，对角点固定" style="cursor:crosshair"><title>拖动调整长宽高，对角点固定；旁边的 X/Y/Z 手柄可只改一个尺寸</title><circle cx="${p[0]}" cy="${p[1]}" r="${k*10}" fill="transparent"/><circle cx="${p[0]}" cy="${p[1]}" r="${k*(n===index?5:4)}" fill="${n===index?'#f2c94c':'white'}" stroke="#333333" stroke-width="${k*1.5}" pointer-events="none"/></g>`}
 return s+'</g>';
}
function beginSolidTransform(e,q){
 const ringTarget=e.target.closest('[data-world-rotate]');
 if(ringTarget&&tool==='rotate'&&solidRotationAvailable()){
  const axis=+ringTarget.dataset.worldRotate,r=solidRing(axis),startAngle=solidRingAngle(r,q);let tangent=null;
  if(startAngle===null){let best=Infinity,angle=0;for(let j=0;j<96;j++){const a=j*Math.PI/48,gap=Math.hypot(...M.sub(q,solidRingPoint(r,a)));if(gap<best){best=gap;angle=a}}tangent=M.mul(M.add(M.mul(r.pu,-Math.sin(angle)),M.mul(r.pv,Math.cos(angle))),r.radius);if(Math.hypot(...tangent)<r.radius*.15)tangent=M.mul(Math.hypot(...r.pu)>Math.hypot(...r.pv)?r.pu:r.pv,r.radius)}
  drag={kind:'solid-rotate',before:snapshot(),selection:[...selection],primary,axis,center:r.center,ring:r,start:q,last:q,lastAngle:startAngle,rawAngle:0,angle:0,tangent,snapped:null,changed:false};canvas.style.cursor='grabbing';capture(e);drawHandles();return true;
 }
 const cornerTarget=e.target.closest('[data-solid-corner]'),axisTarget=e.target.closest('[data-solid-size-axis]');if(!cornerTarget&&!axisTarget||tool!=='size')return false;const info=solidResizeInfo();if(!info)return false;
 if(cornerTarget){info.index=+cornerTarget.dataset.solidCorner;solidCorner={id:info.id,index:info.index};info.vectors=info.axes.map(a=>M.projectVector(a,scene.basis,info.world[info.index]))}
 const axes=axisTarget?[+axisTarget.dataset.solidSizeAxis]:solidPair(info.vectors);if(!solidSizeDelta(axes,[0,0],info.vectors))return false;
 const anchor=info.world[info.index^7];drag={kind:'solid-size',before:snapshot(),selection:[...selection],primary,id:info.id,info,axes,anchor,basis:M.clone(scene.basis),start:q,last:q,changed:false};canvas.style.cursor='crosshair';capture(e);drawHandles();return true;
}
function solidRigidRotation(angle){
 const matrix=M.axisRotation(worldAxes[drag.axis],angle);for(const o of selected().filter(o=>o.type!=='hole')){const p=M.add(drag.center,M.mat(matrix,M.sub(M.origin(doc(),o),drag.center)));o.position=M.sub(p,[0,0,M.floor(doc(),o)?.height||0]);o.orientation=M.product(matrix,o.orientation);if(o.type==='text')o.textAngle+=angle*180/Math.PI}
}
function constrainSolidFactors(o,factors,axes){
 // Circular arcs and spiral radii keep their shape; their two radial dimensions move together.
 let coupled=o.type==='spiral'||o.wallPath?[0,1]:null;
 if([o,...M.holes(doc(),o)].some(h=>h.curves?.some(v=>Math.abs(v)>1e-7)))coupled=o.type==='wall'?[0,2]:[0,1];
 if(coupled){const i=coupled.find(i=>axes.includes(i));if(i!==undefined)for(const j of coupled)factors[j]=factors[i]}
 if(o.type==='ladder'){factors[0]=Math.max(factors[0],5/o.span,1/o.railWidth);factors[1]=Math.max(factors[1],1/o.thickness)}
}
function resizeSolidFromCorner(delta,grid=false){
 const o=doc().objects.find(o=>o.id===drag.id),{b,index}=drag.info,extent=M.sub(b.max,b.min),factors=extent.map((n,i)=>Math.max(grid?gridStep()/n:.02,1+delta[i]*((index>>i)&1?1:-1)/n));
 constrainSolidFactors(o,factors,drag.axes);
 const original=M.clone(o),before=doc().objects.filter(t=>t.type==='text').map(t=>({t,position:[...t.position]}));
 scaleHost(o,worldAxes,factors,drag.anchor);if(['stairs','spiral'].includes(o.type))o.thickness*=factors[2];
 // Size changes leave label typography intact and affect only selected annotations.
 for(const {t,position} of before)t.position=position;
 for(const t of selected().filter(t=>['text','marker','route'].includes(t.type))){const at=p=>{const local=M.local(doc(),original,p),a=M.local(doc(),original,drag.anchor);return M.world(doc(),original,local.map((v,i)=>a[i]+(v-a[i])*factors[i]))},oldOrigin=M.origin(doc(),t),next=at(oldOrigin);if(t.type==='route')t.points=t.points.map(p=>M.mat(M.transpose(t.orientation),M.sub(at(M.world(doc(),t,p)),next)));t.position=M.sub(next,[0,0,M.floor(doc(),t)?.height||0])}
 M.updateCounts(o);return extent.map((n,i)=>n*factors[i]);
}
function moveSolidTransform(q,e){
 if(!drag.changed&&Math.hypot(...M.sub(q,drag.start))<pixel()*3)return;
 if(drag.kind==='solid-rotate'){
  if(drag.tangent)drag.rawAngle=M.dot(M.sub(q,drag.start),drag.tangent)/(M.dot(drag.tangent,drag.tangent)||1);
  else{const angle=solidRingAngle(drag.ring,q);if(angle===null||Math.hypot(...M.sub(q,drag.ring.p))<pixel()*3)return;drag.rawAngle+=Math.atan2(Math.sin(angle-drag.lastAngle),Math.cos(angle-drag.lastAngle));drag.lastAngle=angle}
  const angle=snappedAngle(drag.rawAngle,e);project=JSON.parse(drag.before);solidRigidRotation(angle);drag.angle=angle;status(`旋转 ${worldNames[drag.axis]} · ${(angle*180/Math.PI).toFixed(1)}° · Esc 取消`);
 }else{
  let delta;if(drag.basis.eye){const values=M.dragAxes(q,drag.start,drag.info.world[drag.info.index],drag.axes.map(i=>drag.info.axes[i]),drag.basis);if(!values)return;delta=[0,0,0];drag.axes.forEach((axis,j)=>delta[axis]=values[j])}else delta=solidSizeDelta(drag.axes,M.sub(q,drag.start),drag.info.vectors);if(!delta)return;
  if(gridEnabled(e)){const extent=M.sub(drag.info.b.max,drag.info.b.min);for(const i of drag.axes){const sign=(drag.info.index>>i)&1?1:-1;delta[i]=(gridLength(extent[i]+delta[i]*sign)-extent[i])*sign}}
  project=JSON.parse(drag.before);const dimensions=resizeSolidFromCorner(delta,gridEnabled(e));status(`长 / 宽 / 高：${dimensions.map(n=>n.toFixed(1)).join(' / ')} · 对角点固定 · Esc 取消`);
 }
 drag.last=q;drag.changed=true;drawCanvas();
}
