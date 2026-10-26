// The visible order is also the range-selection order. Holes stay under their host.
let layerAnchor=null,layerOrderDrag=null,layerClickSuppressed=false;
function componentListRows(){
 const d=doc(),filter=$('#layer-filter').value;if(!d)return [];
 const inFloor=o=>!d.floors||o.floor===d.activeFloor;
 if(filter==='hole')return d.objects.filter(o=>o.type==='hole'&&inFloor(o));
 return [...d.objects].reverse().filter(o=>o.type!=='hole'&&inFloor(o)&&(filter==='all'||o.type===filter)).flatMap(o=>filter==='all'?[o,...d.objects.filter(h=>h.type==='hole'&&h.host===o.id)]:[o]);
}
function chooseLayer(id,e){
 finishPropertyScrub(true);
 if(!e.shiftKey){choose(id,e.ctrlKey||e.metaKey,true);return}
 const ids=componentListRows().map(o=>o.id),anchor=layerAnchor?.doc===current&&ids.includes(layerAnchor.id)?layerAnchor.id:ids.includes(primary)?primary:id;
 const from=ids.indexOf(anchor),to=ids.indexOf(id);if(from<0||to<0)return;
 const range=ids.slice(Math.min(from,to),Math.max(from,to)+1);
 selection=e.ctrlKey||e.metaKey?[...new Set([...selection,...range])]:range;primary=id;panel='properties';layerAnchor={doc:current,id:anchor};
 eventId=null;floorSelection=null;vertexIndex=null;curveText=null;curveSelected=false;
 if(view.mode==='elevation'&&view.scope==='selection')view.focusIds=[...selection];render();canvasFocus();
}
function layerOrderScope(){return current+'|'+(doc()?.activeFloor||'')+'|'+$('#layer-filter').value}
function layerOrderLocked(objects){return objects.some(o=>o.locked||o.type==='hole'&&doc().objects.find(h=>h.id===o.host)?.locked)}
function moveComponentStep(direction){
 const d=doc();if(!d||!selection.length)return;
 const ids=childIds();if(layerOrderLocked(d.objects.filter(o=>ids.has(o.id))))return;
 const lanes=new Map(),replacements=new Map();
 for(const o of componentListRows()){
  if(o.type==='hole'&&ids.has(o.host))continue;
  const parent=o.type==='hole'?o.host:null;if(!lanes.has(parent))lanes.set(parent,[]);lanes.get(parent).push(o);
 }
 for(const lane of lanes.values()){
  const next=[...lane],start=direction<0?1:next.length-2,end=direction<0?next.length:-1,step=direction<0?1:-1;
  for(let i=start;i!==end;i+=step){const j=i+direction;if(ids.has(next[i].id)&&!ids.has(next[j].id))[next[i],next[j]]=[next[j],next[i]]}
  // Replace only listed sibling slots; host links and omitted objects stay intact.
  lane.forEach((o,i)=>{if(o!==next[i])replacements.set(o.id,next[i])});
 }
 if(!replacements.size)return;
 mutate(()=>{d.objects=d.objects.map(o=>replacements.get(o.id)||o)},direction<0?'已上移组件 · Ctrl+Z 撤销':'已下移组件 · Ctrl+Z 撤销');
}
function layerOrderCandidates(a){
 const visible=componentListRows(),sameLevel=o=>a.host?o.type==='hole'&&o.host===a.host:o.type!=='hole';
 return visible.filter(o=>sameLevel(o)&&!a.ids.includes(o.id)).map(o=>{
  const rows=[document.querySelector(`[data-layer="${o.id}"]`)?.closest('.layer')];
  if(!a.host)for(const h of visible.filter(h=>h.type==='hole'&&h.host===o.id))rows.push(document.querySelector(`[data-layer="${h.id}"]`)?.closest('.layer'));
  const boxes=rows.filter(Boolean).map(row=>row.getBoundingClientRect());
  return {id:o.id,top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom))};
 });
}
function previewLayerOrder(a){
 if(layerOrderDrag!==a||!a.moved)return;
 if(a.scope!==layerOrderScope()||a.before!==snapshot()||!a.row.isConnected){finishLayerOrder(true);return}
 const [x,y]=a.last,list=$('#layers'),bounds=list.getBoundingClientRect(),pane=list.closest('aside').getBoundingClientRect();
 const top=Math.max(bounds.top,pane.top,0),bottom=Math.min(bounds.bottom,pane.bottom,innerHeight);
 a.ghost.style.left=Math.max(4,Math.min(x+12,innerWidth-a.ghost.offsetWidth-4))+'px';a.ghost.style.top=Math.max(4,Math.min(y+12,innerHeight-a.ghost.offsetHeight-4))+'px';
 a.target=null;a.line.hidden=true;
 if(x<bounds.left||x>bounds.right||y<top||y>bottom)return;
 if(a.host){
  const siblings=componentListRows().filter(o=>o.type==='hole'&&o.host===a.host).map(o=>document.querySelector(`[data-layer="${o.id}"]`).closest('.layer').getBoundingClientRect());
  if(y<Math.min(...siblings.map(b=>b.top))-4||y>Math.max(...siblings.map(b=>b.bottom))+4)return;
 }
 const candidates=layerOrderCandidates(a);if(!candidates.length)return;
 const next=candidates.find(b=>y<(b.top+b.bottom)/2),target=next||candidates.at(-1);
 const lineY=clamp(next?target.top:target.bottom,top,bottom);
 a.target={id:target.id,before:!!next};
 a.line.style.left=bounds.left+'px';a.line.style.top=(lineY-1)+'px';a.line.style.width=bounds.width+'px';a.line.hidden=false;
}
function scrollLayerOrder(a){
 if(layerOrderDrag!==a)return;
 const pane=$('#layers').closest('aside'),b=pane.getBoundingClientRect(),[x,y]=a.last,edge=36;
 if(x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom){const dy=y<b.top+edge?-Math.ceil((b.top+edge-y)/3):y>b.bottom-edge?Math.ceil((y-b.bottom+edge)/3):0;if(dy){pane.scrollTop+=dy;previewLayerOrder(a)}}
 a.frame=requestAnimationFrame(()=>scrollLayerOrder(a));
}
document.addEventListener('pointerdown',e=>{
 layerClickSuppressed=false;if(layerOrderDrag)finishLayerOrder(true);
 const button=e.target.closest('#layers [data-layer]');if(!button||e.button!==0||e.shiftKey||e.ctrlKey||e.metaKey||e.altKey||rowRename)return;
 const visible=componentListRows(),source=visible.find(o=>o.id===button.dataset.layer);if(!source)return;
 const ids=visible.filter(o=>(selection.includes(source.id)?selection.includes(o.id):o.id===source.id)&&(source.type==='hole'?o.type==='hole'&&o.host===source.host:o.type!=='hole')).map(o=>o.id);
 const carried=doc().objects.filter(o=>ids.includes(o.id)||o.type==='hole'&&ids.includes(o.host));if(layerOrderLocked(carried))return;
 layerOrderDrag={id:source.id,ids,host:source.type==='hole'?source.host:null,scope:layerOrderScope(),before:snapshot(),pointer:e.pointerId,start:[e.clientX,e.clientY],last:[e.clientX,e.clientY],row:button.closest('.layer'),selection:selection.includes(source.id)?[...selection]:[source.id],moved:false};
},true);
document.addEventListener('pointermove',e=>{
 const a=layerOrderDrag;if(!a||e.pointerId!==a.pointer)return;a.last=[e.clientX,e.clientY];
 if(!a.moved&&Math.hypot(e.clientX-a.start[0],e.clientY-a.start[1])<5)return;
 e.preventDefault();
 if(!a.moved){
  a.moved=true;rowStamp=null;layerClickSuppressed=true;
  a.ghost=document.createElement('div');a.ghost.className='layer-drag-ghost';a.ghost.setAttribute('aria-hidden','true');
  a.ghost.textContent=doc().objects.find(o=>o.id===a.id).name+(a.ids.length>1?' · '+a.ids.length+' 个组件':'');a.ghost.style.width=a.row.getBoundingClientRect().width+'px';
  a.line=document.createElement('div');a.line.className='layer-insertion-line';a.line.hidden=true;document.body.append(a.ghost,a.line);document.body.classList.add('layer-ordering');
  for(const id of a.ids)document.querySelector(`[data-layer="${id}"]`)?.closest('.layer').classList.add('layer-dragging');
  $('#layers').setPointerCapture?.(a.pointer);a.frame=requestAnimationFrame(()=>scrollLayerOrder(a));
 }
 previewLayerOrder(a);
},true);
function finishLayerOrder(cancel=false){
 const a=layerOrderDrag;if(!a)return;layerOrderDrag=null;cancelAnimationFrame(a.frame);a.ghost?.remove();a.line?.remove();document.body.classList.remove('layer-ordering');document.querySelectorAll('.layer-dragging').forEach(row=>row.classList.remove('layer-dragging'));
 const list=$('#layers');if(list.hasPointerCapture?.(a.pointer))list.releasePointerCapture(a.pointer);
 if(cancel||!a.moved||!a.target||a.scope!==layerOrderScope()||a.before!==snapshot())return;
 const d=doc(),objects=d.objects.filter(o=>a.ids.includes(o.id)||o.type==='hole'&&a.ids.includes(o.host));if(layerOrderLocked(objects))return;
 const order=componentListRows().filter(o=>a.host?o.type==='hole'&&o.host===a.host:o.type!=='hole').map(o=>o.id),remaining=order.filter(id=>!a.ids.includes(id)),index=remaining.indexOf(a.target.id)+(a.target.before?0:1);
 remaining.splice(index,0,...a.ids);if(remaining.every((id,i)=>id===order[i]))return;
 mutate(()=>{
  const ids=new Set(objects.map(o=>o.id)),rest=d.objects.filter(o=>!ids.has(o.id));
  const block=a.host?objects:a.ids.slice().reverse().flatMap(id=>[d.objects.find(o=>o.id===id),...d.objects.filter(o=>o.type==='hole'&&o.host===id)]);
  const index=rest.findIndex(o=>o.id===a.target.id)+(a.host?!a.target.before:a.target.before);rest.splice(index,0,...block);d.objects=rest;
  selection=a.selection;primary=a.id;layerAnchor={doc:current,id:a.id};eventId=null;floorSelection=null;vertexIndex=null;tool='move';
  if(view.mode==='elevation'&&view.scope==='selection')view.focusIds=[...selection];
 },'已调整组件顺序 · Ctrl+Z 撤销');
}
document.addEventListener('pointerup',e=>{if(layerOrderDrag&&e.pointerId===layerOrderDrag.pointer){if(layerOrderDrag.moved){layerOrderDrag.last=[e.clientX,e.clientY];previewLayerOrder(layerOrderDrag)}finishLayerOrder()}},true);
document.addEventListener('pointercancel',e=>{if(layerOrderDrag&&e.pointerId===layerOrderDrag.pointer)finishLayerOrder(true)},true);
$('#layers').addEventListener('lostpointercapture',()=>finishLayerOrder(true));
window.addEventListener('blur',()=>finishLayerOrder(true));
window.addEventListener('resize',()=>finishLayerOrder(true));
document.addEventListener('keydown',e=>{if(layerOrderDrag&&(e.key==='Escape'||(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z')){e.preventDefault();e.stopImmediatePropagation();finishLayerOrder(true)}},true);
document.addEventListener('click',e=>{if(layerClickSuppressed){layerClickSuppressed=false;if(e.detail>0){e.preventDefault();e.stopImmediatePropagation()}}},true);
