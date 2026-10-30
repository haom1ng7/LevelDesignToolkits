// Offline solid booleans. Results store convex boundary polygons in a local frame.
(()=>{
'use strict';
const M=window.StudioModel,EPS=1e-6,LIMIT=20000;
M.names.solid='集合实体';
const types=new Set(['plane','wall','stairs','ladder','spiral','solid']);
const bounds=polys=>{const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const p of polys)for(const v of p.points)for(let i=0;i<3;i++){min[i]=Math.min(min[i],v[i]);max[i]=Math.max(max[i],v[i])}return {min,max}};
function polygon(points){
 points=points.filter((p,i)=>Math.hypot(...M.sub(p,points[(i+points.length-1)%points.length]))>EPS);
 const n=M.faceNormal(points);return points.length>=3&&Math.hypot(...n)>.5?{points,n,w:M.dot(n,points[0])}:null;
}
const flip=p=>({points:[...p.points].reverse(),n:M.mul(p.n,-1),w:-p.w});
function split(p,plane,sameFront,sameBack,front,back,budget){
 const ds=p.points.map(v=>M.dot(plane.n,v)-plane.w),ts=ds.map(d=>d>EPS?1:d<-EPS?2:0),kind=ts.reduce((a,b)=>a|b,0);
 if(!kind){(M.dot(plane.n,p.n)>0?sameFront:sameBack).push(p);return}
 if(kind===1){front.push(p);return}if(kind===2){back.push(p);return}
 if(++budget.splits>100000)throw Error('集合轮廓过于复杂，请减少所选组件或踏步数量');
 const f=[],b=[];for(let i=0;i<p.points.length;i++){
  const j=(i+1)%p.points.length,a=p.points[i],v=p.points[j];if(ts[i]!==2)f.push(a);if(ts[i]!==1)b.push(a);
  if((ts[i]|ts[j])===3){const q=M.add(a,M.mul(M.sub(v,a),ds[i]/(ds[i]-ds[j])));f.push(q);b.push(q)}
 }
 const pf=polygon(f),pb=polygon(b);if(pf)front.push(pf);if(pb)back.push(pb);
}
class Node{
 constructor(polys=[],budget={splits:0},depth=0){this.polys=[];this.budget=budget;this.depth=depth;if(polys.length)this.build(polys)}
 build(polys){
  if(!polys.length)return;if(this.depth>180||polys.length>LIMIT)throw Error('集合轮廓过于复杂，请减少所选组件或踏步数量');
  if(!this.plane){
   // A small deterministic plane sample bounds recursion for detailed stairs.
   let best=Infinity;for(let i=0;i<Math.min(12,polys.length);i++){
    const p=polys[Math.floor(i*polys.length/Math.min(12,polys.length))];let f=0,b=0,s=0;
    for(const q of polys){let lo=Infinity,hi=-Infinity;for(const v of q.points){const d=M.dot(p.n,v)-p.w;lo=Math.min(lo,d);hi=Math.max(hi,d)}if(hi>EPS)f++;if(lo<-EPS)b++;if(hi>EPS&&lo<-EPS)s++}
    const score=s*4+Math.abs(f-b);if(score<best){best=score;this.plane={n:p.n,w:p.w}}
   }
  }
  const f=[],b=[];for(const p of polys)split(p,this.plane,this.polys,this.polys,f,b,this.budget);
  if(f.length){this.front??=new Node([],this.budget,this.depth+1);this.front.build(f)}if(b.length){this.back??=new Node([],this.budget,this.depth+1);this.back.build(b)}
 }
 all(){return [...this.polys,...(this.front?.all()||[]),...(this.back?.all()||[])]}
 invert(){this.polys=this.polys.map(flip);if(this.plane)this.plane={n:M.mul(this.plane.n,-1),w:-this.plane.w};this.front?.invert();this.back?.invert();[this.front,this.back]=[this.back,this.front]}
 clip(polys){if(!this.plane)return polys;let f=[],b=[];for(const p of polys)split(p,this.plane,f,b,f,b,this.budget);if(this.front)f=this.front.clip(f);b=this.back?this.back.clip(b):[];return [...f,...b]}
 clipTo(other){this.polys=other.clip(this.polys);this.front?.clipTo(other);this.back?.clipTo(other)}
}
function operation(a,b,mode){
 if(!a.length)return mode==='union'?b:[];if(!b.length)return mode==='intersect'?[]:a;
 const x=bounds(a),y=bounds(b);if(x.min.some((n,i)=>x.max[i]<=y.min[i]+EPS||y.max[i]<=n+EPS))return mode==='intersect'?[]:mode==='union'?[...a,...b]:a;
 const budget={splits:0},A=new Node(a,budget),B=new Node(b,budget);
 if(mode==='union'){A.clipTo(B);B.clipTo(A);B.invert();B.clipTo(A);B.invert();A.build(B.all())}
 else if(mode==='subtract'){A.invert();A.clipTo(B);B.clipTo(A);B.invert();B.clipTo(A);B.invert();A.build(B.all());A.invert()}
 else{A.invert();B.clipTo(A);B.invert();A.clipTo(B);B.clipTo(A);A.build(B.all());A.invert()}
 const out=A.all();if(out.length>LIMIT)throw Error('集合结果过于复杂，请减少所选组件');return out;
}
function volume(polys){
 const origin=polys[0]?.points[0]||[0,0,0];let v=0;for(const p of polys)for(let i=1;i<p.points.length-1;i++)v+=M.dot(M.sub(p.points[0],origin),M.cross(M.sub(p.points[i],origin),M.sub(p.points[i+1],origin)))/6;return Math.abs(v);
}
const occupied=p=>{if(!p.length)return false;const b=bounds(p),size=b.max.reduce((v,n,i)=>v*Math.max(0,n-b.min[i]),1);return volume(p)>Math.max(1e-12,size*1e-9)};
function fromFaces(faces){return faces.flatMap(f=>window.StudioMeshExport.faceTriangles(f).map(polygon).filter(Boolean))}
function source(d,o){
 if(o.type==='solid')return o.mesh.map(r=>polygon(r.map(p=>M.world(d,o,p)))).filter(Boolean);
 // A stair is a collection of closed slabs. Decorative risers in the scene
 // must not participate as open surfaces in a volume operation.
 if(o.type==='stairs'){
  let result=[];for(const f of o.flights){
   if(!f.steps){result=operation(result,fromFaces(M.geometry(d,{...o,flights:[f]})),'union');continue}
   const ps=M.stairProfile(f).points,lerp=(a,b,t)=>M.add(a,M.mul(M.sub(b,a),t));
   for(let j=0;j<f.steps;j++){const t=j/f.steps,u=(j+1)/f.steps,z=f.start+(f.end-f.start)*u,ring=[lerp(ps[0],ps[3],t),lerp(ps[1],ps[2],t),lerp(ps[1],ps[2],u),lerp(ps[0],ps[3],u)];
    const part={...o,id:M.uid(),flights:[{...f,points:ring,start:z,end:z,steps:0}]};result=operation(result,fromFaces(M.geometry(d,part)),'union');
   }
  }return result;
 }
 const faces=M.geometry(d,o);
 if(o.type==='ladder'||o.type==='spiral'){
  let result=[],piece=[];for(const face of faces){piece.push(face);if(piece.length===6){result=operation(result,fromFaces(piece),'union');piece=[]}}
  if(piece.length)throw Error('组件无法形成封闭实体');return result;
 }
 return fromFaces(faces);
}
function resultObject(d,o,polys,label){
 return {id:o.id,type:'solid',name:o.name+' · '+label,floor:o.floor,position:[...o.position],orientation:[...o.orientation],visible:true,locked:false,opacity:o.opacity,fill:o.fill,stroke:o.stroke,width:o.width??1,mesh:polys.map(p=>p.points.map(v=>M.local(d,o,v)))};
}
function setComponents(d,ids,mode){
 if(d?.type!=='space'||!['intersect','difference'].includes(mode))throw Error('集合工具仅支持空间实体');
 const roots=d.objects.filter(o=>ids.includes(o.id)&&types.has(o.type));
 if(roots.length<2)throw Error('请选中至少两个实体组件');
 if(roots.some(o=>o.locked||o.visible===false||M.floor(d,o)?.visible===false)||d.objects.some(o=>o.type==='hole'&&roots.some(r=>r.id===o.host)&&(o.locked||o.visible===false)))throw Error('请先显示并解锁所选实体及其附属空洞');
 const meshes=roots.map(o=>source(d,o));if(meshes.some(p=>!occupied(p)))throw Error('所选组件无法形成有效实体');
 const replacements=new Map(),label=mode==='intersect'?'交集':'差集';
 if(mode==='intersect'){
  let out=meshes[0];for(const p of meshes.slice(1)){out=operation(out,p,'intersect');if(!occupied(out)){out=[];break}}
  roots.forEach(o=>replacements.set(o.id,null));if(out.length)replacements.set(roots[0].id,resultObject(d,roots[0],out,label));
 }else{
  // Fully enclosed components disappear without boring a cavity in the host.
  // All pair decisions use the original selection, independent of its order.
  const enclosed=roots.map(()=>false),overlaps=roots.map(()=>roots.map(()=>false));
  for(let i=0;i<roots.length;i++)for(let j=i+1;j<roots.length;j++){
   const overlap=operation(meshes[i],meshes[j],'intersect');if(!occupied(overlap))continue;overlaps[i][j]=overlaps[j][i]=true;
   if(!occupied(operation(meshes[i],meshes[j],'subtract')))enclosed[i]=true;
   if(!occupied(operation(meshes[j],meshes[i],'subtract')))enclosed[j]=true;
  }
  roots.forEach((o,i)=>{
   if(enclosed[i]){replacements.set(o.id,null);return}
   let out=meshes[i],changed=false;for(let j=0;j<roots.length;j++)if(j!==i&&!enclosed[j]&&overlaps[i][j]){out=operation(out,meshes[j],'subtract');changed=true;if(!occupied(out)){out=[];break}}
   if(changed)replacements.set(o.id,out.length?resultObject(d,o,out,label):null);
  });
 }
 const next=d.objects.flatMap(o=>replacements.has(o.id)?replacements.get(o.id)?[replacements.get(o.id)]:[]:o.type==='hole'&&replacements.has(o.host)?[]:[o]);
 if(next.length>3000)throw Error('集合结果超过组件数量上限');
 d.objects=next;return roots.map(o=>o.id).filter(id=>next.some(o=>o.id===id));
}
const geometry=M.geometry,controls=M.controls,validate=M.validate,validGeometry=M.validGeometry;
function validMesh(o){return Array.isArray(o.mesh)&&o.mesh.length>=4&&o.mesh.length<=LIMIT&&o.mesh.every(r=>Array.isArray(r)&&r.length>=3&&r.length<=2000&&r.every(p=>Array.isArray(p)&&p.length===3&&p.every(v=>Number.isFinite(v)&&Math.abs(v)<1e6))&&M.nonzero(r))&&/^#[0-9a-f]{6}$/i.test(o.fill)&&/^#[0-9a-f]{6}$/i.test(o.stroke)}
M.geometry=(d,o)=>o.type==='solid'?M.mergeFaces(o.mesh.map(points=>({owner:o,points,holes:[],side:.7+.3*Math.abs(M.mat(o.orientation,M.faceNormal(points))[2])}))).map(f=>({...f,points:f.points.map(p=>M.world(d,o,p)),holes:f.holes.map(r=>r.map(p=>M.world(d,o,p)))})):geometry(d,o);
M.controls=(d,o,view,flight=0)=>{if(o.type!=='solid')return controls(d,o,view,flight);const b=bounds(o.mesh.map(points=>({points})));return Array.from({length:8},(_,index)=>({index,point:M.world(d,o,[0,1,2].map(i=>(index>>i)&1?b.max[i]:b.min[i]))}))};
M.validGeometry=d=>validGeometry(d)&&d.objects.filter(o=>o.type==='solid').every(validMesh);
M.validate=input=>{for(const d of input?.documents||[])for(const o of d.objects||[])if(o.type==='solid'&&(d.type!=='space'||!validMesh(o)))throw Error('集合实体轮廓数据不正确');return validate(input)};
Object.assign(M,{setComponents,setSolidTypes:types});
})();
