// App fragment: click a seam on the selected component, commit only on subdivision.
const cutCursor='url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="none" stroke="white" stroke-width="5" stroke-linecap="round"><path d="M10 22 27 5M16 16 27 27"/><circle cx="7" cy="25" r="4"/><circle cx="7" cy="8" r="4"/><path d="m10 11 6 5"/></g><g fill="none" stroke="#18212b" stroke-width="2" stroke-linecap="round"><path d="M10 22 27 5M16 16 27 27"/><circle cx="7" cy="25" r="4"/><circle cx="7" cy="8" r="4"/><path d="m10 11 6 5"/></g></svg>')+'") 16 16, crosshair';
function cutTarget(){
 const roots=selected().filter(o=>o.type!=='hole');if(doc()?.type!=='space'||roots.length!==1||floorSelection||locked())return null;const o=roots[0];
 if(!['plane','wall'].includes(o.type)||selected().some(h=>h.id!==o.id&&h.host!==o.id)||o.visible===false||M.floor(doc(),o)?.visible===false||view.mode==='plan'&&o.floor!==doc().activeFloor)return null;
 const footprint=o.type==='wall'&&(view.mode==='plan'||!!(o.wallPath||o.wallFootprint));
 if(footprint&&!o.wallPath&&!o.wallFootprint){const b=bounds2(o.points);if(o.shape||o.curves?.some(Boolean)||o.points.length!==4||o.points.some(p=>!([b.min[0],b.max[0]].includes(p[0])&&[b.min[1],b.max[1]].includes(p[1]))))return null}
 const frame=footprint?{origin:[0,0,0],r:[1,0,0],d:[0,1,0],n:[0,0,1]}:localFrame(o),normal=M.mat(o.orientation,frame.n),facing=M.dot(normal,M.viewBasis(doc(),view).n);
 if(Math.abs(facing)<.025)return null;
 // Preview and boundary snaps lie on the visible broad face, including backs.
 if(footprint)frame.origin[2]=M.wallLevels(o)[facing>0?1:0];else if(o.type==='wall')frame.origin[1]=(facing>0?-1:1)*o.thickness/2;else frame.origin[2]=facing>0?0:-o.thickness;
 const profile=M.cutProfile(doc(),o,footprint);return profile?{id:o.id,footprint,frame,profile}:null;
}
function beginCut(){const target=cutTarget();drawing=target?{kind:'cut',...target,points:[],hover:null}:null}
function cutWorld(p){const o=doc().objects.find(o=>o.id===drawing.id),f=drawing.frame;return M.world(doc(),o,M.add(f.origin,M.add(M.mul(f.r,p[0]),M.mul(f.d,p[1]))))}
function cutPoint(q,e={}){
 const a=drawing,o=doc().objects.find(o=>o.id===a.id),f=a.frame,world=M.unproject(q,scene.basis,cutWorld([0,0]),M.mat(o.orientation,f.n)),local=M.local(doc(),o,world),raw=M.frameCoordinates(f,local).slice(0,2),screen=p=>M.project(cutWorld(p),scene.basis);
 if(a.points.length>=3&&Math.hypot(...M.sub(q,screen(a.points[0])))/pixel()<9)return {point:a.points[0],close:true,valid:true};
 let best=null,distance=8*pixel();for(const ring of [a.profile.points,...a.profile.holes])for(let i=0;i<ring.length;i++){const p=ring[i],r=ring[(i+1)%ring.length],u=screen(p),v=M.sub(screen(r),u),t=clamp(M.dot(M.sub(q,u),v)/(M.dot(v,v)||1),0,1),candidate=M.add(p,M.mul(M.sub(r,p),t)),n=Math.hypot(...M.sub(q,screen(candidate)));if(n<distance){distance=n;best=candidate}}
 const grid=M.local(doc(),o,snap(world,e)),p=best||M.frameCoordinates(f,grid).slice(0,2),inside=p=>(M.inside(p,a.profile.points)||M.profileOnRing(p,a.profile.points))&&!a.profile.holes.some(r=>M.inside(p,r)&&!M.profileOnRing(p,r));
 return {point:inside(p)?p:raw,valid:inside(p)||inside(raw),edge:!!best};
}
function cutClick(q,e){
 if(!drawing||drawing.id!==obj()?.id||!cutTarget()){status('请重新选择一个组件开始切割');return}const candidate=cutPoint(q,e);drawing.hover=candidate;
 if(!candidate.valid){status('请在所选组件内部或边缘取点');drawHandles();return}
 const p=candidate.point;if(candidate.close)drawing.points.push([...drawing.points[0]]);else if(!drawing.points.length||Math.hypot(...M.sub(p,drawing.points.at(-1)))>1e-6)drawing.points.push(p);
 if(drawing.points.length>=2){const result=finishCut(false);if(result===true)return;if(result===null){drawHandles();return}}drawHandles();status('继续取点 · 点击首点闭合，或连通边缘完成切割 · Backspace 退点 · Esc 取消');
}
function finishCut(explicit=true){
 const a=drawing;if(!a||a.kind!=='cut')return false;
 try{if(a.points.length<2||M.splitProfile(a.profile.points,a.profile.holes,a.points).length<2){if(explicit)status('切割线尚未闭合或贯穿组件，请继续取点');return false}
  let ids;const success=mutate(()=>{ids=M.cutComponents(doc(),a.id,a.points,a.footprint);if(ids.length<2)throw Error('切割线尚未分开组件');selection=ids;primary=ids[0];eventId=null;floorSelection=null;vertexIndex=null;drawing=null;tool='select'},'已切割为多个独立组件 · Ctrl+Z 可撤销');
  if(success){render();status('已切割为 '+ids.length+' 个独立组件 · Ctrl+Z 可撤销')}else{drawing=a;tool='cut';render()}return success?true:null;
 }catch(e){status(e.message);return null}
}
function cutMarkup(){
 if(drawing?.kind!=='cut')return '';const a=drawing,p=a.points.map(p=>M.project(cutWorld(p),scene.basis)),h=a.hover,q=h&&M.project(cutWorld(h.point),scene.basis),px=pixel(),line=q&&p.length?[...p,q]:p;
 return `<g data-cut-preview="true" pointer-events="none"><path d="${R.path(line)}" fill="none" stroke="white" stroke-width="${px*4}"/><path d="${R.path(line)}" fill="none" stroke="#ba4618" stroke-width="${px*2}" stroke-dasharray="${px*6} ${px*3}"/>${p.map((q,i)=>`<circle cx="${q[0]}" cy="${q[1]}" r="${px*(i?3:5)}" fill="${i?'#ba4618':'#fff64b'}" stroke="#18212b" stroke-width="${px}"/>`).join('')}${q?`<circle cx="${q[0]}" cy="${q[1]}" r="${px*(h.close?8:4)}" fill="none" stroke="${h.valid?'#ba4618':'#999'}" stroke-width="${px*1.5}"/>`:''}</g>`;
}
