# Codex 项目工作区

本目录集中维护关卡设计工具箱的项目上下文、协作规则、技能和 hooks。持久指引入口为根目录 [AGENTS.md](../AGENTS.md)。

## 目录与职责

```text
.codex/
├── README.md             导航与加载约定
├── project-context.md    项目架构、源码入口、命令与快照缺件
├── rules/                按任务读取的工程规范
├── skills/               三个项目工作流及其 agents/openai.yaml
├── hooks.json            Codex 生命周期 hooks 配置
└── hooks/                日志检查实现与启用说明
```

| 内容 | 入口与加载方式 |
| --- | --- |
| 持久协作指引 | [AGENTS.md](../AGENTS.md)：要求先读本页，按任务读取规则和技能 |
| 项目架构与命令 | [project-context.md](project-context.md)：涉及应用实现、构建或打包时阅读 |
| 工程规则 | [源码维护](rules/development.md)、[编辑器行为](rules/editor-behavior.md)、[验证](rules/validation.md)、[发布](rules/release.md)：经 AGENTS.md 接入 |
| 项目技能 | 下表中的 SKILL.md：由 AGENTS.md 按任务明确读取 |
| 日志 hooks | [hooks.json](hooks.json)：Codex 原生配置，执行需审阅并信任；详见 [启用与验证说明](hooks/README.md) |
| 变更记录 | [logs/CHANGELOG.md](../logs/CHANGELOG.md)：只在历史记录后追加 |

## 按任务选择技能

| 任务 | 技能入口 |
| --- | --- |
| 新增或修改编辑功能、修复模型/几何/交互 | [level-studio-edit](skills/level-studio-edit/SKILL.md) |
| 选择回归、定位测试失败、验证浏览器/导出 | [level-studio-verify](skills/level-studio-verify/SKILL.md) |
| 同步教程、生成离线网页、封装 Windows 和整理附件 | [level-studio-package](skills/level-studio-package/SKILL.md) |

按需读取相应技能，不为每个任务加载全部内容。技能的界面元数据保留默认自动选择策略，但能否出现在客户端技能列表中，取决于客户端实际发现的路径。

## 加载约定

- `rules/*.md` 是本项目的工程规范，经 AGENTS.md 的读取指引生效；它们与控制命令执行权限的原生 `.rules` 文件用途不同。
- 本项目将技能集中维护在 `.codex/skills/`，通过 AGENTS.md 中的明确路径读取执行。[当前官方技能发现文档](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills)列出的项目扫描路径为 `.agents/skills/`；不把本项目的指引加载表述为已经确认的原生自动发现。
- `hooks.json` 使用[官方 hooks 配置](https://learn.chatgpt.com/docs/hooks)。项目配置层和 hook 定义受信任后才会自动执行，不能仅凭文件存在认定已启用；日志规则始终由 AGENTS.md 要求执行。

## 维护与验证

功能、工具、规则、技能或 hooks 变化，须在同一任务中追加 `logs/CHANGELOG.md`，写明实际变更、影响文件和本次验证；完整格式统一见 AGENTS.md。

调整目录时同步检查 AGENTS.md、Markdown 链接、hook 监控范围和测试。hooks 当前使用本机绝对脚本路径，移动项目后还需更新 hooks.json 并重新审阅信任。

本目录集成验证无需安装 npm 依赖：

```sh
node --test tests/changelog-hooks.test.cjs
```

应用构建和回归命令见项目上下文及验证规则，按本次改动范围选择。
