# 项目上下文：关卡设计工具箱

供应用实现、构建、验证和打包任务按需阅读；协作入口见 [README.md](README.md)，持久指引见 [AGENTS.md](../AGENTS.md)。

整理日期：2026-10-22；依据当前目录中的源码和脚本。产品说明见 [根目录 README](../README.md)，用户操作见 [使用说明](../docs/使用说明.md)。环境缺件属于本次快照，执行任务前需重新核实。

## 项目概况

- 名称：关卡设计工具箱 / Level Design Toolkits；npm 包名 `level-design-toolkits`，当前产品版本 `1.0.0`。
- 用途：供关卡策划绘制空间布局和游玩节奏，包括空间三视图、楼层与组件、节奏/压力曲线，以及 JSON 工程保存和 PNG/SVG 导出。
- 网页采用原生 JavaScript、HTML、CSS 与 SVG，无前端框架或第三方运行时脚本。构建后是可离线打开的单个 `dist/index.html`，无需后端。
- Windows 桌面版使用 Electron，复用构建后的网页；支持目录版和单文件便携版。
- 依赖用于开发、构建、测试及桌面封装，版本由 `package-lock.json` 锁定。

## 目录导航

| 路径 | 职责 |
| --- | --- |
| `src/` | 可维护的网页源码，包括模型、几何、渲染、编辑器交互及样式 |
| `src/editor.html`、`src/editor.css`、`src/ui-shell.js` | 页面模板、工业风界面样式、深浅主题与窄屏面板；HTML 中的占位符由构建脚本替换 |
| `src/fonts/` | Saira 可变字体与 OFL 许可，构建时一并嵌入单页；中文与画布文字使用系统黑体 |
| `src/help/` | 内置教程内容 `content.json`、7 段 GIF 及其 PNG 封面 |
| `data/initial-project.json` | 正式启动种子，当前为空工程 |
| `data/qa-project.json`、`data/two-storey-house.json` | 空间/曲线和两层小楼示例 |
| `desktop/` | Electron 主进程 `main.cjs`、包信息和图标 |
| `tools/` | 网页构建、教程生成、QA 示例生成、桌面封装和发布归档脚本 |
| `tests/` | 自动回归、浏览器操作片段、导出文件检查及桌面冒烟测试 |
| `tests/fixtures/` | 回归测试所需的旧版吸附求解器对照样本 |
| `dist/` | 网页构建产物；当前已有可直接打开的 `index.html` |
| `docs/` | 用户教程、图稿示例、发布指南和历史检查记录 |
| `third_party/` | 桌面封装相关第三方许可文件 |
| `.build/`、`release/`、`release-upload/` | 封装/发布脚本运行时产生的目录，当前快照未包含 |

## 源码组织与构建顺序

入口是 [tools/build.mjs](../tools/build.mjs)。它按固定顺序拼接普通脚本，再使用 Terser 压缩，并将脚本、CSS、教程媒体与工程种子嵌入 HTML。

顶层源码按以下顺序加载：

```text
model → geometry → model-features → curved-geometry → creation-colors
→ model-v10 → geometry-cache → mesh-export → render → render-features
→ view-features → advanced-render → app
```

这些源码以全局对象和立即执行函数组织，并非 ES Module。多个文件会扩展或包装前面定义的方法，尤其是 `StudioModel.validate`、几何和渲染入口；调整顺序时需核对依赖。

`src/app.js` 是编辑器主闭包，负责工程状态、选择、视图/相机、撤销重做、自动暂存、命令和界面更新。其中两个占位符会在构建时展开：

- `/*INTERACTIONS*/`：依次插入 `interactions`、`ui-features`、`advanced-interactions`、`export-preview`、`curve-panel`、`keyboard`、`grid-snapping`、`move-snapping`、`transform-snapping`、`world-move`、`world-transform`、`usage-help`、`event-editing`、`ui-shell`。
- `/*TEXT_EDITING*/`：插入 `text-editing.js`。

这些插入片段共享 `app.js` 的闭包变量，不能一概作为独立脚本加载。新增文件需在构建脚本中显式接入。

主要代码入口：

| 功能 | 入口 |
| --- | --- |
| 对象、楼层、工程校验与迁移 | `model.js`、`model-features.js`、`model-v10.js` |
| 三维坐标、实体/空洞几何、曲面与缓存 | `geometry.js`、`curved-geometry.js`、`geometry-cache.js` |
| SVG 场景、三视图、文字对比色图像 | `render.js`、`render-features.js`、`view-features.js`、`advanced-render.js` |
| 选择、拖拽、创建和属性操作 | `app.js`、`interactions.js`、`ui-features.js`、`advanced-interactions.js` |
| 网格与移动吸附、旋转/大小吸附 | `grid-snapping.js`、`move-snapping.js`、`transform-snapping.js` |
| 立体图世界轴/平面手柄 | `world-move.js`、`world-transform.js` |
| 文字编辑、输入法和快捷键 | `text-editing.js`、`keyboard.js`，以及 `app.js` 中的事件绑定 |
| 曲线属性、事件位置和排序 | `curve-panel.js`、`event-editing.js` |
| PNG/SVG 预览、输出范围、异步下载 | `export-preview.js`，以及 `app.js`、`render.js` 中的导出逻辑 |
| FBX/OBJ 三维网格、空洞三角化与文件序列化 | `mesh-export.js` 的 `StudioMeshExport`；复用模型几何，由 `export-preview.js` 接入格式选择和下载 |
| 帮助目录与 GIF 播放 | `usage-help.js`、`src/help/content.json` |

调试和测试可通过 `window.StudioModel`、`window.StudioRender`、`window.StudioSnapping`、`window.StudioTransformSnapping` 及 `window.SpatialEditor` 访问现有接口。`SpatialEditor` 提供工程/当前图稿、选择、相机、命令、创建图稿、载入工程、文字编辑和导出预览等入口。

## 数据与交互约定

- 当前工程格式为 `format: "level-spatial-editor"`、`version: 7`。产品版本 `1.0.0`、文件名中的 v9/v10 与工程格式版本含义不同。
- 空间图的 `gridSize` 表示每格虚幻单位，默认 100，允许 1–10000 的整数，随 JSON、暂存和撤销保存；旧工程缺省为 100。网格显示与网格吸附独立开关。网格吸附优先于组件边吸附，新建实体取整格尺寸，移动按主组件包围框边界对齐，调整尺寸按当前网格取整，Ctrl 暂停；已有组件不会在切换开关时批量修改。
- 工程包含 `documents` 和可选的 `activeDocument`；图稿类型为 `space` 或 `curve`。空间对象包含平面、墙壁、宿主空洞、楼梯、爬梯、旋转楼梯、文字、路线及标记。
- 导入和启动恢复通过 `StudioModel.validate` 完成校验/迁移；修改数据结构时应一起检查各层校验包装和旧工程兼容性。
- `app.js` 的 `mutate`、`history` 管理变更校验、失败回滚和撤销记录；编辑功能需沿用现有的操作提交/取消机制。
- 网页暂存键默认为 `spatial-studio-v9:` 加 `location.pathname`；桌面封装时改为固定键 `level-diagram-studio-desktop-v1`。更换网页路径、浏览器或电脑不会自动迁移暂存，JSON 下载用于长期保存和跨端转移。
- 界面字体、控件及间距统一为原界面的约 110%，使用 rem 尺寸，不缩放图稿坐标。“工程图稿”内提供新增、改名、复制、删除；改名沿用工程撤销历史，不改变曲线图内标题。界面主题使用独立的 `level-toolkits-ui-theme` 键，不进入工程、撤销记录或导出图稿。990px 及以下使用底部三个面板入口，编辑选项默认收起；选择绘图工具后返回画布。桌面注入暂存键时保留 `<html>` 上的设计配置属性。
- 立体图实体支持 W 世界轴移动、E 三轴刚体旋转、R 单实体本地角点调尺寸（对角点固定）；路线快捷键为 L，S 保留为大小工具别名。多实体可一起移动/旋转，独立轮廓顶点编辑仍在平面/立面完成；文字保留各视图字号和旋转，空洞依附宿主。路线使用直接节点操作。
- 导出需区分完整图稿和当前视野；编辑手柄不得进入成品。异步预览切换/关闭后应取消旧下载并释放临时对象 URL。
- FBX/OBJ 仅用于空间图，输出所有可见楼层的五类实体及宿主空洞，不按当前视角、选中范围或预览取景裁切；不输出文字、路线和标记。三角网格保持世界坐标数值 1:1、Z 轴向上；二进制 FBX 7.4 使用厘米并含基础颜色/透明度，OBJ 为单个几何文件（含法线，不带 MTL）。`three` 仅作为开发测试依赖，用独立读取器验证输出，不嵌入网页。
- 网页 CSP 禁止网络连接；Electron 也拦截外部网络，关闭 Node 集成并启用上下文隔离及沙箱。

## 常用命令

以下命令在项目根目录运行，项目说明要求 Node.js 24、npm 和 Python 3。

```sh
npm ci
npm run build
npm test
npm run manual
```

- `build`：生成 `dist/index.html` 和 `dist/build-report.json`。修改源码后先构建，再运行测试，因为多数回归加载的是构建产物。
- `test`：顺序运行 15 组 `tests/verify-*.cjs`，覆盖版本兼容、事件、视角、空间操作、楼梯吸附、世界移动、立体旋转与角点尺寸、变换吸附、导出临时图像内存限制及 FBX/OBJ 的独立读取、空洞/法线/世界坐标和取消下载。
- `manual`：等价于 `python -X utf8 tools/build-manual.py`，从 `src/help/content.json` 和媒体生成 `docs/使用说明.md`、`docs/使用说明.html`。修改教程后需同时重建网页和外部说明。
- `npm run qa`：生成 `data/qa-project.json` 和带示例种子的 `dist/qa.html`；会覆盖已有 QA 示例数据，按需使用。
- 单组回归可用 `node tests/verify-world-move.cjs` 等直接执行；仍需先构建。

Windows 封装及发布归档：

```sh
npm run package:portable
python -X utf8 tools/package-release.py
```

`package:portable` 依次构建网页、生成 `.build/desktop/关卡设计工具箱-win32-x64/` 目录版，再生成 `.build/portable/LevelDesignToolkits-1.0.0-Windows-x64.exe`。发布脚本将产物、源码、示例和校验值整理到 `release/`；它本身不上传或部署。当前快照的封装缺件见下节。

## 验证方式与当前快照缺件

自动模型/jsdom 回归、真实浏览器交互、实际导出文件和 Windows 桌面运行是不同层面的验证。`docs/最终检查记录.md` 记录的是 2026-10-16 的历史验证，后续修改应另行报告本次实际执行的检查。

- `tests/browser-*.js` 多为接收 Playwright `page` 的函数片段，部分包含历史工作目录或本地服务地址；未接入 `npm test`，运行前需准备浏览器驱动入口并检查输出路径。
- `node tests/browser-mesh-export.cjs` 可直接在 Chrome 中检查 FBX/OBJ 实际下载并用独立读取器验证，兼查 PNG/SVG、窄屏设置、空图与曲线图限制；证据写入 `qa/mesh-export/`。
- `tests/check-*.cjs` 依赖预先生成的 QA 报告/导出文件；当前目录没有对应 `qa/` 证据目录。
- `tests/desktop-smoke.cjs` 通过 `STUDIO_EXE` 指向目录版 EXE，并使用独立用户配置运行。历史记录说明单文件便携启动器不适用同一 Electron 调试启动方式。
- 当前目录没有 `node_modules/`；依赖尚未在此快照中安装。本次建立上下文文档未安装依赖或重跑应用回归。
- 当前目录没有 `.git/`、`.github/`、`.gitignore`、`.gitattributes`。根 README 和发布指南提到的 Pages/Windows Actions 配置不在这份快照中，不能据此认定已存在或已部署。
- `tools/release_files.py` 明确要求根目录的 `.gitignore` 和 `.gitattributes`，二者缺失会使源码归档/上传准备失败。
- `tools/package-desktop.mjs` 还要复制 `docs/导出图稿_预览.png` 和 `docs/事件名称排序_拖动中.png`，当前均缺失；桌面封装前需补齐这些输入或修正复制清单。
- `npm run desktop` 会让主进程加载 `desktop/index.html`，当前不存在该文件；`npm run build` 只输出到 `dist/`。直接运行此命令尚缺页面准备步骤，封装脚本则会向暂存应用目录写入页面。

## 后续维护提示

- 从 `src/` 修改功能，通过构建更新 `dist/`；教程以 `src/help/content.json` 为内容源。生成文件上的临时修改会被下一次构建覆盖。
- 保留正式种子的空工程状态；用独立示例或测试夹具验证，避免把用户暂存和 QA 工程嵌入正式页面。
- 修改空间交互时重点检查宿主/空洞、编组、整层操作、撤销重做、取消拖拽和视图切换；修改导出时检查实际文件及异步取消行为。
- 发布源码使用 `tools/release_files.py` 的目录/文件清单；`.codex/` 当前不在发布清单中。新增必要资源时需检查构建、桌面复制和发布归档是否都能带上。
- 许可属于权利保留及软件使用许可，详见 `LICENSE`，并非开源许可证；第三方许可见 `THIRD_PARTY_NOTICES.md`。
