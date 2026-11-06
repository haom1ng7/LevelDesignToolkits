#!/usr/bin/env node
// MCP stdio + authenticated loopback browser bridge. Uses only Node built-ins.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {tools,instructions,checkArgs} from './tools.mjs';

const root=new URL('../../',import.meta.url),limit=16*1024*1024;
export async function startBridge({port=Number(process.env.STUDIO_MCP_PORT??32123),timeout=15000}={}){
 if(!Number.isInteger(port)||port<0||port>65535)throw Error('STUDIO_MCP_PORT 必须是 0–65535 的整数');
 const token=randomBytes(32).toString('hex'),pending=new Map(),disconnected=new Set();let owner=null,lastSeen=0,origin,closed=false;
 const browserScript=await readFile(new URL('tools/mcp/browser.js',root),'utf8');
 const original=await readFile(new URL('dist/index.html',root),'utf8').catch(()=>{throw Error('缺少 dist/index.html，请先 npm run build')});
 if(!original.includes('StudioMCP'))throw Error('网页构建尚不含 MCP 接口，请先 npm run build');
 const html=original.replace('connect-src &#39;none&#39;','connect-src &#39;self&#39;').replace('</body>',()=>'<script>'+browserScript+'</script></body>');
 const connected=()=>!!owner&&Date.now()-lastSeen<10000;
 function rejectAll(message){for(const task of pending.values()){clearTimeout(task.timer);task.reject(Error(message))}pending.clear()}
 function send(res,code,value){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(JSON.stringify(value))}
 const server=createServer(async(req,res)=>{
  try{
   if(req.headers.host!==new URL(origin).host){send(res,403,{error:'Invalid Host'});return}
   if(req.headers.origin&&req.headers.origin!==origin){send(res,403,{error:'Invalid Origin'});return}
   if(req.url==='/'&&req.method==='GET'){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"frame-ancestors 'none'"});res.end(html);return;
   }
   if(!['/bridge/poll','/bridge/disconnect'].includes(req.url)||req.method!=='POST'){send(res,404,{error:'Not found'});return}
   if(req.headers.authorization!=='Bearer '+token){send(res,401,{error:'Unauthorized'});return}
   const chunks=[];let bytes=0;
   for await(const chunk of req){bytes+=chunk.length;if(bytes>limit){send(res,413,{error:'Payload too large'});return}chunks.push(chunk)}
   const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(typeof data.clientId!=='string'||!(/^[\w-]{1,100}$/).test(data.clientId)){send(res,400,{error:'Invalid clientId'});return}
   if(req.url==='/bridge/disconnect'){
    disconnected.add(data.clientId);if(disconnected.size>100)disconnected.delete(disconnected.values().next().value);
    if(data.clientId===owner){owner=null;lastSeen=0;rejectAll('联动画稿已断开；请先读取状态确认之前的操作是否完成')}
    send(res,200,{});return;
   }
   if(disconnected.has(data.clientId)){send(res,401,{error:'Page disconnected'});return}
   if(connected()&&owner!==data.clientId){send(res,409,{error:'Another page is connected'});return}
   if(owner&&owner!==data.clientId)rejectAll('联动画稿页面已更换，请重新读取状态');
   owner=data.clientId;lastSeen=Date.now();
   for(const reply of data.replies??[]){
    const task=pending.get(reply.id);if(!task)continue;
    clearTimeout(task.timer);pending.delete(reply.id);reply.error?task.reject(Error(String(reply.error))):task.resolve(reply.result);
   }
   send(res,200,{commands:[...pending.values()].map(task=>task.command)});
  }catch(error){if(!res.headersSent)send(res,400,{error:error.message});else res.end()}
 });
 server.requestTimeout=10000;server.headersTimeout=10000;
 await new Promise((resolve,reject)=>{
  server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.removeListener('error',reject);resolve()});
 }).catch(async error=>{
  if(error.code!=='EADDRINUSE'||port===0||process.env.STUDIO_MCP_PORT!==undefined)throw error;
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{server.removeListener('error',reject);resolve()})});
 });
 origin='http://127.0.0.1:'+server.address().port;
 return {
  origin,url:origin+'/#studio-token='+token,
  info(){return {url:this.url,connected:connected(),port:server.address().port,instructions:'在此地址打开联动画稿页，再用网页的“打开工程”载入 JSON。仅此页接受 AI 编辑。服务运行期间保持页面打开，完成后保存工程。',storageNote:'暂存按本机端口隔离。默认 32123；端口被占用时另选端口。更换地址或重启前请保存 JSON。'}},
  call(method,args,{signal}={}){
   if(closed)return Promise.reject(Error('服务已关闭'));
   if(!connected())return Promise.reject(Error('尚未连接画稿页，请调用 studio_connect 并打开返回的 URL'));
   if(pending.size>=20)return Promise.reject(Error('等待队列已满，请稍后再试'));
   const id=randomBytes(16).toString('hex');
   return new Promise((resolve,reject)=>{
    if(signal?.aborted){reject(Error('请求已取消'));return}
    const command={id,method,args,expiresAt:Date.now()+timeout};
    const cleanup=()=>signal?.removeEventListener('abort',cancel);
    const cancel=()=>{clearTimeout(timer);pending.delete(id);cleanup();reject(Error('请求已取消，若已执行请读取状态核对'))};
    const timer=setTimeout(()=>{pending.delete(id);cleanup();reject(Error('画稿页响应超时。操作可能已完成，请先 studio_get_state 核对，勿直接重试。'))},timeout);
    pending.set(id,{command,resolve:value=>{cleanup();resolve(value)},reject:error=>{cleanup();reject(error)},timer});
    signal?.addEventListener('abort',cancel,{once:true});
   });
  },
  async close(){closed=true;rejectAll('服务已关闭');server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
 };
}

export async function runStdio(){
 const bridge=await startBridge(),input=createInterface({input:process.stdin,crlfDelay:Infinity});
 const running=new Map();let stopping=false;
 const output=value=>{if(!stopping)process.stdout.write(JSON.stringify(value)+'\n')};
 async function stop(){if(stopping)return;stopping=true;input.close();await bridge.close()}
 input.on('line',async line=>{
  let message;
  try{if(Buffer.byteLength(line)>limit)throw Error('Message too large');message=JSON.parse(line)}catch{output({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}});return}
  if(!message||typeof message!=='object'||Array.isArray(message)||message.jsonrpc!=='2.0'||typeof message.method!=='string'){output({jsonrpc:'2.0',id:message?.id??null,error:{code:-32600,message:'Invalid Request'}});return}
  if(message.method==='notifications/cancelled'){
   const task=running.get(message.params?.requestId);if(task){task.cancelled=true;task.controller.abort()}return;
  }
  if(message.id===undefined)return;
  const request={cancelled:false,controller:new AbortController()};running.set(message.id,request);
  try{
   let result;
   if(message.method==='initialize'){
    const supported=['2024-11-05','2025-03-26','2025-06-18','2025-11-25'];
    result={protocolVersion:supported.includes(message.params?.protocolVersion)?message.params.protocolVersion:'2025-11-25',capabilities:{tools:{listChanged:false}},serverInfo:{name:'level-design-toolkits',version:'1.0.0'},instructions};
   }else if(message.method==='ping')result={};
   else if(message.method==='tools/list')result={tools};
   else if(message.method==='tools/call'){
    try{
     const {name,arguments:args={}}=message.params??{};checkArgs(name,args);
     const value=name==='studio_connect'?bridge.info():await bridge.call(name.replace(/^studio_/,''),args,{signal:request.controller.signal});
     result={content:[{type:'text',text:JSON.stringify(value)}],structuredContent:value};
    }catch(error){result={isError:true,content:[{type:'text',text:error.message}]}}
   }else{output({jsonrpc:'2.0',id:message.id,error:{code:-32601,message:'Method not found'}});return}
   if(!request.cancelled)output({jsonrpc:'2.0',id:message.id,result});
  }catch(error){output({jsonrpc:'2.0',id:message.id,error:{code:-32603,message:error.message}})}
  finally{running.delete(message.id)}
 });
 input.on('close',()=>{void stop()});process.once('SIGINT',()=>{void stop()});process.once('SIGTERM',()=>{void stop()});
 process.stderr.write('Level Design Toolkits MCP ready (loopback '+bridge.origin+'). Use studio_connect.\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 runStdio().catch(error=>{process.stderr.write(error.message+'\n');process.exitCode=1});
}
