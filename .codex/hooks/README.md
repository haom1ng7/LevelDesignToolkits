# 功能变更日志 hooks

配置入口是 [../hooks.json](../hooks.json)，日志目标固定为项目根目录的 `logs/CHANGELOG.md`。实现使用 Node.js 内置模块，无需安装 npm 依赖，也不依赖 Git。

## 首次启用

根据 [OpenAI 官方 Hooks 文档](https://learn.chatgpt.com/docs/hooks#review-and-trust-hooks)，项目 `.codex/` 配置层和非托管 hook 都需要受信任；新的或修改后的 hook 定义在审阅并信任前会被跳过。

在支持 hooks 的 Codex CLI 中打开本项目，通过 `/hooks` 审阅并信任这三项 hook；需要时重新打开会话，让配置被重新加载。不能仅凭文件存在认定已经启用。未启用期间，根目录 `AGENTS.md` 中的日志要求仍然适用。

当前命令使用本项目在 Windows 上的绝对脚本路径，因此从项目子目录启动也能执行；移动项目后需同步修改 `hooks.json` 中的三处命令并重新审阅信任。运行环境需能找到 `node`。

## 执行方式

1. `SessionStart`：提示项目日志规则。
2. `UserPromptSubmit`：在用户回合开始时，保存受监控文件的 SHA-256 和当前日志正文。
3. `Stop`：对比新增、修改、删除的文件；发现变更但未追加完整日志时，返回 `decision: "block"`，让 Codex 继续补写日志。补齐后再次检查即可结束。

受监控范围：`src/`、`desktop/`、`data/`、`tools/`、`tests/`、`dist/`、`package.json`、`package-lock.json`、`AGENTS.md`、`.codex/hooks.json`、`.codex/hooks/`、`.codex/rules/` 和 `.codex/skills/`。依赖目录、构建暂存、Git 元数据、Python 缓存及符号链接不递归扫描。仅改普通说明文档不会要求新增日志；规则和 skills 的变更属于开发流程变更，需要记录。

判断依据是受监控文件的内容变化，因此源码格式整理或只重建产物也可能要求写一条记录。hook 检查是否追加了含日期、变更、影响文件、验证的条目；具体描述是否准确仍由 Codex 按项目规则负责。写入一条日志后继续修改功能时，应同步补全该条记录。

基线保存在操作系统临时目录 `level-diagram-changelog-hooks/`，按项目路径和会话 ID 隔离，不进入项目产物。检查不通过或回合中断时保留基线，避免自动继续时把尚未记入日志的修改当成旧内容；成功结束后清除该会话的基线。临时目录被清理、在回合中途首次启用或 hook 执行失败时，自动核对可能不可用，仍需遵守 `AGENTS.md`。

## 日志格式

只在末尾追加，不改写已有记录：

```markdown
## YYYY-MM-DD · 变更标题

- 变更：实际改变的行为及原因。
- 影响文件：主要文件或目录。
- 验证：本次实际执行的检查和结果，或未运行及原因。
```

## 验证

在项目根目录运行：

```sh
node --test tests/changelog-hooks.test.cjs
```

测试在独立临时目录中模拟 hook 事件和文件变更，不修改应用工程；覆盖缺日志阻止结束、追加后放行、继续回合保留基线、纯文档、文件新增/删除及会话隔离。
