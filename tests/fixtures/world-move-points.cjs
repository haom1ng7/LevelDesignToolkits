// Generate pointer endpoints from known world positions, including perspective depth.
module.exports=function worldMovePoints(M,A,document,delta){
 const basis=A.scene.basis,roots=A.document.objects.filter(o=>A.selection.ids.includes(o.id)&&!['hole','text','route'].includes(o.type));
 const box=points=>({min:[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...points.map(p=>p[i])))});
 let anchor;
 if(roots.length===1){
  const o=roots[0];if(o.type==='marker')anchor=M.origin(A.document,o);
  else{const b=box(M.geometry(A.document,o).flatMap(f=>f.points.map(p=>M.local(A.document,o,p))));if(o.type==='stairs'){b.min[2]=Math.min(...o.flights.flatMap(f=>[f.start,f.end]))-o.thickness;b.max[2]=Math.max(...o.flights.flatMap(f=>[f.start,f.end]))}if(o.type==='spiral'){b.min=[-o.outer,-o.outer,o.start-o.thickness];b.max=[o.outer,o.outer,o.end]}anchor=M.world(A.document,o,M.mul(M.add(b.min,b.max),.5))}
 }else{const b=box(roots.flatMap(o=>o.type==='marker'?[M.origin(A.document,o)]:M.geometry(A.document,o).flatMap(f=>f.points)));anchor=M.mul(M.add(b.min,b.max),.5)}
 return {start:M.project(anchor,basis),end:M.project(M.add(anchor,delta),basis)};
};
