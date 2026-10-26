// Component details share one schema for single and multiple selections.
const inspectorSections=new Map();
function propertyObjects(){return selected().filter(o=>o.type!=='hole'||!selection.includes(o.host))}
function inspectorSection(key,label,html){return `<details class="inspector-section" data-inspector-section="${key}" ${inspectorSections.get(key)!==false?'open':''}><summary>${label}</summary><div class="inspector-section-body">${html}</div></details>`}
document.addEventListener('toggle',e=>{const key=e.target.dataset?.inspectorSection;if(key)inspectorSections.set(key,e.target.open)},true);
document.addEventListener('focusin',e=>{if(e.target.closest('#properties')&&e.target.dataset.scope)lastFormKey=null});
function propertyRotation(o){
 const m=o.orientation,y=Math.asin(clamp(-m[6],-1,1)),regular=Math.abs(Math.cos(y))>1e-7;
 return [regular?Math.atan2(m[7],m[8]):Math.atan2(-m[5],m[4]),y,regular?Math.atan2(m[3],m[0]):0].map(v=>v*180/Math.PI);
}
function propertyOrientation(angles){return M.product(M.product(M.axisRotation([0,0,1],angles[2]*Math.PI/180),M.axisRotation([0,1,0],angles[1]*Math.PI/180)),M.axisRotation([1,0,0],angles[0]*Math.PI/180))}
function propertyDimensions(o){const b=solidLocalBounds(o);return M.sub(b.max,b.min)}
function transformFields(o){
 if(o.type==='hole')return '';
 const row=(label,keys,values,unit,titles)=>`<div class="transform-row" role="group" aria-label="${label}"><span class="transform-label">${label}<small>${unit}</small></span><div class="transform-values">${keys.map((key,i)=>`<label class="axis-field axis-${i}" data-property-scrub="${key}" title="${titles[i]} · 左右拖动调值，单击输入；Shift 精细调整，Ctrl 暂停网格"><span aria-hidden="true">${'XYZ'[i]}</span><input id="prop-${key}" data-scope="prop" data-key="${key}" type="number" step="any" ${key.startsWith('dimension')?'min="0.01"':''} value="${+values[i].toFixed(4)}" aria-label="${titles[i]}"></label>`).join('')}</div></div>`;
 let html=row('位置',['px','py','pz'],o.position,'cm',['X 位置','Y 位置','Z 位置（相对楼层）']);
 if(solidTypes.includes(o.type))html+=row('旋转',['rx','ry','rz'],propertyRotation(o),'度',['X 旋转 / Roll','Y 旋转 / Pitch','Z 旋转 / Yaw'])+row('大小',['dimensionX','dimensionY','dimensionZ'],propertyDimensions(o),'cm',['本地 X 长度','本地 Y 宽度','本地 Z 高度']);
 return inspectorSection('transform','变换',html);
}
function propertyValue(o,scope,key){
 if(scope==='flight')return o.flights[flight][key];
 if(['px','py','pz'].includes(key))return o.position[{px:0,py:1,pz:2}[key]];
 if(['rx','ry','rz'].includes(key))return propertyRotation(o)[{rx:0,ry:1,rz:2}[key]];
 if(key.startsWith('dimension'))return propertyDimensions(o)['XYZ'.indexOf(key.slice(-1))];
 if(key==='totalDegrees')return o.turns*360;if(key==='wallHeight')return o.wallPath.height;
 return o[key];
}
function propertyControls(root){return [...root.querySelectorAll('[data-scope="prop"],[data-scope="flight"]')]}
function sameProperty(a,b){return typeof a==='number'&&typeof b==='number'?Math.abs(a-b)<1e-7:a===b}
function selectionPropertyMarkup(){
 const objects=propertyObjects(),templates=objects.map(o=>{const t=document.createElement('template');t.innerHTML=componentFields(o);return t.content}),root=templates[0];
 if(!root)return '';
 const controls=templates.map(t=>new Map(propertyControls(t).map(i=>[i.dataset.scope+':'+i.dataset.key,i])));
 for(const input of propertyControls(root)){
  const {scope,key}=input.dataset,others=controls.map(m=>m.get(scope+':'+key));
  if(others.some(i=>!i||i.type!==input.type)){(input.closest('.property,.transform-row')||input).remove();continue}
  if(input.type==='number'){
   const mins=others.filter(i=>i.min!=='').map(i=>+i.min),maxs=others.filter(i=>i.max!=='').map(i=>+i.max);
   if(mins.length)input.min=Math.max(...mins);if(maxs.length)input.max=Math.min(...maxs);
  }
  const values=objects.map(o=>propertyValue(o,scope,key)),mixed=values.some(v=>!sameProperty(v,values[0]));
  if(key==='thickness'&&new Set(objects.map(o=>o.type)).size>1)input.closest('.property').querySelector('label').textContent='厚度';
  if(!mixed)continue;
  input.dataset.mixed='true';input.setAttribute('aria-description','多个值：输入后统一应用到所选组件');
  if(input.tagName==='SELECT'){
   const option=document.createElement('option');option.value='';option.textContent='多个值';option.disabled=true;option.setAttribute('selected','');input.prepend(option);
   for(const opt of input.options)if(opt!==option)opt.removeAttribute('selected');
  }else if(input.type==='color'){
   input.value='#000000';input.setAttribute('value','#000000');const wrapper=document.createElement('div');wrapper.className='mixed-color';input.replaceWith(wrapper);wrapper.append(input);const note=document.createElement('span');note.textContent='多个值';wrapper.append(note);
  }else{input.value='';input.setAttribute('value','');input.placeholder='多个值';if(input.tagName==='TEXTAREA')input.textContent=''}
 }
 if(objects.length>1){root.querySelectorAll('small:not(.transform-label small),.group-note,button').forEach(e=>e.remove());root.querySelectorAll('.paired-fields').forEach(e=>{if(!e.children.length)e.remove()})}
 root.querySelectorAll('.inspector-section').forEach(e=>{if(!e.querySelector('[data-scope]'))e.remove()});
 const holder=document.createElement('div');holder.append(root);return holder.innerHTML;
}
function syncPropertyInputs(active){
 const template=document.createElement('template');template.innerHTML=selectionPropertyMarkup();
 const next=new Map(propertyControls(template.content).map(i=>[i.dataset.scope+':'+i.dataset.key,i]));
 for(const input of propertyControls($('#properties'))){
  const fresh=next.get(input.dataset.scope+':'+input.dataset.key);if(!fresh)continue;
  if(input!==active){if(input.tagName==='SELECT')input.innerHTML=fresh.innerHTML;input.value=fresh.value}
  if(fresh.dataset.mixed){input.dataset.mixed='true';input.setAttribute('aria-description',fresh.getAttribute('aria-description'));if(fresh.placeholder)input.placeholder=fresh.placeholder}
  else{delete input.dataset.mixed;input.removeAttribute('aria-description');if(input.placeholder==='多个值')input.placeholder='';const wrapper=input.closest('.mixed-color');if(wrapper)wrapper.replaceWith(input)}
 }
}
function resizeProperty(o,axis,value,e={}){
 const extent=propertyDimensions(o),factors=[1,1,1];if(extent[axis]<1e-8)throw Error('当前组件无法调整此尺寸');
 const desired=gridEnabled(e)?gridLength(value):value;if(sameProperty(extent[axis],desired))return;
 factors[axis]=desired/extent[axis];
 constrainSolidFactors(o,factors,[axis]);
 const labels=doc().objects.filter(t=>t.type==='text').map(t=>({t,position:[...t.position]}));
 scaleHost(o,worldAxes,factors,M.origin(doc(),o));if(['stairs','spiral'].includes(o.type))o.thickness*=factors[2];
 for(const {t,position} of labels)t.position=position;
}
function applyObjectProperty(o,scope,key,value,e={}){
  const target=scope==='flight'?o.flights[flight]:o;
  if(scope==='prop'&&['px','py','pz'].includes(key)){const axis={px:0,py:1,pz:2}[key];o.position[axis]=value}
  else if(scope==='prop'&&['rx','ry','rz'].includes(key)){const angles=propertyRotation(o),axis={rx:0,ry:1,rz:2}[key];if(sameProperty(angles[axis],value))return;angles[axis]=value;const matrix=propertyOrientation(angles);if(matrix.every((v,i)=>sameProperty(v,o.orientation[i])))return;o.orientation=matrix}
  else if(scope==='prop'&&key.startsWith('dimension'))resizeProperty(o,'XYZ'.indexOf(key.slice(-1)),value,e);
  else if(key==='totalDegrees')o.turns=value/360;
  else if(key==='wallHeight'){o.wallPath.height=value;o.points=o.points.map(p=>[p[0],p[1]?value:0])}
  else if(key==='thickness'&&o.wallFootprint)scaleHost(o,[[0,1,0]],[value/o.thickness],M.origin(doc(),o));
  else{target[key]=key==='direction'?Number(value):value;if(['steps','rungs'].includes(key))o.countMode='manual'}
  if(gridEnabled(e)&&['thickness','span','inner','outer','start','end','wallHeight'].includes(key))fitObjectToGrid(doc(),o);
  M.updateCounts(o);
}
function applyComponentProperty(scope,key,value){
 if(key==='floor'){
  const ids=childIds();doc().objects.filter(o=>ids.has(o.id)).forEach(o=>o.floor=value);doc().activeFloor=value;return;
 }
 for(const o of propertyObjects())applyObjectProperty(o,scope,key,value);
}

// Scrubbing previews from the original state and commits one history entry on release.
let propertyScrub=null,propertyScrubClickUntil=0;
function finishPropertyScrub(cancel=false){
 const a=propertyScrub;if(!a)return;propertyScrub=null;
 document.body.classList.remove('property-scrubbing');a.capture.querySelector('.scrubbing')?.classList.remove('scrubbing');
 if(a.capture.hasPointerCapture?.(a.pointer))a.capture.releasePointerCapture(a.pointer);
 if(!a.started)return;
 propertyScrubClickUntil=performance.now()+250;
 if(cancel){project=JSON.parse(a.before);prune();status('已取消属性拖动')}
 else if(a.changed)history(a.before);
 lastFormKey=null;persist();render();
}
document.addEventListener('pointerdown',e=>{
 const field=e.target.closest('[data-property-scrub]'),input=field?.querySelector('input');
 if(!input||input.disabled||e.button!==0||e.isPrimary===false||drag||propertyScrub||locked())return;
 const key=input.dataset.key;finishEditing();
 propertyScrub={key,pointer:e.pointerId,capture:$('#properties'),before:snapshot(),document:current,selection:selection.join(','),start:[e.clientX,e.clientY],lastX:e.clientX,delta:0,started:false,changed:false,values:new Map(propertyObjects().map(o=>[o.id,propertyValue(o,'prop',key)])),min:input.min===''?-Infinity:+input.min,max:input.max===''?Infinity:+input.max};
},true);
document.addEventListener('pointermove',e=>{
 const a=propertyScrub;if(!a||e.pointerId!==a.pointer)return;
 if(current!==a.document||selection.join(',')!==a.selection||locked()){finishPropertyScrub(true);return}
 if(!a.started){
  const dx=e.clientX-a.start[0],dy=e.clientY-a.start[1];
  if(e.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>4){finishPropertyScrub(true);return}
  if(Math.abs(dx)<4)return;
  document.activeElement?.blur();clearTimeout(timer);a.started=true;
  a.capture.setPointerCapture?.(a.pointer);document.body.classList.add('property-scrubbing');
  $('#prop-'+a.key)?.closest('.axis-field').classList.add('scrubbing');window.getSelection()?.removeAllRanges();
 }
 e.preventDefault();e.stopPropagation();const values=[...a.values.values()];a.delta=clamp(a.delta+(e.clientX-a.lastX)*(e.shiftKey ? .1 : 1),a.min-Math.min(...values),a.max-Math.max(...values));a.lastX=e.clientX;
 const previous=project;
 try{
  project=JSON.parse(a.before);
  for(const o of propertyObjects())applyObjectProperty(o,'prop',a.key,clamp(a.values.get(o.id)+a.delta,a.min,a.max),e);
  if(!valid())throw Error('轮廓或空洞无效，保留上一次有效值');M.validate(project);a.changed=snapshot()!==a.before;
  status(`${$('#prop-'+a.key)?.getAttribute('aria-label')||'变换'} · ${a.delta>=0?'+':''}${+a.delta.toFixed(2)} · Esc 取消`);
 }catch(error){project=previous;status(error.message)}
 drawCanvas();syncPropertyInputs();
},true);
document.addEventListener('pointerup',e=>{if(propertyScrub&&e.pointerId===propertyScrub.pointer)finishPropertyScrub()},true);
document.addEventListener('pointercancel',e=>{if(propertyScrub&&e.pointerId===propertyScrub.pointer)finishPropertyScrub(true)},true);
document.addEventListener('lostpointercapture',e=>{if(propertyScrub?.started&&e.pointerId===propertyScrub.pointer)finishPropertyScrub(true)},true);
document.addEventListener('click',e=>{if(performance.now()<propertyScrubClickUntil&&e.target.closest('#properties')){propertyScrubClickUntil=0;e.preventDefault();e.stopImmediatePropagation()}},true);
document.addEventListener('keydown',e=>{
 if(!propertyScrub?.started)return;
 if(e.key==='Escape'||(e.ctrlKey||e.metaKey)&&['z','y'].includes(e.key.toLowerCase())){e.preventDefault();e.stopImmediatePropagation();finishPropertyScrub(true)}
 else if(!['Shift','Control','Meta','Alt'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation()}
},true);
window.addEventListener('blur',()=>finishPropertyScrub(true));
window.addEventListener('resize',()=>finishPropertyScrub(true));
window.addEventListener('beforeunload',()=>finishPropertyScrub(true));
