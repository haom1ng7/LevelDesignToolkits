(()=>{
'use strict';const R=window.StudioRender,M=window.StudioModel,oldScene=R.scene;
function sample(points,kind){if(points.length<3)return points;const out=[];if(kind==='monotone'){const slopes=points.slice(1).map((p,i)=>(p[1]-points[i][1])/(p[0]-points[i][0]||1e-6)),m=points.map((_,i)=>i===0?slopes[0]:i===points.length-1?slopes.at(-1):slopes[i-1]*slopes[i]<=0?0:2/(1/slopes[i-1]+1/slopes[i]));for(let i=0;i<points.length-1;i++){const p=points[i],q=points[i+1],dx=(q[0]-p[0])/3;segment(p,[p[0]+dx,p[1]+m[i]*dx],[q[0]-dx,q[1]-m[i+1]*dx],q,out)}}else{const a=[points[0],...points,points.at(-1)];for(let i=1;i<a.length-2;i++){const [v,w,x,y]=a.slice(i-1,i+3);segment(w,[w[0]+(x[0]-v[0])/8,w[1]+(x[1]-v[1])/8],[x[0]-(y[0]-w[0])/8,x[1]-(y[1]-w[1])/8],x,out)}}return out}
function segment(a,b,c,d,out){for(let j=0;j<=24;j++){const t=j/24,u=1-t;out.push([0,1].map(i=>u*u*u*a[i]+3*u*u*t*b[i]+3*u*t*t*c[i]+t*t*t*d[i]))}}
function distance(p,line){let min=Infinity;for(let i=0;i<line.length-1;i++){const a=line[i],b=line[i+1],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));min=Math.min(min,Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy))}return min}
// Trace the union of projected material, once per selected silhouette. A dash
// must continue across face partitions instead of restarting on every face.
function materialContours(regions){
 const eps=1e-7,cross=(a,b)=>a[0]*b[1]-a[1]*b[0],length=v=>Math.hypot(...v),segments=[],faces=regions.map(f=>({...f,box:[Math.min(...f.poly.map(p=>p[0])),Math.min(...f.poly.map(p=>p[1])),Math.max(...f.poly.map(p=>p[0])),Math.max(...f.poly.map(p=>p[1]))]}));
 for(const f of faces)for(const ring of [f.poly,...f.cutouts])ring.forEach((a,i)=>{const b=ring[(i+1)%ring.length],v=M.sub(b,a),size=length(v);if(size>eps)segments.push({a,b,v,size,ts:[0,1],box:[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]})});
 const add=(s,t)=>{if(t>=-eps/s.size&&t<=1+eps/s.size)s.ts.push(Math.max(0,Math.min(1,t)))};
 for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
  const a=segments[i],b=segments[j];if(a.box[2]<b.box[0]-eps||b.box[2]<a.box[0]-eps||a.box[3]<b.box[1]-eps||b.box[3]<a.box[1]-eps)continue;
  const w=M.sub(b.a,a.a),den=cross(a.v,b.v);
  if(Math.abs(den)>1e-10*a.size*b.size){const t=cross(w,b.v)/den,u=cross(w,a.v)/den;if(t>=-eps/a.size&&t<=1+eps/a.size&&u>=-eps/b.size&&u<=1+eps/b.size){add(a,t);add(b,u)}}
  else if(Math.abs(cross(w,a.v))<eps*a.size){for(const p of [b.a,b.b])add(a,M.dot(M.sub(p,a.a),a.v)/(a.size*a.size));for(const p of [a.a,a.b])add(b,M.dot(M.sub(p,b.a),b.v)/(b.size*b.size))}
 }
 const material=p=>faces.some(f=>p[0]>=f.box[0]&&p[0]<=f.box[2]&&p[1]>=f.box[1]&&p[1]<=f.box[3]&&M.inside(p,f.poly)&&!f.cutouts.some(h=>M.inside(p,h)));
 const vertices=[],buckets=new Map(),edges=[],keys=new Set(),cell=eps*4;
 function vertex(p){const q=p.map(v=>Math.floor(v/cell));for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(const i of buckets.get([q[0]+x,q[1]+y].join(','))||[])if(length(M.sub(vertices[i].p,p))<cell)return i;const i=vertices.length,k=q.join(',');vertices.push({p,out:[]});if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(i);return i}
 for(const s of segments){const ts=s.ts.sort((a,b)=>a-b).filter((t,i,a)=>!i||(t-a[i-1])*s.size>eps),at=t=>M.add(s.a,M.mul(s.v,t));for(let i=1;i<ts.length;i++){
  const a=at(ts[i-1]),b=at(ts[i]),v=M.sub(b,a),size=length(v);if(size<=eps)continue;
  const mid=M.mul(M.add(a,b),.5),normal=M.mul([-v[1],v[0]],Math.min(1e-5,size*.001)/size),left=material(M.add(mid,normal)),right=material(M.sub(mid,normal));if(left===right)continue;
  const u=vertex(left?a:b),w=vertex(left?b:a),key=[u,w].sort((a,b)=>a-b).join(':');if(u===w||keys.has(key))continue;keys.add(key);vertices[u].out.push(edges.length);edges.push({u,v:w});
 }}
 const loops=[];
 for(let i=0;i<edges.length;i++){if(edges[i].used)continue;let j=i,closed=false;const ring=[];for(let step=0;step<=edges.length;step++){
  const e=edges[j];if(e.used)break;e.used=true;ring.push(vertices[e.u].p);if(e.v===edges[i].u){closed=true;break}
  const incoming=M.sub(vertices[e.v].p,vertices[e.u].p),candidates=vertices[e.v].out.filter(k=>!edges[k].used);if(!candidates.length)break;
  const turn=k=>{const v=M.sub(vertices[edges[k].v].p,vertices[e.v].p),angle=Math.atan2(cross(incoming,v),M.dot(incoming,v));return (angle+Math.PI*2)%(Math.PI*2)};j=candidates.sort((a,b)=>turn(a)-turn(b))[0];
 }if(closed&&ring.length>=3){const clean=ring.filter((p,i)=>{const a=M.sub(p,ring[(i+ring.length-1)%ring.length]),b=M.sub(ring[(i+1)%ring.length],p);return Math.abs(cross(a,b))>eps*(length(a)+length(b))||M.dot(a,b)<0});if(clean.length>=3)loops.push(clean)}}
 return loops;
}
function grid(d,view,basis,camera){
 const r=camera||{x:0,y:0,w:d.width,h:d.height},step=d.gridSize??100,line=(a,b)=>`<path d="${R.path([a,b])}" stroke="#98a6b6" stroke-width="${r.w/1200*.6}" opacity=".28"/>`;
 let s='<g data-viewport-grid="true" pointer-events="none">';
 if(basis.eye){const radius=Math.min(step*180,Math.max(d.width,d.height,Math.abs(basis.eye[2])*3,basis.focal*3)),center=basis.eye.slice(0,2).map(v=>Math.round(v/step)*step),count=Math.ceil(radius/step);for(let axis=0;axis<2;axis++)for(let j=-count;j<=count;j++){const a=[center[0],center[1],0],b=[...a];a[axis]+=j*step;b[axis]+=j*step;a[1-axis]-=radius;b[1-axis]+=radius;const segment=M.clipSegment(a,b,basis,r);if(segment.length)s+=line(...segment.map(p=>M.project(p,basis)))}return s+'</g>'}
 if(view.mode!=='solid'){const base=M.project([0,0,0],basis);for(let i=0;i<2;i++){const min=i?r.y:r.x,size=i?r.h:r.w;if(size/step>2000)continue;for(let n=Math.floor((min-base[i])/step);base[i]+n*step<min+size+step;n++){const at=base[i]+n*step;s+=i?line([r.x,at],[r.x+r.w,at]):line([at,r.y],[at,r.y+r.h])}}return s+'</g>'}
 // Work in the projected viewport: inverse ground projection diverges at 0 degrees.
 // Each line family has at most 1001 lines, regardless of pitch, zoom or aspect.
 const t=Math.min(1,Math.abs(basis.n[2])/Math.sin(Math.PI/60)),fade=t*t*(3-2*t);
 s=`<g data-viewport-grid="true" pointer-events="none" opacity="${fade}">`;if(!fade)return s+'</g>';
 const base=M.project([0,0,0],basis),axes=[[basis.r[0],basis.down[0]],[basis.r[1],basis.down[1]]],corners=[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]],span=Math.hypot(r.w,r.h),center=[r.x+r.w/2,r.y+r.h/2];
 for(let i=0;i<2;i++){const direction=axes[1-i],length=Math.hypot(...direction);if(length<1e-10)continue;const u=M.mul(direction,1/length);let n=[-u[1],u[0]],gap=M.dot(n,axes[i])*step;if(Math.abs(gap)<1e-10)continue;if(gap<0){gap=-gap;n=M.mul(n,-1)}const phase=M.dot(n,base),values=corners.map(p=>M.dot(n,p)),lo=Math.ceil((Math.min(...values)-phase)/gap),hi=Math.floor((Math.max(...values)-phase)/gap);
  // Hide an over-dense family; never substitute a different world-unit spacing.
  if(hi-lo>1000)continue;
  for(let j=lo;j<=hi;j++){const q=M.add(center,M.mul(n,phase+j*gap-M.dot(n,center))),delta=M.mul(u,span);s+=line(M.sub(q,delta),M.add(q,delta))}
 }
 return s+'</g>'
}
R.scene=(d,view,options={})=>{const show=d.gridVisible;let s;d.gridVisible=false;try{s=oldScene(d,view,options)}finally{d.gridVisible=show}s.outlines=new Map();s.tolerance=options.tolerance||10;if(show&&d.type==='space'&&options.viewportDecorations!==false)s.geom=grid(d,view,s.basis,options.camera)+s.geom;
 const projected=new Map(),material=new Map();for(const f of s.faces){let regions=material.get(f.owner.id);if(!regions)material.set(f.owner.id,regions=[]);regions.push({poly:f.poly,cutouts:f.cutouts});if(s.basis.eye){let points=projected.get(f.owner.id);if(!points)projected.set(f.owner.id,points=[]);for(const p of f.poly)points.push(p)}}
 for(const o of d.objects){if(!o.visible||M.floor(d,o)?.visible===false)continue;const ghost=view.mode==='plan'&&o.floor&&!R.floorInScope(d,o.floor,view);if(ghost&&!options.ghost)continue;
  if(['plane','wall','stairs','ladder','spiral','solid'].includes(o.type)){let p=s.basis.eye?projected.get(o.id)||[]:M.geometry(d,o).flatMap(f=>f.points).map(p=>M.project(p,s.basis));if(!p.length)continue;let outline=M.hull(p);if(!s.basis.eye&&o.type==='plane'&&Math.abs(M.dot(M.normal(o),s.basis.n))>.999)outline=o.points.map(p=>M.project(M.world(d,o,[...p,0]),s.basis));const regions=material.get(o.id)||[];s.outlines.set(o.id,{poly:outline,...(['plane','wall','solid'].includes(o.type)?{regions,paths:regions.map(f=>[R.path(f.poly,true),...f.cutouts.map(h=>R.path(h,true))].join(' '))}: {})});if(!ghost&&o.type==='ladder')s.hits.push({id:o.id,poly:outline,depth:0,body:true})}
  if(o.type==='hole'){const p=M.clipPolygon(M.controls(d,o,view.mode).map(c=>c.point),s.basis).map(p=>M.project(p,s.basis));if(p.length<3)continue;s.outlines.set(o.id,{poly:p});if(o.cut&&!ghost)s.holeHits.push({id:o.id,host:o.host,poly:p})}
  if(o.type==='text'&&s.textBoxes.has(o.id))s.outlines.set(o.id,{poly:s.textBoxes.get(o.id).corners});
  if(s.basis.eye&&['marker','route'].includes(o.type)&&(o.type==='route'?o.points.map(p=>M.world(d,o,p)):[M.origin(d,o)]).some(p=>M.cameraDepth(p,s.basis)<s.basis.near))continue;
  if(o.type==='marker')s.outlines.set(o.id,{circle:{p:M.project(M.origin(d,o),s.basis),r:o.r}});
  if(o.type==='route'){const shape=R.routeShape(d,o,s.basis),{p,sampled,heads,line}=shape;s.outlines.set(o.id,{line:sampled,linePath:line,control:p,arrow:o.arrow,heads});for(const h of s.hits.filter(h=>h.id===o.id&&h.line))h.line=sampled}
 }
 if(d.curve){const events=[...d.curve.events].sort((a,b)=>R.eventX(d,a)-R.eventX(d,b)),p=events.map(e=>R.eventPoint(d,e));s.curveLine=sample(p,'monotone');s.curveEvents=events}
 return s};
const oldPick=R.pickAll;R.pickAll=(q,s,d,view)=>{const out=oldPick(q,{...s,hits:s.hits.filter(h=>!h.line&&!h.body)},d,view),lines=s.hits.filter(h=>h.line&&distance(q,h.line)<s.tolerance),bodies=s.hits.filter(h=>h.body&&M.inside(q,h.poly)),curve=s.curveLine&&distance(q,s.curveLine)<s.tolerance?[{curve:true}]:[];return [...out.filter(h=>h.event||h.edit||h.id&&d.objects.find(o=>o.id===h.id)?.type==='text'),...lines,...curve,...bodies,...out.filter(h=>!h.event&&!h.edit&&(!h.id||d.objects.find(o=>o.id===h.id)?.type!=='text'))].filter((h,i,a)=>a.findIndex(v=>v.id===h.id&&v.event===h.event&&v.edit===h.edit&&v.curve===h.curve)===i)};
Object.assign(R,{sample,distance,viewportGrid:grid,materialContours});
})();
