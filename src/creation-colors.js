(()=>{
'use strict';const M=window.StudioModel,createObject=M.createObject,createDocument=M.createDocument,validate=M.validate;
// A small fixed palette keeps the result predictable and allocation bounded.
const palette=['#dce8df','#eedbdf','#f0d2bc','#e6daed','#c5dfd6','#e4cbc4','#d4bfce','#e1e6c5','#bcd4d2','#ccc8dd','#c9dac9','#efd0d8'];
const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),near=(a,b)=>Math.hypot(...M.sub(rgb(a),rgb(b)))<12;
const border=c=>'#'+rgb(c).map(n=>Math.round(n*.62).toString(16).padStart(2,'0')).join('');
const solids=['plane','wall','stairs','ladder','spiral'],color=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);
function defaults(d){
 if(d.type!=='space')return;
 // Persist the default on the floor so editing, reordering or deleting objects
 // cannot change later creations. Legacy objects retain their saved appearance.
 for(const f of d.floors)if(f.componentColor===undefined){const o=d.objects.find(o=>o.floor===f.id&&solids.includes(o.type)&&color(o.fill));if(o)f.componentColor=o.fill.toLowerCase()}
 for(const f of d.floors)if(f.componentColor===undefined){const used=d.floors.map(f=>f.componentColor).filter(Boolean),count=c=>used.filter(r=>near(c,r)).length;f.componentColor=palette.find(c=>!count(c))||[...palette].sort((a,b)=>count(a)-count(b))[0]}
}
M.createObject=(d,type,pos)=>{const o=createObject(d,type,pos);if(d.type==='space'&&solids.includes(type)){defaults(d);o.fill=M.floor(d,o).componentColor;o.stroke=border(o.fill)}return o};
M.createDocument=(...args)=>{const d=createDocument(...args);defaults(d);if(d.type==='space')for(const o of d.objects)if(solids.includes(o.type)){o.fill=M.floor(d,o).componentColor;o.stroke=border(o.fill)}return d};
M.validate=input=>{const p=validate(input);for(const d of p.documents){const s=d.planeColors;if(s&&(!Array.isArray(s.used)||s.used.length>palette.length||new Set(s.used).size!==s.used.length||s.used.some(c=>!palette.includes(c))||s.last!==null&&!palette.includes(s.last)))throw Error('平面配色记录不正确');if(d.type==='space'&&d.floors.some(f=>f.componentColor!==undefined&&!color(f.componentColor)))throw Error('楼层组件颜色不正确');defaults(d)}return p};
M.planePalette=palette;
})();
