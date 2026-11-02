// Generate pointer endpoints from known world positions, including perspective depth.
module.exports=function worldMovePoints(M,A,document,delta){
 const basis=A.scene.basis,circle=document.querySelector('[data-world-gizmo] > circle'),start=[+circle.getAttribute('cx'),+circle.getAttribute('cy')];
 const candidates=A.document.objects.filter(o=>A.selection.ids.includes(o.id)&&!['hole','text','route'].includes(o.type)).flatMap(o=>o.type==='marker'?[M.unproject(start,basis,M.origin(A.document,o))]:M.geometry(A.document,o).flatMap(f=>f.points));
 const distance=p=>Math.hypot(...M.sub(M.project(p,basis),start));
 const anchor=candidates.reduce((best,p)=>distance(p)<distance(best)?p:best);
 return {start:M.project(anchor,basis),end:M.project(M.add(anchor,delta),basis)};
};
