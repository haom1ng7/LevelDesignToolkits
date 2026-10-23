'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');

const ROOT = path.resolve(__dirname, '../..');
const LOG = 'logs/CHANGELOG.md';
const WATCHED = [
  'src', 'desktop', 'data', 'tools', 'tests', 'dist',
  'package.json', 'package-lock.json', 'AGENTS.md',
  '.codex/hooks.json', '.codex/hooks', '.codex/rules', '.codex/skills',
];
const EXCLUDED = new Set(['node_modules', '.git', '.build', '__pycache__']);
const REMINDER = '本项目要求：新增/修改功能、修复缺陷或调整开发流程后，必须在本轮向 logs/CHANGELOG.md 追加记录，包含日期、变更、影响文件、验证。仅阅读或纯文档修改无需记录。参见 AGENTS.md。';

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function snapshot(root) {
  const files = {};
  function visit(relative) {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) return;
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) return;
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(absolute).sort()) {
        if (!EXCLUDED.has(name)) visit(path.join(relative, name));
      }
    } else if (stat.isFile()) {
      files[relative.split(path.sep).join('/')] = digest(fs.readFileSync(absolute));
    }
  }
  for (const relative of WATCHED) visit(relative);
  return files;
}

function readLog(root) {
  const file = path.join(root, LOG);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function hasEntry(text) {
  return text.split(/(?=^## )/m).some(entry =>
    /^## \d{4}-\d{2}-\d{2}\s+·\s+\S.+/m.test(entry) &&
    ['变更', '影响文件', '验证'].every(label =>
      new RegExp('^- ' + label + '：\\s*\\S.+$', 'm').test(entry)));
}

function context(eventName) {
  return { hookSpecificOutput: { hookEventName: eventName, additionalContext: REMINDER } };
}

function handle(event, options = {}) {
  const root = options.root || ROOT;
  const stateDir = options.stateDir || path.join(os.tmpdir(), 'level-diagram-changelog-hooks');
  const eventName = event.hook_event_name;
  if (!['SessionStart', 'UserPromptSubmit', 'Stop'].includes(eventName)) return {};
  if (typeof event.session_id !== 'string' || !event.session_id) {
    throw new Error('Hook event requires session_id; cannot track this session.');
  }
  const stateFile = path.join(stateDir, digest(root + '\0' + event.session_id) + '.json');
  const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : null;
  const writeState = value => {
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(value), 'utf8');
  };

  if (eventName === 'SessionStart') {
    // SessionStart only reminds. UserPromptSubmit captures the actual turn baseline.
    return context(eventName);
  }
  if (eventName === 'UserPromptSubmit') {
    // Keep unfinished work across Stop continuations, interruptions and compaction.
    if (!state) writeState({ files: snapshot(root), changelog: readLog(root) });
    return context(eventName);
  }
  if (!state) {
    return { systemMessage: '变更日志 hook 缺少本轮文件基线，无法自动核对；如有功能变更，请按 AGENTS.md 手动确认 logs/CHANGELOG.md 已追加记录。' };
  }

  const current = snapshot(root);
  const changed = [...new Set([...Object.keys(state.files), ...Object.keys(current)])]
    .filter(file => state.files[file] !== current[file]).sort();
  if (changed.length) {
    const changelog = readLog(root);
    const appended = changelog.startsWith(state.changelog)
      ? changelog.slice(state.changelog.length) : '';
    if (!hasEntry(appended)) {
      const shown = changed.slice(0, 20).join('、');
      return {
        decision: 'block',
        reason: `检测到本轮文件变更：${shown}${changed.length > 20 ? ' 等' : ''}。请保留 logs/CHANGELOG.md 原有内容，并在末尾追加“## YYYY-MM-DD · 标题”及“- 变更：…”、“- 影响文件：…”、“- 验证：…”三项真实记录，再结束本轮。此检查使用文件内容哈希，不依赖 Git；不要用占位日志通过检查。`,
      };
    }
  }
  // A new user turn gets a fresh baseline; an unchanged Stop retry can end normally.
  fs.unlinkSync(stateFile);
  return {};
}

function main() {
  try {
    const event = JSON.parse(fs.readFileSync(0, 'utf8'));
    process.stdout.write(JSON.stringify(handle(event)) + '\n');
  } catch (error) {
    process.stderr.write('Changelog hook failed: ' + error.message + '\n');
    process.exitCode = 1;
  }
}

module.exports = { handle, main };
if (require.main === module) main();
