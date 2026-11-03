// Floor positions are list positions; changing the order never changes heights or IDs.
let floorOrderDrag=null,floorClickSuppressed=false,floorListState=null;
function resetFloorListSelection(){floorListState=null}
function floorListIds(){const d=doc();return floorListState?.doc===current?floorListState.ids.filter(id=>d?.floors?.some(f=>f.id===id)):d?.floors?[d.activeFloor]:[]}
function renderFloors(d){
 if(floorOrderDrag)finishFloorOrder(true);
 const selectedIds=floorListIds();
 $('#floors').innerHTML=d?.floors?d.floors.map((f,i)=>{
  const shortcut=i<10?String((i+1)%10):'',hint=`楼层列表中的第 ${i+1} 层`;
  return `<div class="floor-row"><button data-floor="${f.id}" class="${selectedIds.includes(f.id)?'active':''}" aria-pressed="${selectedIds.includes(f.id)}" aria-current="${d.activeFloor===f.id}" ${shortcut?`aria-keyshortcuts="${shortcut}"`:''} style="touch-action:none;user-select:none" title="${hint}">${R.esc(f.name)}<small>${+f.height.toFixed(1)}</small></button><button data-floor-visible="${f.id}" title="楼层${f.visible?'当前可见':'当前隐藏'}"><span class="visibility-dot" aria-hidden="true">${f.visible?'●':'○'}</span></button></div>`;
 }).join(''):'';
}
function chooseFloorList(id,e){
 if(!e.ctrlKey&&!e.metaKey&&!e.shiftKey){chooseFloor(id);return}
 const d=doc(),order=d.floors.map(f=>f.id),previous=floorListIds(),anchor=floorListState?.doc===current&&order.includes(floorListState.anchor)?floorListState.anchor:d.activeFloor,mod=e.ctrlKey||e.metaKey;
 let ids;
 if(e.shiftKey){const from=order.indexOf(anchor),to=order.indexOf(id),range=order.slice(Math.min(from,to),Math.max(from,to)+1);ids=mod?[...new Set([...previous,...range])]:range}
 else ids=previous.includes(id)?previous.filter(f=>f!==id):[...previous,id];
 floorListState={doc:current,ids,anchor:e.shiftKey?anchor:id};renderFloors(d);
}
function chooseFloor(id){
 if(!floor(id))return;
 finishFloorOrder(true);finishLayerOrder(true);finishPropertyScrub(true);stopCameraNavigation();if(drag)endDrag(true);finishEditing();
 const d=doc();floorListState={doc:current,ids:[id],anchor:id};layerAnchor=null;d.activeFloor=id;view.face=null;view.faceHost=null;drawing=null;placementGhost=null;
 selection=d.objects.filter(o=>o.floor===id&&o.visible!==false).map(o=>o.id);primary=selection.find(id=>d.objects.find(o=>o.id===id)?.type!=='hole')||selection[0]||null;
 floorSelection=id;eventId=null;vertexIndex=null;curveText=null;curveSelected=false;tool='move';canvas.style.cursor='default';render();persist();
}
function floorShortcut(e){
 if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||composingKey(e)||!/^\d$/.test(e.key)||!doc()?.floors||floorOrderDrag?.moved||layerOrderDrag?.moved)return false;
 const target=doc().floors[e.key==='0'?9:Number(e.key)-1];if(!target)return false;
 e.preventDefault();if(!e.repeat){rowStamp=null;chooseFloor(target.id);canvasFocus()}return true;
}
function previewFloorOrder(a){
 if(floorOrderDrag!==a||!a.moved)return;
 if(a.doc!==current||a.before!==snapshot()||!a.row.isConnected){finishFloorOrder(true);return}
 const [x,y]=a.last,list=$('#floors'),b=list.getBoundingClientRect(),pane=list.closest('aside').getBoundingClientRect(),top=Math.max(b.top,pane.top,0),bottom=Math.min(b.bottom,pane.bottom,innerHeight);
 a.ghost.style.left=clamp(x+12,4,Math.max(4,innerWidth-a.ghost.offsetWidth-4))+'px';a.ghost.style.top=clamp(y+12,4,Math.max(4,innerHeight-a.ghost.offsetHeight-4))+'px';
 a.target=null;a.line.hidden=true;if(x<b.left||x>b.right||y<top||y>bottom)return;
 const candidates=doc().floors.filter(f=>!a.ids.includes(f.id)).map(f=>({id:f.id,box:document.querySelector(`[data-floor="${f.id}"]`).closest('.floor-row').getBoundingClientRect()}));
 const next=candidates.find(f=>y<(f.box.top+f.box.bottom)/2),target=next||candidates.at(-1);if(!target)return;
 a.target={id:target.id,before:!!next};a.line.style.left=b.left+'px';a.line.style.top=(clamp(next?target.box.top:target.box.bottom,top,bottom)-1)+'px';a.line.style.width=b.width+'px';a.line.hidden=false;
}
function scrollFloorOrder(a){
 if(floorOrderDrag!==a)return;
 const pane=$('#floors').closest('aside'),b=pane.getBoundingClientRect(),[x,y]=a.last,edge=36;
 if(x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom){const dy=y<b.top+edge?-Math.ceil((b.top+edge-y)/3):y>b.bottom-edge?Math.ceil((y-b.bottom+edge)/3):0;if(dy){pane.scrollTop+=dy;previewFloorOrder(a)}}
 a.frame=requestAnimationFrame(()=>scrollFloorOrder(a));
}
document.addEventListener('pointerdown',e=>{
 floorClickSuppressed=false;finishFloorOrder(true);
 const button=e.target.closest('#floors [data-floor]');if(!button||e.button!==0||e.shiftKey||e.ctrlKey||e.metaKey||e.altKey||rowRename||doc().floors.length<2)return;
 const id=button.dataset.floor,selectedIds=floorListIds(),ids=doc().floors.filter(f=>selectedIds.includes(id)?selectedIds.includes(f.id):f.id===id).map(f=>f.id);
 floorOrderDrag={id,ids,doc:current,before:snapshot(),pointer:e.pointerId,start:[e.clientX,e.clientY],last:[e.clientX,e.clientY],row:button.closest('.floor-row'),moved:false};
},true);
document.addEventListener('pointermove',e=>{
 const a=floorOrderDrag;if(!a||e.pointerId!==a.pointer)return;a.last=[e.clientX,e.clientY];
 if(!a.moved&&Math.hypot(e.clientX-a.start[0],e.clientY-a.start[1])<5)return;
 e.preventDefault();
 if(!a.moved){
  a.moved=true;rowStamp=null;floorClickSuppressed=true;
  a.ghost=document.createElement('div');a.ghost.className='layer-drag-ghost floor-drag-ghost';a.ghost.setAttribute('aria-hidden','true');a.ghost.textContent=floor(a.id).name+(a.ids.length>1?' · '+a.ids.length+' 个楼层':'');a.ghost.style.width=a.row.getBoundingClientRect().width+'px';
  a.line=document.createElement('div');a.line.className='layer-insertion-line floor-insertion-line';a.line.hidden=true;document.body.append(a.ghost,a.line);document.body.classList.add('layer-ordering');
  $('#floors').setPointerCapture?.(a.pointer);a.frame=requestAnimationFrame(()=>scrollFloorOrder(a));
 }
 previewFloorOrder(a);
},true);
function finishFloorOrder(cancel=false){
 const a=floorOrderDrag;if(!a)return;floorOrderDrag=null;cancelAnimationFrame(a.frame);a.ghost?.remove();a.line?.remove();a.row.classList.remove('floor-dragging');document.body.classList.remove('layer-ordering');
 const list=$('#floors');if(list.hasPointerCapture?.(a.pointer))list.releasePointerCapture(a.pointer);
 if(cancel||!a.moved||!a.target||a.doc!==current||a.before!==snapshot())return;
 const d=doc(),remaining=d.floors.filter(f=>!a.ids.includes(f.id)),block=d.floors.filter(f=>a.ids.includes(f.id)),index=remaining.findIndex(f=>f.id===a.target.id)+(a.target.before?0:1);remaining.splice(index,0,...block);
 if(remaining.every((f,i)=>f===d.floors[i]))return;
 const success=mutate(()=>{d.floors=remaining},'已调整楼层顺序 · 数字键按新顺序切换 · Ctrl+Z 撤销');
 if(success){floorListState={doc:current,ids:[...a.ids],anchor:a.id};renderFloors(d)}
}
document.addEventListener('pointerup',e=>{if(floorOrderDrag&&e.pointerId===floorOrderDrag.pointer){if(floorOrderDrag.moved){floorOrderDrag.last=[e.clientX,e.clientY];previewFloorOrder(floorOrderDrag)}finishFloorOrder()}},true);
document.addEventListener('pointercancel',e=>{if(floorOrderDrag&&e.pointerId===floorOrderDrag.pointer)finishFloorOrder(true)},true);
$('#floors').addEventListener('lostpointercapture',()=>finishFloorOrder(true));
window.addEventListener('blur',()=>finishFloorOrder(true));window.addEventListener('resize',()=>finishFloorOrder(true));
document.addEventListener('keydown',e=>{if(floorOrderDrag&&(e.key==='Escape'||(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z')){e.preventDefault();e.stopImmediatePropagation();finishFloorOrder(true)}},true);
document.addEventListener('click',e=>{if(floorClickSuppressed){floorClickSuppressed=false;if(e.detail>0){e.preventDefault();e.stopImmediatePropagation()}}},true);
