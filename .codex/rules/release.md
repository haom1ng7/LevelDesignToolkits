# 教程、离线构建与发布规则

适用于帮助内容、网页构建和源码归档。

- 内置帮助和外部教程共用 `src/help/content.json`。修改内容/媒体后运行 `npm run build` 与 `npm run manual`，检查引用的 GIF、PNG 封面均存在，HTML 能离线使用。
- 网页交付入口是 `dist/index.html`。正式种子应为空；教学媒体与脚本应嵌入页面，构建占位符不应残留。
- 项目只交付浏览器网页；发布附件包含离线 HTML、网页 ZIP、源码 ZIP、教程、示例和 SHA256 校验值。
- 源码归档由 `tools/release_files.py` 明确枚举，日志使用 `logs/CHANGELOG.md`。核对所有归档输入与测试夹具，不要求不存在的可选配置文件。
- 源码包仅附带 hooks 测试所需的 `.codex/hooks/changelog.cjs`，不分发本机绝对路径的 hook 配置。若交付要求包含完整开发配置，显式调整清单并核对引用配套。
- `tools/package-release.py` 只生成本地附件与 SHA256 校验；`tools/prepare-github.py` 只整理上传目录。是否已上传、部署或创建远端仓库，要以实际外部结果为准。
- 原创代码采用 MIT，保留 `LICENSE` 和 `THIRD_PARTY_NOTICES.md`。构建将项目 MIT、Three.js MIT 和字体 OFL 全文嵌入离线 HTML；字体源文件的 OFL 声明同时保留在 `src/fonts/`。
