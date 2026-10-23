# 项目协作规则

开始工作前阅读 [.codex/README.md](.codex/README.md)。涉及应用实现、构建或打包时，再读 [项目上下文](.codex/project-context.md)，了解项目结构与构建方式。

## 按任务读取 rules 和 skills

实施改动前读取 `.codex/rules/development.md`。涉及下表范围时，再读取对应规则；这些 Markdown 规则通过本入口接入，按需加载。

| 范围 | 规则文件 |
| --- | --- |
| 模型、几何、编辑器交互、曲线、导出 | `.codex/rules/editor-behavior.md` |
| 构建、回归、浏览器/桌面验证、测试结果 | `.codex/rules/validation.md` |
| 教程、离线网页、Windows 封装、源码归档 | `.codex/rules/release.md` |

项目 skills 集中维护在 `.codex/skills/`。任务匹配时，按下表路径读取相应 `SKILL.md` 并执行；即使当前客户端的技能列表没有列出它们，也按本入口加载，不要求为每个任务读取全部 skills。

| Skill | 使用场景 |
| --- | --- |
| [level-studio-edit](.codex/skills/level-studio-edit/SKILL.md) | 新增/修改编辑功能、修复模型或交互缺陷 |
| [level-studio-verify](.codex/skills/level-studio-verify/SKILL.md) | 构建验证、回归选择、浏览器/导出检查与失败定位 |
| [level-studio-package](.codex/skills/level-studio-package/SKILL.md) | 同步教程、构建离线网页、封装 Windows 和检查本地发布附件 |

## 功能变更必须记录日志

- 每次新增功能、修改已有功能、修复缺陷或改变界面/交互行为，都必须在同一任务中向 `logs/CHANGELOG.md` **追加**记录，完成后才能给出最终答复。
- 日志写明日期（Asia/Shanghai）、实际改变的行为、影响文件以及本次真实执行的验证；未运行的检查注明“未运行”及原因，不得沿用历史检查结果。
- 同一任务的多个功能变化应分别写清，可合并在一条记录中。保留已有内容，不覆盖或改写历史条目，不用占位内容代替说明。
- 单纯阅读、分析和未改变功能的文档修改无需新增功能日志；修改开发工具、hooks 或协作机制时也应记录。
- 日志固定使用 **`logs/CHANGELOG.md`**，在已有历史记录后追加。

追加格式：

```markdown
## YYYY-MM-DD · 变更标题

- 变更：具体说明新增、调整或修复后的行为。
- 影响文件：列出主要文件或目录。
- 验证：实际运行的命令和结果；未执行时说明原因。
```

项目 hooks 配置见 `.codex/hooks.json`，工作原理与首次启用步骤见 `.codex/hooks/README.md`。即使 hooks 尚未受信任、被禁用或未执行，仍须遵守本规则。
