function toolTeaching(t){
 const solid=view.mode==='solid';
 return {select:solid?'点击选中组件':'点击选中，拖框多选',move:solid&&usesWorldGizmo()?'拖动坐标轴或平面手柄':'选中后拖动组件',size:solid?'拖角点调整长宽高，对角点固定；拖旁边的轴只改一个尺寸':'拖边调整单个尺寸；拖角分别调整两个尺寸，Shift 等比缩放',rotate:solid&&solidRotationAvailable()?'拖动 X/Y/Z 圆环旋转；Shift 每次 15°':'拖动圆环调整方向',intersect:'多选实体后立即保留共同重叠体积',difference:'多选实体后立即删除重叠体积；完全被包裹的组件直接删除',vertex:'拖动角点，调整图形轮廓',plane:'拖拽创建矩形 · Shift 正方形',ellipse:'拖拽创建椭圆 · Shift 正圆',polygon:'依次点击取点，至少三个顶点后点击首点闭合创建；Backspace 退点，Esc 取消',wall:'拖拽创建墙壁',cut:'选中一个组件后逐点取点，闭合或贯穿时自动拆分；O 启用，Esc 取消',hole:view.mode==='elevation'?'在墙壁上拖拽打洞':'在平面上拖拽打洞',stairs:'点击放置楼梯',ladder:'点击放置爬梯',spiral:'点击放置旋转楼梯',marker:'点击放置标记',route:'依次点击连线，Enter结束',text:'点击添加，双击修改',pan:'按住左键拖动画面'}[t];
}
// GIFs are decoded only on demand, and replaced with their still when stopped.
const helpDialog=$('#help-dialog');
const helpContent=$('#help-content'),helpSections=[...helpDialog.querySelectorAll('[data-help-section]')];
function selectHelpChapter(id){helpDialog.querySelectorAll('[data-help-chapter]').forEach(button=>button.setAttribute('aria-current',String(button.dataset.helpChapter===id)));$('#help-chapter').value=id}
function goHelpChapter(id){const section=helpSections.find(s=>s.dataset.helpSection===id);if(section){helpContent.scrollTop=section.offsetTop-helpContent.offsetTop;selectHelpChapter(id)}}
function stopHelpDemos(){helpDialog.querySelectorAll('[data-help-demo]').forEach(button=>{button.querySelector('img').src=button.dataset.poster;button.setAttribute('aria-pressed','false');button.querySelector('.help-demo-action').textContent='点击播放演示'})}
helpDialog.addEventListener('click',e=>{const chapter=e.target.closest('[data-help-chapter]');if(chapter){goHelpChapter(chapter.dataset.helpChapter);return}const button=e.target.closest('[data-help-demo]');if(!button)return;const play=button.getAttribute('aria-pressed')!=='true';stopHelpDemos();if(play){button.querySelector('img').src=button.dataset.gif;button.setAttribute('aria-pressed','true');button.querySelector('.help-demo-action').textContent='点击停止演示'}});
$('#help-chapter').addEventListener('change',e=>goHelpChapter(e.target.value));
helpContent.addEventListener('scroll',()=>{const section=helpSections.filter(s=>s.offsetTop-helpContent.offsetTop<=helpContent.scrollTop+40).at(-1)||helpSections[0];selectHelpChapter(section.dataset.helpSection);const playing=helpDialog.querySelector('[data-help-demo][aria-pressed="true"]');if(playing){const a=playing.getBoundingClientRect(),b=helpContent.getBoundingClientRect();if(a.bottom<b.top||a.top>b.bottom)stopHelpDemos()}});
helpDialog.addEventListener('close',stopHelpDemos);
document.addEventListener('keydown',e=>{if(e.key==='F1'){e.preventDefault();if(!document.querySelector('dialog[open]'))command('help')}});
