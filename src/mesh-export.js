// View-independent triangle meshes. Reuse the editor's sampled, cut geometry.
window.StudioMeshExport=(()=>{
'use strict';
const M=window.StudioModel,solidTypes=new Set(['plane','wall','stairs','ladder','spiral','solid']);
const area=ring=>ring.reduce((s,p,i)=>{const q=ring[(i+1)%ring.length];return s+p[0]*q[1]-q[0]*p[1]},0)/2;
function clean(ring){
 let p=ring.filter((v,i)=>Math.hypot(...M.sub(v,ring[(i+ring.length-1)%ring.length]))>1e-7),changed=true;
 while(changed&&p.length>3){changed=false;for(let i=0;i<p.length;i++){const a=M.sub(p[i],p[(i+p.length-1)%p.length]),b=M.sub(p[(i+1)%p.length],p[i]);if(Math.abs(a[0]*b[1]-a[1]*b[0])<=1e-9*Math.max(1,Math.hypot(...a)*Math.hypot(...b))){p.splice(i,1);changed=true;break}}}
 return p;
}
function triangulate(ring){
 const p=clean(ring),expected=Math.abs(area(p));if(expected<1e-8)return [];
 const ts=M.triangles(p),actual=ts.reduce((s,t)=>s+Math.abs(area(t)),0);
 if(Math.abs(actual-expected)>Math.max(1e-6,expected*1e-7))throw Error('无法三角化组件轮廓');
 return ts;
}
function faceTriangles(face){
 const n=M.faceNormal(face.points);if(Math.hypot(...n)<.5)return [];
 const origin=face.points[0],edge=face.points.map((p,i)=>M.sub(face.points[(i+1)%face.points.length],p)).sort((a,b)=>M.dot(b,b)-M.dot(a,a))[0],u=M.unit(edge),v=M.cross(n,u),project=p=>{const q=M.sub(p,origin);return [M.dot(q,u),M.dot(q,v)]};
 let parts=triangulate(face.points.map(project)).map(t=>t.map(p=>[...p,0]));
 for(const hole of face.holes||[])for(const triangle of triangulate(hole.map(project))){
  const planes=triangle.map((a,i)=>{const b=triangle[(i+1)%3],n=M.unit([b[1]-a[1],a[0]-b[0],0]);return {n,w:M.dot(n,[...a,0])}});
  parts=parts.flatMap(p=>M.subtract(p,planes));
 }
 const out=[];
 for(const p of parts)for(let i=1;i<p.length-1;i++){
  const t=[p[0],p[i],p[i+1]];if(Math.abs(area(t))<1e-8)continue;
  if(area(t)<0)t.reverse();out.push(t.map(q=>M.add(origin,M.add(M.mul(u,q[0]),M.mul(v,q[1])))));
 }
 return out;
}
function build(d){
 if(d?.type!=='space')throw Error('FBX / OBJ 仅支持空间图');
 const meshes=[];
 for(const o of d.objects){
  if(!solidTypes.has(o.type)||o.visible===false||M.floor(d,o)?.visible===false)continue;
  const vertices=[],triangles=[],normals=[],indices=new Map();
  const index=p=>{if(!p.every(Number.isFinite))throw Error('组件坐标不正确');const key=p.map(v=>Math.round(v*1e7)).join(',');if(!indices.has(key)){indices.set(key,vertices.length);vertices.push(p)}return indices.get(key)};
  try{for(const face of M.geometry(d,o))for(const t of faceTriangles(face)){const ids=t.map(index);if(new Set(ids).size<3)continue;triangles.push(ids);normals.push(M.faceNormal(t))}}catch(e){throw Error(o.name+'：'+e.message)}
  if(triangles.length)meshes.push({id:o.id,name:o.name,vertices,triangles,normals,color:o.fill||'#cccccc',opacity:o.opacity??1});
 }
 if(!meshes.length)throw Error('没有可导出的实体，请添加或显示平面、墙壁或楼梯');
 return {name:d.name,meshes,vertices:meshes.reduce((s,m)=>s+m.vertices.length,0),triangles:meshes.reduce((s,m)=>s+m.triangles.length,0)};
}
const number=v=>String(Number(v.toFixed(8))),label=s=>String(s).replace(/[\r\n\x00-\x1f]/g,' ').trim();
function obj(model){
 const lines=['# Level Design Toolkits OBJ','# Right-handed, Z up; coordinates 1:1; geometry only.'];let vertex=1,normal=1;
 model.meshes.forEach((m,i)=>{lines.push('o '+(i+1)+'_'+label(m.name).replace(/\s+/g,'_'),'s off');for(const p of m.vertices)lines.push('v '+p.map(number).join(' '));for(const n of m.normals)lines.push('vn '+n.map(number).join(' '));m.triangles.forEach((t,j)=>lines.push('f '+t.map(k=>(vertex+k)+'//'+(normal+j)).join(' ')));vertex+=m.vertices.length;normal+=m.normals.length});
 return lines.join('\n')+'\n';
}
// FBX 7.4 binary, uncompressed arrays. Binary also works with importers that
// reject ASCII FBX. Node offsets and property lengths are measured in UTF-8 bytes.
const prop=(type,value)=>({type,value}),I=v=>prop('I',v),L=v=>prop('L',v),D=v=>prop('D',v),array=(type,v)=>prop(type,v),node=(name,props=[],children=[])=>({name,props,children});
const P=(name,type,kind,flags,...values)=>node('P',[name,type,kind,flags,...values.map(v=>typeof v==='number'?(type==='int'?I(v):D(v)):v)]);
function fbx(model){
 const globals=[P('UpAxis','int','Integer','',2),P('UpAxisSign','int','Integer','',1),P('FrontAxis','int','Integer','',1),P('FrontAxisSign','int','Integer','',-1),P('CoordAxis','int','Integer','',0),P('CoordAxisSign','int','Integer','',1),P('OriginalUpAxis','int','Integer','',2),P('OriginalUpAxisSign','int','Integer','',1),P('UnitScaleFactor','double','Number','',1),P('OriginalUnitScaleFactor','double','Number','',1)];
 const objects=[],connections=[];
 model.meshes.forEach((m,i)=>{
  const g=1000+i*3,b=g+1,mat=g+2,name=label(m.name),rgb=[1,3,5].map(j=>parseInt(m.color.slice(j,j+2),16)/255),element=type=>node('LayerElement',[],[node('Type',[type]),node('TypedIndex',[I(0)])]);
  objects.push(node('Geometry',[L(g),name+'\x00\x01Geometry','Mesh'],[
   node('GeometryVersion',[I(124)]),node('Vertices',[array('d',m.vertices.flat())]),node('PolygonVertexIndex',[array('i',m.triangles.flatMap(t=>[t[0],t[1],-t[2]-1]))]),
   node('LayerElementNormal',[I(0)],[node('Version',[I(101)]),node('Name',['']),node('MappingInformationType',['ByPolygonVertex']),node('ReferenceInformationType',['Direct']),node('Normals',[array('d',m.normals.flatMap(n=>[...n,...n,...n]))])]),
   node('LayerElementMaterial',[I(0)],[node('Version',[I(101)]),node('Name',['']),node('MappingInformationType',['AllSame']),node('ReferenceInformationType',['IndexToDirect']),node('Materials',[array('i',[0])])]),
   node('Layer',[I(0)],[node('Version',[I(100)]),element('LayerElementNormal'),element('LayerElementMaterial')])
  ]));
  objects.push(node('Model',[L(b),name+'\x00\x01Model','Mesh'],[node('Version',[I(232)]),node('Properties70',[],[P('Lcl Translation','Lcl Translation','','A',0,0,0),P('Lcl Rotation','Lcl Rotation','','A',0,0,0),P('Lcl Scaling','Lcl Scaling','','A',1,1,1)]),node('Shading',[prop('C',true)]),node('Culling',['CullingOff'])]));
  objects.push(node('Material',[L(mat),name+'\x00\x01Material',''],[node('Version',[I(102)]),node('ShadingModel',['phong']),node('MultiLayer',[I(0)]),node('Properties70',[],[P('DiffuseColor','Color','','A',...rgb),P('DiffuseFactor','Number','','A',1),P('Opacity','double','Number','',m.opacity),P('TransparencyFactor','Number','','A',1-m.opacity)])]));
  connections.push(node('C',['OO',L(g),L(b)]),node('C',['OO',L(mat),L(b)]),node('C',['OO',L(b),L(0)]));
 });
 const roots=[node('FBXHeaderExtension',[],[node('FBXHeaderVersion',[I(1003)]),node('FBXVersion',[I(7400)]),node('EncryptionType',[I(0)]),node('Creator',['Level Design Toolkits'])]),node('GlobalSettings',[],[node('Version',[I(1000)]),node('Properties70',[],globals)]),node('Documents',[],[node('Count',[I(1)]),node('Document',[L(1),label(model.name),'Scene'],[node('RootNode',[L(0)])])]),node('References'),node('Definitions',[],[node('Version',[I(100)]),node('Count',[I(objects.length)]),...['Geometry','Model','Material'].map(t=>node('ObjectType',[t],[node('Count',[I(model.meshes.length)])]))]),node('Objects',[],objects),node('Connections',[],connections),node('Takes',[],[node('Current',[''])])];
 return binary(roots);
}
function binary(roots){
 const utf8=new TextEncoder();
 function prepare(n){n.bytes=utf8.encode(n.name);n.props=n.props.map(p=>{if(typeof p==='string')p=prop('S',utf8.encode(p));p.size=p.type==='S'?5+p.value.length:p.type==='d'||p.type==='i'?13+p.value.length*(p.type==='d'?8:4):p.type==='L'||p.type==='D'?9:p.type==='I'?5:2;return p});n.propertySize=n.props.reduce((s,p)=>s+p.size,0);n.children.forEach(prepare);n.size=13+n.bytes.length+n.propertySize+(n.children.length?n.children.reduce((s,c)=>s+c.size,0)+13:0)}
 roots.forEach(prepare);const end=27+roots.reduce((s,n)=>s+n.size,0)+13,footer=16+((16-(end+16)%16)%16)+4+120+16,bytes=new Uint8Array(end+footer),view=new DataView(bytes.buffer);let at=27;
 bytes.set(utf8.encode('Kaydara FBX Binary  \x00\x1a\x00'));view.setUint32(23,7400,true);
 const u32=v=>{view.setUint32(at,v,true);at+=4};
 function write(n){const start=at;u32(start+n.size);u32(n.props.length);u32(n.propertySize);bytes[at++]=n.bytes.length;bytes.set(n.bytes,at);at+=n.bytes.length;for(const p of n.props){bytes[at++]=p.type.charCodeAt(0);if(p.type==='S'){u32(p.value.length);bytes.set(p.value,at);at+=p.value.length}else if(p.type==='d'||p.type==='i'){u32(p.value.length);u32(0);u32(p.value.length*(p.type==='d'?8:4));for(const v of p.value){if(p.type==='d'){view.setFloat64(at,v,true);at+=8}else{view.setInt32(at,v,true);at+=4}}}else if(p.type==='L'){view.setBigInt64(at,BigInt(p.value),true);at+=8}else if(p.type==='D'){view.setFloat64(at,p.value,true);at+=8}else if(p.type==='I'){view.setInt32(at,p.value,true);at+=4}else bytes[at++]=p.value?1:0}n.children.forEach(write);if(n.children.length)at+=13;if(at!==start+n.size)throw Error('FBX 数据长度不正确')}
 roots.forEach(write);at+=13;bytes.set([0xfa,0xbc,0xab,0x09,0xd0,0xc8,0xd4,0x66,0xb1,0x76,0xfb,0x83,0x1c,0xf7,0x26,0x7e],at);at+=16;at+=((16-at%16)%16);u32(7400);at+=120;bytes.set([0xf8,0x5a,0x8c,0x6a,0xde,0xf5,0xd9,0x7e,0xec,0xe9,0x0c,0xe3,0x75,0x8f,0x29,0x0b],at);
 return bytes;
}
return {build,obj,fbx,solidTypes,faceTriangles};
})();
