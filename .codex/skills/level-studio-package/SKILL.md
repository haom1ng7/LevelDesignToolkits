---
name: level-studio-package
description: "在关卡设计工具箱项目同步内置/外部教程、生成离线单页、封装 Windows 目录版或便携版、整理源码和本地发布附件时使用。处理资源清单与缺件，不将本地打包视为已部署或已上传。"
---

# 构建关卡设计工具箱离线产物

按用户需要生成网页、教程、Windows 程序或本地发布附件。先读 [发布规则](../../rules/release.md)，只执行与所需交付物相关的步骤。

## 检查输入

检查 `package.json` 的实际脚本、锁文件与运行时。核对帮助媒体、桌面复制清单、源码归档路径和许可证，不把历史检查记录当作当前缺件已经解决的证据。

当前源码归档脚本可能仍引用根目录 `CHANGELOG.md`，而实际日志是 `logs/CHANGELOG.md`；桌面文档清单也包含可能缺失的两张截图。遇到缺件时先定位用途，在打包任务范围内补齐必需资源或修正过时清单，不用空文件假装完整。

## 按交付物构建

| 交付物 | 命令及主要输出 |
| --- | --- |
| 离线网页 | `npm run build` → `dist/index.html` |
| 同步教程 | `npm run manual` → `docs/使用说明.md`、`docs/使用说明.html`；内置内容变化时也重建网页 |
| Windows 程序 | `npm run package:portable` → `.build/desktop/` 与 `.build/portable/` |
| 发布附件和校验值 | `python -X utf8 tools/package-release.py` → `release/`，需要先有桌面产物 |
| 源码上传目录 | `python -X utf8 tools/prepare-github.py` → 新的 `release-upload/`，脚本不覆盖已有仓库目录 |

系统 `python` 不可用时使用实际可用的 Python 3 路径，不为此改写用户全局配置。构建工具首次下载可能需要网络，按当前环境的权限流程执行。

## 检查与交付

依据 [验证规则](../../rules/validation.md) 检查空种子、离线帮助、实际导出和目标程序启动；确认归档清单包含必要的运行资源与许可。若交付开发配置，检查 `.codex/`、`AGENTS.md` 和其测试的引用配套，不能把本机路径直接当作跨机器配置。

报告真实生成的路径和检查结果。构建本地附件不代表远端上传或站点部署；外部发布只有在用户请求相应动作时执行。修改构建、清单或教程行为后按 [AGENTS.md](../../../AGENTS.md) 追加日志。
