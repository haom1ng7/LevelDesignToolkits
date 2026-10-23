# 教程、离线构建与发布规则

适用于帮助内容、网页构建、Windows 封装和源码归档。

- 内置帮助和外部教程共用 `src/help/content.json`。修改内容/媒体后运行 `npm run build` 与 `npm run manual`，检查引用的 GIF、PNG 封面均存在，HTML 能离线使用。
- 网页交付入口是 `dist/index.html`。正式种子应为空；教学媒体与脚本应嵌入页面，构建占位符不应残留。
- 桌面主进程位于 `desktop/main.cjs`，封装使用构建网页并注入固定暂存键。维护现有隔离设置、外部导航和网络拦截。
- `npm run package:portable` 会构建网页、目录版和便携版；不要把仅生成网页描述为已生成或验证了桌面程序。
- 封装前核对 `tools/package-desktop.mjs` 的文档复制清单。当前已知清单中的两张截图可能缺失，应按任务补齐实际资源或修正过时清单。
- `npm run desktop` 直接加载 `desktop/index.html`，而网页构建只写 `dist/`；检查页面准备步骤，不把该命令默认视作可运行的开发服务器。
- 源码归档由 `tools/release_files.py` 明确枚举。当前清单仍引用根目录 `CHANGELOG.md`，日志已在 `logs/CHANGELOG.md`；归档任务中应检查这个路径和 `.gitignore`、`.gitattributes` 等缺件。
- `.codex/` 和 `AGENTS.md` 当前未纳入源码发布清单；如交付要求包含开发配置，显式调整清单，并使其中引用的脚本/测试完整配套，避免顺带发布本机绝对路径或临时状态。
- `tools/package-release.py` 只生成本地附件与 SHA256 校验；`tools/prepare-github.py` 只整理上传目录。是否已上传、部署或创建远端仓库，要以实际外部结果为准。
- 保留 `LICENSE`、`THIRD_PARTY_NOTICES.md` 和第三方许可文件；本项目不是默认采用 MIT 等模板的开源项目。
