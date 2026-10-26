// One world-unit lattice is shared by rendering, placement and transforms.
function gridStep(d=doc()){return d?.gridSize??100}
function gridEnabled(e={}){return doc()?.type==='space'&&$('#snap').checked&&!e.ctrlKey&&!e.metaKey}
function gridLength(n,step=gridStep()){return Math.max(step,Math.round(n/step)*step)}
function gridObjectBounds(d,o){
 if(solidTypes.includes(o.type))return solidLocalBounds(o,d);
 if(o.type==='hole'){
  const b=bounds2(o.points);return {min:[...b.min,0],max:[...b.max,0]};
 }
 return null;
}
function gridReference(d,ids,id){
 const o=d.objects.find(o=>o.id===id&&ids.includes(o.id)&&o.type!=='hole')||d.objects.find(o=>ids.includes(o.id));
 return o?gridObjectReference(d,o):[0,0,0];
}
function gridObjectReference(d,o){
 const b=gridObjectBounds(d,o);
 if(b&&o.type!=='hole')return bounds3(Array.from({length:8},(_,n)=>M.world(d,o,[0,1,2].map(i=>(n>>i)&1?b.max[i]:b.min[i])))).min;
 if(o.type==='hole')return bounds3(M.controls(d,o,view.mode).map(c=>c.point)).min;
 return M.origin(d,o);
}
function gridMoveDelta(raw,axes=null){
 if(!drag.gridReference){
  const d=JSON.parse(drag.before).documents.find(d=>d.id===current);
  drag.gridReference=gridReference(d,drag.sourceIds||drag.ids,drag.primary||primary);
  if(drag.floor)drag.gridReference[2]=d.floors.find(f=>f.id===drag.floor).height;
 }
 const step=gridStep(),at=M.add(drag.gridReference,raw),out=[...raw];
 if(axes){for(const i of axes)out[i]=Math.round(at[i]/step)*step-drag.gridReference[i]}
 else for(const axis of [scene.basis.r,scene.basis.down]){
  const n=M.dot(at,axis);for(let i=0;i<3;i++)out[i]+=axis[i]*(Math.round(n/step)*step-n);
 }
 return out;
}
function fitObjectToGrid(d,o,axes=[0,1,2],anchor=null){
 const step=gridStep(d),b=gridObjectBounds(d,o);if(!b)return;
 if(o.type==='hole'){
  const host=d.objects.find(h=>h.id===o.host),frame=o.cut||localFrame(host),lengths=[frame.r,frame.d].map(v=>Math.hypot(...v)),extent=M.sub(b.max,b.min),at=anchor?(o.cut?M.holeLocal(o,M.local(d,host,anchor)):M.faceLocal(host,M.local(d,host,anchor))):b.min;
  const factors=[0,1].map(i=>axes.includes(i)&&extent[i]>1e-8?gridLength(extent[i]*lengths[i],step)/(extent[i]*lengths[i]):1);
  o.points=o.points.map(p=>p.map((v,i)=>at[i]+(v-at[i])*factors[i]));return;
 }
 const extent=M.sub(b.max,b.min),factors=extent.map((n,i)=>axes.includes(i)&&n>1e-8?gridLength(n,step)/n:1);
 let coupled=o.type==='spiral'||o.wallPath?[0,1]:null;
 if([o,...M.holes(d,o)].some(h=>h.curves?.some(v=>Math.abs(v)>1e-7)))coupled=o.type==='wall'?[0,2]:[0,1];
 if(coupled){const i=coupled.find(i=>axes.includes(i));if(i!==undefined)for(const j of coupled)factors[j]=factors[i]}
 const fixed=[...b.min];if(o.type==='plane')fixed[2]=b.max[2];
 scaleHost(o,worldAxes,factors,anchor||M.world(d,o,fixed),d);
 if(['stairs','spiral'].includes(o.type))o.thickness*=factors[2];
 M.updateCounts(o);
}
function gridPlace(d,o,e={}){
 if(!gridEnabled(e))return false;
 fitObjectToGrid(d,o);
 if(o.type==='hole')return true;
 const ref=gridObjectReference(d,o),step=gridStep(d),axes=view.mode==='plan'?[0,1]:[0,1,2];
 for(const i of axes)o.position[i]+=Math.round(ref[i]/step)*step-ref[i];
 moveSnapGuides=[];return true;
}
function gridResize2D(){
 const o=doc().objects.find(o=>o.id===drag.id),info=drag.info,j=drag.index;
 if(info.kind==='spiral'){
  if(drag.radius==='inner')o.inner=Math.max(0,Math.min(o.outer-gridStep()/2,Math.round(o.inner*2/gridStep())*gridStep()/2));
  else{const radius=gridLength(o.outer*2)/2,ratio=o.inner/o.outer;o.outer=radius;o.inner=radius*ratio}
  M.updateCounts(o);return;
 }
 const original=JSON.parse(drag.before).documents.find(d=>d.id===current),source=original.objects.find(o=>o.id===drag.id),old=gridObjectBounds(original,source),now=gridObjectBounds(doc(),o);
 const axes=[0,1,2].filter(i=>Math.abs((old.max[i]-old.min[i])-(now.max[i]-now.min[i]))>1e-6);
 if(drag.corner&&drag.proportional&&axes.length){
  // Round the longest edited dimension, then apply one common factor so Shift
  // preserves the original proportions even when they are off the grid.
  const lengths=o.type==='hole'?[info.frame.r,info.frame.d].map(v=>Math.hypot(...v)):[1,1,1],extent=old.max.map((v,i)=>(v-old.min[i])*(lengths[i]||1)),axis=axes.reduce((a,b)=>extent[a]>=extent[b]?a:b),ratio=gridLength((now.max[axis]-now.min[axis])*(lengths[axis]||1))/extent[axis],v=M.sub(drag.start,M.project(sizeCornerAnchor(info,j),scene.basis));
  editSize(M.add(drag.start,M.mul(v,ratio-1)));return;
 }
 const center=info.world.reduce((a,b)=>M.add(a,M.mul(b,1/info.world.length)),[0,0,0]);
 const anchor=info.world.length===2?info.world[1-j]:info.world.length===4?info.world[(j+2)%4]:center;
 fitObjectToGrid(doc(),o,o.type==='hole'?axes.filter(i=>i<2):axes,anchor);
}
function gridRectanglePoint(q,e){
 if(!gridEnabled(e))return q;
 const origin=M.project([0,0,0],scene.basis),step=gridStep();
 return q.map((v,i)=>origin[i]+Math.round((v-origin[i])/step)*step);
}
