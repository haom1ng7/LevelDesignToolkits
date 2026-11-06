const {spawn}=require('node:child_process'),{createInterface}=require('node:readline'),path=require('node:path');
function createClient(){
 const child=spawn(process.execPath,[path.resolve(__dirname,'../../tools/mcp/server.mjs')],{env:{...process.env,STUDIO_MCP_PORT:'0'},stdio:['pipe','pipe','pipe'],windowsHide:true});
 const pending=new Map();let sequence=0,stderr='';
 child.stderr.on('data',chunk=>{stderr+=chunk});
 const lines=createInterface({input:child.stdout});
 lines.on('line',line=>{
  let reply;try{reply=JSON.parse(line)}catch(error){for(const p of pending.values())p.reject(error);return}
  const p=pending.get(reply.id);if(!p)return;pending.delete(reply.id);clearTimeout(p.timer);reply.error?p.reject(Error(JSON.stringify(reply.error))):p.resolve(reply.result);
 });
 child.on('error',error=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(error)}pending.clear()});
 child.on('exit',()=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('MCP exited: '+stderr))}pending.clear()});
 return {child,get stderr(){return stderr},
  request(method,params={}){const id=++sequence;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('MCP test request timed out: '+method+' '+stderr))},25000);pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n')})},
  async tool(name,args={}){const reply=await this.request('tools/call',{name,arguments:args});if(reply.isError)throw Error(reply.content[0].text);return reply.structuredContent},
  async close(){
   if(child.exitCode!==null)return;child.stdin.end();
   await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill();resolve()},4000);child.once('exit',()=>{clearTimeout(timer);resolve()})});lines.close();
  }
 };
}
module.exports={createClient};
