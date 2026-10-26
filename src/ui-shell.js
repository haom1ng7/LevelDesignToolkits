// Shared app fragment: presentation state never enters the project JSON/history.
const shellNarrow=window.matchMedia?.('(max-width: 990px)');
const shellDark=window.matchMedia?.('(prefers-color-scheme: dark)');
function shellIsDark(){return document.documentElement.dataset.theme?document.documentElement.dataset.theme==='dark':!!shellDark?.matches}
function syncShellTheme(){const b=$('#theme-toggle'),dark=shellIsDark();b.setAttribute('aria-pressed',String(dark));b.setAttribute('aria-label',dark?'切换到浅色界面':'切换到深色界面');b.title=dark?'切换到浅色界面':'切换到深色界面';b.innerHTML=dark?'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></svg>':'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4v16"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none"/></svg>'}
function syncShellPanes(){const active=document.body.dataset.pane||'canvas',narrow=!!shellNarrow?.matches;for(const name of ['tools','canvas','properties']){const el=$('#workspace-'+name);el.inert=narrow&&name!==active}document.querySelectorAll('[data-shell-pane]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.shellPane===active)))}
function setShellPane(name){if(!['tools','canvas','properties'].includes(name))return;finishEditing();document.body.dataset.pane=name;syncShellPanes();if(name==='canvas')requestAnimationFrame(()=>{if(doc())fit()})}
// Presentation changes follow real editor state, without per-frame observers or save writes.
let shellComposition='';
function syncShellComposition(d){
 const mode=d?.curve?'curve':d?view.mode:'empty',key=[current,mode,view.side,panel].join(':');
 document.body.dataset.workspaceMode=mode;document.body.dataset.shellTool=tool;document.body.dataset.inspector=panel;
 document.body.dataset.hasSelection=String(!!(selection.length||eventId));
 const labels={empty:'START',plan:'PLAN',elevation:'ELEVATION',solid:'VOLUME',curve:'RHYTHM'};
 $('#shell-view-index').textContent=d?String(project.documents.findIndex(item=>item.id===d.id)+1).padStart(2,'0'):'00';$('#shell-mode-label').textContent=labels[mode];
 if(key!==shellComposition){
  shellComposition=key;
  if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
   const heading=$('.canvas-heading');heading.getAnimations?.().forEach(a=>a.cancel());
   heading.animate?.([{clipPath:'inset(0 8% 0 0)',transform:'translateX(-6px)'},{clipPath:'inset(0)',transform:'none'}],{duration:280,easing:'cubic-bezier(.16,1,.3,1)'});
  }
 }
}
function updateShell(){
 const d=doc(),objects=new Map(d?.objects.map(o=>[o.id,o])||[]);document.body.dataset.document=d?.type||'empty';
 syncShellComposition(d);
 $('#workspace-count').textContent=d?.curve?d.curve.events.length:d?d.objects.length:project.documents.length;
 $('#workspace-count-label').textContent=d?.curve?'个事件':d?'个组件':'张图稿';
 $('#document-select').disabled=!project.documents.length;$('#layer-filter').disabled=!d;
 $('[data-action="new"]').disabled=project.documents.length>=30;
 for(const attr of ['tool','view','side','panel','background'])document.querySelectorAll('[data-'+attr+']').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('active'))));
 document.querySelectorAll('[data-layer]').forEach(b=>{b.setAttribute('aria-pressed',String(selection.includes(b.dataset.layer)))});
 document.querySelectorAll('[data-floor]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.floor===d?.activeFloor)));
 document.querySelectorAll('[data-visible]').forEach(b=>{const o=objects.get(b.dataset.visible);b.setAttribute('aria-label',(o?.visible?'隐藏':'显示')+'组件：'+(o?.name||''))});
 document.querySelectorAll('[data-lock]').forEach(b=>{const o=objects.get(b.dataset.lock);b.setAttribute('aria-label',(o?.locked?'解除锁定：':'锁定组件：')+(o?.name||''))});
 syncShellPanes();
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.hasAttribute('data-shell-theme')){const theme=shellIsDark()?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('level-toolkits-ui-theme',theme)}catch{}syncShellTheme();return}if(b.dataset.shellPane){setShellPane(b.dataset.shellPane);return}if(shellNarrow?.matches&&(b.dataset.tool||b.dataset.template))setShellPane('canvas')});
// Native focus can leave a partly visible control clipped inside the single row.
document.addEventListener('focusin',e=>{const bar=e.target.closest('.canvas-top');if(!bar)return;const item=e.target.getBoundingClientRect(),area=bar.getBoundingClientRect();if(item.left<area.left+4)bar.scrollLeft-=area.left+4-item.left;else if(item.right>area.right-4)bar.scrollLeft+=item.right-area.right+4});
document.addEventListener('click',e=>{if(!e.target.closest('.skip-workspace'))return;e.preventDefault();setShellPane('canvas');$('#workspace-canvas').focus({preventScroll:true})});
shellNarrow?.addEventListener('change',()=>{syncShellPanes();if(!shellNarrow.matches||document.body.dataset.pane==='canvas')requestAnimationFrame(()=>{if(doc())fit()})});
shellDark?.addEventListener('change',syncShellTheme);
syncShellTheme();
