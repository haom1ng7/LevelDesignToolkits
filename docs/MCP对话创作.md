# 通过 Codex 对话创作图稿

本地 MCP 服务让 Codex CLI 和桌面端读取并编辑关卡设计工具箱的原生图稿：空间布局、楼层、墙体、楼梯、空洞、路线、文字和节奏曲线。创作使用 Codex 当前对话的模型，无需另配 OpenAI API Key。

## 首次配置

在源码目录使用 Node.js 24：

```powershell
npm ci
npm run build
npm run mcp:setup
```

`mcp:setup` 在本项目 `.codex/config.toml` 写入 MCP 启动项，保留其他配置。该文件包含本机 Node 与源码的绝对路径，不随 Git 提交；移动目录或换电脑后重新运行此命令。设置只对这个项目生效；在 Codex 中信任项目后开启新对话，让客户端加载工具。

如需在所有项目中使用，也可用 CLI 注册（把路径替换为真实位置）：

```powershell
codex mcp add level_design_toolkits -- node "C:/path/to/LevelDesignToolkits/tools/mcp/server.mjs"
codex mcp list
```

两种配置选择一种。Codex CLI 和桌面端共用同一主机的 MCP 配置。官方配置参考：[OpenAI MCP 文档](https://developers.openai.com/codex/mcp)。

## 开始创作

1. 在项目的 Codex 新对话中说：“连接 Level Design Toolkits，给我打开图稿的地址。”Codex 调用 `studio_connect`，返回带临时配对片段的本机 URL。
2. 在 Chrome、Edge 或支持本机地址的浏览器打开返回的完整 URL。页面底部显示“AI 已连接”。如已有图稿，在该页点击“打开工程”导入 JSON；原先独立打开的离线 HTML 不会被自动接管。
3. 继续对话描述布局、尺寸、关卡意图和约束。例如：

   > 在新空间图中创建一个 1800×1200 单位的中庭，南侧入口，中央留空，东西两侧各一条高差 300 的楼梯，添加一条通往北侧出口的路线和中文区域名称。

   > 读取当前选中的平面，把轮廓改成左右交替的 S 弯，保留两端接口和中央 80 单位的直通通道。

   > 新增节奏曲线，按探索、预热、战斗、缓冲、高潮五个阶段安排事件，再把第二场战斗的强度降低。

4. 图稿实时更新，每批 AI 改动只增加一次撤销；网页 Ctrl/Command+Z 或 `studio_history` 均可撤销。AI 会先读当前 revision；你在其间手动改图后，旧修改请求会拒绝，需重新读取。
5. 使用网页“保存工程”保留 JSON。可在网页导出 PNG/SVG/FBX/OBJ；MCP 的 `studio_export` 返回 SVG 或工程 JSON 文本供 Codex 保存。

页面编辑、拖拽、输入文字、属性输入或对话框打开期间，AI 写入会拒绝；完成或取消手动操作、点击画布后再继续。点击底部“断开 AI”可立即停止后续指令，保留已画内容；重新连接需再次打开 `studio_connect` 返回的完整地址。

## 工具与数据约定

| 工具 | 用途 |
| --- | --- |
| `studio_connect` | 获取本机联动页面 URL 与连接状态 |
| `studio_get_schema` | 读取原生组件模板、坐标、曲线结构与批次示例 |
| `studio_get_state` | 读取当前图稿所有对象、楼层、选择、视图及 revision；可选完整工程 |
| `studio_apply_operations` | 原子执行创建/更新/删除图稿、楼层、组件，批量移动，修改节奏曲线 |
| `studio_set_view` | 切换图稿、三视图、选择组件和取景 |
| `studio_history` | 撤销/重做一次操作 |
| `studio_export` | 获取完整工程 JSON 或当前视图的完整图稿 SVG 文本 |

新建空间图为空，新建曲线图带原生默认阶段和事件。`props` 使用原生模型字段，数组整体替换；`set_curve` 的 `xAxis`、`yAxis` 和 `fonts` 支持字段补丁。一次批次最多 200 个操作，支持指定新对象 ID 供批内后续操作引用。宿主移动、转楼层与删除会携带空洞；编组移动/删除与网页规则一致。锁定组件需先明确解锁。任何一步校验失败，整批均不写入。

坐标 `[x,y,z]` 的 Z 向上；对象 `position.z` 相对楼层高度。平面/墙体轮廓为局部二维坐标，路线节点为局部三维坐标；每格默认 100 单位。`studio_get_schema` 返回各类组件可直接参考的完整模板。AI 直接编辑原生几何和文字；模型的关卡理解与生成质量仍需设计者检查。

## 本机连接与恢复

- 服务仅监听 `127.0.0.1`，浏览器接口需要临时随机令牌，校验 Host/Origin；一个服务只接受一个联动画稿页。第二页会显示占用，原页关闭约 10 秒后可重新连接。请保管完整配对 URL。
- 默认端口 `32123`；被占用时自动选择其他端口。暂存和浏览器文件关联按端口隔离，更换地址前保存 JSON。可在 MCP 配置的环境变量中指定 `STUDIO_MCP_PORT`；显式指定的端口占用时直接报错。
- 纯离线 `dist/index.html` 保留禁止网络连接的 CSP；只有本机服务提供的页面允许同源联动请求。图稿不会经此服务上传，Codex 读取到的图稿内容仍受你所用 Codex 客户端的正常数据处理方式约束。
- MCP 不执行任意 JavaScript，也不任意读取或写入磁盘文件。打开工程和保存由网页或 Codex 的文件工具完成。服务在 CLI/桌面端结束 MCP 进程后关闭；页面仍可手动编辑、保存。
- 遇到超时先读取状态核对：命令可能已执行而响应丢失，直接重试可能重复创建。离线、过期、取消和尚未派发的指令不会在重新连接后补画。
- 当前连接针对本机浏览器。远端/SSH Codex 主机需要对应的浏览器或端口转发，未提供自动跨机器接管。

## 验证命令

```powershell
npm run build
npm run test:mcp
npm run test:mcp:browser
npm test
```

浏览器专项检查使用本机 Chrome，或以 `STUDIO_BROWSER` 指定浏览器可执行文件；截图、工程和报告输出到 `qa/mcp/`。
