// Optional perspective basis. Orthographic drafting continues to use the original math.
(()=>{
'use strict';const M=window.StudioModel,oldBasis=M.viewBasis,oldProject=M.project,oldUnproject=M.unproject;
const depth=(p,b)=>M.dot(M.sub(b.eye,p),b.n);
function planes(b,r=null){
 const out=[p=>depth(p,b)-b.near];
 if(r){out.push(p=>M.dot(M.sub(p,b.eye),b.r)-(r.x-b.offset[0])/b.focal*depth(p,b),p=>(r.x+r.w-b.offset[0])/b.focal*depth(p,b)-M.dot(M.sub(p,b.eye),b.r),p=>M.dot(M.sub(p,b.eye),b.down)-(r.y-b.offset[1])/b.focal*depth(p,b),p=>(r.y+r.h-b.offset[1])/b.focal*depth(p,b)-M.dot(M.sub(p,b.eye),b.down))}return out;
}
function clipPolygon(points,b){
 if(!b.eye)return points;let ring=points;
 for(const plane of planes(b)){const next=[];for(let i=0;i<ring.length;i++){const a=ring[i],c=ring[(i+1)%ring.length],da=plane(a),dc=plane(c);if(da>=0)next.push(a);if((da>=0)!==(dc>=0))next.push(M.add(a,M.mul(M.sub(c,a),da/(da-dc))))}ring=next}return ring;
}
function clipSegment(a,c,b,r=null){
 if(!b.eye)return [a,c];a=[...a];c=[...c];for(const plane of planes(b,r)){const da=plane(a),dc=plane(c);if(da<0&&dc<0)return [];if((da>=0)!==(dc>=0)){const p=M.add(a,M.mul(M.sub(c,a),da/(da-dc)));if(da<0)a=p;else c=p}}return [a,c];
}
function ray(q,b){return M.unit(M.add(M.mul(b.n,-1),M.add(M.mul(b.r,(q[0]-b.offset[0])/b.focal),M.mul(b.down,(q[1]-b.offset[1])/b.focal))))}
function projectVector(axis,b,p){
 if(!b.eye)return [M.dot(axis,b.r),M.dot(axis,b.down)];const v=M.sub(p,b.eye),z=Math.max(b.near,depth(p,b)),along=M.dot(axis,b.n);return [M.dot(axis,b.r)+M.dot(v,b.r)*along/z,M.dot(axis,b.down)+M.dot(v,b.down)*along/z];
}
function dragAxes(q,start,anchor,axes,b){
 if(axes.length===1){const a=axes[0],at=q=>{const r=ray(q,b),c=M.dot(a,r),den=1-c*c,w=M.sub(b.eye,anchor);return den>1e-7?(M.dot(a,w)-c*M.dot(r,w))/den:null},end=at(q),begin=at(start);return end===null||begin===null?null:[end-begin]}
 const normal=M.unit(M.cross(axes[0],axes[1])),r0=ray(start,b),r1=ray(q,b);if(Math.abs(M.dot(normal,r0))<1e-5||Math.abs(M.dot(normal,r1))<1e-5)return null;
 const delta=M.sub(M.unproject(q,b,anchor,normal),M.unproject(start,b,anchor,normal));return axes.map(a=>M.dot(delta,a));
}
M.viewBasis=(d,v)=>{const b=oldBasis(d,v);if(v.mode==='solid'&&v.fly)return {...b,origin:[...v.fly.eye],eye:[...v.fly.eye],offset:[...v.fly.center],focal:v.fly.focal,near:1};return b};
M.project=(p,b)=>{if(!b.eye)return oldProject(p,b);const v=M.sub(p,b.eye),scale=b.focal/Math.max(b.near,depth(p,b));return [b.offset[0]+M.dot(v,b.r)*scale,b.offset[1]+M.dot(v,b.down)*scale]};
M.unproject=(q,b,p,n=b.n)=>{if(!b.eye)return oldUnproject(q,b,p,n);const direction=ray(q,b),den=M.dot(n,direction);if(Math.abs(den)<1e-9)return [...p];return M.add(b.eye,M.mul(direction,M.dot(n,M.sub(p,b.eye))/den))};
Object.assign(M,{cameraDepth:depth,clipPolygon,clipSegment,perspectiveRay:ray,projectVector,dragAxes});
})();
