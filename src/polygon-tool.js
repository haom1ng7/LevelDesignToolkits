// App fragment: keep the draft out of the project until its outline closes.
function polygonPoint(q,e={}){
 const points=drawing.points,first=points[0],r=stage.getBoundingClientRect();
 const near=p=>{const v=M.sub(q,M.project(p,scene.basis));return Math.hypot(v[0]*r.width/camera.w,v[1]*r.height/camera.h)<10};
 const raw=M.unproject(q,scene.basis,[0,0,floor(doc().activeFloor)?.height||0],[0,0,1]),p=[...snap(raw.slice(0,2),e),raw[2]];
 const close=points.length>=3&&(near(first)||Math.hypot(...M.sub(p,first))<1e-7);
 return {point:close?first:p,close};
}
function polygonClick(q,e){
 if(!enabled('polygon')||drawing?.kind!=='polygon')return;
 const candidate=polygonPoint(q,e);drawing.hover=candidate;
 if(candidate.close){finish();return}
 if(!drawing.points.some(p=>Math.hypot(...M.sub(p,candidate.point))<1e-7))drawing.points.push(candidate.point);
 drawHandles();status('逐点点击 · 至少三个顶点后点击首点闭合 · Backspace 退点 · Esc 取消');
}
function polygonOutlineValid(points){
 const p=points.map(q=>q.slice(0,2)),eps=1e-7,cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const on=(a,b,c)=>Math.abs(cross(a,b,c))<eps&&c.every((v,i)=>v>=Math.min(a[i],b[i])-eps&&v<=Math.max(a[i],b[i])+eps);
 if(!M.simple(p))return false;
 for(let i=0;i<p.length;i++){
  const a=p[i],b=p[(i+1)%p.length],c=p[(i+2)%p.length];
  if(Math.hypot(...M.sub(a,b))<eps||Math.abs(cross(a,b,c))<eps&&M.dot(M.sub(a,b),M.sub(c,b))>0)return false;
  for(let j=i+2;j<p.length;j++){
   if(i===0&&j===p.length-1)continue;
   const c=p[j],d=p[(j+1)%p.length];
   if(on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b))return false;
  }
 }
 return true;
}
function polygonMarkup(){
 const a=drawing,p=a.points.map(q=>M.project(q,scene.basis)),hover=a.hover&&M.project(a.hover.point,scene.basis),r=pixel()*4;
 if(!p.length)return '';
 const preview=hover?[...p,hover]:p;
 return `<g data-polygon-preview="true" pointer-events="none"><path d="${R.path(preview,preview.length>=3)}" fill="${preview.length>=3?'#3977df18':'none'}" stroke="#3977df" stroke-width="${pixel()*1.5}" stroke-dasharray="${pixel()*5} ${pixel()*3}"/><path d="${R.path(p)}" fill="none" stroke="#3977df" stroke-width="${pixel()*1.5}"/>${p.map((q,i)=>`<circle ${i===0?'data-polygon-start="true" ':''}cx="${q[0]}" cy="${q[1]}" r="${r*(i===0&&a.hover?.close?2:1)}" fill="${i===0?'#ffffff':'#3977df'}" stroke="#3977df" stroke-width="${pixel()*2}"/>`).join('')}</g>`;
}
