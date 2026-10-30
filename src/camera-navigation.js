// Navigation uses a real perspective camera; orthographic views remain available.
const cameraKeys=new Set();
let cameraFrame=null,cameraTickAt=0,cameraMoveSpeed=600;
function syncPerspectiveControls(){const active=view.mode==='solid'&&!!view.fly;$('#solid-projection').value=active?'perspective':'orthographic';document.querySelectorAll('[data-action="zoom-in"],[data-action="zoom-out"]').forEach(b=>b.disabled=active||!doc());$('#elevation').min=active?'-90':'0.5';$('#elevation').title=active?'透视俯仰角范围：-90°–90°':'俯仰角范围：0.5°–90°'}
function enablePerspectiveCamera(frame=false){
 if(view.fly||view.mode!=='solid'||doc()?.type!=='space')return;
 const b=M.viewBasis(doc(),view),center=[camera.x+camera.w/2,camera.y+camera.h/2],target=M.unproject(center,b,b.origin),focal=camera.w*.9;
 let distance=focal;
 if(frame){const points=doc().objects.filter(o=>o.visible!==false&&M.floor(doc(),o)?.visible!==false&&o.type!=='hole').flatMap(o=>['route','text','marker'].includes(o.type)?[M.origin(doc(),o)]:M.geometry(doc(),o).flatMap(f=>f.points));for(const p of points){const v=M.sub(p,target);distance=Math.max(distance,M.dot(v,b.n)+Math.max(Math.abs(M.dot(v,b.r))*focal/(camera.w*.44),Math.abs(M.dot(v,b.down))*focal/(camera.h*.44))+1)}}
 view.fly={eye:M.add(target,M.mul(b.n,distance)),center,focal};syncPerspectiveControls();
}
function changeCameraProjection(value){stopCameraNavigation();if(value==='perspective'){enablePerspectiveCamera(true);drawCanvas()}else{delete view.fly;view.elevation=Math.max(.5,view.elevation);syncPerspectiveControls();fit()}canvasFocus()}
function cameraKey(e){const physical=/^Key([WASDQE])$/.exec(e.code||'');return physical?physical[1].toLowerCase():!e.code&&/^[wasdqe]$/i.test(e.key||'')?e.key.toLowerCase():null}
function cameraNavigationAvailable(){return doc()?.type==='space'&&view.mode==='solid'&&!selection.length&&!editing&&!rowRename&&!drawing&&!space&&(!drag||drag.kind==='orbit')&&!document.querySelector('dialog[open]')&&!textInput(document.activeElement)}
function stopCameraNavigation(){cameraKeys.clear();if(cameraFrame!==null)cancelAnimationFrame(cameraFrame);cameraFrame=null;cameraTickAt=0}
function moveCameraFrame(now){
 cameraFrame=null;if(!cameraKeys.size||!cameraNavigationAvailable()){stopCameraNavigation();return}
 const dt=clamp((now-cameraTickAt)/1000,0,.05);cameraTickAt=now;
 const side=Number(cameraKeys.has('d'))-Number(cameraKeys.has('a')),forward=Number(cameraKeys.has('w'))-Number(cameraKeys.has('s')),up=Number(cameraKeys.has('e'))-Number(cameraKeys.has('q')),b=M.viewBasis(doc(),view),direction=M.add(M.add(M.mul(b.r,side),M.mul(b.n,-forward)),[0,0,up]),length=Math.hypot(...direction);
 if(length>1e-9&&dt){view.fly.eye=M.add(view.fly.eye,M.mul(direction,cameraMoveSpeed*dt/length));drawCanvas()}
 cameraFrame=requestAnimationFrame(moveCameraFrame);
}
function beginCameraNavigation(e){
 const k=cameraKey(e);if(!k||e.ctrlKey||e.metaKey||e.altKey||textInput(e.target)||composingKey(e)||!cameraNavigationAvailable())return false;
 e.preventDefault();if(!e.repeat){const entering=!view.fly;enablePerspectiveCamera();if(entering)drawCanvas();cameraKeys.add(k);if(cameraFrame===null){cameraTickAt=performance.now();cameraFrame=requestAnimationFrame(moveCameraFrame)}}return true;
}
function adjustCameraMoveSpeed(e){
 if(doc()?.type!=='space'||view.mode!=='solid'||!(e.buttons&2)&&drag?.kind!=='orbit')return false;
 // Treat a wheel detent as one step, while retaining fine trackpad deltas.
 const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?800:1);
 if(delta){cameraMoveSpeed=clamp(cameraMoveSpeed*Math.pow(1.25,clamp(-delta/100,-4,4)),10,100000);if(drag?.kind==='orbit')drag.rateAdjusted=true;status('摄像机移动速率：'+Math.round(cameraMoveSpeed)+' cm/s · 右键＋滚轮调节')}
 return true;
}
document.addEventListener('keyup',e=>{const k=cameraKey(e);if(k)cameraKeys.delete(k);if(!cameraKeys.size)stopCameraNavigation()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'||e.code==='Space'||e.ctrlKey||e.metaKey||e.altKey)stopCameraNavigation()},true);
document.addEventListener('focusin',e=>{if(e.target!==canvas)stopCameraNavigation()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCameraNavigation()});
window.addEventListener('blur',stopCameraNavigation);
canvas.addEventListener('pointercancel',stopCameraNavigation);
