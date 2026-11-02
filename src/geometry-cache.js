(()=>{
'use strict';const M=window.StudioModel,geometry=M.geometry,boundary=M.boundaryEdges,cache=new WeakMap(),facesCache=new WeakMap();
// Visual edits and camera changes keep geometry; every physical field participates
// in the signature. Weak keys retain only live objects, without evicting every
// component on every pass once a document grows beyond a fixed cache size.
const visual=new Set(['name','fill','stroke','strokeWidth','color','opacity','locked','group','visible','autoCount','stepSpacing','rungSpacing']);
const physical=o=>Object.fromEntries(Object.entries(o).filter(([k])=>!visual.has(k)));
M.geometry=(d,o)=>{const holes=M.holes(d,o),signature=JSON.stringify([physical(o),M.floor(d,o)?.height||0,holes.map(physical)]);let entry=cache.get(o);if(!entry||entry.signature!==signature){
 // Geometry depends on the host and its openings. Sampling unrelated curved
 // objects for each host made a cold scene build quadratic in document size.
 const local={...d,objects:[o,...holes]};entry={signature,faces:geometry(local,o),edges:null};cache.set(o,entry);
 }const faces=entry.faces.map(f=>({...f,owner:o}));facesCache.set(faces,entry);return faces};
M.boundaryEdges=faces=>{const entry=facesCache.get(faces);if(!entry)return boundary(faces);return entry.edges??(entry.edges=boundary(faces))};
})();
