// Tool keys belong to the canvas; composition and typing belong to editors.
let composingElement=null,imeHintAt=-Infinity;
function textInput(target){return target instanceof Element&&!!target.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]')}
function composingKey(e){return e.isComposing||e.keyCode===229||e.key==='Process'||composingElement&&textInput(e.target)}
// Capture save before inline editors stop propagation or form fields filter tool keys.
document.addEventListener('keydown',e=>{
 if(!(e.ctrlKey||e.metaKey)||e.altKey||!(e.code==='KeyS'||e.key?.toLowerCase()==='s'))return;
 e.preventDefault();e.stopPropagation();
 if(e.repeat||composingKey(e)||document.querySelector('dialog[open]'))return;
 command('save');
},true);
document.addEventListener('compositionstart',e=>{if(textInput(e.target))composingElement=e.target},true);
document.addEventListener('compositionend',()=>{composingElement=null},true);
document.addEventListener('focusout',e=>{if(composingElement===e.target)composingElement=null},true);
function toolKey(e){
 const keys={r:'size',w:'move',e:'rotate',v:'vertex',p:'plane',c:'ellipse',o:'cut',l:'route',t:'text',m:'marker',h:'pan'};
 const physical=/^Key([A-Z])$/.exec(e.code||'');return keys[physical?physical[1].toLowerCase():e.key?.toLowerCase()];
}
function unavailableTool(t){if(!doc())return '当前没有可编辑的图稿';if(['move','size','rotate','vertex','hole'].includes(t)&&!selection.length)return '当前没有选中的可编辑组件';if(locked())return '选中的组件已锁定';if(t==='intersect'||t==='difference')return '交集与差集仅适用于至少两个可见且未锁定的实体，附属空洞也需可见且未锁定';if(t==='cut')return '切割仅适用于单个平面或墙壁的可见切割面';if(t==='size'&&obj()?.type==='text')return '文字大小由字号决定';if(t==='vertex'&&obj()?.type==='route')return '路线形状由路线节点决定';if(view.mode==='solid'){if(t==='size'&&!solidSizeAvailable())return '立体图尺寸编辑仅适用于单个实体';return obj()?.type==='hole'?'空洞编辑仅适用于平面图与立面图':'当前组件不支持立体图中的此项编辑'}return '当前组件或视图不支持此工具'}
function imeHint(){if(Date.now()-imeHintAt<6000)return;imeHintAt=Date.now();status('快捷键未识别，请切换英文输入法后重试，或点击左侧工具')}
function canvasFocus(){if(!editing&&!rowRename&&!document.querySelector('dialog[open]'))canvas.focus({preventScroll:true})}
// Do not destroy an editor while its candidate text is being committed on blur.
document.addEventListener('pointerdown',e=>{if(composingElement&&editing&&!e.target.closest('#inline-edit-shell')){e.stopImmediatePropagation();const editor=$('#inline-editor');editor.blur();queueMicrotask(()=>{composingElement=null;finishEditing();canvasFocus()})}},true);
