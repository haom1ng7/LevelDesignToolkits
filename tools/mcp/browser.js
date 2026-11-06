// Injected only by the loopback MCP host. Offline dist/index.html never connects.
(()=>{
 'use strict';
 const fragment=new URLSearchParams(location.hash.slice(1)),secret=fragment.get('studio-token')||sessionStorage.getItem('studio-mcp-token');
 if(!secret||!window.StudioMCP)return;
 sessionStorage.setItem('studio-mcp-token',secret);history.replaceState(null,'',location.pathname);
 const clientId=crypto.randomUUID(),completed=new Map();let stopped=false;
 const bar=document.createElement('div'),label=document.createElement('span'),button=document.createElement('button');
 bar.id='studio-mcp-status';bar.setAttribute('role','status');
 bar.style.cssText='display:flex;align-items:center;gap:.5rem;flex:none;padding:0;color:inherit;font:inherit;white-space:nowrap;justify-self:center;max-width:100%';
 label.textContent='AI 联动正在连接';button.textContent='断开 AI';button.type='button';
 button.style.cssText='background:var(--ark-signal,#d9e443);color:var(--ark-on-signal,#141719);border:0;padding:.25rem .5rem;min-width:0;min-height:1.75rem;font:inherit;line-height:1.25;cursor:pointer;white-space:nowrap';
 bar.append(label,button);const dock=document.querySelector('.canvas-bottom');if(!dock)return;dock.insertBefore(bar,dock.querySelector('.zoom'));
 // Equal side columns anchor the status to the canvas center, regardless of labels or zoom width.
 const info=dock.querySelector('#selection-info'),zoom=dock.querySelector('.zoom');
 dock.style.display='grid';dock.style.gridTemplateColumns='minmax(0,1fr) auto minmax(0,1fr)';dock.style.rowGap='.125rem';
 if(info){info.style.gridColumn='1';info.style.gridRow='1'}
 if(zoom){zoom.style.justifySelf='end';zoom.style.gridRow='1'}
 function layoutStatus(){
  const style=getComputedStyle(dock),available=dock.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),gap=parseFloat(style.columnGap)||0;
  const narrow=available<bar.getBoundingClientRect().width+2*(zoom?.getBoundingClientRect().width||0)+2*gap;
  bar.style.gridColumn=narrow?'1 / -1':'2';bar.style.gridRow=narrow?'2':'1';
  if(zoom)zoom.style.gridColumn=narrow?'2 / 4':'3';
 }
 const layoutObserver=new ResizeObserver(layoutStatus);layoutObserver.observe(dock);layoutObserver.observe(bar);if(zoom)layoutObserver.observe(zoom);layoutStatus();
 button.onclick=async()=>{stopped=true;sessionStorage.removeItem('studio-mcp-token');label.textContent='AI 已断开';button.remove();try{await request('/bridge/disconnect',{clientId})}catch{}};
 async function request(path,body){
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+secret},body:JSON.stringify(body),signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw Error(response.status===409?'另一个联动画稿页正在使用此服务':response.status===401?'服务已重启，请重新获取联动地址':'连接失败：'+response.status);
  return response.json();
 }
 async function poll(){
  let replies=[];
  while(!stopped){
   try{
    const data=await request('/bridge/poll',{clientId,replies});replies=[];
    if(stopped)break;
    label.textContent='AI 已连接';
    for(const command of data.commands){
     if(stopped)break;
     let reply=completed.get(command.id);
     if(!reply){
      try{
       if(Date.now()>=command.expiresAt)throw Error('操作已过期，未执行');
       reply={id:command.id,result:await window.StudioMCP.dispatch(command.method,command.args)};
      }catch(error){reply={id:command.id,error:error.message}}
      completed.set(command.id,reply);if(completed.size>100)completed.delete(completed.keys().next().value);
     }
     replies.push(reply);
    }
   }catch(error){if(!stopped)label.textContent=error.message}
   if(!stopped)await new Promise(resolve=>setTimeout(resolve,250));
  }
 }
 poll();
})();
