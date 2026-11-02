// Compare the optimized cache's scoped document with the original geometry pipeline.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({window:{},console});
const load=name=>vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/'+name+'.js'),'utf8'),context,{filename:name+'.js'});
for(const name of ['model','geometry','model-features','curved-geometry','creation-colors','model-v10','cutting-geometry','set-geometry'])load(name);
const M=context.window.StudioModel,uncached=M.geometry;load('geometry-cache');
const points=faces=>JSON.stringify(faces.map(({owner,...f})=>f)),d=M.createDocument('space','Cache regression');
const hosts=['plane','wall','stairs','ladder','spiral'].map((type,i)=>M.createObject(d,type,[i*500,30,40]));d.objects=hosts;
const curved=M.createObject(d,'plane',[500,500,20]);curved.shape='ellipse';d.objects.push(curved);
const wall=M.createObject(d,'wall',[900,500,0]);wall.wallPath={points:[[0,0],[200,100],[400,0]],curves:[.25,0],height:200};d.objects.push(wall);
const hole=Object.assign(M.createObject(d,'hole'),{host:hosts[0].id,floor:hosts[0].floor,points:[[-20,-20],[20,-20],[20,20],[-20,20]]});d.objects.push(hole);
const bore=Object.assign(M.createObject(d,'hole'),{host:hosts[1].id,floor:hosts[1].floor,points:[[-20,50],[20,50],[20,100],[-20,100]],cut:{origin:[0,0,0],r:[1,0,0],d:[0,0,1],n:[0,-1,0]}});d.objects.push(bore);
curved.cutouts=[{points:[[-10,-10],[10,-10],[10,10],[-10,10]]}];
const solid={...M.clone(hosts[0]),id:M.uid(),type:'solid',mesh:uncached(d,hosts[0]).map(f=>f.points.map(p=>M.local(d,hosts[0],p)))};d.objects.push(solid);
function compare(){for(const o of d.objects.filter(o=>o.type!=='hole'))assert.equal(points(M.geometry(d,o)),points(uncached(d,o)),o.type+' matches complete-document geometry')}
compare();d.floors[0].height=123;compare();hole.visible=false;compare();hole.visible=true;hole.points[0][0]-=3;compare();hosts[1].thickness+=7;compare();hosts[2].orientation=M.axisRotation([1,0,0],.3);compare();curved.curves=[.1,.2,.3,.4];compare();
// A large live document keeps all entries warm across repeated complete passes.
const large=M.createDocument('space'),template=M.createObject(large,'plane');large.objects=Array.from({length:800},(_,i)=>({...M.clone(template),id:'cache-'+i,position:[i*300,0,0]}));
const first=large.objects.map(o=>M.geometry(large,o));for(let pass=0;pass<2;pass++)large.objects.forEach((o,i)=>assert.strictEqual(M.geometry(large,o)[0].points,first[i][0].points,'no 512-entry cache thrashing'));
const o=large.objects[0],edges=M.boundaryEdges(first[0]);o.name='rename';o.fill='#abcdef';assert.strictEqual(M.geometry(large,o)[0].points,first[0][0].points,'visual edit retains geometry');assert.strictEqual(M.boundaryEdges(M.geometry(large,o)),edges,'boundary data remains cached');
o.position[0]+=10;assert.notStrictEqual(M.geometry(large,o)[0].points,first[0][0].points,'in-place physical edit invalidates');const copy=M.clone(o);copy.position[1]+=10;large.objects[0]=copy;assert.equal(points(M.geometry(large,copy)),points(uncached(large,copy)),'replacement object with the same ID is fresh');
console.log('PASS geometry cache: scoped/full geometry equivalence for primitives, holes, bores, structural cutouts, curves, bent walls and solids; floor/visibility/shape/rotation invalidation; 800 live entries across repeated passes; visual and boundary reuse; same-ID replacement.');
