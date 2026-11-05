function toolDescription(t){
 return {select:'确定当前编辑的组件',move:'改变组件在空间中的位置',size:'改变组件的长宽高',rotate:'改变组件在空间中的朝向',intersect:'保留多个实体共同重叠的体积',difference:'移除实体间的重叠体积，内部实体形成空腔',vertex:'改变组件的顶点位置与轮廓',plane:'创建矩形轮廓的平面组件',ellipse:'创建椭圆轮廓的平面组件',polygon:'创建自定义闭合轮廓的平面组件',freehand:'按住左键自由绘画，松开闭合成平面组件',wall:'沿组件的直边创建墙壁',cut:'沿闭合或贯穿的路径拆分平面与墙壁',hole:view.mode==='elevation'?'在墙壁中创建贯穿空洞':'在平面中创建贯穿空洞',stairs:'创建连接不同高度的直线楼梯',ladder:'创建连接不同高度的爬梯',spiral:'创建环绕中心轴的旋转楼梯',marker:'为图稿中的位置添加标记',route:'用连续线段表示路线',text:'为图稿添加文字标注',pan:'改变图稿在视窗中的位置'}[t];
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
