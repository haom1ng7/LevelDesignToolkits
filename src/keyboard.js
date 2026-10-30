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
function unavailableTool(t){if(!doc())return '请先新建图稿';if(['move','size','rotate','vertex','hole'].includes(t)&&!selection.length)return '请先选择可编辑组件';if(locked())return '请先解除组件锁定';if(t==='intersect'||t==='difference')return '请选中至少两个可见且未锁定的实体，附属空洞也须显示并解锁';if(t==='cut')return '请选择单个平面或墙壁，并切换到可见的切割面';if(t==='size'&&obj()?.type==='text')return '双击文字或在属性中调整字号';if(t==='vertex'&&obj()?.type==='route')return '直接拖动路线节点调整';if(view.mode==='solid'){if(t==='size'&&!solidSizeAvailable())return '请在组件列表选择单个实体，拖角点调整长宽高';return obj()?.type==='hole'?'请切换平面图或立面图编辑空洞':'当前组件不支持此工具，请切换平面图或立面图'}return '当前组件或视图不支持此工具'}
function imeHint(){if(Date.now()-imeHintAt<6000)return;imeHintAt=Date.now();status('快捷键未识别，请切换英文输入法后重试，或点击左侧工具')}
function canvasFocus(){if(!editing&&!rowRename&&!document.querySelector('dialog[open]'))canvas.focus({preventScroll:true})}
// Do not destroy an editor while its candidate text is being committed on blur.
document.addEventListener('pointerdown',e=>{if(composingElement&&editing&&!e.target.closest('#inline-edit-shell')){e.stopImmediatePropagation();const editor=$('#inline-editor');editor.blur();queueMicrotask(()=>{composingElement=null;finishEditing();canvasFocus()})}},true);
