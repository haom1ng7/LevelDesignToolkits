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


## 2026-10-23 · 修复路线箭头尖端圆包

- 变更：将路线线身收进三角箭头内部，修复圆形端帽伸出尖端、看起来像额外粘了一块的问题。保持箭头尖端对应原路线节点，平滑路线裁短后仍使用原贝塞尔曲线；起点、终点、双端、自动/手动描边及选中轮廓共用修正后的线身，PNG/SVG 导出同步生效。短路线按可用长度缩小箭头，线身过粗时仅绘制三角形，投影重合时避免退化箭头。
- 影响文件：src/render.js、src/render-features.js、src/advanced-interactions.js、dist/index.html、dist/build-report.json；临时浏览器检查驱动为 .build/inspect-route-arrows.cjs、.build/verify-route-arrows.cjs，修改前后截图、选中状态、预览、实际 PNG/SVG 与 report.json 位于 qa/route-arrow/。
- 验证：npm run build 成功；最终构建的 npm test 全部 15 组通过。node .build/verify-route-arrows.cjs 在真实 Chrome 中通过 246 个三视图、直线/平滑、四种箭头、三档线宽、实线/虚线/点线及短路线/投影重合检查，18 次尖端像素比较确认线身不再改变三角尖轮廓；选中轮廓使用相同路径，节点位置与 JSON 恢复正常。实际下载的 1000×700 PNG/SVG 逐像素一致，均不含选择/节点辅助元素，无页面异常或在线请求；已打开复核修改前后、选中状态和实际 PNG。node --check src/render.js、node --check src/render-features.js 与相关文件 git diff --check 通过。未运行 Windows 封装、桌面程序启动或手机真机检查，本次更新源码和离线网页。

## 2026-10-23 · UE 式三轴属性面板与多选共有值编辑

- 变更：属性面板改为可折叠的“组件”“变换”“外观与参数”分组；五类实体的位置、旋转、长宽高各以一行 X/Y/Z 输入显示，三轴使用红、绿、蓝标记。位置精确设置各组件原点（Z 相对楼层），旋转复用原有方向矩阵，长宽高使用旋转前的本地实体尺寸；只修改输入对应的轴，尺寸继续遵循网格，圆弧和旋转楼梯保留径向联动。加宽桌面侧栏，保留深浅主题及窄屏面板。
- 变更：多选汇总所有独立选中组件的共有属性，相同值直接显示，不同值显示“多个值”，名称、数值、下拉选项、文字和颜色均支持；不再显示最后选中组件的单件值。输入新值会统一应用到各件，保留其他轴，连续输入合为一次批量撤销；输入后失焦不会因旋转或尺寸浮点误差重复创建历史。不同类型仅显示共同支持字段，任一所选组件锁定时禁止编辑，无效批量变更整批回滚。附属空洞随宿主处理，避免重复变换；独立选择空洞仍编辑自身属性。输入时同步其他派生属性且保留焦点，空数字不会误写为零，折叠状态在重绘后保留。
- 变更：接入独立的属性编辑片段，共用组件字段生成单选和多选面板，复用三维尺寸约束；新增自动与真实浏览器专项，将属性回归接入 npm test。同步内置帮助、外部教程、项目上下文和验证入口。
- 影响文件：src/property-inspector.js、src/app.js、src/world-transform.js、src/editor.css、src/help/content.json、tools/build.mjs、package.json、tests/verify-property-inspector.cjs、tests/browser-property-inspector.cjs、docs/使用说明.md、docs/使用说明.html、.codex/project-context.md、.codex/rules/validation.md、dist/index.html、dist/build-report.json；截图和报告位于 qa/property-inspector/，既有单件属性截图更新于 qa/solid-properties/。
- 验证：npm ci 成功；npm run build 成功。node tests/verify-property-inspector.cjs 通过逐轴混合值、改变主选择不影响汇总、空值保护、名称/颜色/下拉/文本批量设置、一次撤销与重做、五类旋转实体各轴尺寸、原点不变、网格/圆形联动、宿主空洞、锁定、整批回滚、欧拉角奇异位置、JSON 及三视图；补充输入和原生 change 提交不重复记入历史的断言通过。node tests/verify-world-move.cjs、node tests/verify-solid-transform.cjs、node tests/verify-grid-snapping.cjs 通过。
- 验证：node tests/browser-property-inspector.cjs 在真实 Chrome 中通过 Ctrl 点击多选、实际文本/数字/颜色输入、焦点、批量历史、分组折叠、锁定、三视图及 JSON；1440/1024/991/768/390/360px 的深浅主题共 12 种组合无横向溢出，三轴始终同排，窄屏批量编辑正常，无页面异常或在线请求；已打开复核桌面深色及手机浅色截图。首轮检查发现 1024px 旧断点覆盖新增侧栏宽度，修正 CSS 顺序后通过。node tests/browser-solid-properties.cjs 通过已有单件输入、撤销重做、三视图、锁定、楼梯参数及 JSON 回归。
- 验证：使用工作区 Python 执行 tools/build-manual.py 成功；一次性 Node.js 离线集成检查通过脚本解析、无构建占位符、正式空种子、属性模块及全部教程条目的内外同步。node --check 检查属性模块、app、world-transform 和两份新测试通过；node --test tests/changelog-hooks.test.cjs 的 15 项通过；git diff --check 通过。
- 验证：本任务首次 npm test（新增专项接入前）15 组通过；最终构建的 npm test 在 verify-v7.cjs 的导出预览 ready 断言失败。定位为工作区同期其他修改从 src/editor.html 删除 export-model-note，而 src/export-preview.js 的 exportControls 仍读取该元素的 hidden 属性；该修改不属于本任务，已保留并如实记录，最终全套不能记为通过。未运行 Windows 封装、桌面程序启动或手机真机检查；本次交付源码及离线网页。

## 2026-10-23 · 移除多选属性面板提示文字

- 变更：删除多选属性面板顶部“共有属性 · 不同值显示‘多个值’”一行提示，保留选中数量、字段内“多个值”及批量编辑行为。
- 影响文件：src/app.js、dist/index.html、dist/build-report.json；浏览器证据更新于 qa/property-inspector/。
- 验证：npm run build 成功；一次性 Node.js 断言确认源码及构建页面已无该提示。node tests/browser-property-inspector.cjs 在 Chrome 中通过多选、混合值、输入、批量历史、折叠、锁定、三视图、JSON，以及 12 种屏幕宽度/主题组合和窄屏批量编辑，无页面异常或在线请求。未运行完整 npm test、Windows 封装、桌面启动或手机真机检查，本次仅删除一行界面提示并更新离线页面。

## 2026-10-23 · 精简组件属性空态与楼层提示

- 变更：删除组件属性空态中的平行四边形装饰图标及“选择组件后编辑属性。”，保留“未选择组件”状态；无图稿时保留“暂无图稿”和新建/打开引导。删除图稿设置当前楼层下“立面图拖动单件改变相对高度，楼层全选移动改变基准高度。”提示，保留楼层名称、基准高度及楼层操作。
- 影响文件：src/app.js、dist/index.html、dist/build-report.json、logs/CHANGELOG.md；本次浏览器截图与报告位于 qa/inspector-cleanup/。
- 验证：npm run build 通过；node tests/verify-property-inspector.cjs 通过。通过 PowerShell here-string 管道交给 node 执行临时 Playwright/Chrome 检查，确认无图稿引导、未选择组件时无图标与提示、选中后属性字段正常，1440/390px 的深浅主题四种组合无横向溢出，楼层字段仍可见且提示已移除，无页面异常或在线请求；已打开复核桌面与窄屏浅色截图。git diff --check -- src/app.js dist/index.html logs/CHANGELOG.md 通过。未运行全套 npm test、Windows 封装或桌面程序启动，本次只精简界面提示与空态装饰。

## 2026-10-23 · 调整组件属性空态排版

- 变更：将“未选择组件”从靠左的粗体标题调整为居中的轻量状态文字；用低对比底色、上下细分隔线及均衡留白组织空白属性区，深浅主题复用现有颜色变量。无图稿引导沿用同一布局；已移除的图标和说明文字保持移除。删除失效的空态图标样式。
- 设计：局部 Redesign，沿用地图与区域导航家族、画布为视觉锚点及现有中性色/系统黄主题；签名是选中时呈现属性、未选中时以安静的占位区表示状态。省略图标、额外英文、编号与强调色装饰，保留工具界面的扫描层次。
- 影响文件：src/editor.css、dist/index.html、dist/build-report.json、logs/CHANGELOG.md；截图和检查报告位于 qa/inspector-empty-state/。
- 验证：npm run build、node tests/verify-property-inspector.cjs 通过。通过 PowerShell here-string 管道交给 node 执行临时 Playwright/Chrome 检查，1440/1024/768/430/390/360px 与深浅主题共 12 种组合下，空态文字水平/垂直居中，无横向溢出，文字对比度检查通过；选中组件后空态消失且名称可编辑，切换图稿设置及清空选择后正常。无图稿引导保留，无页面异常或在线请求。视觉 verified（已打开检查桌面浅色、手机深色截图）；响应式 verified（Chrome 模拟）；交互 verified（真实浏览器选中、输入、切换及清空）。git diff --check -- src/editor.css dist/index.html logs/CHANGELOG.md 通过。未运行全套 npm test、Windows 封装、桌面程序启动或手机真机检查，本次仅调整局部 CSS。

## 2026-10-23 · 移除 S 切换大小工具的旧快捷键

- 变更：移除 S 到大小工具的兼容映射。平面、立面和立体图中，选中组件后按 S 或 Shift＋S 均保持当前工具；R 继续切换大小工具，Ctrl＋S 仍暂存工程。同步内置帮助、外部教程、README 和项目上下文中的快捷键说明，并更新离线网页。
- 影响文件：src/keyboard.js、src/help/content.json、README.md、.codex/project-context.md、tests/verify-solid-transform.cjs、tests/browser-solid-transform.cjs、docs/使用说明.md、docs/使用说明.html、dist/index.html、dist/build-report.json；浏览器报告与截图位于 qa/solid-transform/。
- 验证：修复前先构建并运行新增的 node tests/verify-solid-transform.cjs 断言，复现 plan: S preserves select 失败，实际工具为 size。修复后 npm run build、node tests/verify-solid-transform.cjs、node tests/verify-world-move.cjs 通过；覆盖三视图、选择/移动/旋转状态、大小写 S、缺少物理按键代码的回退、输入法物理 KeyS、R、几何及撤销历史不变，以及既有变换与移动回归。node tests/browser-solid-transform.cjs 在真实 Chrome 中通过三视图 S/Shift＋S 不切工具、R 切换、Ctrl＋S 本地暂存，并通过 W/E/R 实际手柄拖动、撤销重做、Esc、属性输入、锁定、JSON、宿主和 SVG 辅助元素排除检查，无页面异常。浏览器首轮驱动将 Ctrl＋S 误作 JSON 下载并等待超时，按实际暂存语义改为核对 localStorage 后通过。
- 验证：使用工作区 Python 执行 tools/build-manual.py 成功；一次性 Node.js 检查确认离线网页及两份外部教程均含当前快捷键且无“S 兼容”。node --check 检查 keyboard 与两份修改的测试通过，git diff --check 通过。npm test 在首组 verify-v7.cjs 的 exportPreview.ready 断言失败；检查发现当前工作区 src/editor.html 缺少 export-model-note，而 src/export-preview.js 仍读取其 hidden 属性，这是已有的导出预览问题，本次未修改相关功能，其余未执行的全套回归不记为通过。未运行 Windows 封装或桌面程序启动，本次交付源码与离线网页。

## 2026-10-23 · 变换数值支持左右拖动调节

- 变更：位置、旋转、长宽高的九个数值框及其 X/Y/Z 色块均支持按住横向拖动，向右增大、向左减小；单击仍可输入，拖动超过 4px 才进入调值，避免轻微手抖误改。增加横向调值光标、拖动中的轴色强调与悬停操作提示，不新增常驻说明文字。Shift 将增量缩为十分之一，切换修饰键时不跳值；尺寸沿用网格及径向联动约束，Ctrl/Command 暂停网格；最小尺寸不反转，到达下限后反向拖动立即恢复增长。
- 变更：多选拖动给每个独立组件的对应轴增加相同增量，保留原有数值差，直接输入仍统一设置。预览每次从拖动起始状态计算，验证失败时整批保留上一次有效状态；附属空洞随宿主一次变换。松开仅提交一条撤销记录，预览不写历史；Esc、Ctrl/Command+Z/Y、指针取消、捕获丢失、窗口失焦、尺寸变化及切换工具/选择/视图等操作恢复原状态，结束后释放捕获、光标和临时选字状态。输入及工程载入复用现有模型、历史和保存流程。
- 变更：扩展自动属性回归，新增真实浏览器拖动专项；同步内置帮助、外部教程、项目上下文和验证映射。
- 影响文件：src/property-inspector.js、src/app.js、src/editor.css、src/help/content.json、tests/verify-property-inspector.cjs、tests/browser-property-scrub.cjs、docs/使用说明.md、docs/使用说明.html、.codex/project-context.md、.codex/rules/validation.md、dist/index.html、dist/build-report.json；本次拖动证据位于 qa/property-scrub/，既有属性证据更新于 qa/property-inspector/ 和 qa/solid-properties/。
- 验证：npm run build 成功；node tests/verify-property-inspector.cjs 通过既有属性、多选、模型/JSON 回归及新增九个拖动字段、预览不记历史、一次撤销、取消与多选差值检查。node tests/verify-world-move.cjs、node tests/verify-solid-transform.cjs、node tests/verify-grid-snapping.cjs 通过。
- 验证：node tests/browser-property-scrub.cjs 在真实 Chrome 中通过三个视图的全部九个数值拖动、实时预览/单次撤销重做、色块向左调小、多选位置/角度/尺寸差值、Shift 及中途修饰键切换、网格/Ctrl、尺寸下限及反向恢复、宿主空洞/旋转楼梯、七类取消路径、无效批量预览保留最后有效值、普通点击/手抖/输入、锁定及 390px 面板，无页面异常；已查看窄屏截图。首轮驱动把平滑移动过程中的有效中间帧误当成无效结果，改为直接发送一次无效位置以准确验证回滚后通过。node tests/browser-property-inspector.cjs 和 node tests/browser-solid-properties.cjs 在最终构建通过既有多选/单件输入、焦点、历史、锁定、三视图、JSON 及 12 种宽度/主题组合检查。
- 验证：使用工作区 Python 执行 tools/build-manual.py 成功；一次性 Node.js 检查通过离线脚本解析、全部帮助条目的内外同步、新拖动字段接入及此前删除的多选提示保持缺席。node --check 检查属性片段、app 及两份相关测试通过；git diff --check 通过。npm test 本次仍在 tests/verify-v7.cjs:34 的导出预览 ready 断言失败，沿用已记录的导出说明元素被删除而代码仍读取的问题，未记为全套通过；本任务保留该独立修改。未运行 Windows 封装、桌面启动、手机真机或真实触屏手势检查，本次更新源码及离线网页，窄屏使用 Chrome 模拟。

## 2026-10-23 · 立体视角改为右键拖动

- 变更：立体图旋转摄像机由左键拖动空白处改为按住右键拖动；可从空白处、组件或变换手柄开始，旋转时保持组件选择、几何及撤销历史。左键空白拖动不再旋转，左键单击空白处仍取消选择，组件选择和编辑继续使用左键。右键移动超过 5px 才旋转，右键单击或轻微抖动仍打开组件菜单；兼容浏览器在按下或松开右键时派发 contextmenu，拖动中及松开后不误弹菜单。中键和空格平移、反转方向、俯仰范围、Esc 结束拖动及右键退出创建沿用原行为。
- 变更：同步立体图空态提示、内置帮助、README 和外部教程；将已有俯仰及空间回归、历史浏览器片段中的旋转手势改为右键，并补充左键不旋转和右键确实改变角度的断言。
- 影响文件：src/app.js、src/help/content.json、README.md、tests/verify-min-pitch.cjs、tests/verify-spatial-update.cjs、tests/browser-spatial-update.js、tests/browser-world-move.js、docs/使用说明.md、docs/使用说明.html、dist/index.html、dist/build-report.json、logs/CHANGELOG.md；临时浏览器驱动为 .build/verify-right-orbit.cjs，报告及截图位于 qa/right-orbit/。
- 验证：npm run build 成功；使用工作区 Python 执行 tools/build-manual.py 成功。node tests/verify-min-pitch.cjs、node tests/verify-horizon.cjs、node tests/verify-spatial-update.cjs、node tests/verify-world-move.cjs、node tests/verify-solid-transform.cjs 通过；旧空间回归最初仍发送左键，更新为右键后通过。最终构建重新通过俯仰及空间回归。
- 验证：node .build/verify-right-orbit.cjs 在真实 Chrome 中通过空白处/未选中组件/W、E、R 手柄上的右键拖动、双向角度变化、选择/几何/历史保持、右键菜单及轻微抖动、左键选择/取消选择、中键和空格平移、路线及矩形创建退出、平面/立面菜单、Esc 结束及旋转后组件列表菜单；无页面异常，最终构建重跑通过。node tests/browser-tool-selection.cjs 通过既有三视图左键选择与工具/手柄同步检查。临时驱动首次定位角点时匹配了两个圆，改为取首个命中圆后通过；已查看立体图截图。
- 验证：一次性 Node.js 检查通过离线脚本解析、构建占位符排除及全部内置/Markdown/HTML 帮助条目同步；node --check 检查 app 与修改的四份测试通过，相关文件 git diff --check 通过。npm test 在 tests/verify-v7.cjs:34 的 exportPreview.ready 断言失败；检查确认与历史日志相同，src/editor.html 已缺少 export-model-note，而 src/export-preview.js 的 exportControls 仍读取其 hidden 属性；该已有导出问题不在本次交互修改范围，后续未执行的全套回归不记为通过。两份历史 browser-*.js 片段未端到端执行，本次真实手势由专项 Chrome 驱动覆盖。未运行 Windows 封装或桌面程序启动，本次更新源码及离线网页。

## 2026-10-23 · 精简变换字段与旋转单位

- 变更：删除平面在“外观与参数”中的独立“平面厚度”输入项，厚度仍可通过“变换 → 大小 → Z”调整；墙壁和阶梯类组件的厚度参数保留。将变换行“长宽高”改名为“大小”，旋转单位由“°”改为“度”，保留三轴输入、多选多个值、左右拖动和撤销行为。同步内置帮助与外部教程，既有平面厚度回归改为操作大小 Z 输入。
- 影响文件：src/app.js、src/property-inspector.js、src/help/content.json、tests/browser-solid-properties.cjs、tests/verify-world-move.cjs、tests/verify-grid-snapping.cjs、docs/使用说明.md、docs/使用说明.html、dist/index.html、dist/build-report.json；浏览器证据更新于 qa/property-inspector/、qa/property-scrub/ 和 qa/solid-properties/。
- 验证：使用工作区 Python 执行 tools/build-manual.py、npm run build 成功。node tests/verify-property-inspector.cjs、node tests/verify-world-move.cjs、node tests/verify-grid-snapping.cjs 全部通过；node tests/browser-property-inspector.cjs、node tests/browser-property-scrub.cjs、node tests/browser-solid-properties.cjs 在真实 Chrome 中全部通过，覆盖多选、三轴数值输入与拖动、批量差值、网格、历史/取消、锁定、三视图、JSON 和响应式布局。
- 验证：通过 PowerShell here-string 管道运行一次性 Playwright/Chrome 检查，确认平面没有独立厚度控件、墙壁仍有厚度控件，变换三行均显示位置/旋转/大小且大小含三个输入、旋转单位为“度”，生成的两份教程和离线网页同步。已打开复核本次桌面深色及 390px 浅色截图，布局正常。相关文件 git diff --check 通过。未运行全套 npm test、Windows 封装、桌面程序启动或手机真机检查，本次仅精简局部属性界面并已运行相关专项。

## 2026-10-23 · 选中组件后自动切换组件属性

- 变更：从画布或组件列表选中组件后，“属性与设置”自动切换到“组件属性”；再次点击已选组件也会重新打开属性。Ctrl 多选、Shift 列表范围选择、框选及全选沿用同一行为。手动切回“图稿设置”后，普通刷新和清空选择保持该标签；窄屏仅更新内部属性标签，保留当前画布/工具面板，方便继续操作。切换不改组件数据或撤销记录。同步内置帮助、外部教程及离线网页。
- 影响文件：src/app.js、src/component-list.js、src/help/content.json、docs/使用说明.md、docs/使用说明.html、dist/index.html、dist/build-report.json、logs/CHANGELOG.md；本次浏览器检查报告位于 qa/selection-properties/report.json。
- 验证：npm run build 成功；使用工作区 Python 执行 tools/build-manual.py 成功。node --check src/app.js、node --check src/component-list.js 通过；node tests/verify-property-inspector.cjs、node tests/verify-component-list.cjs、node tests/verify-world-move.cjs 通过。node tests/browser-tool-selection.cjs、node tests/browser-property-inspector.cjs 在真实 Chrome 中通过既有选择/工具状态、三视图、属性输入、多选、历史及 12 种宽度/主题组合回归。
- 验证：通过 PowerShell here-string 管道交给 node 执行临时 Playwright/Chrome 专项，三视图的列表/画布选中与重复点击、Ctrl 多选、Shift 连选、Ctrl+A、框选自动切换通过；手动图稿设置、空白清选、390px 面板及继续画布操作正常，组件几何与历史不变，无页面异常或在线请求。一次性 Node.js 检查通过脚本解析、无构建占位符及选择说明内外同步；git diff --check 通过。
- 验证：npm test 在首组 tests/verify-v7.cjs:34 的 exportPreview.ready 断言失败；本次检查确认 src/editor.html 缺少 export-model-note，而 src/export-preview.js 的 exportControls 仍读取其 hidden 属性，属于工作区已有导出预览问题，未修改该独立功能，未记为全套通过。未运行 Windows 封装、桌面程序启动或手机真机检查，本次交付源码、教程与离线网页。

## 2026-10-23 · 移除画布底部多选操作提示

- 变更：删除画布底部“Ctrl 点击多选 / 组件列表编辑单件”提示，平面与立面图未选中组件时该位置留空。
- 影响文件：src/app.js、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build、node --check src/app.js 通过；通过 PowerShell here-string 管道交给 node 执行一次性 jsdom 检查，确认源码及离线页面已移除该文案，平面/立面未选中状态留空，立体图提示和选中组件名称正常，无运行异常。未运行完整 npm test、真实浏览器或 Windows 封装，本次仅删除一段界面提示。

## 2026-10-23 · 组件列表拖动排序与 Shift 连续选择

- 变更：左下角组件列表可按住名称上下拖动，显示浮动名称与插入线，松开后一次提交顺序；拖动当前选中项可将列表中选中的同级组件按原相对顺序一起移动。沿用工程 objects 顺序、JSON 与自动暂存，不新增格式字段；一次排序可一次撤销/重做，原位置松开不增加历史。长列表拖到侧栏边缘自动滚动，插入线限制在可见区域；Esc、Ctrl+Z、列表外松开、指针取消、窗口失焦、切换图稿/筛选均取消预览。锁定组件及包含锁定空洞的宿主禁止拖动，宿主携带空洞，空洞只能在同一宿主内排序，保留归属、分组、几何及其他楼层组件。
- 变更：先点击 A，再 Shift 点击 B，按当前列表显示顺序选中两端及中间组件；重复 Shift 点击保留起点并调整范围，Ctrl/Meta+Shift 将范围加入原选择。范围仅使用当前楼层和当前筛选列出的行，包含列出的隐藏/锁定组件，保留列表选择单件的行为。排序后范围按新顺序计算；修饰键点击清除双击计时，避免连选后误触改名，保留双击改名、显示与锁定按钮。同步内置帮助、外部教程和项目模块/验证入口。
- 影响文件：src/component-list.js、src/app.js、src/advanced-interactions.js、src/editor.css、src/help/content.json、tools/build.mjs、package.json、tests/verify-component-list.cjs、tests/browser-component-list.cjs、.codex/project-context.md、.codex/rules/validation.md、docs/使用说明.md、docs/使用说明.html、dist/index.html、dist/build-report.json、logs/CHANGELOG.md；本次截图与报告位于 qa/component-list/。
- 验证：npm run build 成功；使用工作区 Python 执行 tools/build-manual.py 成功。最终构建的 node tests/verify-component-list.cjs、node tests/verify-property-inspector.cjs、node tests/verify-events.cjs 通过，覆盖正反范围与缩减、Ctrl 联合、筛选、整组单件、单项/批量排序、预览不改模型、撤销/重做、无变化历史、校验失败回滚、取消、锁定、宿主空洞、跨楼层、JSON、三视图、曲线标注、改名与图标按钮。
- 验证：node tests/browser-component-list.cjs 在真实 Chrome 中通过 Shift/Ctrl 连选、实际名称拖动、指针捕获、插入线、批量排序、撤销/重做、取消、改名/显隐按钮、宿主空洞及锁定、JSON/自动暂存重载、长列表自动滚动；1440px 与 390px 的深浅主题四种组合均无横向溢出、页面异常或在线请求。已打开复核桌面深色与窄屏浅色拖动截图。首轮浏览器检查在侧栏滚到底后松开于列表外的复制按钮区域，按取消语义未排序；修正测试为滚动后在列表内松开，同时完善可见区插入线边界，再次全部通过。
- 验证：npm test 在首组 tests/verify-v7.cjs:34 的 exportPreview.ready 断言失败；随后通过 PowerShell here-string 管道运行 Node.js spawnSync，依 package.json 顺序单独执行其余 16 组，15 组通过，tests/verify-mesh-export.cjs:44 同样在 exportPreview.ready 失败。已确认 src/editor.html 缺少 export-model-note，而 src/export-preview.js 的 exportControls 仍访问其 hidden 属性；这是本轮开始前已有的独立导出预览问题，未修改该功能，不将全套回归记为通过。
- 验证：node --check 检查组件列表、app、advanced-interactions 与两份新测试通过；node --test tests/changelog-hooks.test.cjs 的 15 项通过。一次性 Node.js 检查通过连选/排序帮助内外同步、构建占位符清除与正式空种子；相关文件 git diff --check 通过。未运行 Windows 封装、桌面程序启动、手机真机操作或 PNG/SVG 实际下载，本次交付源码、教程及离线网页，导出行为未改动。


## 2026-10-23 · 移除工程图稿改名按钮

- 变更：删除“工程图稿”区域的“改名”按钮及其独立改名弹窗、事件和专用样式；复制与删除调整为等宽两列。空间图名称继续通过右侧“图稿设置”修改。同步内置帮助、外部教程和项目上下文，并更新离线网页与现有图稿管理浏览器检查。
- 影响文件：src/editor.html、src/editor.css、src/ui-shell.js、src/app.js、src/help/content.json、tests/browser-document-management.cjs、.codex/project-context.md、docs/使用说明.md、docs/使用说明.html、dist/index.html、dist/build-report.json、logs/CHANGELOG.md；本次截图与报告位于 qa/ui-refine/。
- 验证：使用工作区 Python 执行 tools/build-manual.py、npm run build 成功；node tests/browser-document-management.cjs 在真实 Chrome 中通过按钮/弹窗移除、新增、图稿设置名称编辑、复制/删除与撤销重做、曲线复制、实际 JSON 下载/导入、360px 两列按钮及暂存恢复检查，无页面异常或在线请求；已查看窄屏截图。node tests/verify-property-inspector.cjs 通过。node --check 检查 app、ui-shell 与图稿管理测试通过；相关文件 git diff --check 通过。
- 验证：一次性 Node.js 检查通过构建后改名界面/事件排除、脚本及空工程种子解析、无构建占位符及内外教程同步；首轮检查把 application/json 工程种子当成 JavaScript 解析而失败，按脚本类型区分后通过。未运行完整 npm test、Windows 封装、桌面程序启动或手机真机检查，本次为局部界面删除，已运行相关专项。

## 2026-10-23 · 修正三视图按钮文字偏左

- 变更：平面图、立面图、立体图按钮改用左右对称的内边距，消除文字约 3.84px 的左偏；将原切角预留空间均分至两侧，保留按钮整体宽度。曲线图共用按钮同步居中。
- 设计：沿用地图与区域导航家族、画布视觉锚点及现有中性色/系统黄主题，仅修正高频视图切换控件的文字对齐，保留现有选中和焦点样式。
- 影响文件：src/editor.css、dist/index.html、dist/build-report.json、logs/CHANGELOG.md；本次截图与报告位于 qa/view-label-centering/。
- 验证：npm run build 成功。通过 PowerShell here-string 管道交给 Node.js 执行 Playwright/Chrome 专项：修复前实测三个标签均左偏 3.84375px；修复后通过 1440/1024/768/430/390/360px、深浅主题及三种视图共 36 组检查，文字水平偏移小于 0.1px，左右内边距相等，桌面按钮宽度仍为 66px，无页面横向溢出。12 组曲线图标签、键盘焦点与 Enter 切换检查通过，视图切换保持组件数据及撤销历史，无页面异常或在线请求。首轮驱动将程序化 focus 误作键盘焦点而触发焦点外框断言失败，改为真实 Shift+Tab 导航后通过。已打开复核桌面浅色与 390px 深色工具栏截图；视觉、响应式（Chrome 模拟）和交互 verified。未运行完整 npm test、Windows 封装、桌面程序启动或手机真机检查，本次仅调整局部 CSS 并更新离线网页。


## 2026-10-23 · 工程文件保存与 Ctrl+S 快速保存

- 变更：顶部“下载工程”改为“保存工程”，按钮与 Ctrl+S / Command+S 共用文件保存流程。首次保存选择文件位置，本次打开期间后续保存更新同一 JSON；空工程也可保存。工程导入和程序载入后清除旧目标，保存目标不进入工程格式、暂存键或撤销记录；重新启动后首次保存重新选择位置。不支持文件保存接口的浏览器保留下载兼容路径，帮助与按钮提示明确位置由浏览器下载设置决定。
- 变更：快捷键在捕获阶段处理，支持属性输入和行内文字编辑期间先提交再保存；输入法组合、按住重复触发及打开对话框时不误保存，阻止浏览器自身的网页保存。保存中显示按钮状态、合并重叠请求，取消不丢内容；写入失败中止并提示，成功后保留目标供重试/快速保存，旧工程异步完成不关联到新工程。
- 变更：桌面增加隔离 preload 的受限保存 IPC，首次调用系统保存对话框；仅接受主窗口当前主框架的工程 JSON，在目标目录写完临时文件后替换目标，失败清理临时文件。保留 Node 禁用、上下文隔离、沙箱及离线限制。关闭窗口改用独立 autosave 命令，避免未选择保存位置时弹窗；原有自动暂存继续工作。同步内置帮助、快捷键表、外部教程及项目保存/验证说明。
- 影响文件：src/project-saving.js、src/app.js、src/keyboard.js、src/editor.html、src/help/content.json、desktop/main.cjs、desktop/preload.cjs、tools/build.mjs、tests/browser-project-saving.cjs、tests/browser-solid-transform.cjs、tests/browser-document-management.cjs（仅增加下载兼容测试设置，保留工作区其他调整）、tests/desktop-smoke.cjs、README.md、docs/使用说明.md、docs/使用说明.html、.codex/project-context.md、.codex/rules/validation.md、dist/index.html、dist/build-report.json。
- 验证：npm run build 成功；使用工作区 Python 执行 tools/build-manual.py 成功。node tests/browser-project-saving.cjs 在最终构建通过真实 Chrome 快捷键、输入/行内中文提交、空工程、目标复用、取消、输入法/重复键/对话框保护、并发去重、写入失败与重试、打开工程重置和异步隔离、有效 JSON 下载兼容；同时通过实际 Electron 启动、隔离 preload/IPC、真实 JSON 写盘与 Ctrl+S 覆盖、失败保护及关闭行为。浏览器文件句柄与系统对话框选路径使用测试替身，未人工操作原生选择器；报告及截图在 qa/project-saving/，已查看保存按钮截图。首轮驱动误取默认第一个组件而非新增文字组件，改为按组件 ID 核对后通过。
- 验证：node tests/verify-world-move.cjs、node tests/verify-solid-transform.cjs、node tests/verify-property-inspector.cjs、node tests/browser-document-management.cjs 在最终构建通过；node tests/browser-solid-transform.cjs 通过真实 W/E/R 与新的 Ctrl+S 文件保存回归。一次性 Node.js 检查通过离线脚本解析、空工程种子、旧“下载工程”文案清除及全部内外帮助同步；node --check 检查新增保存模块、快捷键、桌面主进程/preload 与专项脚本通过，git diff --check 通过。
- 验证：npm test 本次仍在 tests/verify-v7.cjs:34 的 exportPreview.ready 断言失败；已核对 src/export-preview.js 读取页面缺失的 export-model-note 元素，此为任务开始前已记录的独立导出预览问题，未改动该功能，完整回归不记为通过。未运行 Windows 目录版/便携版重新封装，未验证已封装 EXE；本次更新源码、教程与离线网页，桌面保存使用独立配置的 Electron 源码暂存应用实测。
- 验证补充：tests/desktop-smoke.cjs 的 JSON 检查已从 DownloadItem 迁移到原生保存 IPC 入口（测试替代对话框选路径），保留 PNG 下载检查及关闭后的自动暂存恢复；node --check 通过。该已封装 EXE 冒烟脚本未运行，原因是本任务未重新封装程序；等价保存路径已由新增 Electron 专项实测。最终按 Windows CRLF 换行规则执行 Git 空白检查通过。


## 2026-10-23 · Ark UI 界面重构与 v1.1 版本同步

- 变更：按 ark-ui 的 ark / moderate 设计约定重构界面，整理原有多轮叠加的样式，统一为黑白灰工作台、青色状态线和方角控件。覆盖顶部文件命令、工程图稿与楼层、工具与组件列表、视图工具栏、欢迎入口、属性面板、新建/帮助/导出弹窗；欢迎页使用原创技术图解与单层蓝图网格。保留深浅主题、110% 界面比例、三轴输入和既有编辑操作；990px 以下使用底部面板导航，660px 以下重排顶部命令及纵向弹窗；增加可读焦点颜色和减少动态效果处理。
- 变更：页面标题和版本标识改为 v1.1，npm、锁文件根节点及桌面包版本改为 1.1.0，浏览器/桌面的默认工程文件名改为“关卡设计工具箱_工程_v1.1.json”。网页构建输出、桌面封装元数据及发布附件命名读取根 package.json 的版本，更新当前发布说明和项目上下文；现有快捷方式指向的 dist/index.html 已更新。
- 修复：导出弹窗补回脚本依赖的 export-model-note，模型格式显示完整导出范围说明；修复此前已记录的预览无法就绪问题。恢复组件列表原有垂直留白，确保真实指针排序和长列表边缘自动滚动正常。
- 设计与来源：新增 docs/UI设计说明.md，记录官方页面的高层参考模式、原创实现、Saira OFL 字体沿用、信息归属和中等深度校准；未添加官方游戏素材或第三方运行时依赖。
- 影响文件：src/editor.html、src/editor.css、src/project-saving.js、desktop/main.cjs、desktop/package.json、package.json、package-lock.json、tools/build.mjs、tools/package-desktop.mjs、tools/package-release.py、README.md、docs/GitHub发布指南.md、docs/UI设计说明.md、.codex/project-context.md、tests/browser-ark-ui.cjs、tests/desktop-smoke.cjs、tests/browser-world-published-finish.js、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功；npm test 的全部 17 组通过，包括旧工程兼容、模型几何、事件、吸附、三视图变换、属性编辑、列表排序及 PNG/SVG/FBX/OBJ 导出相关回归。node tests/browser-document-management.cjs、node tests/browser-property-inspector.cjs、node tests/browser-component-list.cjs、node tests/browser-tool-selection.cjs、node tests/browser-mesh-export.cjs、node tests/browser-project-saving.cjs 全部通过；覆盖真实 Chrome 编辑、JSON 保存/导入、拖动/自动滚动、实际 PNG/SVG 与 FBX/OBJ 下载及独立读取，以及真实 Electron 源码暂存应用的隔离 IPC、Ctrl+S 和写盘（原生选择路径由测试替身提供）。
- 验证：新增 node tests/browser-ark-ui.cjs 通过 1440/1024/991/990/768/390/360px 深浅主题共 14 组，检查卡片可见/可滚动、横向溢出、文字 AA 对比度、焦点可见性、真实 Tab/Enter、减少动态效果、图稿两种入口、三视图、主题与历史隔离、九项变换字段、窄屏 inert/选工具回画布/编辑选项、帮助和导出。无页面/CSP 异常或在线请求，QA 明确禁止工程暂存写入与删除。证据与同尺寸前后截图在 qa/ark-ui/；已查看桌面、竖屏、深浅主题与导出截图。首轮新驱动在立面图尝试使用禁用的平面工具，改为先切回平面图后通过；首轮组件列表检查暴露行距压缩使滚动余量不足，恢复留白后最终专项通过。
- 验证：node .codex/skills/ark-ui-skill/scripts/audit-ark-ui.mjs src/editor.css 无错误或警告；对 src 全目录审计无错误，唯一警告为静态扫描不能识别运行时生成的组件/帮助 DOM 钩子，已由真实操作回归验证。node --check 检查新浏览器专项及封装脚本通过，工作区 Python ast.parse 检查发布脚本通过；一次性 Node 检查通过版本/锁文件/保存文件名同步、空正式种子及构建占位符清除；git -c core.whitespace=cr-at-eol diff --check 通过。
- 未运行：项目未定义独立 lint 命令；教程内容未修改，未重新生成外部教程；未重新封装 Windows 目录版/便携版或执行已封装 EXE 的 desktop-smoke，当前交付源码与离线网页，桌面保存仅由 Electron 源码暂存应用实测；手机检查使用 Chrome 模拟视口，未使用手机真机。


## 2026-10-23 · 修正楼层操作按钮文字偏左

- 变更：修正“新增楼层 / 复制楼层 / 删除楼层”文字左偏问题。将共用 button-row 操作按钮原有不对称的左右内边距均分，保留总内边距和按钮宽度；属性面板内复用该规则的操作按钮同步居中。
- 影响文件：src/editor.css、dist/index.html、dist/build-report.json、logs/CHANGELOG.md；本次浏览器截图和测量报告在 qa/floor-label-centering/。
- 验证：npm run build 成功。通过 PowerShell here-string 管道交给 Node.js 执行一次性 Playwright/Chrome 专项，修改前实测三个标签均左偏 2.75px（左内边距 8.8px、右内边距 14.3px）；修改后通过 1440/1024/991/990/768/430/390/360px 与深浅主题共 16 组检查，左右内边距相等、文字中心偏差小于 0.1px，三个按钮宽度均保持 73.5px，无横向溢出或页面异常。真实点击新增、复制、删除楼层及撤销/重做通过，Tab 焦点顺序和可见焦点正常；切换布局/主题不改变工程与历史。已查看 360px 深色截图，按钮文字居中。git -c core.whitespace=cr-at-eol diff --check -- src/editor.css logs/CHANGELOG.md 通过。
- 未运行：完整 npm test、Windows 封装、已封装 EXE 和手机真机验证；本次仅修正共用按钮水平内边距，已构建离线网页并验证相关真实交互。


## 2026-10-23 · 移除组件空列表提示句号

- 变更：将空组件列表提示“当前范围内没有组件。”改为“当前范围内没有组件”，删除末尾句号。
- 影响文件：src/editor.css、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 最终成功；首次写入 dist/index.html 时出现 UNKNOWN 文件写入错误，首次产物断言因此未通过，重试构建成功后重新执行断言通过。通过 PowerShell here-string 管道运行一次性 Node.js 检查，源码与离线网页均含无句号文案，且不含原带句号文案；Git 空白检查通过。未运行完整回归、真实浏览器或 Windows 封装，本次仅删除一个标点。

## 2026-10-23 · Endfield 四级极繁工作台重构

- 变更：按 Ark UI 的 endfield / maximal 合约重构启动、空间三视图、曲线、属性、导出和帮助界面。使用灰白竖轨、炭黑停靠区、信号黄切角、双语层级和大型章节编号；启动页采用原创矢量图解与非对称模板。视图、楼层、真实选择驱动标题、取景边界和属性状态；左侧竖轨可键盘定位图稿、工具与组件。底部展示现有工作状态与暂存反馈，跳到画布链接会恢复窄屏画布面板和焦点。界面状态独立于工程、历史与导出。
- 变更：重新编排桌面、短横屏与竖屏；390×844 下两个创建入口均直接可见，991–1250px 且高度不超过 740px 时折叠编辑选项。统一短揭示、视图裁切和控件反馈，减少动态效果时保持静态状态。保留已有约 110% 界面比例、JSON、编辑模型、字体许可与空工程种子；没有新增运行依赖或远程资产。同步内置与外部教程、设计说明和项目上下文。
- 影响文件：src/editor.html、src/editor.css、src/endfield-shell.css、src/ui-shell.js、src/help/content.json、tools/build.mjs、tests/browser-ark-ui.cjs、tests/browser-endfield-workbench.cjs、docs/UI设计说明.md、docs/使用说明.md、docs/使用说明.html、.codex/project-context.md、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。视觉前后对照及本次报告位于 qa/endfield-ui/；属性和实际下载证据更新于 qa/property-inspector/、qa/mesh-export/。
- 验证：npm run build 最终通过，离线页 3,512,809 字节；npm test 全部 17 组通过。首轮发现外壳 data-view 与既有按钮选择器冲突，改用独立 data-workspace-mode 后重新构建并通过整套回归；后续仅去除取景角标的多余边框，最终构建再次通过真实工作台专项。node tests/browser-ark-ui.cjs 通过 14 组宽度/深浅主题、AA 文字对比度、焦点与 Enter、主题/竖轨/工程历史隔离、两种图稿、三视图、属性、导出、帮助及移动面板。node tests/browser-endfield-workbench.cjs 通过 7 组桌面/竖屏/短横屏、390×844 双入口、真实鼠标创建和一次撤销重做、两层小楼三视图与双主题、真实名称输入、竖轨定位、紧凑桌面折叠、跳转链接焦点、减少动态效果、外壳不进入 SVG 和 QA 保存写入/删除抑制；无页面/CSP 异常或在线请求。已逐张查看桌面、390px、844×390、小楼、属性和帮助截图。
- 验证：node tests/browser-property-inspector.cjs 通过真实多选/输入/尺寸/颜色/锁定/历史与 12 组响应式主题；node tests/browser-mesh-export.cjs 通过 PNG/SVG/FBX/OBJ 实际下载、FBX/OBJ 独立读取、三视图/全楼层和窄屏输出。node --check src/ui-shell.js、node --check tests/browser-endfield-workbench.cjs 与 Git 空白检查通过；Node.js/jsdom 离线集成断言通过唯一 ID、空种子、占位符清除、根设计属性和外部教程同步。
- 验证：node .codex/skills/ark-ui-skill/scripts/audit-ark-ui.mjs src 返回 0 errors，保留两项启发式 warnings：运行时生成的组件/属性/帮助节点未出现在静态模板，以及模型/图稿既有颜色字面量较多；相关动态节点由模型回归和 Chrome 操作验证，用户图稿颜色继续独立于界面主题。首次按单个模板/覆盖 CSS 审计时因没有合并共享样式而报缺少响应式/焦点，改为整个 src 目录后完成正确范围审计。npm run manual 因系统 Python 为 Microsoft Store 占位入口失败，使用工作区自带 Python 执行 tools/build-manual.py 成功，生成 8 节及 7 段自包含演示的同步教程；未更改系统 Python 配置。
- 未运行：项目没有独立 lint 命令；未重新封装 Windows 目录版/便携版，未运行已封装 EXE 和手机真机。本次交付源码及离线网页，浏览器检查使用独立 Chrome 上下文。

## 2026-10-23 · 工程图稿新增按钮仅保留加号

- 变更：移除“工程图稿”旁新增按钮的可见“新增”文字，仅保留居中的加号，收为方形信号黄按钮；保留“新增图稿”无障碍名称与悬停提示，点击仍打开新建图稿对话框。
- 影响文件：src/editor.html、src/endfield-shell.css、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 通过。通过 PowerShell here-string 管道运行一次性 Playwright/Chrome 检查，1440/390px 与深浅主题四组均通过：仅显示加号，名称和提示正确，按钮尺寸不小于 40px，加号水平中心误差小于 0.2px，真实点击可打开并关闭新建图稿对话框，无页面异常；截图位于 qa/add-drawing-plus/。未运行完整 npm test、导出检查和 Windows 封装，本次仅修改按钮文案与局部布局。

## 2026-10-23 · 精简启动页文案与句号

- 变更：按用户确认的“仅启动页”范围，删除引导句“把空间与节奏，变成可玩的关卡。”和标题下的“空间图 / 曲线图”；删除 NEXT LEVEL 后的英文句号，以及启动页属性/图稿设置空态中的中文句号。保留版本号小数点和曲线图编辑状态的类型说明。
- 影响文件：src/editor.html、src/app.js、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 通过。通过 PowerShell here-string 管道运行一次性 Playwright/Chrome 检查，1440/390px 与深浅主题四组均通过：启动页各面板与设置中无指定文案和中英文句号，版本号小数点保留；真实点击可创建空间图与曲线图，空间图类型副标题隐藏、曲线图编辑副标题正常，无页面异常。截图位于 qa/startup-copy/。Git 空白检查通过。未运行完整 npm test、导出检查、教程重建和 Windows 封装，本次仅调整启动页文案，未修改教程、编辑模型或导出行为。

## 2026-10-23 · 删除启动页底部说明

- 变更：删除启动页底部“从构思到图稿”和“JSON 工程 · PNG / SVG 图稿 · FBX / OBJ 模型”整块区域，清理对应分隔线、间距、动效与响应式样式，并同步设计说明。
- 影响文件：src/editor.html、src/endfield-shell.css、docs/UI设计说明.md、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 通过。通过 PowerShell here-string 管道运行一次性 Node.js/Playwright/Chrome 检查，构建页面不含两段文字和 welcome-footer 残余样式；1440/390px 下两个创建入口保留、页面无横向溢出，真实点击可创建空间图，无页面异常。Git 空白检查通过。未运行完整 npm test、导出检查或 Windows 封装，本次仅删除启动页说明区及其样式。


## 2026-10-23 · 移除工作台状态行与导航列并精简双语标签

- 变更：移除底部整行“工作状态”、操作消息与工程上下文，以及左侧 LD/ 导航列和对应定位按钮；清理专用样式与事件监听，工作区直接使用释放的宽度与高度。保留隐藏的内部状态节点，既有编辑、保存与暂存流程可继续更新状态而不占据界面空间。
- 变更：将 START、PLAN、ELEVATION、VOLUME、RHYTHM、TOOLS、INSPECTOR、SPACE、CURVE 和启动页品牌小标签中的“/ 中文”后缀移除，只保留英文；主要中文标题、按钮、功能名称及操作说明保留。同步帮助、外部教程、设计说明、项目上下文和既有浏览器专项预期。
- 影响文件：src/editor.html、src/ui-shell.js、src/endfield-shell.css、src/help/content.json、tests/browser-ark-ui.cjs、tests/browser-endfield-workbench.cjs、docs/UI设计说明.md、docs/使用说明.md、docs/使用说明.html、.codex/project-context.md、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 3,507,787 字节；使用工作区 Python 执行 tools/build-manual.py 成功，生成 8 节与 7 段自包含演示的同步教程。npm test 全部 17 组通过。node tests/browser-ark-ui.cjs 通过 14 组宽度/深浅主题、英文小标签与三视图/曲线标题、区域删除、对比度、键盘、主题历史隔离、属性、导出预览、帮助与窄屏面板检查；node tests/browser-endfield-workbench.cjs 通过 7 组桌面/竖屏/短横屏，确认工作区铺满释放空间、两个入口可达、真实鼠标创建和撤销重做、两层小楼三视图与深浅主题、属性名称编辑、紧凑选项和减少动态效果；均无页面异常或在线请求，QA 禁止工程暂存写入与删除。已查看 1440×900 修改前后与 390×844 修改后截图，未见残留空白栏、遮挡或横向溢出；证据在 qa/shell-simplification/ 和 qa/endfield-ui/。
- 验证：node --check 检查 src/ui-shell.js 及两个浏览器专项通过；一次性 Node.js/jsdom 检查通过唯一 ID、隐藏内部状态节点、英文标签、内外帮助同步、空种子及构建占位符清除；Git 空白检查通过。Ark UI 全 src 审计为 0 errors，保留既有两项启发式 warnings：动态生成节点无法由静态模板扫描识别、模型及图稿包含多种既有颜色；本次未改动这些编辑内容。
- 未运行：项目无独立 lint 命令；未执行实际文件下载专项、Windows 重新封装、已封装 EXE 或手机真机验证。本次改动为工作台外壳与文案，导出预览和模型导出自动回归已通过。


## 2026-10-23 · 删除立体图未选中操作提示

- 变更：删除画布底部“点击组件选中 / 按住右键拖动转动视角”提示及其立体视图判断分支；未选中组件时该处留空，选中组件的名称、墙壁正面状态与缩放控件保持原有行为。
- 影响文件：src/app.js、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 通过，离线页 3,507,716 字节。通过 PowerShell here-string 管道运行一次性 Node.js/Playwright/Chrome 专项，源码与构建产物均不含指定提示；1440/390px 与深浅主题四组通过未选中提示清空、真实右键拖动转动视角、工程与历史隔离、选中名称显示、真实点击空白取消选择、缩放控件保留、无横向溢出及页面异常。证据在 qa/solid-hint-removal/，已查看桌面浅色截图。首轮专项错误地假设 Esc 会取消组件选择，实际既有行为保留选择；改为真实点击空白取消选择后通过，未修改编辑器的 Esc 行为。Git 空白检查通过。
- 未运行：完整 npm test、实际导出下载、教程重建与 Windows 封装；本次只删除一处常驻提示文案，教程中的操作说明保留。


## 2026-10-23 · 精简启动卡片说明与缺角装饰

- 变更：删除启动页空间图卡片的“平面 / 立面 / 立体”和曲线图卡片的“阶段 / 事件 / 节奏”，清理对应说明文字样式；卡片继续显示空间图、曲线图名称与创建箭头。删除空间图示意 SVG 内部的竖向虚线。
- 变更：移除两张卡片 01、02 右侧延伸的整条右边框，改为真实裁切的短缺角；上沿在缺角处收住，仅在右上角绘制约 13px 范围内的短斜线，缺角区域不响应按钮点击。深浅主题、悬停和键盘焦点沿用原有行为；同步设计说明。
- 影响文件：src/editor.html、src/editor.css、src/endfield-shell.css、docs/UI设计说明.md、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 3,507,559 字节。node tests/browser-ark-ui.cjs 通过 14 组宽度/深浅主题、布局、文字对比度、键盘、减少动态效果、创建入口、三视图、属性、导出预览与帮助检查。一次性 Node.js/Playwright/Chrome 专项通过 1440×900、1024×600、844×390、390×844、360×800 与深浅主题共 10 组：说明节点及示意图虚线已移除、无整条右边框、缺角尺寸约 13px 且按钮命中区域正确裁切、无横向溢出或页面异常；真实 Tab 焦点和 Enter 创建曲线图、鼠标创建空间图通过。首轮专项对 innerText 换行作了过严假设，改为检查实际标题节点后通过。已查看桌面卡片修改前后细节与 390px 截图，证据位于 qa/startup-card-refinement/。
- 验证：Ark UI 全 src 审计为 0 errors，保留既有两项启发式 warnings：动态节点不在静态模板中、多种既有模型/图稿颜色字面量。Git 空白检查通过。
- 未运行：完整 npm test、实际导出下载、教程重建、Windows 封装与手机真机；本次仅调整启动页 HTML/CSS、原创示意图与设计说明，未修改编辑模型和教程内容。


## 2026-10-23 · 修正启动标题黄线遮挡文字

- 变更：将“选择你的创作起点”上方黄线从英文标题行内元素的绝对定位装饰，改为中文引导区内独立占位的一行，并与标题保留固定间距，避免字体行高及窄屏排版导致黄线遮挡文字。
- 影响文件：src/endfield-shell.css、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 3,507,479 字节。通过 PowerShell here-string 管道执行一次性 Node.js/Playwright/Chrome 专项，1920×1080、1440×900、1280×720、1024×600、844×390、390×844、360×800 与深浅主题共 14 组全部通过：黄线独立参与布局，至中文标题的实测间距均至少 8px，原英文标题绝对定位黄线已移除；无横向溢出，两个入口可见或可滚动到达，390px 下均直接可见，真实创建空间图成功，无页面异常。已查看桌面与 390px 浅色截图，证据在 qa/welcome-accent-spacing/；修改前同尺寸截图沿用上一任务的最终构建截图。
- 验证：Ark UI 全 src 审计为 0 errors，保留既有动态节点静态扫描及模型/图稿颜色字面量两项启发式 warnings；Git 空白检查通过。
- 未运行：完整 npm test、实际导出下载、教程重建、Windows 封装与手机真机，本次仅调整启动页黄线布局与间距。


## 2026-10-23 · 统一启动页图稿设置空状态

- 变更：将启动页“图稿设置”的“先新建一张图稿”改为与“组件属性”完全相同的空状态：使用相同装饰与布局显示“暂无图稿”和“新建或打开图稿”；创建图稿后的设置表单保持原有行为。
- 影响文件：src/app.js、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 最终成功，离线页 3,507,527 字节；首次构建写入 dist/index.html 遇到 UNKNOWN 文件打开错误，重试成功后才执行检查。通过 PowerShell here-string 管道运行一次性 Node.js/Playwright/Chrome 专项，1440/390px 与深浅主题四组全部通过：真实切换组件属性/图稿设置，空状态 HTML、文字和位置尺寸完全相同，切换不改变工程与历史；创建空间图和曲线图后正常显示设置字段，无页面异常。已查看桌面浅色截图，证据在 qa/startup-inspector-empty/。Git 空白检查通过。
- 未运行：完整 npm test、实际导出下载、教程重建和 Windows 封装；本次仅统一无图稿时的提示与现有空状态样式。


## 2026-10-23 · 标题编号改为当前工程图稿顺序

- 变更：画布标题左侧的大号两位编号改为当前图稿在工程下拉列表中的顺序，空间图与曲线图共用 01、02、03……；切换平面、立面和立体视图保持同一个图稿号。新建、复制、删除、撤销重做、导入及暂存恢复后根据当前工程顺序刷新；空工程继续显示 00。编号仅从已有 documents 派生，不写入工程或增加历史记录。同步内置/外部教程、设计说明与项目上下文。
- 影响文件：src/ui-shell.js、src/help/content.json、tests/browser-ark-ui.cjs、tests/browser-document-management.cjs、docs/UI设计说明.md、docs/使用说明.md、docs/使用说明.html、.codex/project-context.md、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 3,507,696 字节；使用工作区 Python 执行 tools/build-manual.py 成功，生成 8 节与 7 段自包含演示的同步教程。node tests/browser-document-management.cjs 通过真实 Chrome 新建、名称编辑、复制/删除、撤销重做、跨图稿类型编号、第二张空间图三视图保持 02、删除前序图稿后的编号更新、JSON 实际下载/导入、窄屏操作与暂存重载；node tests/browser-ark-ui.cjs 通过 14 组宽度/深浅主题及既有键盘、布局、模式、属性、预览/帮助检查，新增空工程 00、第一张空间图三视图均 01、第二张曲线图 02 的断言。均无页面异常或在线请求。
- 验证：一次性 Node.js/Playwright/Chrome 专项通过 30 张混合图稿的真实下拉切换，确认 01/02/10/30 正确显示、第一张曲线图为 01、第一张空间图三视图均为 01、空工程恢复 00，切换不改变图稿数据或撤销数量；QA 抑制工程暂存写入与删除。已查看第一张立体图 01 与第二张曲线图 02 的标题截图，证据在 qa/drawing-number/，管理与界面报告在 qa/ui-refine/ 和 qa/endfield-ui/。
- 验证：node --check 检查 src/ui-shell.js 与两个修改的浏览器专项通过；Ark UI 全 src 审计为 0 errors，保留既有动态节点静态扫描及模型/图稿颜色字面量两项启发式 warnings；Git 空白检查通过。
- 未运行：完整 npm test、图像/模型实际导出专项、Windows 封装和手机真机；本次修改为标题编号派生，已执行对应图稿管理和外壳浏览器检查，JSON 下载/导入在管理专项中实测。


## 2026-10-23 · 移除图稿与组件小标题编号前缀

- 变更：将工程图稿的小标题“01 / DRAWINGS”改为“DRAWINGS”，组件的小标题“03 / COMPONENTS”改为“COMPONENTS”，删除这两处固定数字及其斜杠前缀。
- 影响文件：src/editor.html、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 3,507,686 字节；通过 PowerShell here-string 管道执行一次性 Node.js/jsdom 检查，源码和构建产物中的两个标题文字准确且均不含原编号前缀；Git 空白检查通过。
- 未运行：完整回归、真实浏览器、导出下载、教程重建与 Windows 封装，本次仅删除两处静态标题前缀。


## 2026-10-23 · 精简楼层高度参考标注格式

- 变更：将立体图和立面图的楼层高度标注由“一层 · 0 单位”改为“一层：0”，中点改为冒号并移除单位后缀；所选平面的高度参考提示同步采用“所选平面：高度”。保持楼层名称转义、原有高度数值精度、参考线显示开关、坐标与工程数据；包含高度参考线的图稿导出同步使用新格式。
- 影响文件：src/view-features.js、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 3,507,630 字节；npm test 全部 17 组通过，覆盖旧工程、空间交互、三视图变换、吸附、属性、列表与导出回归。node --check src/view-features.js 和 Git 空白检查通过。
- 验证：通过 PowerShell here-string 管道执行一次性 Node.js/Playwright/Chrome 专项，1440/390px、深浅主题、立面/立体共 8 组通过，楼层显示“一层：0”“二层：320”“地下层：-120.5”，选中偏移平面显示“所选平面：15.75”，工程图稿数据保持一致，无页面异常；真实下载 SVG 并解析验证三个参考标注，PNG 下载与文件签名检查通过，已查看 PNG 成品。证据在 qa/height-reference-labels/。首轮浏览器驱动尝试点击窄屏默认收起的“适应画布”按钮而超时，改为调用已有 fit 命令准备取景后完整专项通过，未修改该折叠行为。
- 未运行：Windows 重新封装、已封装 EXE、手机真机及教程重建；本次仅修改参考标注文本，既有教程没有描述原标签格式。

## 2026-10-23 · 修复启动卡片右侧边框与切角衔接

- 变更：恢复首页空间图卡片的右侧边框，顶端缩短至右上斜角下端，与斜边连续衔接；曲线图卡片同步使用相同边框规则。去掉卡片顶部叠加的 3px 粗线，改为与切角、左右边框一致的 1px 细线，悬停时不再额外生成顶部色条。
- 影响文件：src/endfield-shell.css、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 3,507,712 字节；node tests/browser-ark-ui.cjs 通过 14 组视口/主题、对比度、键盘、减少动态效果及入口操作检查；node tests/browser-endfield-workbench.cjs 通过 7 组桌面/竖屏/横屏布局与真实编辑回归。一次性 Playwright/Chrome 检查覆盖 1440/390px、深浅主题、悬停及焦点，无横向溢出或页面错误，已查看修改前后卡片截图，证据在 qa/start-card-edge/；首次截图驱动的通用选择器匹配两个空间图按钮，改用首页卡片内选择器后专项通过。
- 验证：Ark UI 审计无错误，保留动态 DOM 钩子、既有颜色字面量两类历史启发式提醒；Git 空白检查通过。
- 未运行：npm test 全套模型回归、图稿实际下载、教程重建与 Windows 重新封装；本次仅调整首页卡片 CSS 描边，已运行两组相关真实浏览器回归。

## 2026-10-23 · 将空间显示开关并入三视图工具栏

- 变更：将“显示 / 高度参考线 / 楼梯方向箭头”从独立整行移至平面图、立面图、立体图按钮旁边；宽屏同排显示，吸附、背景和适应画布等操作在工具栏内另排一行。窄屏及低矮紧凑窗口保留编辑选项展开/收起，展开后显示开关在同一工具栏内换行，不挤压视图按钮。曲线图继续隐藏空间专用开关，原有开关状态、图稿数据及撤销行为保持一致。
- 影响文件：src/editor.html、src/endfield-shell.css、docs/UI设计说明.md、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 3,507,990 字节；node tests/browser-ark-ui.cjs 通过 14 组视口/主题及键盘、对比度、减少动态效果和入口操作检查；node tests/browser-endfield-workbench.cjs 通过 7 组布局与真实编辑回归。
- 验证：一次性 Playwright/Chrome 专项通过 1920/1440/1280/1024/990/768/390/360px、深浅主题共 16 组，确认宽屏开关与视图按钮同排、控件无裁切或横向溢出、紧凑展开和收起可用；真实点击两个复选框，校验高度参考线/楼梯箭头场景输出、图稿字段与一次撤销恢复；验证曲线隐藏开关，无页面异常。已查看 1440px 和 390px 成品截图，证据在 qa/view-display-toolbar/。
- 验证：Ark UI 审计无错误，保留动态 DOM 钩子和既有颜色字面量两类历史启发式提醒；Git 空白检查通过。
- 未运行：npm test 全套模型回归、实际图稿下载、教程重建及 Windows 重新封装；本次仅调整工具栏结构与样式，显示开关逻辑未改，现有教程对紧凑窗口展开显示设置的说明仍然适用。

## 2026-10-23 · 移除楼层标题的固定编号

- 变更：将楼层小标题“02 / FLOORS”改为“FLOORS”，移除固定编号与斜杠，与工程图稿和组件标题一致。
- 影响文件：src/editor.html、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功；通过一次性 Node.js/jsdom 检查源码和构建产物，楼层小标题均为 FLOORS 且页面不含“02 / FLOORS”；Git 空白检查通过。
- 未运行：完整回归、真实浏览器、导出下载、教程重建与 Windows 封装；本次仅删除一处静态标题前缀。

## 2026-10-23 · 移除启动卡片缺角斜边描线

- 变更：移除首页空间图及曲线图卡片右上缺角斜边上的细描线，保留缺角轮廓、上边框及从斜角下端开始的右侧边框；悬停时也不再绘制斜边线。
- 影响文件：src/endfield-shell.css、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 3,507,796 字节；一次性 Playwright/Chrome 检查通过 1440/390px、深浅主题共 4 组，保存并查看卡片截图，确认斜边不描线且右边框保留，另检查悬停截图和真实点击创建空间图，无横向溢出或页面错误。前后对比截图通过在隔离浏览器临时恢复旧描线规则生成，证据在 qa/start-card-no-diagonal/。
- 验证：Ark UI 审计无错误，保留动态 DOM 钩子与既有颜色字面量两类历史启发式提醒；Git 空白检查通过。
- 未运行：完整回归、实际图稿下载、教程重建及 Windows 封装；本次仅移除一层卡片装饰描线。

## 2026-10-23 · 统一首页卡片高度并保留错位

- 变更：将首页空间图卡片下边缘上移至与曲线图卡片等高，宽屏下两张卡片顶部位置、曲线图下边缘及原有上下错位保持不变；使用同一错位间距控制空间图下留白和曲线图上留白，紧凑单列及短横屏布局取消该留白，保留原有堆叠和对齐方式。
- 影响文件：src/endfield-shell.css、docs/UI设计说明.md、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 3,508,101 字节；一次性 Playwright/Chrome 专项通过 1920/1440/1280/1024/768/844/390/360px、深浅主题共 16 组，实测两张卡片等高，1440px 与修改前尺寸比较确认两张卡片顶部和曲线图下边缘未变、空间图下边缘上移约 26.4px，宽屏上下错位相等，紧凑布局无额外间距或裁切；真实操作创建空间图和曲线图通过，无页面异常或横向溢出。已查看桌面与竖屏截图，证据在 qa/start-card-equal-height/。
- 验证：node tests/browser-endfield-workbench.cjs 通过 7 组布局及真实编辑回归；Ark UI 审计无错误，保留动态 DOM 钩子和既有颜色字面量两类历史启发式提醒；Git 空白检查通过。
- 未运行：完整模型回归、实际图稿下载、教程重建及 Windows 封装；本次仅调整首页卡片布局间距，已进行相关真实浏览器验证。

## 2026-10-23 · 将全部画布选项压为单行工具栏

- 变更：移除“显示”及其分隔线，将三视图、参考线与箭头、吸附、网格、背景和适应画布等操作保持在同一行；立面范围与侧向选择、创建形状也并入该工具栏，不再额外占行。所有尺寸均不折叠选项，空间不足时仅工具栏内部横向滚动，键盘聚焦自动滚动到控件，保留完整标签和原有选项/撤销行为。1440×1000 下工具栏由约 115.2px 降为 64.6px，释放约 50.6px 给编辑画布。
- 变更：移除旧“编辑选项”展开按钮及其事件/CSS；同步内置帮助、外部使用说明、界面设计说明、项目上下文和相关浏览器检查，新增可复用单行工具栏浏览器验证。
- 影响文件：src/editor.html、src/editor.css、src/endfield-shell.css、src/ui-shell.js、src/help/content.json、docs/使用说明.md、docs/使用说明.html、docs/UI设计说明.md、.codex/project-context.md、tests/browser-toolbar.cjs、tests/browser-ark-ui.cjs、tests/browser-endfield-workbench.cjs、tests/browser-ui-shell.cjs、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：通过本机实际 Python 执行 tools/build-manual.py 成功，生成 8 节同步教程与 7 段离线媒体；npm run build 成功，离线页 3,506,653 字节；npm test 全部 17 组通过。node tests/browser-ark-ui.cjs 与 node tests/browser-endfield-workbench.cjs 通过既有 14 组视口/主题、7 组布局及真实编辑、导出预览、帮助、键盘与减少动态效果检查。
- 验证：node tests/browser-toolbar.cjs 通过 10 种窗口、深浅主题、平面/立面/立体共 60 组，检查全部选项同排、横向滚动不扩张页面、键盘 Tab/Enter 自动显示末尾操作、真实参考线/箭头开关与撤销、创建形状不增加行高、曲线隐藏空间开关、触屏滚动后点击末尾操作；无页面错误或网络请求。已查看桌面、竖屏和创建选项截图，证据在 qa/single-row-toolbar/。首轮创建形状检查使用 selectOption 未先聚焦，未触发浏览器自动滚动；驱动改为真实聚焦并按 ArrowDown 后完整专项通过，应用未为此改动。
- 验证：内置与外部教程内容同步检查、node --check src/ui-shell.js、node --check tests/browser-toolbar.cjs 及 Git 空白检查通过；Ark UI 审计无错误，保留动态 DOM 钩子和既有颜色字面量两类历史启发式提醒。
- 检查限制：node tests/browser-ui-shell.cjs 在后段既有的顶栏按钮触控尺寸断言失败，撤销/重做按钮约 39.6×39.6px、主题按钮宽约 39.6px，低于该测试要求的 44px；本次未修改这些按钮样式，不将该综合检查计为通过。该测试此前的布局、编辑及 PNG/SVG 下载阶段已执行；本次工具栏触屏访问由专项独立通过。
- 未运行：Windows 重新封装、已封装 EXE 与手机真机；本次交付为重新构建的离线网页。

## 2026-10-23 · 统一楼层小标题的斜杠装饰

- 变更：为 FLOORS 补上与 DRAWINGS、TOOLS、COMPONENTS 一致的“//”前缀，复用同一 CSS 规则，确保颜色、间距及字体统一，不恢复已移除的数字编号。
- 影响文件：src/endfield-shell.css、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 3,506,685 字节；一次性 Playwright/Chrome 检查通过 1440/390px、深浅主题共 4 组，比较四个左栏小标题伪元素的内容、颜色、间距和字体，完全一致，无页面错误或横向溢出；已查看楼层标题成品截图，证据在 qa/floor-heading-prefix/。Ark UI 审计无错误，保留动态 DOM 钩子与既有颜色字面量两类历史启发式提醒；Git 空白检查通过。
- 未运行：完整回归、图稿导出、教程重建与 Windows 封装；本次仅将楼层标题加入既有的共享装饰规则。

## 2026-10-23 · 常用工具栏靠右与立面上下文靠左

- 变更：保留三视图切换在左侧，将立面方向、立面显示范围等额外选项移动到三视图之后的左侧区域；创建形状上下文也放入左侧。参考线、楼梯箭头、吸附、网格、背景和适应取景等常用工具选项统一靠右，曲线图隐藏空间开关后常用工具仍靠右。继续保持单行与横向滚动，不增加画布上方占用高度。
- 变更：修复窄屏控件部分可见时浏览器原生聚焦不滚动的问题，聚焦工具栏内控件后仅调整工具栏自身的横向滚动，让控件和焦点完整显示；不改变图稿与撤销记录。同步界面设计说明，并增加宽屏左右分组几何检查。
- 影响文件：src/editor.html、src/endfield-shell.css、src/ui-shell.js、docs/UI设计说明.md、tests/browser-toolbar.cjs、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：最终 npm run build 成功，离线页 3,507,892 字节；node tests/browser-toolbar.cjs 通过 2560px 宽屏的三个视图左右对齐检查及 10 种窗口、深浅主题、三视图共 60 组布局，键盘聚焦、触控、开关撤销、创建形状和曲线访问通过，桌面画布相对双行基线继续增加约 50.6px，无页面异常与网络请求。首轮专项发现新位置的创建形状下拉框聚焦后右侧仍被裁切约 20px，已通过 focusin 处理修复后完整重跑通过。
- 验证：node tests/browser-ark-ui.cjs、node tests/browser-endfield-workbench.cjs 在最终构建上通过，覆盖 14 组主题/视口、7 组布局及真实编辑、键盘、帮助、预览和减少动态效果。一次性 Playwright/Chrome 检查通过立面侧向切换、当前楼层范围及曲线工具栏右对齐；已查看相同视口修改前后的平面/立面工具栏及最终窄屏聚焦截图，证据在 qa/toolbar-alignment/、qa/single-row-toolbar/。
- 验证：node --check src/ui-shell.js、node --check tests/browser-toolbar.cjs、Git 空白检查通过；Ark UI 审计无错误，保留动态 DOM 钩子和既有颜色字面量两类历史启发式提醒。
- 未运行：npm test 全套模型回归、browser-ui-shell.cjs 综合检查、实际图稿下载、教程重建及 Windows 封装；本次调整工具栏布局与焦点滚动，已完成对应真实浏览器回归，既有帮助对单行及聚焦自动滚动的说明仍适用。

## 2026-10-23 · 对齐组件栏图标与名称

- 变更：将左下角组件栏的类型图标与名称分成独立元素，为图标设置固定宽度并居中，使不同符号宽度不再影响同级名称的起点；名称保留单行省略显示，空洞保留子级缩进，选择、双击改名、拖动排序和显示/锁定按钮沿用既有行为。
- 影响文件：src/app.js、src/editor.css、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 3,507,470 字节；node tests/verify-component-list.cjs 通过；node tests/browser-component-list.cjs 单独运行通过真实选择、排序、取消、改名、显示/锁定、自动滚动及深浅主题/窄屏检查。首轮与其他检查并行运行时，长列表自动滚动后的排序断言失败，未改代码单独重跑通过；另在隔离页面临时恢复旧列表结构与布局进行对照，该浏览器回归也通过。
- 验证：一次性 Node.js/Playwright/Chrome 专项覆盖 1440/390px、深浅主题共 4 组和全部 9 类组件，确认同级名称起点一致、图标占位等宽、空洞缩进保留、无横向溢出或页面异常；长名称与分组标记、点击图标选择、双击名称改名、显示按钮及空洞筛选通过。已查看桌面浅色和窄屏深色截图；修改前名称起点相差约 6.52px，修改后差值为 0，证据在 qa/component-icon-alignment/。Git 空白检查通过。
- 未运行：npm test 全套模型回归、图稿实际导出、教程重建与 Windows 重新封装；本次仅调整组件栏标记结构及布局，已运行相关列表与真实浏览器检查。

## 2026-10-23 · 默认开启网格吸附

- 变更：应用启动时默认勾选“网格吸附”，新建图稿沿用当前开关；用户手动关闭后，切换三视图、创建或切换图稿、导入工程均保留关闭状态，重新打开或刷新应用恢复默认开启。网格显示仍独立控制，不批量修改已有组件几何。
- 变更：同步内置帮助、外部使用说明及项目上下文，在既有浏览器网格检查中增加启动和新建图稿默认勾选断言。
- 影响文件：src/editor.html、src/help/content.json、docs/使用说明.md、docs/使用说明.html、.codex/project-context.md、tests/browser-grid-snapping.cjs、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：通过实际 Python 执行 tools/build-manual.py 成功，生成 8 节同步教程及 7 段离线媒体；npm run build 成功，离线页 3,507,945 字节；node tests/verify-grid-snapping.cjs 通过网格创建、移动、尺寸、历史/取消、JSON 与曲线隔离回归。Git 空白检查通过。
- 验证：一次性 Playwright/Chrome 专项通过启动、新建、刷新默认开启，手动关闭后切换三视图、创建曲线和空间图稿、切换图稿、导入工程均不重置开关；检查已有组件几何未改变、网格显示独立，无页面异常，证据在 qa/grid-default/report.json。
- 检查限制：node tests/browser-grid-snapping.cjs 的新增默认状态断言及前段真实绘制、移动、二维尺寸步骤通过，但在第 30 行立体尺寸拖动后“几何必须改变”的断言失败；单独重跑仍失败。隔离副本恢复修改前未勾选状态及原测试显式勾选流程后，同一步骤也失败，确认为当前工作区原有回归问题，本次不将该综合浏览器检查计为通过。
- 未运行：npm test 全套回归、实际导出下载及 Windows 重新封装；本次只调整启动默认值，已完成对应模型与真实浏览器专项检查。

## 2026-10-23 · 将平面创建工具拆为矩形与圆形

- 变更：左侧原“平面”入口拆为独立的“矩形”和“圆形”按钮，使用对应图标与独立选中状态；P 继续选择矩形，Shift 创建正方形，圆形工具拖出椭圆、Shift 创建正圆。矩形和圆形不再显示顶部形状下拉框，空洞保留独立的矩形/椭圆选择。
- 变更：两个工具共用原有平面模型，保留颜色分配、网格/组件吸附、连续创建、预览、取消、单击退出及一次操作一次撤销；圆形仍以 plane + ellipse 保存，兼容既有工程和导出。同步状态提示、悬停说明、内置帮助及外部教程；窄屏点击任一工具后返回画布。
- 影响文件：src/editor.html、src/app.js、src/advanced-interactions.js、src/interactions.js、src/move-snapping.js、src/usage-help.js、src/help/content.json、docs/使用说明.md、docs/使用说明.html、tests/verify-spatial-update.cjs、tests/verify-grid-snapping.cjs、tests/verify-v7.cjs、tests/verify-v9.cjs、tests/verify-v10.cjs、tests/verify-world-move.cjs、tests/browser-ellipse-placement.cjs、tests/browser-toolbar.cjs、tests/browser-world-move.js、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功；使用本机实际 Python 执行 tools/build-manual.py 成功，内置/外部教程同步及构建占位符检查通过；node --check 检查本次应用入口、交互与浏览器专项脚本通过；Git 空白检查通过。最终构建包含工作区同期更新，检查所有顶层源码均早于构建产物。
- 验证：node tests/verify-spatial-update.cjs 通过新增的独立工具创建、形状互不串用、空洞形状保留、撤销/重做、指针取消、切换工具取消、右键/Esc 退出、P 与视图限制检查；最终 npm test 全部 17 组通过。首轮新增键盘检查错误地将事件派发到 document，已修正为画布；后续全套回归遇到工作区同期改为默认开启网格，已让 verify-v9/v10 的自由绘制/组件边吸附用例显式关闭网格，保留原有断言后完整重跑通过，未改变应用默认设置。
- 验证：node tests/browser-ellipse-placement.cjs 通过真实 Chrome 矩形/圆形按钮及激活状态、圆形后切回矩形、P、网格开关下椭圆/正圆首帧轮廓与命中、撤销/重做、JSON 恢复及 390px 深浅主题工具入口检查；已查看桌面正圆与窄屏深色截图，证据在 qa/ellipse-placement/。node tests/browser-toolbar.cjs 通过 60 组视口/主题/视图及键盘、触屏、开关撤销和空洞形状选项检查，证据在 qa/single-row-toolbar/；均无页面错误或在线请求。
- 未运行：Windows 重新封装、已封装 EXE、手机真机及实际 PNG/SVG 下载；本次交付为离线网页与教程更新，三维模型文件由自动回归生成并校验。

## 2026-10-23 · 为圆形工具设置 C 快捷键

- 变更：在画布按 C 选择圆形工具，兼容大小写及既有物理按键处理；左侧圆形按钮显示 C。Ctrl/Command+C 继续复制，Alt+C、属性输入和输入法组合输入不会误切换工具。同步创建教程和 P/C 快捷键说明。
- 影响文件：src/keyboard.js、src/editor.html、src/help/content.json、docs/使用说明.md、docs/使用说明.html、tests/verify-v10.cjs、tests/browser-ellipse-placement.cjs、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：使用本机实际 Python 执行 tools/build-manual.py 成功；npm run build 成功，离线页 3,506,812 字节。node tests/verify-v10.cjs 通过新增的 C/Shift+C、物理按键及缺省 code、Ctrl/Command+C 复制、Alt+C、属性输入和输入法保护检查，以及该组既有回归；node tests/browser-ellipse-placement.cjs 通过真实 Chrome 的 C/Shift+C、按钮激活、Ctrl+C 复制和属性输入隔离，并通过圆形/椭圆创建、撤销/重做、JSON 和窄屏深浅主题检查，无页面错误或在线请求，证据在 qa/ellipse-placement/。
- 验证：按钮标注及内置/外部教程同步检查、node --check src/keyboard.js、node --check tests/verify-v10.cjs、node --check tests/browser-ellipse-placement.cjs、Git 空白检查通过。
- 未运行：npm test 全套回归、实际图片下载和 Windows 重新封装；本次只增加快捷键映射与标注，已运行对应键盘与真实浏览器回归。

## 2026-10-23 · 移除画布四周的装饰断线

- 变更：删除画布外壳的装饰取景框，包括上下刻度短线、左右边线及四角短线；平面、立面、立体与曲线图在深浅主题、宽窄窗口和选中状态下均不再绘制这些装饰。移除对应 HTML、状态及响应式 CSS，同步界面设计说明。
- 影响文件：src/editor.html、src/endfield-shell.css、docs/UI设计说明.md、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 3,506,727 字节；node tests/browser-endfield-workbench.cjs 通过 7 组桌面/竖屏/短横屏布局、真实指针创建与撤销重做、三视图/深浅主题、属性编辑、紧凑工具栏、帮助及导出外壳隔离检查。
- 验证：一次性 Node.js/Playwright/Chrome 专项通过 1440/390px、深浅主题、空间三视图及曲线图共 16 组，确认装饰框无残留、无横向溢出、页面异常或网络请求；选中组件后 SVG 图稿、工程数据与撤销计数保持一致。已查看修改前后平面图、窄屏深色立体图及曲线图截图，证据在 qa/canvas-frame-removal/。源码与构建产物均无 stage-frame 残留。
- 未运行：npm test 全套模型回归、实际导出文件下载、教程重建与 Windows 重新封装；本次仅移除界面装饰层，编辑及导出逻辑未改，既有使用教程没有描述该装饰。

## 2026-10-23 · 更换终末地工作台中文字体

- 变更：中文界面改用与思源黑体同源的 Noto Sans SC 可变字体，以方正字面、清晰直线和真实粗字重匹配现有终末地工业工作台。标题、按钮、属性及内置帮助共用新的中文字体；保留 Saira 英文标签与编号，微软雅黑、苹方等系统字体作为中文缺字回退。画布、图内文字编辑及图稿导出保留原字体，既有图稿排版不变。
- 变更：加入 1,976,648 字节的本地 WOFF2 子集，覆盖 GB2312、现有界面文案与常用标点，共 7,744 个 Unicode 字符，保留 100–900 连续字重；字体及完整 OFL 许可随构建嵌入离线单页。记录上游版本、来源、校验值和子集处理方式，日常构建无需新依赖或在线资源。
- 影响文件：src/editor.css、src/fonts/NotoSansSC-UI.woff2、src/fonts/NotoSansSC-OFL.txt、src/fonts/README.md、tools/build.mjs、THIRD_PARTY_NOTICES.md、.codex/project-context.md、docs/UI设计说明.md、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线单页 6,146,913 字节；npm test 全部 17 组回归通过；node tests/browser-endfield-workbench.cjs 通过 7 组桌面/竖屏/短横屏布局、真实绘制及撤销重做、空间三视图、深浅主题、属性、帮助与外壳导出隔离检查。
- 验证：一次性 Node.js/Playwright/Chrome 专项通过 1440/768/430/390/360px 与深浅主题共 10 组布局，Chrome 实际字形来源确认中文标题、按钮和帮助使用嵌入的 Noto Sans SC，英文使用 Saira，生僻字“龘”回退到系统字体；工程内容、撤销计数和图稿字体保持不变，无页面错误或在线请求。首次字形断言未包含上游字体内部名称的 Thin 后缀，按 Chrome 实际报告修正检查后通过；粗标题实际使用 ExtraBold。已查看桌面修改前后、390px 深色及帮助正文截图，证据在 qa/chinese-fonts/ 和 qa/endfield-ui/。
- 验证：fontTools 检查现有 src/ 文案中文无缺字、字重轴保留 100–900；离线字体嵌入、无残留占位符、完整 OFL 声明及 WOFF2 校验值检查通过；node --check tools/build.mjs 与本次文本文件 Git 空白检查通过。
- 未运行：真实 PNG/SVG 下载、手机真机、外部教程重建和 Windows 重新封装；本次仅调整界面字体及离线资源接入，未改变图稿渲染、用户操作步骤或桌面逻辑。

## 2026-10-23 · 删除保存快捷键后的括号提示

- 变更：删除保存快捷键后的“（首次选择位置，之后快速保存）”，保留 Ctrl＋S / Command＋S；同步 README、内置帮助、外部使用说明与离线网页。
- 影响文件：README.md、src/help/content.json、docs/使用说明.md、docs/使用说明.html、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：使用本机实际 Python 执行 tools/build-manual.py 成功；npm run build 成功，离线页 6,146,425 字节。一次性 Node.js/jsdom 检查确认上述五份内容及产物均不含指定括号提示，内置与外部 HTML 的保存快捷键均保留为 Ctrl＋S / Command＋S。
- 检查限制：Git 空白检查发现 dist/index.html 内嵌字体许可的既有行尾空格，对应 src/fonts/NotoSansSC-OFL.txt 原文；未改动许可证。
- 未运行：完整应用回归、真实浏览器操作、实际图稿导出与 Windows 重新封装；本次仅删除提示文字。

## 2026-10-23 · 移除属性与设置标题旁的箭头

- 变更：删除右侧“属性与设置”标题旁的装饰箭头，以及其基础、选中和曲线模式样式；保留标题、选中时的底边强调色及组件属性/图稿设置切换，同步界面设计说明。
- 影响文件：src/editor.html、src/editor.css、src/endfield-shell.css、docs/UI设计说明.md、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 6,146,470 字节；node tests/browser-endfield-workbench.cjs 通过 7 组布局、真实创建与撤销重做、三视图/深浅主题、属性编辑、紧凑工具栏、帮助和导出外壳隔离检查。
- 验证：一次性 Node.js/Playwright/Chrome 专项通过 1440/390px、深浅主题、选中空间组件及曲线图共 8 组，确认箭头无残留、标题布局正常、无横向溢出、页面异常或网络请求；两个属性标签均可切换，工程数据和撤销计数不变。已查看桌面浅色空间图及窄屏深色曲线图标题截图，证据在 qa/inspector-arrow-removal/。源码与构建产物无 inspector-mark 残留；本次相关文件 Git 空白检查通过。
- 未运行：npm test 全套模型回归、实际导出文件下载、教程重建和 Windows 重新封装；本次仅删除标题装饰与对应样式，既有使用教程未描述该箭头。

## 2026-10-23 · 缩小显示与隐藏圆点

- 变更：缩小组件列表和楼层列表的显示／隐藏圆点，分别以原尺寸的 65% 和 55% 显示，使两处圆点统一约为 8px；保留实心／空心状态、原按钮排版与完整点击范围。使用独立标记只缩放圆点，不缩放按钮、锁定图标或组件类型图标。
- 影响文件：src/app.js、src/editor.css、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线页 6,146,643 字节；node tests/verify-component-list.cjs 通过列表选择、排序、历史、取消、锁定、宿主空洞及图标操作回归；node --check src/app.js 通过。
- 验证：一次性 Node.js/Playwright/Chrome 专项通过 1440/390px、深浅主题共 4 组，圆点显示宽度约 7.87px；在各组布局中临时恢复原始按钮标记对照，按钮宽高完全一致。真实点击圆点与按钮边缘、Enter 激活及组件可见性撤销／重做通过，无横向溢出、页面异常或网络请求；已查看桌面浅色和窄屏深色截图，证据在 qa/visibility-dots/。
- 检查限制：包含 dist/index.html 的 Git 空白检查报告内嵌字体许可的既有行尾空格，来源为 src/fonts/NotoSansSC-OFL.txt 原文，未修改许可证；本次源文件和日志的空白检查通过。
- 未运行：npm test 全套模型回归、实际图稿导出、教程重建和 Windows 重新封装；本次只调整可见性圆点的显示尺寸，操作含义保持一致。

## 2026-10-26 · 修复平面图与立面图角点尺寸被强制等比缩放

- 变更：平面图、立面图的“大小”（R）角点拖动改为分别调整两个可见的本地尺寸，单向拖动只改对应尺寸；矩形与实体包围框保持对角点固定。覆盖平面、椭圆、墙壁、楼梯、爬梯、旋转楼梯立面和独立空洞，保留宿主带动空洞及三视图共用几何。按住 Shift 可等比缩放，拖动中松开可恢复独立调整；圆弧和旋转楼梯的圆形约束保留。
- 变更：组件边吸附沿实际角点拖动方向求解，不再把单轴拖动转换成双轴等比缩放；网格仅取整发生变化的尺寸。Shift 等比且开启网格时，以较长的所改尺寸取整格，其余尺寸保留原比例。沿用 Ctrl/Command 暂停吸附、一次拖动一次撤销、Esc/指针取消/切换工具与视图恢复原状态的流程。同步状态提示、工具说明、内置与外部教程，将新增专项接入 npm test 及验证规则。
- 影响文件：src/interactions.js、src/transform-snapping.js、src/grid-snapping.js、src/app.js、src/usage-help.js、src/help/content.json、package.json、tests/verify-orthographic-size.cjs、tests/browser-orthographic-size.cjs、.codex/project-context.md、.codex/rules/validation.md、docs/使用说明.md、docs/使用说明.html、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：新增 node tests/verify-orthographic-size.cjs 在修复前构建上按预期复现单轴角点拖动被等比缩放的失败；重新构建后专项通过所有角点方向、旋转/倾斜面、实体与空洞/非单位 cut 坐标、Shift 动态切换、网格/Ctrl/组件吸附、固定点、撤销重做/取消、JSON 和三视图检查。node tests/verify-transform-snapping.cjs 通过；最终 npm test 全部 18 组回归通过。
- 验证：使用本机运行时 Python 执行 tools/build-manual.py 成功，同步 8 节教程和 7 段离线媒体；npm run build 成功，离线页 6,147,812 字节。node --check 检查本次交互、吸附、应用入口及两个新增专项脚本通过；本次源码、配置与日志的 Git 空白检查通过。
- 验证：node tests/browser-orthographic-size.cjs 最终通过真实 Chrome 平面/立面及网格开关共 4 组鼠标检查，验证横向与纵向角点独立尺寸、Ctrl、Shift、一次历史、撤销重做、Esc、宿主空洞有效性、三视图与 JSON 同步；无页面异常或网络请求。首轮脚本因重复选行触发重命名、连续放大后角点超出画布及网格半格浮点临界值而失败，调整测试选取、预留取景范围及非临界拖动量后重跑通过，未放宽尺寸断言。已查看平面自由尺寸、立面网格尺寸截图，证据在 qa/orthographic-size/。
- 未运行：实际 PNG/SVG 下载、窄屏/手机真机及 Windows 重新封装；本次交付源码和离线网页，自动回归已检查 SVG 不含编辑手柄及 FBX/OBJ 文件读取。

## 2026-10-26 · 顶点编辑改为终末地工业定位节点

- 变更：组件顶点由蓝色圆点改为骨白切角方形、炭黑描边和中心定位点，悬停及当前顶点使用信号黄，当前顶点额外显示对角角标。边中点改为较轻的菱形加号，区分移动顶点与插入顶点；路线的直接节点沿用同套样式。按画布横纵比例分别换算，缩放及窗口变化时保持固定屏幕尺寸，顶点和中点均提供直径 20px 的透明命中区，顶点优先于重叠中点命中。使用骨白隔离线适应深浅图稿及组件填色，保留原有编辑、取消及一次操作一次历史的流程。
- 影响文件：src/app.js、src/interactions.js、src/editor.css、tests/browser-vertex-handles.cjs、docs/UI设计说明.md、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线单页 6,149,223 字节；npm test 全部 18 组回归通过。node --check 检查 src/app.js、src/interactions.js 和 tests/browser-vertex-handles.cjs 通过；本次源码、设计说明、浏览器专项及日志的 Git 空白检查通过。
- 验证：node tests/browser-vertex-handles.cjs 通过真实 Chrome 的 23 项检查，包含 1440/390px、深浅界面及黑白画布共 8 组布局，平面/椭圆/墙壁/空洞/楼梯/旋转楼梯及三视图路线共 13 组节点命中，平面和路线 2 组真实拖动、插入、删除、撤销重做及 Esc 取消；同时检查悬停、选中角标、透明边缘命中、缩放尺寸、无横向溢出及 SVG 不含编辑手柄，无页面异常或在线请求。已查看桌面浅色、窄屏深色及节点局部截图，证据在 qa/vertex-handles/。首轮专项在撤销重做后未重新选择组件而等待节点超时，已按现有撤销会清空选择的行为修正测试并重跑通过，未改变应用历史语义。
- 未运行：实际 PNG/SVG 下载、手机真机及 Windows 重新封装；本次更新源码与离线网页，导出隔离已通过实际浏览器生成的 SVG 和既有自动回归检查。
- 检查范围：完整 npm test 结果针对本次 6,149,223 字节的顶点样式构建；验证期间工作区出现切割功能相关的同期源码与构建更新，已在同期重新生成的网页上再次运行 node tests/browser-vertex-handles.cjs，23 项顶点专项仍全部通过。切割功能自身不在本次改动和验证结论内。

## 2026-10-26 · 以逐点切割替换空洞工具

- 变更：工具栏原“空洞”按钮替换为“切割”（O）。先选中一个未锁定、可见的平面（含圆形）或墙壁，鼠标变为剪刀；在组件内部或边缘连续取点，显示折线、首点和悬停预览，并吸附组件边缘。点击首点闭合、边到边贯穿或折线形成可分区域时，自动拆分为两个或多个独立组件，保留全部材料并选中结果；拆分组件不沿用原编组，可分别移动和编辑。支持平面、墙面、墙体占地及立体图中对应的可见正面/背面，侧向无可见面积、楼梯/文字/路线、多选或锁定时禁用。Backspace/Delete 退一个点，Esc/右键/指针取消/切换工具、视图、图稿或组件取消未完成切割；整次切割一次撤销/重做。
- 变更：新增材料平面图细分，处理凹轮廓、折线交叉、多个分区及原有开口。闭合切割的外块将内部轮廓保存在自身 cutouts 中，不额外增加组件列表条目；旧版宿主空洞继续兼容。内轮廓随宿主尺寸、移动、复制、旋转、楼层、JSON 与三视图保持一致，并复用 PNG/SVG/FBX/OBJ 几何；隐藏开口在可归属时保留，切割跨越隐藏开口时拒绝并回滚。墙体占地允许三点以上多边形，面积/体积校验防止丢失材料。切割预览不进入导出，内轮廓也不作为独立空洞参与画布命中。
- 变更：同步工具提示、内置及外部说明，使用真实 Chrome 切割和独立移动过程替换旧打洞 GIF 与封面；新增模型及浏览器专项，将切割回归接入 npm test，更新构建拼装清单和项目验证入口。
- 影响文件：src/cutting-geometry.js、src/cutting.js、src/app.js、src/interactions.js、src/advanced-interactions.js、src/curved-geometry.js、src/render.js、src/keyboard.js、src/editor.html、src/usage-help.js、src/help/content.json、src/help/build.gif、src/help/build.png、tools/build.mjs、package.json、tests/verify-cutting.cjs、tests/browser-cutting.cjs、tests/verify-spatial-update.cjs、.codex/project-context.md、.codex/rules/validation.md、docs/使用说明.md、docs/使用说明.html、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。保留工作区同期顶点样式修改。
- 验证：npm run build 成功；最终离线网页 6,990,505 字节，正式种子仍为空工程。使用本机 bundled Python 执行 tools/build-manual.py 成功，输出 8 节说明与 7 段自包含媒体。npm test 全部 19 组通过；最终可见正面/背面取点投影调整后，重新构建并运行 node tests/verify-cutting.cjs 和 node tests/browser-cutting.cjs 均通过。
- 验证：切割专项覆盖闭合/贯穿/交叉多块、凹形三块、开口分割和再次切割、圆形及正反面、面积/体积守恒、隐藏开口保留与失败回滚、组件独立选择/尺寸/复制、跨图稿内轮廓 ID、JSON、撤销重做、取消和工具限制；FBX/OBJ 自动回归保留独立 Three.js 读取检查。
- 验证：真实 Chrome 检查剪刀指针、边缘与首点吸附、逐点预览、闭合后独立拖移、凹形一次三块、墙体立面、历史与四种取消方式、390px 工具访问；实际下载 PNG/SVG/OBJ/FBX，无页面异常或在线请求。独立 Three.js 读取本次两个模型下载文件，各为 2 个网格、64 个三角面，总体积约 4,200,000，与原组件一致；Pillow 检查 1200×800 PNG 的切口为白色、内外材料颜色一致，教程 GIF 为 960px 宽、8 个有效帧。已查看闭合预览、切下组件移动、三块拆分及窄屏截图，证据在 qa/cutting/。首轮像素采样落在网格线上，改取非网格点后通过，未调整图像输出。
- 验证：node --check 检查新增两个源码模块和两个专项脚本通过；本次源码、构建清单、包配置和协作入口的 git diff --check 通过（仅提示既有 LF/CRLF 转换）。
- 未运行：Windows 重新封装/桌面 EXE 冒烟、手机真机；本次交付源码、离线网页和同步教程。旧版斜向开口组件暂不支持切割，普通开口墙壁需在与其一致的切割面操作；复杂轮廓超出 2500 段时提示减少取点。

## 2026-10-26 · 简化切割工具画布提示

- 变更：将切割工具的画布提示改为“左键取点，Backspace退点，Esc取消”。
- 影响文件：src/app.js、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build、node --check src/app.js 通过；Node.js 检查离线网页包含新提示且不再包含原提示。未运行全套回归与浏览器操作，本次仅替换一处提示文案。

## 2026-10-26 · 修复多选后单击已选组件无法切回单选

- 变更：平面图、立面图和立体图中，多选后单击其中一个组件，松开鼠标即只选中该组件；编组及宿主附属关系仍沿用整组选择。按下时暂时保留多选，使平面图、立面图中的拖动继续整体移动；Ctrl/Command 增减选择、Alt 拖动复制和 Shift 保留选择沿用原行为。锁定组件或立体图使用世界手柄时也可通过单击收起多选，拖过点击阈值则不误判为单击；Esc、指针取消、失焦和切换工具/视图不提交待处理的单击选择。选择变化不修改工程几何或增加撤销记录。
- 变更：同步内置帮助及外部教程，说明多选后的单击和整体拖动；新增真实浏览器专项，并把三视图单击、取消、锁定、编组及整体拖动断言加入现有空间回归。
- 影响文件：src/app.js、src/help/content.json、tests/verify-spatial-update.cjs、tests/browser-multi-selection.cjs、docs/使用说明.md、docs/使用说明.html、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：新增空间回归断言在修复前构建上复现“单击后仍保留两个组件”的失败；npm run build 成功，最终离线网页 6,990,934 字节；node tests/verify-spatial-update.cjs 及最终 npm test 全部 19 组回归通过，包含创建退出、宿主空洞、世界移动/旋转、楼层、多选属性、列表、切割及模型导出检查。
- 验证：node tests/browser-multi-selection.cjs 最终通过真实 Chrome 的 7 组检查，覆盖三视图 Ctrl 多选后点击任一成员、微小指针抖动、锁定/编组、Esc/指针取消/失焦、立体图拖过点击阈值、平面/立面整体拖动及相对位置、一次撤销/重做、Alt 整体复制、真实拖框多选后单击，以及 390px 画布；无页面异常或在线请求。已查看立体图选择截图，证据在 qa/multi-selection/。
- 验证：使用本机 bundled Python 执行 tools/build-manual.py 成功，同步 8 节教程和 7 段自包含媒体；Node.js 检查内置帮助、外部 Markdown/HTML 均包含新选择说明。node --check 检查应用入口及两个专项脚本通过；本次源码、帮助、测试及日志的 Git 空白检查通过（仅提示既有 LF/CRLF 转换）。
- 未运行：实际 PNG/SVG 下载、手机真机、Windows 重新封装和桌面 EXE 冒烟；本次交付源码、同步教程与离线网页，未修改导出和桌面代码。

## 2026-10-26 · 精简组件操作并改为逐层上移下移

- 变更：左下组件列表移除“复制”“粘贴”，仅保留等宽两列的“编组”“解组”；右侧组件属性底部移除“编辑顶点”“复制副本”“编组”“解组”，保留“上移”“下移”“锁定编辑”和“删除”。顶点工具栏、复制粘贴快捷键及右键复制副本继续可用，右键排序菜单同步显示“上移”“下移”。
- 变更：原置顶/置底改为每次在当前楼层及筛选列表的同级组件间调整一位；连续或分散多选保留所选组件的相对顺序。宿主携带附属空洞的列表行，空洞只在同一宿主内排序，锁定成员或附属空洞阻止整次调整；不改变几何、编组、宿主关系及其他楼层或筛选外组件的槽位。沿用一次操作一次撤销、失败回滚和 JSON 保存，边界不产生空历史。同步内置与外部教程。
- 影响文件：src/editor.html、src/editor.css、src/app.js、src/component-list.js、src/help/content.json、tests/verify-component-list.cjs、tests/verify-world-move.cjs、tests/browser-solid-properties.cjs、docs/使用说明.md、docs/使用说明.html、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：新增 node tests/verify-component-list.cjs 逐层断言在旧构建上复现“一次直接置顶”的失败；npm run build 成功，离线单页 6,991,608 字节，正式种子仍为空工程；重建后的列表专项及最终 npm test 全部 19 组通过，覆盖单选/连续与分散多选、编组、边界、筛选/楼层、锁定、宿主空洞、失败回滚、撤销重做、JSON 和曲线标注排序。
- 验证：一次性 Node.js/Playwright/Chrome 专项通过 1440/390px 与深浅主题共 4 组，确认两处按钮、两列编组布局、真实编组/解组与逐层按钮点击、几何不变及撤销重做；确认右键菜单同义、Ctrl+C/V、复制副本及左侧顶点工具可用，无横向溢出、页面异常或在线请求。已查看桌面浅色及窄屏深色截图，证据在 qa/component-actions/。node tests/browser-component-list.cjs 和 node tests/browser-solid-properties.cjs 均通过，覆盖真实拖排、宿主空洞、自动暂存、宽窄主题和立体属性编辑。
- 验证：全套回归首轮因旧测试仍查找已移除的属性顶点/副本按钮失败，已改查左侧顶点工具、保留的排序按钮及实际复制命令限制。立体属性浏览器脚本首轮因默认网格将 32 取整为 100 失败，已在该自由数值编辑场景显式关闭网格后重跑通过，保留原数值断言；应用网格行为未改。
- 验证：使用本机 bundled Python 执行 tools/build-manual.py 成功，同步 8 节教程与 7 段自包含媒体；Node.js 检查离线按钮、空种子、旧排序文案移除及教程同步通过。node --check 检查本次应用入口、列表模块及三个修改的测试脚本通过；本次源文件、测试、Markdown 教程与日志的 Git 空白检查通过（仅提示既有 LF/CRLF 转换）。
- 未运行：实际 PNG/SVG 下载、手机真机、Windows 重新封装与桌面 EXE 冒烟；本次交付源码、离线网页和同步教程，未改导出或桌面代码。

## 2026-10-26 · 移除规整为矩形功能

- 变更：移除平面、墙壁及宿主空洞属性面板中的“规整为矩形”按钮，同时删除 regularize 命令分发及实现函数。
- 影响文件：src/app.js、src/ui-features.js、dist/index.html、dist/build-report.json、logs/CHANGELOG.md。
- 验证：npm run build 成功，离线单页 6,991,077 字节；node tests/verify-property-inspector.cjs、node tests/verify-spatial-update.cjs、node tests/verify-cutting.cjs 均通过；node --check src/app.js 和 node --check src/ui-features.js 通过；一次性 Node.js 检查确认源码及构建网页不再含 regularize 或按钮文案；git diff --check 通过（仅既有 LF/CRLF 转换提示）。
- 未运行：全套 npm test、真实浏览器交互、实际导出下载及 Windows 重新封装/桌面冒烟；本次仅移除单个属性操作，已运行相关三组回归，未改模型、导出或桌面实现。
