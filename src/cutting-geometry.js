// Subdivide a material profile with a planar half-edge graph. No kerf or material loss.
(()=>{
'use strict';const M=window.StudioModel,EPS=1e-6;
const area=r=>r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-p[1]*q[0]},0)/2;
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],near=(a,b)=>Math.hypot(...M.sub(a,b))<EPS;
function clean(r){
 let p=r.filter((v,i)=>!near(v,r[(i+r.length-1)%r.length])),changed=true;
 while(changed&&p.length>2){changed=false;for(let i=0;i<p.length;i++){const a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length];if(near(a,c)||Math.abs(cross(M.sub(b,a),M.sub(c,b)))<EPS*Math.max(1,Math.hypot(...M.sub(c,a)))){p.splice(i,1);changed=true;break}}}return p;
}
function onSegment(p,a,b){const v=M.sub(b,a),l=M.dot(v,v),t=l?M.dot(M.sub(p,a),v)/l:0;return t>=-EPS&&t<=1+EPS&&Math.abs(cross(M.sub(p,a),v))<=EPS*Math.max(1,Math.sqrt(l))}
const onRing=(p,r)=>r.some((a,i)=>onSegment(p,a,r[(i+1)%r.length]));
function split(outer,holes,path){
 const material=p=>(M.inside(p,outer)||onRing(p,outer))&&!holes.some(r=>M.inside(p,r)&&!onRing(p,r));
 const segments=[];for(const r of [outer,...holes])r.forEach((a,i)=>segments.push({a,b:r[(i+1)%r.length],ts:[0,1],boundary:true}));
 path.slice(1).forEach((b,i)=>{if(!near(path[i],b))segments.push({a:path[i],b,ts:[0,1],boundary:false})});
 if(segments.length>2500)throw Error('切割轮廓过于复杂，请减少取点');
 const add=(s,t)=>{if(t>=-EPS&&t<=1+EPS)s.ts.push(Math.max(0,Math.min(1,t)))};
 for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
  const a=segments[i],b=segments[j],u=M.sub(a.b,a.a),v=M.sub(b.b,b.a),w=M.sub(b.a,a.a),den=cross(u,v);
  if(Math.abs(den)>EPS){const t=cross(w,v)/den,s=cross(w,u)/den;if(t>=-EPS&&t<=1+EPS&&s>=-EPS&&s<=1+EPS){add(a,t);add(b,s)}}
  else if(Math.abs(cross(w,u))<=EPS*Math.max(1,Math.hypot(...u))){for(const p of [b.a,b.b])add(a,M.dot(M.sub(p,a.a),u)/M.dot(u,u));for(const p of [a.a,a.b])add(b,M.dot(M.sub(p,b.a),v)/M.dot(v,v))}
 }
 const vertices=[],buckets=new Map(),edges=[],edgeKeys=new Set();
 function vertex(p){const cell=p.map(v=>Math.floor(v/EPS));for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(const i of buckets.get([cell[0]+x,cell[1]+y].join(','))||[])if(near(vertices[i].p,p))return i;const i=vertices.length,k=cell.join(',');vertices.push({p,out:[]});if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(i);return i}
 for(const s of segments){const ts=s.ts.sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>1e-10),at=t=>M.add(s.a,M.mul(M.sub(s.b,s.a),t));for(let i=1;i<ts.length;i++){const a=at(ts[i-1]),b=at(ts[i]);if(near(a,b)||!s.boundary&&!material(M.mul(M.add(a,b),.5)))continue;const u=vertex(a),v=vertex(b),key=[u,v].sort((a,b)=>a-b).join(':');if(u===v||edgeKeys.has(key))continue;edgeKeys.add(key);const n=edges.length;edges.push({u,v,twin:n+1},{u:v,v:u,twin:n});vertices[u].out.push(n);vertices[v].out.push(n+1)}}
 for(const v of vertices)v.out.sort((a,b)=>{const p=M.sub(vertices[edges[a].v].p,v.p),q=M.sub(vertices[edges[b].v].p,v.p);return Math.atan2(p[1],p[0])-Math.atan2(q[1],q[0])});
 const loops=[];for(let i=0;i<edges.length;i++){if(edges[i].used)continue;let j=i,ring=[];do{const e=edges[j];if(e.used)break;e.used=true;ring.push(vertices[e.u].p);const out=vertices[e.v].out;j=out[(out.indexOf(e.twin)+out.length-1)%out.length]}while(j!==i);ring=clean(ring);const a=area(ring);if(ring.length>=3&&Math.abs(a)>EPS)loops.push({points:ring,area:a})}
 // The left side of a directed edge identifies its material face, including
 // disconnected inner rings (closed cuts and pre-existing openings).
 const span=Math.max(1,...outer.flat().map(Math.abs)),offset=Math.max(EPS*10,Math.min(.001,span*1e-7));
 function sample(r){for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length],v=M.sub(b,a),length=Math.hypot(...v);if(length>EPS)return M.add(M.mul(M.add(a,b),.5),M.mul([-v[1],v[0]],Math.min(offset,length*1e-4)/length))}return r[0]}
 const faces=loops.filter(l=>l.area>EPS&&material(sample(l.points))).map(l=>({...l,holes:[]}));
 for(const l of loops.filter(l=>l.area<-EPS)){const p=sample(l.points),owner=faces.filter(f=>M.inside(p,f.points)).sort((a,b)=>a.area-b.area)[0];if(owner&&material(p))owner.holes.push([...l.points].reverse())}
 return faces.map(({points,holes})=>({points,holes}));
}
// Structural openings belong to their component; they are not extra list items.
const holes=M.holes,geometry=M.geometry,validGeometry=M.validGeometry,validHole=M.validHole,validate=M.validate;
function structural(o){return (o.cutouts||[]).map((h,i)=>Object.assign(h,{id:o.id+'-cut-'+i,type:'hole',name:'切割内轮廓',host:o.id,floor:o.floor,position:[0,0,0],orientation:M.I(),visible:true,locked:false,opacity:1}))}
function materialDocument(d){if(!d.objects.some(o=>o.cutouts?.length))return d;const ids=new Set(d.objects.map(o=>o.id));return {...d,objects:d.objects.flatMap(o=>[o,...structural(o).filter(h=>!ids.has(h.id))])}}
M.holes=(d,o)=>{const a=holes(d,o),ids=new Set(a.map(h=>h.id));return [...a,...structural(o).filter(h=>!ids.has(h.id))]};
M.geometry=(d,o)=>geometry(materialDocument(d),o);
M.validHole=(d,h)=>validHole(materialDocument(d),h);
M.validGeometry=d=>validGeometry(materialDocument(d));
M.validate=input=>{
 const p=M.clone(input),ids=new Set();for(const d of p.documents||[])for(const o of d.objects||[]){if(o.cutouts!==undefined&&(!['plane','wall'].includes(o.type)||!Array.isArray(o.cutouts)||o.cutouts.length>500||o.cutouts.some(h=>!h||typeof h!=='object'||h.cutouts!==undefined||!Array.isArray(h.points))))throw Error('切割内轮廓数据不正确');for(const h of structural(o)){if(d.objects.some(v=>v.id===h.id))throw Error('切割内轮廓 ID 冲突');ids.add(d.id+':'+h.id)}}
 p.documents=p.documents.map(materialDocument);const v=validate(p);for(const d of v.documents){for(const o of d.objects)if(o.cutouts)o.cutouts=o.cutouts.map((_,i)=>d.objects.find(h=>h.id===o.id+'-cut-'+i));d.objects=d.objects.filter(o=>!ids.has(d.id+':'+o.id))}return v;
};
function profile(o,footprint=false){return footprint?(o.wallPath?M.footprint(o):M.wallFootprint(o)):M.contour(o)}
function openingProfile(o,h,footprint){
 const f=footprint?{origin:[0,0,0],r:[1,0,0],d:[0,1,0],n:[0,0,1]}:o.type==='wall'?{origin:[0,0,0],r:[1,0,0],d:[0,0,1],n:[0,-1,0]}:null;
 if(!h.cut)return footprint?null:M.contour(h);if(!f)return null;
 // A directional bore cannot be flattened without changing its volume.
 if(Math.abs(M.dot(M.unit(h.cut.n),f.n))<.999999)return null;
 return M.contour(h).map(p=>M.frameCoordinates(f,M.holePoint(h,p)).slice(0,2));
}
M.cutProfile=(d,o,footprint=false)=>{const hs=M.holes(d,o),rings=hs.map(h=>openingProfile(o,h,footprint));return rings.some(r=>!r)?null:{points:profile(o,footprint),holes:rings}};
M.cutComponents=(d,id,path,footprint=false)=>{
 const o=d.objects.find(o=>o.id===id);if(!o||!['plane','wall'].includes(o.type)||o.locked)throw Error('请选择一个未锁定的平面或墙壁');const input=M.cutProfile(d,o,footprint);if(!input)throw Error('请切换到与原有开口一致的切割面');
 const parts=split(input.points,input.holes,path);if(parts.length<2)return [];
 const expected=Math.abs(area(input.points))-input.holes.reduce((s,r)=>s+Math.abs(area(r)),0),actual=parts.reduce((s,p)=>s+Math.abs(area(p.points))-p.holes.reduce((n,r)=>n+Math.abs(area(r)),0),0);
 if(Math.abs(expected-actual)>Math.max(.001,expected*1e-7)||parts.some(p=>!M.simple(p.points)))throw Error('无法形成有效的切割区域，请调整取点');
 const at=d.objects.indexOf(o),children=new Set(d.objects.filter(h=>h.type==='hole'&&h.host===id).map(h=>h.id));
 const objects=parts.map((p,i)=>{const n=M.clone(o);n.id=i?M.uid():o.id;n.name=o.name+' · 切割'+(i+1);delete n.group;delete n.shape;delete n.curves;delete n.wallPath;delete n.wallFootprint;delete n.cutouts;
  if(footprint){n.wallFootprint=p.points;M.syncWallProfile(n)}else n.points=p.points;
  if(p.holes.length)n.cutouts=p.holes.map(points=>{const h={points};if(n.type==='wall')h.cut=footprint?{origin:[0,0,0],r:[1,0,0],d:[0,1,0],n:[0,0,1]}:{origin:[0,0,0],r:[1,0,0],d:[0,0,1],n:[0,-1,0]};return h});structural(n);return n});
 const hidden=d.objects.filter(h=>children.has(h.id)&&h.visible===false).map(h=>{const host=objects.find(n=>M.validHole({...d,objects:[...d.objects.filter(o=>o.id!==id&&!children.has(o.id)),...objects,{...h,host:n.id}]},{...h,host:n.id}));if(!host)throw Error('切割线经过隐藏的开口，请先显示该开口再切割');return {...M.clone(h),host:host.id}});
 d.objects.splice(at,1,...objects);d.objects=d.objects.filter(o=>!children.has(o.id));d.objects.push(...hidden);return objects.map(o=>o.id);
};
Object.assign(M,{splitProfile:split,profileArea:area,profileOnRing:onRing});
})();
