// Solid views always use a perspective camera; plan/elevation retain drafting projection.
const cameraKeys=new Set();
let cameraFrame=null,cameraTickAt=0,cameraMoveSpeed=600;
let solidOrientationKey=null;
function syncSolidOrientation(){
 const element=$('#solid-orientation'),d=doc();element.toggleAttribute('hidden',d?.type!=='space'||view.mode!=='solid');if(element.hasAttribute('hidden'))return;
 const b=M.viewBasis(d,view),key=JSON.stringify([b.r,b.down,b.n,d.background]);if(key===solidOrientationKey)return;solidOrientationKey=key;
 element.style.setProperty('--orientation-halo',d.background);
 // Project directions only: camera position, distance and viewport scale cannot move the HUD.
 const axes=['X','Y','Z'].map((name,i)=>{const x=b.r[i],y=b.down[i],length=Math.hypot(x,y);return {name,i,x:42+x*26,y:42+y*26,lx:42+x*26+(length>.12?x/length*10:10),ly:42+y*26+(length>.12?y/length*10:-10),depth:b.n[i],color:['#cc332f','#518a26','#2677ce'][i]}}).sort((a,c)=>a.depth-c.depth);
 element.innerHTML='<title>世界坐标轴 · 随立体图视角旋转</title>'+axes.map(a=>`<g data-orientation-axis="${a.name}"><path d="M42 42L${a.x} ${a.y}" fill="none" stroke="${d.background}" stroke-width="4"/><path d="M42 42L${a.x} ${a.y}" fill="none" stroke="${a.color}" stroke-width="2"/><circle cx="${a.x}" cy="${a.y}" r="1.6" fill="${a.color}"/></g>`).join('')+`<circle cx="42" cy="42" r="2" fill="${R.contrast(d.background)}"/>`+axes.map(a=>`<text x="${a.lx}" y="${a.ly}" fill="${a.color}">${a.name}</text>`).join('');
}
function cameraMoveSpeedText(){return String(Math.round(cameraMoveSpeed/10)/10)}
function syncPerspectiveControls(){
 const d=doc(),solid=d?.type==='space'&&view.mode==='solid',label=$('#zoom-label');
 syncSolidOrientation();
 document.querySelectorAll('[data-action="zoom-in"],[data-action="zoom-out"]').forEach(b=>{
  const increase=b.dataset.action==='zoom-in',name=solid?(increase?'提高摄像机速率':'降低摄像机速率'):(increase?'放大':'缩小');
  b.disabled=!d||solid&&(increase?cameraMoveSpeed>=100000:cameraMoveSpeed<=10);b.setAttribute('aria-label',name);b.title=solid?(increase?'提高摄像机在空间中的移动速率':'降低摄像机在空间中的移动速率'):(increase?'放大图稿在视窗中的显示比例':'缩小图稿在视窗中的显示比例');
 });
 label.textContent=solid?cameraMoveSpeedText():d?Math.round(d.width/camera.w*100)+'%':'100%';
 label.title=solid?'摄像机的移动速率，单位为米每秒':'图稿在视窗中的显示比例';label.setAttribute('aria-label',solid?'摄像机移动速率：'+label.textContent+' m/s':'视图缩放：'+label.textContent);
}
function changeCameraMoveSpeed(steps){
 if(doc()?.type!=='space'||view.mode!=='solid')return;
 cameraMoveSpeed=clamp(cameraMoveSpeed*Math.pow(1.25,steps),10,100000);syncPerspectiveControls();
 status('摄像机移动速率：'+cameraMoveSpeedText()+' m/s · ＋/− 或右键＋滚轮调节');
}
function enablePerspectiveCamera(frame=false){
 if(view.fly||view.mode!=='solid'||doc()?.type!=='space')return;
 const b=M.viewBasis(doc(),view),center=[camera.x+camera.w/2,camera.y+camera.h/2],target=M.unproject(center,b,b.origin),focal=camera.w*.9;
 let distance=focal;
 if(frame){const points=doc().objects.filter(o=>o.visible!==false&&M.floor(doc(),o)?.visible!==false&&o.type!=='hole').flatMap(o=>['route','text','marker'].includes(o.type)?[M.origin(doc(),o)]:M.geometry(doc(),o).flatMap(f=>f.points));for(const p of points){const v=M.sub(p,target);distance=Math.max(distance,M.dot(v,b.n)+Math.max(Math.abs(M.dot(v,b.r))*focal/(camera.w*.44),Math.abs(M.dot(v,b.down))*focal/(camera.h*.44))+1)}}
 view.fly={eye:M.add(target,M.mul(b.n,distance)),center,focal};syncPerspectiveControls();
}
function cameraKey(e){const physical=/^Key([WASDQE])$/.exec(e.code||'');return physical?physical[1].toLowerCase():!e.code&&/^[wasdqe]$/i.test(e.key||'')?e.key.toLowerCase():null}
function cameraLookActive(){return view.mode==='solid'&&!!view.fly&&drag?.kind==='orbit'}
function cameraNavigationAvailable(){return doc()?.type==='space'&&view.mode==='solid'&&(!selection.length||cameraLookActive())&&!editing&&!rowRename&&!drawing&&!space&&(!drag||drag.kind==='orbit')&&!document.querySelector('dialog[open]')&&!textInput(document.activeElement)}
function stopCameraNavigation(){cameraKeys.clear();if(cameraFrame!==null)cancelAnimationFrame(cameraFrame);cameraFrame=null;cameraTickAt=0}
function moveCameraFrame(now){
 cameraFrame=null;if(!cameraKeys.size||!cameraNavigationAvailable()){stopCameraNavigation();return}
 const dt=clamp((now-cameraTickAt)/1000,0,.05);cameraTickAt=now;
 const side=Number(cameraKeys.has('d'))-Number(cameraKeys.has('a')),forward=Number(cameraKeys.has('w'))-Number(cameraKeys.has('s')),up=Number(cameraKeys.has('e'))-Number(cameraKeys.has('q')),b=M.viewBasis(doc(),view),direction=M.add(M.add(M.mul(b.r,side),M.mul(b.n,-forward)),[0,0,up]),length=Math.hypot(...direction);
 if(length>1e-9&&dt){view.fly.eye=M.add(view.fly.eye,M.mul(direction,cameraMoveSpeed*dt/length));requestCameraDraw()}
 cameraFrame=requestAnimationFrame(moveCameraFrame);
}
function beginCameraNavigation(e){
 const k=cameraKey(e);if(!k||e.ctrlKey||e.metaKey||e.altKey||textInput(e.target)||composingKey(e)||!cameraNavigationAvailable())return false;
 e.preventDefault();if(!e.repeat){if(drag?.kind==='orbit')drag.navigated=true;cameraKeys.add(k);if(cameraFrame===null){cameraTickAt=performance.now();cameraFrame=requestAnimationFrame(moveCameraFrame)}}return true;
}
function adjustCameraMoveSpeed(e){
 if(doc()?.type!=='space'||view.mode!=='solid'||!(e.buttons&2)&&drag?.kind!=='orbit')return false;
 // Treat a wheel detent as one step, while retaining fine trackpad deltas.
 const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?800:1);
 if(delta){if(drag?.kind==='orbit')drag.rateAdjusted=true;changeCameraMoveSpeed(clamp(-delta/100,-4,4))}
 return true;
}
document.addEventListener('keyup',e=>{const k=cameraKey(e);if(k)cameraKeys.delete(k);if(!cameraKeys.size)stopCameraNavigation()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'||e.code==='Space'||e.ctrlKey||e.metaKey||e.altKey)stopCameraNavigation()},true);
document.addEventListener('focusin',e=>{if(e.target!==canvas)stopCameraNavigation()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCameraNavigation()});
window.addEventListener('blur',stopCameraNavigation);
canvas.addEventListener('pointercancel',stopCameraNavigation);
canvas.addEventListener('lostpointercapture',()=>{if(drag?.kind==='orbit'){stopCameraNavigation();endDrag(true)}});
