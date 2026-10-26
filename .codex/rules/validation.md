# 验证规则

先确认本次改动影响什么，再选择检查。命令在项目根目录运行。

## 构建与检查入口

- 网页源码改动后先 `npm run build`，再运行依赖 `dist/index.html` 的回归；只测旧产物不能证明源码修改正确。
- 依赖未安装时使用项目锁文件安装（`npm ci`）；项目说明要求 Node.js 24。环境中 `python` 可能是 Microsoft Store 占位入口，可使用实际可用的 Python 3 路径执行教程脚本。
- 局部改动先运行对应回归；涉及共享模型、渲染、构建拼接或多个交互路径时运行 `npm test` 的整套应用回归。

| 改动范围 | 优先检查 |
| --- | --- |
| 工程保存、首次位置选择与 Ctrl/Command+S | `node tests/browser-project-saving.cjs`；真实 Chrome 键盘/编辑及 Electron IPC/文件写盘，浏览器文件句柄与原生对话框选择使用测试替身，证据在 `qa/project-saving/` |
| 逐点切割、闭合/贯穿拆分、内轮廓和历史 | `node tests/verify-cutting.cjs`；真实鼠标、剪刀、退点/取消、窄屏和实际四种格式下载用 `node tests/browser-cutting.cjs`，证据在 `qa/cutting/` |
| 空间创建、宿主空洞、可见性与输出范围 | `node tests/verify-spatial-update.cjs` |
| 立体世界移动、Alt 复制、楼层、文字/路线工具限制 | `node tests/verify-world-move.cjs` |
| 固定单位网格、创建/移动/尺寸网格吸附 | `node tests/verify-grid-snapping.cjs`；真实鼠标、缩放与窄屏设置用 `node tests/browser-grid-snapping.cjs` |
| 大小/旋转吸附 | `node tests/verify-transform-snapping.cjs` |
| 平面/立面角点独立尺寸、Shift 等比、网格与固定对角点 | `node tests/verify-orthographic-size.cjs`；真实鼠标、Ctrl/Shift、历史和三视图同步用 `node tests/browser-orthographic-size.cjs`，证据在 `qa/orthographic-size/` |
| 多选属性、多个值、三轴位置/旋转/尺寸与批量历史 | `node tests/verify-property-inspector.cjs`；真实输入、分组折叠和响应式布局用 `node tests/browser-property-inspector.cjs`；横向拖动、精细/网格、多选差值、取消与历史用 `node tests/browser-property-scrub.cjs` |
| 爬梯/旋转楼梯与平台/墙壁吸附 | `node tests/verify-ladder-snapping.cjs` |
| 曲线事件编辑和拖动排序 | `node tests/verify-events.cjs`；阶段/刻度兼容另看 `verify-v10.cjs` |
| 组件列表排序、Shift 连选、宿主空洞与历史 | `node tests/verify-component-list.cjs`；真实指针、自动滚动、暂存及深浅主题/窄屏用 `node tests/browser-component-list.cjs` |
| 俯仰范围及近地平线网格 | `node tests/verify-min-pitch.cjs`、`node tests/verify-horizon.cjs` |
| 临时对比色图像内存 | `node tests/verify-release.cjs`，这不等于验证所有发布产物 |
| FBX/OBJ 模型、空洞、法线、世界坐标与格式切换 | `node tests/verify-mesh-export.cjs`；实际下载及窄屏操作用 `node tests/browser-mesh-export.cjs`，两者用开发依赖 `three` 的独立读取器验证文件 |
| 较早版本的几何、文字、颜色与工具行为 | 按覆盖内容选择 `verify-v7.cjs`、`verify-v8.cjs`、`verify-v9.cjs`、`verify-v10.cjs` |
| 变更日志 hook 与监控范围 | `node --test tests/changelog-hooks.test.cjs`，不依赖 npm 安装 |
| 规则/skills 的文字与元数据 | 检查引用、技能 YAML 与描述边界；没有改应用时无需重跑应用回归 |

## 真实交互与产物

- 对鼠标命中、拖动、文本输入或视觉布局的变化，按需要用真实浏览器操作；jsdom 不等于真实浏览器验收。
- `tests/browser-*.js` 多为接收 Playwright `page` 的函数片段，不是直接 `node` 运行即可完成的测试入口。先检查驱动方式、URL 和历史输出路径。
- 导出变化除预览外还需检查实际下载的 PNG/SVG：尺寸、范围、背景和辅助元素过滤。`tests/check-*.cjs` 需要对应 QA 报告与文件，不能在缺少证据时直接引用旧结果。
- 桌面变化使用独立配置验证；`tests/desktop-smoke.cjs` 通过 `STUDIO_EXE` 指向目录版程序。单文件便携版不能直接套用同一个调试启动方式。
- 低风险文档修改不另写实现镜像测试。只在新增行为或已有覆盖不足时补充有意义的测试。
- 最终说明和变更日志只记录本次运行的命令及结果，并注明未验证部分；`docs/最终检查记录.md` 是历史证据。
