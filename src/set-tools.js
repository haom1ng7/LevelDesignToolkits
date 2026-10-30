// App fragment: immediate, atomic commands shared by every spatial view.
function setToolAvailable(){
 const d=doc(),roots=selected().filter(o=>M.setSolidTypes.has(o.type));
 return d?.type==='space'&&roots.length>=2&&!locked()&&roots.every(o=>o.visible!==false&&M.floor(d,o)?.visible!==false)&&!d.objects.some(h=>h.type==='hole'&&roots.some(o=>o.id===h.host)&&(h.locked||h.visible===false));
}
function applySetTool(mode){
 if(!setToolAvailable()){status('请选中至少两个可见且未锁定的实体，附属空洞也须显示并解锁');return}
 finishEditing();drawing=null;placementGhost=null;tool='select';
 mutate(()=>{selection=M.setComponents(doc(),selection,mode);primary=selection[0]||null;eventId=null;floorSelection=null;vertexIndex=null;},mode==='intersect'?'已保留共同重叠部分 · Ctrl+Z 可撤销':'已删除重叠部分；完全被包裹的组件已删除 · Ctrl+Z 可撤销');canvasFocus();
}
