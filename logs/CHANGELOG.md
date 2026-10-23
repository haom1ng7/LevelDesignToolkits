# 更新记录

## 1.0.0 · 最终发布整理（2026-10-16）

- 空间三视图、楼层、平面、墙壁、独立宿主空洞、三种楼梯、文字、路线与标记。
- 拖拽创建与连续放置；选择、编组、置顶置底、撤销重做；组件移动、旋转和大小吸附。
- 立体视图的世界三轴/平面移动及 Alt 拖动复制，文字字号和单平面旋转。
- 节奏/压力曲线、阶段、事件编辑与排列。
- 完整图稿及当前视野的 PNG/SVG 导出、JSON 保存恢复。
- 固定顶栏的分组教程与7段按需播放GIF。
- 极端宽高比下限制临时对比色图像内存；取消预览后停止旧任务下载。
- 同步外部教程，补全源码包，提供单文件Windows便携版及GitHub Pages配置。

源码当前保留全部权利，允许下载运行及使用导出图稿。详见 LICENSE。

## 2026-10-22 · 建立功能变更日志机制

- 变更：新增项目级 Codex hooks，在回合开始时保存文件内容基线，结束前检查是否追加完整变更日志；漏写时要求继续补写。新增 AGENTS.md 持久协作规则，后续功能和开发流程变更统一追加到 logs/CHANGELOG.md，保留已有历史记录。
- 影响文件：AGENTS.md、.codex/hooks.json、.codex/hooks/、.codex/README.md、tests/changelog-hooks.test.cjs、logs/CHANGELOG.md。
- 验证：`node --test tests/changelog-hooks.test.cjs` 的 12 项测试全部通过，覆盖缺日志阻止结束、追加后放行、继续/恢复保留基线、纯文档、文件新增/删除、历史日志保护、会话隔离及实际 stdin JSON 调用；hooks JSON、三处命令路径和本地文档链接检查通过。未运行应用全套回归，本次只调整协作机制且未安装应用开发依赖。首次自动执行仍需通过 `/hooks` 审阅并信任。

## 2026-10-22 · 建立项目 rules 和 skills

- 变更：建立源码维护、编辑器行为、验证、发布四类规则，并通过 AGENTS.md 按任务接入；在官方项目级发现目录 .agents/skills/ 建立功能维护、回归验证、离线打包三个技能，保留默认自动选择并提供中文界面元数据。扩展日志 hook 的监控范围，规则、技能正文和技能元数据变化同样要求追加日志。
- 影响文件：AGENTS.md、.codex/README.md、.codex/rules/、.agents/skills/、.codex/hooks/changelog.cjs、.codex/hooks/README.md、tests/changelog-hooks.test.cjs、logs/CHANGELOG.md。
- 验证：`node --test tests/changelog-hooks.test.cjs` 的 15 项测试全部通过，新增规则/技能正文/元数据的修改及删除检查。三个技能均通过 skill-creator 的 `quick_validate.py`；10 份 Markdown 的 26 个本地链接、技能目录名称、界面元数据和默认自动调用设置检查通过。校验器所需 PyYAML 6.0.3 安装于系统临时目录，未改项目依赖。未运行应用全套回归，本次未改动网页或桌面应用功能。

## 2026-10-22 · 整理项目 Codex 工作区

- 变更：保留现有 .codex/skills/ 布局，将 README 整理为导航与加载约定，原有架构、命令和快照说明完整移至 project-context.md；统一 AGENTS.md 和三个技能的路径，明确按任务读取技能，避免将指引加载误写为已确认的客户端自动发现。修正日志 hook 及回归用例的技能监控目录，并清理失效的 .agents/ 引用。
- 影响文件：AGENTS.md、.codex/README.md、.codex/project-context.md、.codex/rules/release.md、.codex/skills/、.codex/hooks/changelog.cjs、.codex/hooks/README.md、tests/changelog-hooks.test.cjs、logs/CHANGELOG.md。
- 验证：`node --test tests/changelog-hooks.test.cjs` 的 15 项测试全部通过，覆盖当前 .codex/skills/ 正文及元数据的修改/删除检查；11 份 Markdown 的 35 个本地链接、三处 hook 命令及项目上下文正文保留检查通过。三个技能均通过 skill-creator 的 `quick_validate.py`；沙箱内 PyYAML 导入不完整，经允许后在沙箱外复用已有临时依赖完成只读校验。未运行应用全套回归，本次仅整理协作配置，未改网页或桌面功能。

## 2026-10-22 · 项目更名为 Level Design Toolkits／关卡设计工具箱

- 变更：英文项目名称统一为 Level Design Toolkits，中文名称统一为关卡设计工具箱；同步网页标题与品牌、JSON 工程下载文件名、工程校验提示、桌面应用名称与关于窗口、npm 包名与锁文件、教程、说明和许可文件、项目上下文及技能显示名称。Windows 封装与发布配置使用新的目录和文件名称（LevelDesignToolkits）。保留旧工程格式、桌面应用标识和暂存键，桌面默认数据目录继续使用原有目录，并为首次启动创建目录，保留自定义测试配置路径的优先级。
- 影响文件：src/editor.html、src/app.js、src/model.js、desktop/main.cjs、desktop/package.json、package.json、package-lock.json、tools/build.mjs、tools/build-manual.py、tools/package-desktop.mjs、tools/package-portable.mjs、tools/package-release.py、dist/、README.md、LICENSE、THIRD_PARTY_NOTICES.md、docs/使用说明.md、docs/使用说明.html、docs/GitHub发布指南.md、tests/desktop-smoke.cjs、tests/browser-world-published*.js、.codex/README.md、.codex/project-context.md、.codex/skills/。
- 验证：安装锁文件中的依赖（`npm ci --ignore-scripts --no-audit --no-fund`），`npm run build` 通过；使用工作区 Python 运行 `tools/build-manual.py`，重新生成两份教程。`npm test` 的 12 组应用回归全部通过；`node --test tests/changelog-hooks.test.cjs` 的 15 项测试全部通过。Node.js/jsdom 临时专项检查通过，覆盖包名及锁文件一致性、构建页面标题和中英文品牌、JSON 下载名称、旧暂存工程恢复、桌面默认/自定义配置路径与首次创建目录、教程标题及正式种子为空。桌面主进程和两份 JavaScript 封装脚本的 `node --check`、两份 Python 脚本的 AST 语法检查通过；旧名称扫描仅保留用于兼容的桌面数据目录和暂存键。未运行真实浏览器操作、Windows 封装及桌面启动，本次主要调整名称与元信息，未生成 Windows 程序。

## 2026-10-22 · 修复立体图无法编辑组件属性

- 变更：立体图中选中未锁定的实体或空洞后，右侧名称、颜色、厚度、透明度、所属楼层及楼梯参数等属性可以直接编辑；沿用共享模型、几何校验和撤销重做，修改同步到平面图、立面图及 JSON 工程。保留立体图旋转、大小、顶点及原有组件操作按钮限制，锁定组件或宿主仍禁用属性编辑；补齐楼梯 flight 字段的锁定校验。同步内置帮助和离线使用说明。
- 影响文件：src/app.js、src/help/content.json、tests/verify-world-move.cjs、tests/browser-solid-properties.cjs、dist/index.html、dist/build-report.json、docs/使用说明.md、docs/使用说明.html；浏览器证据位于 qa/solid-properties/solid-properties.png。
- 验证：新增回归在修复前以“#prop-name is editable in solid view”断言失败，确认覆盖本次缺陷；修复后 `npm run build`、`npm test` 的 12 组应用回归全部通过。`node tests/verify-world-move.cjs` 专项再次通过，覆盖六类实体属性、连续输入合并撤销、重做、三视图同步、JSON 往返、锁定/解除锁定、非法参数回滚、编组数值移动和宿主/空洞楼层关联。使用工作区 Python 执行 `tools/build-manual.py` 成功；Node.js 专项检查确认正式种子为空且内置与两份外部教程包含同一属性说明。`node tests/browser-solid-properties.cjs` 在 Chrome 中通过真实文本/数值/颜色输入、焦点保留、撤销重做、视图切换、锁定、楼梯字段和下拉选择、JSON 重载检查，无页面异常，并保存截图供复核；首次沙箱启动 Chrome 被 EPERM 拦截，经允许后运行通过。未运行 Windows 封装与桌面启动，本次交付更新后的离线网页，未生成桌面程序。

## 2026-10-22 · 以 endfield-ui 重构前端编辑界面

- 变更：将顶部命令栏、工程/楼层/工具侧栏、当前图稿与真实组件/事件数量、属性和曲线面板、空工程入口、菜单及新建/帮助/导出弹窗统一为纸白与墨色界面，使用酸黄标记当前工具、切角按钮、细线分区和中英双层标题。移除原有叠加的蓝色、圆角、模糊、渐变与柔和阴影样式；图稿内部的字体、颜色和几何保持原有语义。
- 变更：新增浅色/深色主题切换与独立偏好存储，不写入工程 JSON 或撤销历史；900px 及以下使用图稿与工具、编辑画布、属性与设置三个面板入口，默认收起编辑选项，选择工具后返回画布；隐藏面板退出键盘焦点，键盘切换面板时提交文字编辑。补齐触屏点击区域、横屏画布空间、当前项无障碍状态及减少动态效果支持。
- 变更：本地加入 Saira 可变字体与 OFL 许可，构建时一并嵌入单文件网页并仅允许 data 字体；同步内置帮助、两份外部说明及项目上下文。修正 Windows 封装页面的暂存键注入，使新增的根标签设计属性与旧桌面固定暂存键同时保留。
- 影响文件：src/editor.html、src/editor.css、src/ui-shell.js、src/app.js、src/fonts/、src/help/content.json、tools/build.mjs、tools/package-desktop.mjs、THIRD_PARTY_NOTICES.md、docs/使用说明.md、docs/使用说明.html、.codex/project-context.md、tests/browser-ui-shell.cjs、dist/index.html、dist/build-report.json；截图、实际下载文件与设计说明位于 qa/endfield-ui/。
- 验证：`npm run build` 通过；`npm test` 的 12 组应用回归通过。`node tests/browser-solid-properties.cjs` 在 Chrome 中通过实际属性输入、焦点、撤销重做、三视图、锁定及 JSON 重载检查。`node tests/browser-ui-shell.cjs` 在 Chrome 中通过浅/深色 360、390、430、768、1024、1440px 布局、空间/曲线图、主题持久化且工程/历史不变、离线字体与 CSP、无横向溢出、窄屏绘制与一次撤销、键盘焦点与面板切换提交文字、帮助与导出窗口、实际 SVG/PNG 下载及 PNG 签名和尺寸、减少动态效果、触屏点击区域和选项展开、844×390 横屏画布检查，无页面/CSP 异常或在线资源请求；Chrome 启动遭沙箱 EPERM 限制后，经允许在沙箱外完成检查。使用工作区 Python 执行 `tools/build-manual.py` 成功。`node .build/check-ui-integration.cjs` 只读执行真实封装页面注入表达式，通过固定暂存键、根标签属性、空工程种子、字体/许可嵌入、占位符清理和说明同步检查；`node --check src/ui-shell.js`、`node --check tests/browser-ui-shell.cjs`、`node --check tools/build.mjs`、`node --check tools/package-desktop.mjs` 通过。未运行 Windows 封装、桌面程序启动或手机真机检查，本次交付离线网页与源码改动，移动端验证使用 Chrome 触屏模拟。

## 2026-10-22 · 精简界面、补齐图稿管理并放大至 110%

- 变更：移除空工程入口的修饰性标题、说明段落和重复状态文案，改用直接的新建入口；重画空间图入口为两个墙面与一个地面的清晰结构图。进一步统一纸白/墨黑分区、粗体中文与宽体英文、酸黄当前工具、标准切角和细线层级，保留浅色/深色主题。
- 变更：“工程图稿”内直接提供新增与改名，保留复制/删除。改名弹窗预填并选中当前名称，支持中文、去除首尾空白、空名称校验、Enter 保存、Esc/取消放弃与输入法组合输入保护；一次改名对应一次撤销记录，重复保存相同名称不新增历史，JSON 和自动暂存保留名称，曲线图内标题及图稿几何保持独立。
- 变更：使用统一根字号与 rem 将界面字体、控件和间距扩大到原来的约 110%，不通过整页缩放修改画布命中；窄屏面板断点同步调整为 990px，并压紧横屏工具栏以保留绘图空间。同步内置帮助、两份外部教程和项目上下文。
- 影响文件：src/editor.html、src/editor.css、src/ui-shell.js、src/app.js、src/help/content.json、tests/browser-ui-shell.cjs、tests/browser-document-management.cjs、docs/使用说明.md、docs/使用说明.html、.codex/project-context.md、dist/index.html、dist/build-report.json、qa/endfield-ui/README.md；本轮截图、尺寸报告、图稿管理报告与实际 JSON 文件位于 qa/ui-refine/，完整浏览器布局和实际 PNG/SVG 文件位于 qa/endfield-ui/。
- 验证：`npm run build` 通过；`npm test` 的 12 组应用回归全部通过。`node tests/browser-ui-shell.cjs` 在 Chrome 中通过浅/深色 360、390、430、768、990、991、1024、1440px 布局与断点、空间/曲线/小楼工程、实际窄屏绘制与撤销、主题隔离和持久化、字体/CSP/离线、面板焦点、帮助、PNG/SVG 实际下载与 PNG 尺寸、减少动态效果及触屏横屏检查；首轮发现放大后横屏创建画布仅 95px，压紧布局后通过。`node tests/browser-document-management.cjs` 通过新增、改名预填/焦点、中文与首尾空白、空白拒绝、输入法 Enter、取消/Esc、一次撤销重做、无变化保存、几何/曲线标题隔离、真实 JSON 下载与文件选择导入、360px 管理及自动恢复；首次专项驱动未触发“打开工程”入口导致导入等待超时，修正文件选择驱动后通过。`node tests/browser-solid-properties.cjs` 通过真实属性输入、焦点、撤销重做、三视图、锁定及 JSON 重载。
- 验证：使用工作区 Python 运行 `tools/build-manual.py` 成功；`node .build/check-ui-integration.cjs` 通过桌面页面固定暂存键与根标签属性、空种子、嵌入字体/许可、占位符及教程同步检查。`node .build/inspect-ui-refine.cjs` 在修改前后真实构建页面上测得正文 13→14.3px、标题 20→22px、侧栏 248→272.8px，确认约 110%；844×390 触屏模拟下创建画布高 121px，宽切角按钮文字留白检查通过，并复核深浅/手机截图。`node --check src/ui-shell.js`、`node --check tests/browser-document-management.cjs` 通过。未运行 Windows 封装、桌面程序启动和手机真机检查，本次交付离线网页；移动端为 Chrome 触屏模拟。

## 2026-10-22 · 立体图 W/E/R 操作与角点调尺寸

- 变更：立体图中 W 沿用世界三轴/平面移动与 Alt 拖动复制；E 为平面、墙壁、楼梯、爬梯和旋转楼梯显示 X/Y/Z 旋转环，绕世界轴进行刚体旋转，支持编组、多选和整层，空洞随宿主旋转。Shift 按 15° 调整，Ctrl 暂停角度吸附。修正倾斜后的楼梯再次从其他视图旋转时被压平的问题。
- 变更：R 为单个实体显示八个本地包围框角点，拖动改变长宽高并固定对角点；点击角点后，可拖旁边的本地 X/Y/Z 手柄只调整一个尺寸。直接拖角点使用当前视角投影最清晰的两个本地轴；网格按 10 单位调整，Ctrl 暂停。尺寸保持正值，旋转楼梯及圆弧径向尺寸联动以保留形状。多实体或整层需在组件列表选单件后调尺寸；文字与标记保留自身字号/半径属性。空洞跟随宿主调整，选中的编组文字保留字号并跟随位置。一次拖动对应一次撤销；Esc、指针取消、切换工具或视图可取消尚未提交的操作。
- 变更：路线快捷键由 R 改为 L，R 统一进入大小工具，S 保留为兼容别名；同步工具栏顺序、按键标记、提示、内置帮助、两份外部说明及项目上下文。新增旋转/尺寸片段接入原脚本拼装，复用共享模型和原工程格式，导出排除编辑手柄。
- 影响文件：src/world-transform.js、src/app.js、src/geometry.js、src/keyboard.js、src/editor.html、src/editor.css、src/usage-help.js、src/help/content.json、tools/build.mjs、package.json、tests/verify-solid-transform.cjs、tests/verify-world-move.cjs、tests/browser-solid-transform.cjs、tests/browser-solid-properties.cjs、README.md、docs/使用说明.md、docs/使用说明.html、.codex/project-context.md、.codex/rules/editor-behavior.md、dist/index.html、dist/build-report.json；本次浏览器证据位于 qa/solid-transform/，属性回归截图更新于 qa/solid-properties/。
- 验证：`npm run build` 通过，最终构建后的 `npm test` 全部 13 组通过。新增专项覆盖五类实体的三轴刚体旋转、倾斜后的本地尺寸、正负角点与固定对角点、直接拖角点、尺寸下限、接近退化视角、宿主/方向空洞/编组标签、整层与多选、网格/Ctrl/Shift、原子撤销重做及取消/工具/视图切换、锁定、输入/IME、JSON 往返及 SVG 手柄排除。`node tests/browser-solid-transform.cjs` 在 Chrome 中通过真实 W/E/R/L 按键、旋转环/角点/本地轴命中与拖动、对角点固定、撤销重做/Esc、文本输入、锁定、JSON 与三视图同步检查，无页面异常，保存三张截图及 report.json；首次 Chrome 启动被沙箱 EPERM 拦截，获准后运行通过。`node tests/browser-solid-properties.cjs` 的真实属性输入、撤销重做、三视图、锁定及 JSON 回归通过；`node --test tests/changelog-hooks.test.cjs` 的 15 项检查通过。
- 验证：使用工作区 Python 运行 `tools/build-manual.py` 成功；Node.js 只读检查确认 R/L 工具栏标记、正式种子为空、全部帮助步骤在内置及两份外部教程中同步，构建脚本占位符无残留。`node --check` 检查 src/world-transform.js、src/geometry.js、tests/verify-solid-transform.cjs、tests/browser-solid-transform.cjs 与 tools/build.mjs 均通过。未运行 Windows 封装、桌面启动或手机真机检查，本次更新离线网页与源码，未生成 Windows 程序。

## 2026-10-22 · 移除快捷键提示与底部状态栏

- 变更：删除左侧“快捷键需英文输入法。”小字，移除画布底部显示“已自动暂存 · 下载 JSON 可长期保留”的整个状态栏及其样式；画布利用释放的高度。下载锚点和现有脚本依赖的状态节点移至隐藏容器，保留自动暂存、工程下载与导出操作。
- 影响文件：src/editor.html、src/editor.css、dist/index.html、dist/build-report.json；本次浏览器截图与下载证据更新于 qa/endfield-ui/、qa/ui-refine/。
- 验证：`npm run build` 通过。`node tests/browser-ui-shell.cjs` 在 Chrome 中通过深浅主题、桌面与窄屏布局、绘制/撤销、面板切换、帮助、实际 PNG/SVG 下载及尺寸检查；`node tests/browser-document-management.cjs` 通过图稿管理、改名/撤销、实际 JSON 下载与导入、手机宽度管理与自动暂存恢复。两项浏览器检查首次启动均被沙箱 EPERM 拦截，获准后通过。Node.js/jsdom 临时只读检查确认构建页面无快捷键提示或 footer、画布以缩放栏结束、内部状态/下载节点隐藏且正式种子为空；首轮空种子字符串断言受 JSON 排版影响，改为解析 JSON 后通过。复核本次 Chrome 截图，底部状态框已移除。未运行 `npm test` 全套模型回归、Windows 封装、桌面启动或手机真机检查，本次仅删除界面元素与样式，未改模型和交互逻辑。

## 2026-10-22 · 根据终末地官网细化编辑器 UI

- 变更：实际查看终末地官网的手机与桌面界面，将其中紧凑的英文标签与粗体中文标题、黑白信息带、局部黄色操作块和少量斜线纹转译到工具箱。工程、楼层、工具、组件、属性及当前图稿标题采用统一短条标签；组件/事件数量继续使用真实工程数据。细化工具按钮、属性标签、分段页签与弹窗标题的线条和灰阶层级，保留 110% 界面比例。
- 变更：绘图工具、撤销/重做、主题切换、新建弹窗和属性空态改用原创 SVG 线框图标。导出按钮使用文字区与黄色箭头区；新建空间图/曲线图入口使用原创线稿和黑色操作带，提供短促的悬停反馈。两套主题、手机与横屏布局、减少动态效果和键盘焦点继续适用；未引入官方素材或在线依赖，未恢复已移除的底部状态栏。
- 影响文件：src/editor.html、src/editor.css、src/ui-shell.js、src/app.js、dist/index.html、dist/build-report.json、qa/endfield-site-study/README.md；浏览器截图及实际 PNG/SVG 更新于 qa/endfield-ui/，图稿管理证据更新于 qa/ui-refine/。
- 验证：最终源码 `npm run build` 成功；最终构建的 `npm test` 全部 13 组通过。`node tests/browser-ui-shell.cjs` 在 Chrome 中通过浅/深色 360、390、430、768、990、991、1024、1440px 布局、断点与面板焦点、绘制及一次撤销、主题持久化与工程隔离、帮助、实际 PNG/SVG 下载与 PNG 尺寸、离线字体/CSP、减少动态效果、触屏点击区域和 844×390 横屏画布检查；`node tests/browser-document-management.cjs` 通过新增、中文改名/输入法、取消/Esc、撤销重做、实际 JSON 下载导入、手机管理与自动恢复。浏览器最初因沙箱 EPERM 无法启动，获准在沙箱外运行后通过；最终构建上的检查亦通过。逐张复核桌面浅/深色、390px 新建入口与横屏截图。
- 验证：`node .build/check-ui-integration.cjs` 通过桌面固定暂存键与根属性、空种子、嵌入字体与许可、占位符及教程一致性；`node --check src/ui-shell.js`、`node --check src/app.js` 通过。未运行 Windows 封装、桌面程序启动或手机真机检查，本次交付更新后的离线网页版，移动检查使用 Chrome 触屏模拟。

## 2026-10-22 · 移除空间图标题下方说明

- 变更：移除空间图标题下方“空间图 / 三视图编辑”小字，隐藏该说明行并清空内容；平面、立面、立体和图稿切换后均不再显示，保留图稿名称及曲线图说明。
- 影响文件：src/app.js、dist/index.html、dist/build-report.json。
- 验证：`npm run build` 通过；通过 PowerShell here-string 管道交给 `node` 的临时 jsdom 检查通过，覆盖编辑器初始化、三种空间视图中说明行隐藏且无占位、图稿名称保留、曲线图说明和切回空间图，未发现脚本异常。未运行全套模型回归、真实浏览器、Windows 封装和桌面启动，本次仅移除标题说明文字。

## 2026-10-22 · 画布选择组件时同步移动工具与高亮

- 变更：在画布中点击新组件或从整层选择切换到单件时，先将工具切到“移动组件”，再统一更新选择、绘图工具栏高亮、aria-pressed 和编辑手柄，避免沿用旋转、大小或顶点工具；Ctrl/Command 点击增减选择时同样同步。点击当前组件本体仍保留主动选用的旋转工具，旋转环和尺寸手柄的操作入口继续保留；选中锁定组件时按原限制回退到“选择”。选择和工具切换不新增工程撤销记录。
- 影响文件：src/app.js、tests/browser-tool-selection.cjs、dist/index.html、dist/build-report.json；专项浏览器截图与报告位于 qa/tool-selection/，现有手柄回归证据更新于 qa/solid-transform/。
- 验证：修改前运行 `node tests/browser-tool-selection.cjs`，复现从旋转工具点击另一个组件后实际工具仍为 rotate 的失败。修复后 `npm run build` 通过，`npm test` 全部 14 组回归通过；`node tests/browser-tool-selection.cjs` 在 Chrome 中通过平面/立面/立体图、旋转/大小/顶点切换、新组件按下及松开时的实际工具与 active/aria-pressed 同步、旧手柄移除、同件保留旋转、Ctrl 多选增减、锁定回退及几何/历史不变检查，无页面异常，并保存最终截图与报告。`node tests/browser-solid-transform.cjs` 通过真实 W/E/R/L 按键、移动/旋转/尺寸手柄命中与拖动、固定对角点、撤销重做/Esc、输入/锁定、JSON 和三视图回归。Chrome 首次在沙箱内因 EPERM 无法启动，获准在沙箱外运行后通过；专项驱动曾错误从 scene.hits 查找实体面，改为从 scene.faces 获取真实命中点后通过。`node --check src/app.js`、`node --check tests/browser-tool-selection.cjs` 通过，复核最终高亮截图。未运行 Windows 封装、桌面程序启动和手机真机检查，本次修复网页选择交互并更新离线构建。

## 2026-10-22 · 支持 FBX 和 OBJ 三维模型导出

- 变更：在现有“导出图稿”窗口新增 FBX / OBJ 文件格式，空间图可导出所有可见楼层的平面、墙壁、楼梯、爬梯和旋转楼梯。复用共享几何并对凹轮廓、多空洞、圆弧与椭圆轮廓进行三角化，保留世界位置、三轴旋转、楼层高度和宿主贯穿空洞；隐藏组件和隐藏楼层不导出。模型导出不按当前视图、选中范围或预览取景裁切，预览排除文字、路线、标记及编辑辅助元素，并显示实体和三角面数量。
- 变更：FBX 输出离线生成的 7.4 二进制文件，包含分对象网格、法线、基础颜色及透明度；OBJ 输出单个带对象名称和法线的几何文件，不生成 MTL。两者保持坐标数值 1:1、Z 轴向上，FBX 单位为厘米。模型格式下隐藏图片倍率、输出范围与参考线设置，明确内容和单位；曲线图禁用模型格式并自动回到 PNG，空图禁用下载并给出原因。关闭或切换格式时取消尚未下载的旧模型；文件名自动避免重复扩展名。保留 PNG / SVG 的导出范围和异步下载语义。
- 变更：新增网格导出模块并接入脚本构建；three 0.180.0 仅作为开发测试依赖，用独立 FBXLoader / OBJLoader 验证实际文件，不进入离线网页。同步内置帮助、两份外部教程、README、项目上下文及验证映射，将模型导出回归接入 npm test。
- 影响文件：src/mesh-export.js、src/export-preview.js、src/editor.html、src/help/content.json、tools/build.mjs、package.json、package-lock.json、tests/verify-mesh-export.cjs、tests/browser-mesh-export.cjs、README.md、docs/使用说明.md、docs/使用说明.html、.codex/project-context.md、.codex/rules/validation.md、dist/index.html、dist/build-report.json；实际模型/图片下载、预览截图与 browser-report.json 位于 qa/mesh-export/。
- 验证：npm run build 成功；npm test 全部 14 组通过。新增专项通过独立读取器验证两种文件的对象数、三角面数、有限坐标、单位法线、世界包围盒和 FBX 颜色/透明度；覆盖凹外轮廓、共线点、多处及凹空洞的体积与射线贯穿、定向墙洞、圆弧墙/椭圆、五类旋转实体、楼层高度、隐藏范围、两层小楼、模型/历史不变、空图/曲线图限制及切换/关闭取消异步下载。node tests/browser-mesh-export.cjs 在 Chrome 中通过真实格式选择、文件名、预览拖动缩放、FBX/OBJ 实际下载及独立导入、三视图下全楼层输出、390px 设置/下载入口、空图/曲线图和原 PNG/SVG 实际下载，无页面/CSP 异常或在线请求；小楼两种输出均为 15 个实体、694 个三角面。Chrome 首次启动被沙箱 EPERM 拦截，获准后完成检查；首轮驱动使用 Playwright isDisabled() 检查 option 时误判，改为检查原生 disabled 属性后通过，最终构建上的浏览器复核亦通过。
- 验证：使用工作区 Python 执行 tools/build-manual.py 成功；node .build/check-ui-integration.cjs 通过正式空种子、桌面注入属性/暂存键、嵌入字体/许可、占位符和教程同步检查。node --check 检查新增模块、导出预览、构建脚本及两份新增测试均通过；node --test tests/changelog-hooks.test.cjs 的 15 项通过。测试依赖下载首次因离线缓存缺包失败，经允许后安装成功。未运行 Windows 封装、桌面启动、手机真机或 Blender/Unity/Unreal 等目标软件导入；文件兼容性由独立 Three.js 读取器及几何断言验证，本次交付源码和离线网页。

## 2026-10-22 · 依 endfield-design 再设计编辑器工作面

- 变更：按“地图与区域导航”家族重构视觉层次，让真实图稿成为视觉锚。新增烟黑工程管理停靠区，以纸灰面板、混凝土灰间隙和内嵌画布区分工程、绘图工具、属性与内容；保留原有信息架构、110% 界面比例和深浅主题。
- 变更：主要文件操作与新增入口采用胶囊和圆形图标章；工具、楼层、组件与页签采用明暗反转及黄色边标。移除全局按钮切角和多色注册条，把斜纹收敛到属性标题；入口使用低对比网格及空间/曲线的明暗错位插图，补足文字底部留白。延续手机面板、触屏目标、横屏布局、键盘焦点和减少动态效果支持。未引入官方素材、在线资源或新依赖。
- 影响文件：src/editor.html、src/editor.css、dist/index.html、dist/build-report.json；补充视觉检查驱动 .build/inspect-endfield-redesign.cjs，设计说明、修改前后截图与报告位于 qa/endfield-redesign/；既有浏览器证据更新于 qa/endfield-ui/、qa/ui-refine/、qa/solid-properties/、qa/tool-selection/ 和 qa/mesh-export/。
- 验证：npm run build 成功。本轮首版构建的 npm test 全部 14 组通过，其后仅调整 CSS；最终构建上的 node tests/browser-ui-shell.cjs、node tests/browser-document-management.cjs、node tests/browser-solid-properties.cjs、node tests/browser-tool-selection.cjs 和 node tests/browser-mesh-export.cjs 均通过，覆盖深浅主题、360/390/430/768/990/991/1024/1440px、844×390 触屏横屏、图稿管理/中文输入、属性与选择高亮、撤销重做、面板/键盘焦点、JSON 实际下载导入、PNG/SVG/FBX/OBJ 实际下载及模型独立读取；无页面/CSP 异常或在线资源请求。
- 验证：node .build/inspect-endfield-redesign.cjs 通过深浅主题至 1600px 的 18 个入口布局、文字留白、长名称无横向溢出及指定操作控件的文字对比度抽样（最低约 11.64:1），生成 15 张补充截图与 report.json；已实际打开复核桌面深浅色、选中组件、入口、手机属性、曲线、导出窗口及横屏截图。node .build/check-ui-integration.cjs 通过空种子、桌面注入属性/暂存键、字体/许可和教程一致性检查。Visual、Responsive、Interaction 均为 verified（Chrome）；未运行 Windows 封装、桌面启动或手机真机检查，本轮交付源码与离线网页，移动端使用浏览器模拟。

## 2026-10-23 · 固定虚幻单位网格与整格搭建

- 变更：空间图新增“图稿设置 → 网格 → 每格 / 虚幻单位”，默认 100 UU（1 米），支持 1–10000 的整数；设置随 JSON、自动暂存及撤销重做保存，旧工程自动使用 100。显示网格和吸附共用该尺寸，缩放不再改变每格代表的世界尺寸。平面、立面和立体网格锚定世界原点；网格过密时隐藏对应线族，保留近地平线淡出和有限线数，避免自适应换成另一档单位间距。
- 变更：开启网格吸附后，新建平面、墙壁、空洞、楼梯、爬梯和旋转楼梯按整格尺寸构建；虚影与实际放置使用同一约束，实体长宽高按网格取整，至少一格，平面表面保留楼层高度。移动按主组件包围框边界进行绝对对齐，修复仅取整位移导致原本偏离网格的组件仍偏离；保持拖动维度、编组相对位置及宿主关联。二维尺寸边/角点、三维本地尺寸轴/角点及尺寸数值属性使用图稿网格，三维尺寸保留固定对角点；方向键按整格移动，整层高度吸附以楼层基准为参照。网格吸附优先于组件边和顶点对齐，Ctrl/Command 临时暂停；保留单次撤销、重做、取消、Alt 复制及无效空洞回滚。切换开关不批量改写已有组件；文字字号、标记图标和组件内部细节沿用原语义。
- 变更：新增共享网格约束片段并接入构建，将新增专项纳入 npm test（现为 15 组）；同步吸附提示、内置帮助、外部教程、项目上下文与验证入口。为支持大网格下爬梯整格厚度，将其模型厚度上限同步至 10000 UU。
- 影响文件：src/grid-snapping.js、src/model-features.js、src/render-features.js、src/app.js、src/interactions.js、src/advanced-interactions.js、src/move-snapping.js、src/transform-snapping.js、src/world-move.js、src/world-transform.js、src/ui-features.js、src/geometry.js、src/editor.html、src/help/content.json、tools/build.mjs、package.json、tests/verify-grid-snapping.cjs、tests/browser-grid-snapping.cjs、tests/verify-horizon.cjs、tests/verify-world-move.cjs、tests/verify-solid-transform.cjs、docs/使用说明.md、docs/使用说明.html、.codex/project-context.md、.codex/rules/validation.md、dist/index.html、dist/build-report.json；浏览器证据在 qa/grid-snapping/。
- 验证：npm run build 通过；npm test 全部 15 组通过。新增专项验证旧工程缺省、无效网格拒绝、设置历史与 JSON、三视图及多档缩放的世界网格坐标、矩形创建、楼梯/爬梯/旋转楼梯在平面与立面放置，以及 1/10/75/250/1000 UU 网格尺寸、原本偏离网格及负坐标组件的绝对移动、Ctrl 暂停、主/子宿主与编组 Alt 复制取消、空洞重叠回滚、整层基准高度、二维尺寸边、三维尺寸轴固定对角点和数值属性。node tests/browser-grid-snapping.cjs 在 Chrome 中通过真实设置输入、创建拖拽、虚影放置、滚轮缩放、二维边命中、三维移动与尺寸手柄、撤销重做/Esc、JSON 恢复及 390px 设置入口，无页面异常或在线请求；已查看桌面网格和手机设置截图。
- 验证：使用工作区 Python 执行 tools/build-manual.py，通过 8 章 / 7 段离线 GIF 的同步；node .build/check-ui-integration.cjs 通过正式空种子、字体/许可、构建占位符、桌面注入属性及教程集成。node --check 检查新增约束片段和浏览器驱动通过。首轮旧回归的 40/10 单位和自适应网格计数预期已按新行为更新；浏览器驱动补齐撤销重做后的重新选择，避开快速连点触发列表改名后通过。未运行 Windows 封装、桌面程序启动或手机真机检查，本次交付源码与离线网页，窄屏由 Chrome 模拟。
- 验证：最终构建上的 npm test 15 组与 Chrome 网格专项再次通过；node --test tests/changelog-hooks.test.cjs 的 15 项通过，教程与桌面注入集成复核通过。


## 2026-10-23 · 居中楼层显示隐藏圆点

- 变更：楼层列表的显示／隐藏按钮改用独立网格居中、对称内边距与固定宽度，修复沿用通用按钮不对称内边距造成圆点偏左的问题；实心、空心两种状态均居中，保留触屏最小点击区域。
- 影响文件：src/editor.css、dist/index.html、dist/build-report.json；浏览器截图与报告位于 qa/floor-visibility/。
- 验证：npm run build 通过；node tests/verify-spatial-update.cjs 通过。最终构建通过 PowerShell here-string 管道交给 node 的临时 Playwright／Chrome 检查，覆盖 1440／1024／768／390px、浅色／深色及显示／隐藏共 16 种组合，圆点文字边界中心与按钮中心的最大偏差小于 0.008px，点击切换、撤销重做正常，当前楼层和组件几何不变，无页面异常或横向溢出；已打开复核桌面浅色及手机深色截图。未运行全套模型回归、Windows 封装、桌面启动和手机真机检查，本次仅修正局部 CSS 对齐并更新离线网页。

## 2026-10-23 · 修复圆形平面首次放置并精简网格设置

- 变更：修复网格吸附开启时，圆形/椭圆形平面刚放置显示为矩形、移动后才恢复轮廓的问题。统一对图稿内组件及尚未加入图稿的临时组件采样曲线轮廓，避免放置前尺寸计算把外接矩形写入几何缓存；首次画面、填充命中、撤销重做及 JSON 恢复立即使用正确圆形或椭圆形。
- 变更：删除图稿网格设置下“默认 100 UU（1 米）……”整段说明，将网格尺寸字段标签按要求改为“每个/cm”，同步内置帮助及外部说明中的字段名称；网格数值及保存格式沿用原设置。
- 影响文件：src/curved-geometry.js、src/app.js、src/help/content.json、tests/verify-grid-snapping.cjs、tests/browser-ellipse-placement.cjs、docs/使用说明.md、docs/使用说明.html、dist/index.html、dist/build-report.json；本次浏览器截图和报告位于 qa/ellipse-placement/。
- 验证：修改前新增专项真实复现 ellipse renders curved immediately, grid true（首次可见面仅 4 个点，预期曲线 32 个点）。修复后 npm run build、node tests/verify-grid-snapping.cjs 及 npm test 全部 15 组通过。圆形与椭圆形均覆盖网格开/关、首次可见轮廓、外接框角落不被填充或误选、中点命中和撤销重做；共享几何、空间交互、吸附与模型导出回归通过。
- 验证：node tests/browser-ellipse-placement.cjs 在真实 Chrome 中通过圆形/椭圆形的网格开/关四种放置、未移动前画面与 SVG 路径均为 32 点曲线、外接框角落命中排除、撤销重做和 JSON 恢复，以及桌面/390px 的“每个/cm”标签、说明移除和无横向溢出；无页面异常或在线请求，已查看圆形、椭圆形首次放置及手机设置截图。浏览器驱动首轮在多图稿工程载入后选到了首张图稿，改为隔离单图稿夹具后通过。
- 验证：使用工作区 Python 执行 tools/build-manual.py，同步 8 章 / 7 段离线 GIF 的外部教程；node .build/check-ui-integration.cjs 通过离线构建、空种子、字体/许可、桌面注入属性和教程集成。node --check 检查 src/curved-geometry.js、src/app.js 和 tests/browser-ellipse-placement.cjs 通过。未运行 Windows 封装、桌面程序启动或手机真机检查，本次更新源码及离线网页。

## 2026-10-23 · 更正网格标签并移除单位说明输入项

- 变更：将网格尺寸标签更正为“每格/cm”，同步内置帮助、外部教程和既有浏览器检查中的标签；从图稿设置的当前楼层区域删除“单位说明”输入项。
- 影响文件：src/app.js、src/help/content.json、tests/browser-ellipse-placement.cjs、docs/使用说明.md、docs/使用说明.html、dist/index.html、dist/build-report.json；既有浏览器证据更新于 qa/ellipse-placement/。
- 验证：npm run build 通过；使用工作区 Python 执行 tools/build-manual.py 通过；node .build/check-ui-integration.cjs 通过。对最终构建执行一次性 jsdom 检查，确认网格标签为“每格/cm”且不存在 doc-unit 输入项或“单位说明”文字。node tests/browser-ellipse-placement.cjs 在 Chrome 中通过桌面/390px 标签与已删除网格说明检查，并通过圆形/椭圆形放置、撤销重做及 JSON 回归，无页面异常或在线请求。未运行完整 npm test 或 Windows 封装，本次仅调整标签和移除设置输入项，未修改模型或几何行为。

## 2026-10-23 · 清理项目生成目录与临时文件

- 变更：将可重新安装的 node_modules/、.build/ 内旧界面备份及一次性检查脚本、qa/ 内历史截图/报告/测试工程与模型导出样本，以及 dist/build-report.json 移入 Windows 回收站，共 11,415 个文件、169,701,007 字节（约 161.84 MiB）。删除目标均先核对绝对路径位于本项目内；保留源码、测试与夹具、正式种子和示例、教程及媒体、字体与许可证、桌面源码、构建工具、.codex/ 配置及技能，以及可直接打开的 dist/index.html。历史日志原文保留，旧 qa/ 证据可在重新执行对应检查后生成。
- 变更：新增根目录 .gitignore，排除开发依赖、临时构建/发布/QA 输出、构建报告、QA 页面、Python 缓存及系统杂项；README 补充可清理内容及先运行 npm ci 恢复开发依赖的说明。
- 影响文件：node_modules/、.build/、qa/、dist/build-report.json（移出项目目录）；.gitignore、README.md、logs/CHANGELOG.md；dist/index.html 在清理前重新构建并保留。
- 验证：清理前 npm run build 成功，npm test 全部 15 组应用回归通过；node --test tests/changelog-hooks.test.cjs 的 15 项通过；node .build/check-ui-integration.cjs 通过离线网页、空种子、嵌入字体/许可、桌面注入属性及教程集成检查，该临时检查脚本随后一并清理。清理后使用不依赖 npm 包的 Node.js 检查，确认 27 个构建拼装脚本、教程 GIF/PNG、字体/许可、锁文件齐全，离线网页内嵌脚本可解析、正式种子为空且无未替换占位符；276 个源码/资源/测试/配置文件的清理前后 SHA-256 全部一致，清理目标均已不存在。
- 验证：未运行真实浏览器交互、Windows 封装或桌面启动，本次仅清理项目生成内容并补充目录维护说明，未改编辑器逻辑。依赖清理后再次构建或运行应用回归需先执行 npm ci；直接打开 dist/index.html 无需安装依赖。

## 2026-10-23 · 重写 Git 忽略规则

- 变更：按依赖、构建与发布、检查输出、Python 环境、本机配置和临时文件重组 .gitignore。忽略各层 node_modules、桌面封装与发布目录、QA 和自动化报告、缓存、环境配置及系统杂项；dist/ 仅保留正式离线单页 index.html，环境配置示例允许提交。继续保留源码、教程媒体、字体与许可、示例工程、测试夹具、项目协作配置和变更日志。
- 影响文件：.gitignore、logs/CHANGELOG.md。
- 验证：通过 PowerShell here-string 运行临时 Node.js 断言脚本，调用 git check-ignore --no-index --verbose --non-matching -z --stdin，331 个路径检查全部通过，包含 38 个应忽略示例、37 个应保留示例及 285 个当前项目文件；确认当前文件均可跟踪，并检查 .gitignore 无 BOM、无行尾空白且以换行结束。未运行应用构建、应用回归、浏览器操作或 Windows 封装，本次只调整 Git 忽略规则，未修改应用实现或构建脚本。
