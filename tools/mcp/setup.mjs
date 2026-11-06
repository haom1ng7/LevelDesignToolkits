// Generate a project-local Codex MCP entry without changing unrelated configuration.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url),file=new URL('.codex/config.toml',root);
const start='# BEGIN level-design-toolkits MCP',end='# END level-design-toolkits MCP';
const block=[start,'[mcp_servers.level_design_toolkits]','command = '+JSON.stringify(process.execPath),'args = ['+JSON.stringify(fileURLToPath(new URL('./server.mjs',import.meta.url)))+']','startup_timeout_sec = 15','tool_timeout_sec = 30',end].join('\n');
await mkdir(new URL('.codex/',root),{recursive:true});
let text=await readFile(file,'utf8').catch(error=>{if(error.code==='ENOENT')return '';throw error});
if(text.includes(start)){
 const from=text.indexOf(start),to=text.indexOf(end,from);if(to<0)throw Error('MCP 配置标记不完整，请检查 '+fileURLToPath(file));
 text=text.slice(0,from)+block+text.slice(to+end.length);
}else{
 if(/^\s*\[mcp_servers\.level_design_toolkits(?:\]|\.)/m.test(text))throw Error('已存在同名配置，请先检查 '+fileURLToPath(file));
 text+=(text.endsWith('\n')||!text?'':'\n')+'\n'+block+'\n';
}
await writeFile(file,text,'utf8');
console.log('已配置项目 MCP：'+fileURLToPath(file)+'\n请在 Codex 中信任此项目并开启新对话，然后调用 studio_connect。CLI 可用 /mcp 检查连接。');
