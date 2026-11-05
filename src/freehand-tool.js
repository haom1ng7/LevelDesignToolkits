// App fragment: sample a stroke in screen pixels; only the finished plane enters history.
function beginFreehand(e,q){
 if(!enabled('freehand')||drag)return;
 const r=stage.getBoundingClientRect(),height=floor(doc().activeFloor)?.height||0;
 drawing={kind:'freehand',points:[M.unproject(q,scene.basis,[0,0,height],[0,0,1])]};
 drag={kind:'freehand',pointer:e.pointerId,height,scale:[r.width/camera.w,r.height/camera.h],spacing:2};
 capture(e);drawHandles();
}
function freehandDistance(a,b,stroke){return Math.hypot((a[0]-b[0])*stroke.scale[0],(a[1]-b[1])*stroke.scale[1])}
function moveFreehand(e,force=false){
 const a=drag;if(a?.kind!=='freehand'||e.pointerId!==a.pointer||drawing?.kind!=='freehand')return;
 const samples=e.getCoalescedEvents?.()||[];
 for(const sample of [...samples,e]){
  const p=M.unproject(point(sample),scene.basis,[0,0,a.height],[0,0,1]),points=drawing.points;
  if(freehandDistance(points.at(-1),p,a)<(force ? .01 : a.spacing))continue;
  points.push(p);
  // Bound a long stroke without truncating its end or creating excessive SVG nodes.
  if(points.length>=8192){drawing.points=points.filter((_,i)=>i%2===0||i===points.length-1);a.spacing*=2}
 }
 drawHandles();
}
function simplifyFreehand(points,stroke,tolerance){
 const ring=[...points,points[0]],screen=ring.map(p=>[p[0]*stroke.scale[0],p[1]*stroke.scale[1]]),keep=new Set([0,ring.length-1]),stack=[[0,ring.length-1]];
 while(stack.length){
  const [start,end]=stack.pop(),a=screen[start],b=screen[end],dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;let far=-1,max=tolerance*tolerance;
  for(let i=start+1;i<end;i++){
   const p=screen[i],t=length?clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length,0,1):0,d=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2;
   if(d>max){max=d;far=i}
  }
  if(far!==-1){keep.add(far);stack.push([start,far],[far,end])}
 }
 return [...keep].sort((a,b)=>a-b).slice(0,-1).map(i=>ring[i]);
}
function finishFreehand(stroke,cancel){
 if(cancel){drawing=null;tool='select';restoreCreationSelection();status('已取消自由绘制');return}
 const points=drawing.points.slice();
 while(points.length>1&&freehandDistance(points[0],points.at(-1),stroke)<4)points.pop();
 const area=Math.abs(points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+p[0]*q[1]-q[0]*p[1]},0))*stroke.scale[0]*stroke.scale[1]/2;
 if(points.length<3||area<16){drawing={kind:'freehand',points:[]};drawHandles();status('请按住左键画出有面积的轮廓，松开自动闭合');return}
 let tolerance=1.5,outline=simplifyFreehand(points,stroke,tolerance);
 while(outline.length>1000){tolerance*=1.5;outline=simplifyFreehand(points,stroke,tolerance)}
 // A narrow concavity may need the original detail to remain a simple polygon.
 if(!polygonOutlineValid(outline)&&points.length<=2000)outline=points;
 if(!polygonOutlineValid(outline)){
  drawing={kind:'freehand',points:[]};drawHandles();status('自由图形边线不能相交、重叠或回折，请重新绘制');return;
 }
 drawing.points=outline;finish();
 if(drawing?.points.length){drawing={kind:'freehand',points:[]};render()}
}
function freehandMarkup(){
 const p=drawing.points.map(q=>M.project(q,scene.basis));if(!p.length)return '';
 return `<g data-freehand-preview="true" pointer-events="none"><path d="${R.path(p,p.length>=3)}" fill="${p.length>=3?'#3977df18':'none'}" stroke="none"/><path d="${R.path(p)}" fill="none" stroke="#3977df" stroke-width="${pixel()*1.5}" stroke-linecap="round" stroke-linejoin="round"/>${p.length>=3?`<path d="${R.path([p.at(-1),p[0]])}" fill="none" stroke="#3977df" stroke-width="${pixel()*1.5}" stroke-dasharray="${pixel()*5} ${pixel()*3}"/>`:''}</g>`;
}
