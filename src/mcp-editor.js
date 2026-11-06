// This fragment is inserted into app.js and deliberately shares its transaction/history state.
const mcpRevisionPrefix=M.uid();let mcpRevisionNumber=0,mcpObserved=null;
function mcpRevision(){const value=snapshot()+'|'+current;if(value!==mcpObserved){mcpObserved=value;mcpRevisionNumber++}return mcpRevisionPrefix+':'+mcpRevisionNumber}
function mcpBusy(){return !!(drag||drawing||editing||propertyScrub||rowRename||layerOrderDrag||floorOrderDrag||formInput||projectSaveTask||document.querySelector('dialog[open]')||document.activeElement?.matches('input,textarea,select,[contenteditable="true"]'))}
function mcpCheck(revision){if(typeof revision!=='string'||revision!==mcpRevision())throw Error('图稿已变化，请重新调用 studio_get_state 后再编辑');if(mcpBusy())throw Error('编辑器正在进行手动操作，请完成或取消后再试')}
function mcpState(includeProject=false){
 const state={revision:mcpRevision(),busy:mcpBusy(),activeDocument:current??null,documents:project.documents.map(d=>({id:d.id,name:d.name,type:d.type,objectCount:d.objects.length})),document:doc()?M.clone(doc()):null,selection:[...selection],selectedEvent:eventId,selectedFloor:floorSelection,view:M.clone(view),undoCount:undo.length,redoCount:redo.length};
 if(includeProject)state.project=M.clone(project);return state;
}
function mcpApply({expectedRevision,operations}){
 mcpCheck(expectedRevision);
 const next=window.StudioMCPOperations.apply(project,current,operations),previous=current;
 if(JSON.stringify(next.project)===snapshot()&&next.activeDocument===current)return {results:next.results,...mcpState()};
 // Validation is complete before entering the same mutate/history path used by UI edits.
 const ok=mutate(()=>{project=next.project;current=next.activeDocument;clear();tool='select';if(previous!==current)view={mode:'plan',side:'front',azimuth:35,elevation:35}},'AI 创作已应用 · 可撤销');
 if(!ok){current=previous;throw Error($('#status').textContent)}
 if(previous!==current)fit();
 return {results:next.results,...mcpState()};
}
async function mcpDispatch(method,args={}){
 if(method==='get_state')return mcpState(!!args.includeProject);
 if(method==='get_schema')return window.StudioMCPOperations.schema();
 if(method==='apply_operations')return mcpApply(args);
 if(method==='history'){mcpCheck(args.expectedRevision);if(!['undo','redo'].includes(args.action))throw Error('action 必须为 undo 或 redo');await command(args.action);return mcpState()}
 if(method==='set_view'){
  mcpCheck(args.expectedRevision);
  if(args.documentId!==undefined&&!project.documents.some(d=>d.id===args.documentId))throw Error('图稿不存在');
  if(args.mode!==undefined&&!['plan','elevation','solid'].includes(args.mode))throw Error('mode 无效');
  const target=project.documents.find(d=>d.id===(args.documentId??current));
  if(!target)throw Error('请先创建图稿');
  if(args.mode&&target.type==='curve'&&args.mode!=='plan')throw Error('曲线图只支持平面视图');
  if(args.ids!==undefined&&(!Array.isArray(args.ids)||args.ids.some(id=>!target.objects.some(o=>o.id===id))))throw Error('选择的组件不存在');
  if(args.documentId!==undefined&&args.documentId!==current)switchDocument(args.documentId);
  if(args.mode!==undefined){view={mode:args.mode,side:'front',azimuth:35,elevation:35,scope:'all'};tool='select'}
  if(args.ids!==undefined){clear();selection=[...new Set(args.ids)];primary=selection[0]??null;const first=doc().objects.find(o=>o.id===primary);if(doc().floors&&first){doc().activeFloor=first.floor;resetFloorListSelection()}}
  render();if(args.fit!==false)fit();return mcpState();
 }
 if(method==='export'){
  if(args.format==='project')return {mimeType:'application/json',text:JSON.stringify({...project,activeDocument:current},null,2),revision:mcpRevision()};
  if(args.format!=='svg')throw Error('format 必须为 svg 或 project');
  if(!doc())throw Error('请先创建图稿');
  const revision=mcpRevision(),d=M.clone(doc()),v=M.clone(view),s=R.scene(d,v,{selection:[],wall:null,ghost:false,camera}),r=d.type==='curve'?{x:0,y:0,w:d.width,h:d.height}:fitExport(R.contentExtent(s),d.width/d.height);
  const a=await R.atlas(d,s,r,Math.min(4096,d.width));
  return {mimeType:'image/svg+xml',text:R.svg(d,s,r,a,true),revision};
 }
 throw Error('未知编辑器方法：'+method);
}
