'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { handle } = require('../.codex/hooks/changelog.cjs');

const ENTRY = '\n## 2026-10-22 · 调整编辑器交互\n\n' +
  '- 变更：调整选择行为并保留撤销。\n' +
  '- 影响文件：src/app.js。\n' +
  '- 验证：已运行针对性回归并通过。\n';

function fixture(t) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-changelog-test-'));
  const root = path.join(temporary, 'workspace');
  const options = { root, stateDir: path.join(temporary, 'state') };
  function write(file, text) {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text, 'utf8');
  }
  write('src/app.js', 'original behavior');
  write('logs/CHANGELOG.md', '# 历史记录\n');
  t.after(() => {
    const target = path.resolve(temporary);
    assert.equal(path.dirname(target), path.resolve(os.tmpdir()));
    assert(path.basename(target).startsWith('studio-changelog-test-'));
    fs.rmSync(target, { recursive: true, force: true });
  });
  return {
    root, write,
    event(name, session = 'session-a', extra = {}) {
      return handle({ hook_event_name: name, session_id: session, cwd: root, ...extra }, options);
    },
    append(text = ENTRY) {
      fs.appendFileSync(path.join(root, 'logs/CHANGELOG.md'), text, 'utf8');
    },
  };
}

test('SessionStart 提示正确日志目录，不提前捕获用户回合的基线', t => {
  const f = fixture(t);
  assert.match(f.event('SessionStart').hookSpecificOutput.additionalContext, /logs\/CHANGELOG\.md/);
  f.write('src/app.js', 'external change before prompt');
  f.event('UserPromptSubmit');
  assert.deepEqual(f.event('Stop'), {});
});

test('功能变化缺少本轮日志时阻止结束，stop_hook_active 不跳过检查', t => {
  const f = fixture(t);
  f.event('UserPromptSubmit');
  f.write('src/app.js', 'new behavior');
  const result = f.event('Stop');
  assert.equal(result.decision, 'block');
  assert.match(result.reason, /src\/app\.js/);
  assert.match(result.reason, /logs\/CHANGELOG\.md/);
  assert.equal(f.event('Stop', 'session-a', { stop_hook_active: true }).decision, 'block');
});

test('追加完整日志后放行，下一用户回合获得新基线', t => {
  const f = fixture(t);
  f.event('UserPromptSubmit');
  f.write('src/app.js', 'new behavior');
  f.append();
  assert.deepEqual(f.event('Stop'), {});
  f.event('UserPromptSubmit');
  f.write('src/app.js', 'second behavior');
  assert.equal(f.event('Stop').decision, 'block');
});

test('自动继续、会话恢复和新提示均保留尚未记入日志的变更', t => {
  const f = fixture(t);
  f.event('UserPromptSubmit');
  f.write('src/app.js', 'pending behavior');
  assert.equal(f.event('Stop').decision, 'block');
  f.event('SessionStart', 'session-a', { source: 'resume' });
  f.event('UserPromptSubmit');
  assert.equal(f.event('Stop').decision, 'block');
  f.append();
  assert.deepEqual(f.event('Stop'), {});
});

test('纯文档变更、只读回合和已还原的功能改动无需日志', t => {
  const f = fixture(t);
  f.event('UserPromptSubmit');
  f.write('docs/notes.md', 'documentation');
  f.write('src/app.js', 'temporary behavior');
  f.write('src/app.js', 'original behavior');
  assert.deepEqual(f.event('Stop'), {});
  f.event('UserPromptSubmit');
  assert.deepEqual(f.event('Stop'), {});
});

test('检测文件新增与删除', t => {
  const f = fixture(t);
  f.event('UserPromptSubmit');
  f.write('src/new-feature.js', 'new feature');
  fs.unlinkSync(path.join(f.root, 'src/app.js'));
  const result = f.event('Stop');
  assert.equal(result.decision, 'block');
  assert.match(result.reason, /src\/new-feature\.js/);
  assert.match(result.reason, /src\/app\.js/);
});

test('旧日志及不完整的新条目不能代替本轮完整记录', t => {
  const f = fixture(t);
  f.append();
  f.event('UserPromptSubmit');
  f.write('src/app.js', 'new behavior');
  assert.equal(f.event('Stop').decision, 'block');
  f.append('\n## 2026-10-22 · 缺少验证\n\n- 变更：新的行为。\n- 影响文件：src/app.js。\n');
  assert.equal(f.event('Stop').decision, 'block');
});

test('改写历史正文后即使有完整条目也不作为合法追加', t => {
  const f = fixture(t);
  f.event('UserPromptSubmit');
  f.write('src/app.js', 'new behavior');
  f.write('logs/CHANGELOG.md', '# replaced history\n' + ENTRY);
  assert.equal(f.event('Stop').decision, 'block');
});

test('不同会话的日志基线相互隔离', t => {
  const f = fixture(t);
  f.event('UserPromptSubmit', 'session-a');
  f.write('src/app.js', 'first behavior');
  f.append();
  f.event('UserPromptSubmit', 'session-b');
  assert.deepEqual(f.event('Stop', 'session-a'), {});
  f.write('src/app.js', 'second behavior');
  assert.equal(f.event('Stop', 'session-b').decision, 'block');
});

test('开发规则和 hooks 本身的改动也要求日志', t => {
  const f = fixture(t);
  f.event('UserPromptSubmit');
  f.write('.codex/hooks.json', '{"hooks":{}}');
  f.write('AGENTS.md', 'new project rule');
  assert.equal(f.event('Stop').decision, 'block');
  f.append();
  assert.deepEqual(f.event('Stop'), {});
});

for (const relative of [
  '.codex/rules/development.md',
  '.codex/skills/local-feature/SKILL.md',
  '.codex/skills/local-feature/agents/openai.yaml',
]) {
  test(`规则和技能内容修改及删除要求日志：${relative}`, t => {
    const f = fixture(t);
    f.write(relative, 'original rule or skill');
    f.event('UserPromptSubmit');
    f.write(relative, 'updated rule or skill');
    const updated = f.event('Stop');
    assert.equal(updated.decision, 'block');
    assert(updated.reason.includes(relative));
    f.append();
    assert.deepEqual(f.event('Stop'), {});
    f.event('UserPromptSubmit');
    fs.unlinkSync(path.join(f.root, relative));
    assert.equal(f.event('Stop').decision, 'block');
  });
}

test('缺失基线明确提示，缺失会话标识报错', t => {
  const f = fixture(t);
  assert.match(f.event('Stop').systemMessage, /缺少本轮文件基线/);
  assert.throws(() => f.event('UserPromptSubmit', ''), /session_id/);
});

test('实际命令行接受 stdin JSON，在项目子目录输出有效 hook JSON', t => {
  const f = fixture(t);
  const script = path.resolve(__dirname, '../.codex/hooks/changelog.cjs');
  const result = spawnSync(process.execPath, [script], {
    cwd: path.join(f.root, 'src'), encoding: 'utf8',
    input: JSON.stringify({ hook_event_name: 'SessionStart', session_id: 'stdin-smoke' }),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).hookSpecificOutput.hookEventName, 'SessionStart');
});
