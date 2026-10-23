# Generates the three robot-app artboards from one shared stylesheet.
from pathlib import Path

CSS = r"""
    x-dc { display: block; }
    body { margin: 0; background: #f1f1ee; font-family: "Barlow", "Noto Sans SC", "Microsoft YaHei", sans-serif; color: #1c1c1c; }
    a { color: #1c1c1c; text-decoration: none; } a:hover { color: #000; }
    .app * { box-sizing: border-box; }
    .app { --ink: #1c1c1c; --smoke: #1b1c1e; --paper: #f1f1ee; --line: #d9d9d3; --muted: #84847e; --action: #f8d34d; --notify: #ff7d1a; --danger: #d9302c; --success: #13cf70;
      --t-gather: #2a84b4; --t-collect: #13a85e; --t-haul: #8a5cf6; --t-patrol: #06a2a2;
      position: relative; width: 390px; height: 844px; overflow: hidden; background: var(--paper); font-family: "Barlow", "Noto Sans SC", "Microsoft YaHei", sans-serif; color: var(--ink); font-variant-numeric: tabular-nums; display: flex; flex-direction: column; }
    .app .scene { position: absolute; inset: 0; pointer-events: none; background:
      repeating-linear-gradient(90deg, rgba(28,28,28,.045) 0 1px, transparent 1px 78px),
      repeating-linear-gradient(0deg, rgba(28,28,28,.045) 0 1px, transparent 1px 78px); }
    .app .top { position: relative; padding: 54px 20px 0; display: flex; align-items: center; gap: 10px; }
    .app .crumb { font: 700 12px/1 "Noto Sans SC", sans-serif; letter-spacing: .06em; color: #4a4a46; }
    .app .crumb i { font-style: normal; font-family: "Barlow"; font-weight: 800; color: #a6a6a0; margin-right: 5px; }
    .app .title { font: 900 26px/1.1 "Noto Sans SC", sans-serif; letter-spacing: .02em; }
    .app .title small { display: block; margin-top: 5px; font: 700 11px/1 "Barlow"; letter-spacing: .2em; color: var(--muted); }
    .app .chip { height: 26px; padding: 0 9px; display: inline-flex; align-items: center; gap: 6px; border-radius: 13px; background: #fff; border: 1px solid var(--line); font: 700 12px/1 "Barlow"; color: #3a3a36; }
    .app .chip svg { width: 14px; height: 14px; }
    .app .body { position: relative; flex: 1; padding: 0 20px; overflow: hidden; }

    /* 全息面板：机器人的表情就是状态 */
    .app .holo { position: relative; margin-top: 16px; height: 252px; background: var(--smoke); border-radius: 8px; overflow: hidden; color: #fff; }
    .app .holo::before { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 6px); pointer-events: none; }
    .app .holo .lab { position: absolute; left: 14px; top: 12px; display: flex; align-items: center; gap: 8px; font: 700 11px/1 "Noto Sans SC", sans-serif; letter-spacing: .12em; color: #c9c9c2; }
    .app .holo .lab::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--action); box-shadow: 0 0 8px var(--action); }
    .app .holo .id { position: absolute; right: 14px; top: 12px; font: 800 12px/1 "Barlow"; letter-spacing: .14em; color: #8f8f88; }
    .app .holo .face { position: absolute; left: 50%; top: 36px; transform: translateX(-50%); width: 170px; height: 128px; }
    .app .holo .face svg { width: 100%; height: 100%; display: block; filter: drop-shadow(0 0 6px rgba(248,211,77,.7)); }
    .app .holo .mood { position: absolute; left: 50%; top: 170px; transform: translateX(-50%); white-space: nowrap; font: 700 12px/1 "Noto Sans SC", sans-serif; letter-spacing: .2em; color: var(--action); }
    .app .holo .stat { position: absolute; left: 14px; right: 14px; bottom: 12px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .app .holo .stat span { display: block; font: 700 10px/1 "Noto Sans SC", sans-serif; letter-spacing: .1em; color: #8f8f88; }
    .app .holo .stat b { display: block; margin-top: 5px; font: 800 17px/1 "Barlow Semi Condensed"; color: #fff; }
    .app .holo .stat b em { font-style: normal; color: var(--success); }

    /* 当前任务 */
    .app .cur { margin-top: 12px; background: #fff; border: 1px solid var(--line); padding: 14px 16px 14px; position: relative; }
    .app .cur::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--t-gather); }
    .app .cur .h { display: flex; align-items: center; gap: 8px; }
    .app .cur .h b { font: 700 16px/1.2 "Noto Sans SC", sans-serif; }
    .app .cur .h .ty { font: 700 11px/1 "Noto Sans SC", sans-serif; letter-spacing: .08em; color: #fff; background: var(--t-gather); padding: 3px 6px; }
    .app .cur .h .eta { margin-left: auto; font: 700 12px/1 "Barlow"; color: var(--muted); }
    .app .cur .bar { position: relative; height: 8px; margin-top: 12px; background: #e6e6e1; }
    .app .cur .bar i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--action); }
    .app .cur .nums { display: flex; justify-content: space-between; margin-top: 8px; font: 600 12px/1 "Barlow"; color: #4a4a46; }
    .app .cur .nums b { font-weight: 800; font-size: 14px; color: var(--ink); }

    /* 快捷行动：圆形仪器按钮 */
    .app .quick { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
    .app .quick span { display: grid; justify-items: center; gap: 6px; font: 600 11px/1 "Noto Sans SC", sans-serif; color: #4a4a46; }
    .app .quick i { width: 52px; height: 52px; border-radius: 50%; background: #fff; border: 1px solid var(--line); display: grid; place-items: center; }
    .app .quick i svg { width: 22px; height: 22px; }
    .app .quick i.warn { border: 2px solid var(--danger); }

    /* 任务列表 */
    .app .sh { display: flex; align-items: baseline; gap: 8px; margin-top: 18px; }
    .app .sh b { font: 900 15px/1 "Noto Sans SC", sans-serif; }
    .app .sh small { font: 700 11px/1 "Barlow"; letter-spacing: .14em; color: var(--muted); }
    .app .sh a { margin-left: auto; font: 700 12px/1 "Noto Sans SC", sans-serif; color: #4a4a46; }
    .app .list { margin-top: 10px; background: #fff; border: 1px solid var(--line); }
    .app .row { position: relative; display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; gap: 10px; align-items: center; min-height: 58px; padding: 10px 12px 10px 16px; }
    .app .row + .row { border-top: 1px solid #ecece8; }
    .app .row::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--c, #c9c9c2); }
    .app .row .pri { font: 800 15px/1 "Barlow"; letter-spacing: -.06em; color: #fff; -webkit-text-stroke: .9px #1c1c1c; }
    .app .row .pri.hi { color: var(--action); -webkit-text-stroke: 0; }
    .app .row .nm { font: 700 14px/1.2 "Noto Sans SC", sans-serif; }
    .app .row .nm small { display: block; margin-top: 3px; font: 500 11px/1 "Noto Sans SC", sans-serif; color: var(--muted); }
    .app .row .st { font: 700 11px/1 "Noto Sans SC", sans-serif; padding: 4px 8px; border-radius: 10px; background: #ecece8; color: #4a4a46; white-space: nowrap; }
    .app .row .st.go { background: var(--action); color: var(--ink); }
    .app .row .st.wait { background: transparent; border: 1px solid var(--line); }
    .app .row.done { background: var(--smoke); color: #fff; }
    .app .row.done .nm { color: #fff; }
    .app .row.done .nm small { color: #8f8f88; }
    .app .row.done .stamp { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--action); display: grid; place-items: center; }
    .app .row.done .stamp svg { width: 14px; height: 14px; }
    .app .row.done .ghost { position: absolute; right: 52px; top: 50%; transform: translateY(-50%); font: 800 34px/1 "Barlow Semi Condensed"; color: transparent; -webkit-text-stroke: 1px rgba(248,211,77,.5); letter-spacing: .04em; pointer-events: none; }
    .app .row.pending { background: #f4f4f1; }
    .app .row.pending .nm { color: #6b6b66; }
    .app .row .drag { width: 14px; height: 14px; display: grid; gap: 3px; align-content: center; }
    .app .row .drag i { height: 2px; background: #c2c2bc; }

    /* 底部页签 */
    .app .tabs { position: relative; height: 78px; padding: 0 10px 14px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid var(--line); background: #fff; }
    .app .tabs span { display: grid; justify-items: center; align-content: center; gap: 5px; font: 600 11px/1 "Noto Sans SC", sans-serif; color: #84847e; position: relative; }
    .app .tabs span svg { width: 22px; height: 22px; }
    .app .tabs span.on { color: var(--ink); }
    .app .tabs span.on::before { content: ""; position: absolute; top: 0; left: 22px; right: 22px; height: 3px; background: var(--action); }
    .app .tabs span .dot { position: absolute; top: 12px; right: 26px; width: 8px; height: 8px; background: var(--notify); transform: rotate(45deg); }

    /* 任务页 */
    .app .filters { display: flex; gap: 6px; margin-top: 14px; flex-wrap: wrap; }
    .app .filters span { height: 30px; padding: 0 12px; border-radius: 15px; display: flex; align-items: center; gap: 6px; border: 1px solid var(--line); background: #fff; font: 600 12px/1 "Noto Sans SC", sans-serif; color: #4a4a46; }
    .app .filters span.on { background: var(--ink); color: #fff; border-color: var(--ink); }
    .app .filters span i { width: 8px; height: 8px; }
    .app .grp { display: flex; align-items: center; gap: 8px; margin-top: 16px; font: 700 12px/1 "Noto Sans SC", sans-serif; letter-spacing: .1em; color: #4a4a46; }
    .app .grp::before { content: ""; width: 4px; height: 14px; background: var(--action); }
    .app .grp b { font: 800 12px/1 "Barlow"; color: var(--muted); }
    .app .grp.g2::before { background: #c9c9c2; }
    .app .grp.g3::before { background: var(--ink); }
    .app .row .mini { position: absolute; left: 16px; right: 12px; bottom: 0; height: 3px; background: #ecece8; }
    .app .row .mini i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--action); }
    .app .fab { position: absolute; right: 20px; bottom: 96px; height: 48px; padding: 0 18px 0 6px; border-radius: 24px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.18); display: flex; align-items: center; gap: 10px; font: 700 14px/1 "Noto Sans SC", sans-serif; }
    .app .fab i { width: 36px; height: 36px; border-radius: 50%; background: var(--ink); display: grid; place-items: center; }
    .app .fab i svg { width: 16px; height: 16px; }

    /* 派遣页 */
    .app .back { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid #3a3a36; display: grid; place-items: center; }
    .app .back svg { width: 16px; height: 16px; }
    .app .step { margin-left: auto; font: 800 13px/1 "Barlow"; letter-spacing: .1em; color: var(--muted); }
    .app .step b { color: var(--ink); }
    .app .card { margin-top: 14px; background: #fff; border: 1px solid var(--line); padding: 14px 16px; }
    .app .card .k { font: 700 11px/1 "Noto Sans SC", sans-serif; letter-spacing: .12em; color: var(--muted); }
    .app .card .v { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
    .app .card .v b { font: 900 22px/1.1 "Noto Sans SC", sans-serif; }
    .app .card .v .ty { font: 700 11px/1 "Noto Sans SC", sans-serif; color: #fff; background: var(--t-gather); padding: 4px 7px; }
    .app .card .v .qty { margin-left: auto; font: 800 22px/1 "Barlow Semi Condensed"; }
    .app .pr { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 12px; }
    .app .pr span { height: 40px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid var(--line); font: 700 13px/1 "Noto Sans SC", sans-serif; color: #4a4a46; background: #f7f7f4; }
    .app .pr span b { font: 800 15px/1 "Barlow"; letter-spacing: -.06em; color: #fff; -webkit-text-stroke: .9px #1c1c1c; }
    .app .pr span.on { background: var(--ink); color: #fff; border-color: var(--ink); }
    .app .pr span.on b { color: var(--action); -webkit-text-stroke: 0; }
    .app .map { position: relative; margin-top: 12px; height: 196px; background: #242526; border-radius: 6px; overflow: hidden; }
    .app .map svg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .app .map .tag { position: absolute; padding: 3px 7px; font: 700 11px/1 "Noto Sans SC", sans-serif; color: #fff; background: rgba(28,28,28,.85); }
    .app .map .tag.y { background: var(--action); color: var(--ink); }
    .app .map .dist { position: absolute; right: 10px; bottom: 10px; font: 700 11px/1 "Barlow"; letter-spacing: .1em; color: #c9c9c2; }
    .app .bots { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
    .app .bot { position: relative; background: #fff; border: 1px solid var(--line); padding: 10px 10px 10px; text-align: center; }
    .app .bot .f { width: 44px; height: 34px; margin: 0 auto; }
    .app .bot .f svg { width: 100%; height: 100%; display: block; }
    .app .bot b { display: block; margin-top: 6px; font: 800 13px/1 "Barlow"; letter-spacing: .06em; }
    .app .bot small { display: block; margin-top: 4px; font: 600 10px/1 "Noto Sans SC", sans-serif; color: var(--muted); }
    .app .bot.on { background: var(--smoke); color: #fff; border-color: var(--smoke); }
    .app .bot.on small { color: #c9c9c2; }
    .app .bot.on::after { --len: 9px; --c: var(--action); content: ""; position: absolute; inset: 3px; pointer-events: none; background:
      conic-gradient(from 0deg at var(--len) var(--len), transparent 75%, var(--c) 0) 0 0,
      conic-gradient(from 90deg at calc(100% - var(--len)) var(--len), transparent 75%, var(--c) 0) 100% 0,
      conic-gradient(from 270deg at var(--len) calc(100% - var(--len)), transparent 75%, var(--c) 0) 0 100%,
      conic-gradient(from 180deg at calc(100% - var(--len)) calc(100% - var(--len)), transparent 75%, var(--c) 0) 100% 100%;
      background-size: 45% 45%; background-repeat: no-repeat; }
    .app .bot.off { opacity: .55; }
    .app .est { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; margin-top: 12px; background: var(--line); border: 1px solid var(--line); }
    .app .est div { background: #fff; padding: 10px 12px 11px; }
    .app .est span { display: block; font: 700 10px/1 "Noto Sans SC", sans-serif; letter-spacing: .1em; color: var(--muted); }
    .app .est b { display: block; margin-top: 6px; font: 800 18px/1 "Barlow Semi Condensed"; }
    .app .est b small { font: 700 11px/1 "Barlow"; color: var(--muted); margin-left: 2px; }
    .app .ctas { position: absolute; left: 20px; right: 20px; bottom: 28px; display: flex; gap: 10px; }
    .app .cta { height: 52px; border-radius: 26px; display: flex; align-items: center; gap: 10px; padding: 0 22px 0 8px; font: 700 15px/1 "Noto Sans SC", sans-serif; }
    .app .cta i { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; }
    .app .cta i svg { width: 16px; height: 16px; }
    .app .cta.primary { flex: 1; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.18); }
    .app .cta.primary i { background: var(--ink); }
    .app .cta.secondary { background: var(--ink); color: #fff; padding: 0 18px; }
"""

FACE_WORK = """<svg viewBox="0 0 170 128" fill="#f8d34d"><path d="M34 22l14-10v6l-8 6 8 6v6z"></path><path d="M136 22l-14-10v6l8 6-8 6v6z"></path><rect x="20" y="40" width="130" height="6"></rect><rect x="27" y="50" width="116" height="6"></rect><rect x="34" y="60" width="102" height="6"></rect><rect x="41" y="70" width="88" height="6"></rect><rect x="48" y="80" width="74" height="6"></rect><rect x="55" y="90" width="60" height="6"></rect><rect x="62" y="100" width="46" height="6"></rect><rect x="69" y="110" width="32" height="6"></rect><rect x="76" y="120" width="18" height="6"></rect></svg>"""


def bot_face(color, eyes):
    return (f'<svg viewBox="0 0 44 34" fill="{color}">{eyes}'
            '<rect x="6" y="16" width="32" height="3"></rect><rect x="10" y="21" width="24" height="3"></rect>'
            '<rect x="14" y="26" width="16" height="3"></rect><rect x="18" y="31" width="8" height="3"></rect></svg>')


EYES_HAPPY = '<path d="M10 6l6-4v3l-3 2 3 2v3z"></path><path d="M34 6l-6-4v3l3 2-3 2v3z"></path>'
EYES_IDLE = '<rect x="11" y="6" width="6" height="3"></rect><rect x="27" y="6" width="6" height="3"></rect>'
EYES_SLEEP = '<rect x="9" y="7" width="8" height="2"></rect><rect x="27" y="7" width="8" height="2"></rect>'

ICON_STATUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="13" rx="2"></rect><path d="M9 10h2M13 10h2M8 21h8"></path></svg>'
ICON_TASKS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h2M9 6h11M4 12h2M9 12h11M4 18h2M9 18h11"></path></svg>'
ICON_MAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"></path><circle cx="12" cy="10" r="2"></circle></svg>'
ICON_SET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h10M18 17h2"></path><circle cx="16" cy="7" r="2"></circle><circle cx="8" cy="12" r="2"></circle><circle cx="16" cy="17" r="2"></circle></svg>'
CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="#f8d34d" stroke-width="3"><path d="M5 12l5 5 9-10"></path></svg>'


def tabs(on):
    def cls(k):
        return ' class="on"' if on == k else ''
    dot = '' if on == 'tasks' else '<i class="dot"></i>'
    return f"""
  <div class="tabs">
    <span{cls('home')}>{ICON_STATUS}状态</span>
    <span{cls('tasks')}>{ICON_TASKS}任务{dot}</span>
    <span{cls('map')}>{ICON_MAP}地图</span>
    <span>{ICON_SET}设置</span>
  </div>"""


def shell(inner, h=844):
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700;800&family=Barlow+Semi+Condensed:wght@600;700;800&family=Noto+Sans+SC:wght@400;500;700;900&display=swap">
  <style>{CSS}  </style>
</helmet>
<div class="app" id="board">
  <div class="scene"></div>
{inner}
</div>
</x-dc>
<script data-dc-script data-props='{{"$preview":{{"width":390,"height":{h}}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
"""


HOME = f"""
  <div class="top">
    <div><div class="crumb"><i>//</i>远程作业</div><div class="title" style="margin-top:8px">小机 MK-07<small>FIELD UNIT · 旧矿道 B2</small></div></div>
    <span class="chip" style="margin-left:auto"><svg viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" stroke-width="2"><rect x="3" y="7" width="16" height="10" rx="1.5"></rect><path d="M21 10v4"></path><rect x="5" y="9" width="9" height="6" fill="#13cf70" stroke="none"></rect></svg>78%</span>
    <span class="chip"><svg viewBox="0 0 24 24" fill="#1c1c1c"><path d="M4 18h3v-5H4zM9 18h3V9H9zM14 18h3V5h-3z"></path><path d="M19 18h2V3h-2z" fill="#c9c9c2"></path></svg></span>
  </div>
  <div class="body">
    <div class="holo">
      <div class="lab">工作中 · 采集</div>
      <div class="id">MK-07</div>
      <div class="face">{FACE_WORK}</div>
      <div class="mood">正在干活 · 别担心</div>
      <div class="stat"><div><span>电量</span><b><em>78%</em> · 约 3h</b></div><div><span>信号</span><b>良好</b></div><div><span>背包</span><b>64 / 120</b></div></div>
    </div>
    <div class="cur">
      <div class="h"><span class="ty">采集</span><b>澄砂 ×120</b><span class="eta">剩余约 12 分</span></div>
      <div class="bar"><i style="width:53%"></i></div>
      <div class="nums"><span>已采 <b>64</b></span><span>目标 120</span></div>
    </div>
    <div class="quick">
      <span><i><svg viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" stroke-width="2"><path d="M5 12l7-7 7 7M12 5v14"></path></svg></i>召回</span>
      <span><i><svg viewBox="0 0 24 24" fill="#1c1c1c"><path d="M7 5h4v14H7zM13 5h4v14h-4z"></path></svg></i>暂停</span>
      <span><i><svg viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" stroke-width="2"><path d="M4 8h4l2-3h4l2 3h4v11H4z"></path><circle cx="12" cy="13" r="3"></circle></svg></i>看一眼</span>
      <span><i class="warn"><svg viewBox="0 0 24 24" fill="none" stroke="#d9302c" stroke-width="2"><path d="M12 3 22 20H2z"></path><path d="M12 9v5M12 16.5v1"></path></svg></i>紧急停机</span>
    </div>
    <div class="sh"><b>今日队列</b><small>QUEUE · 3</small><a href="#">全部 →</a></div>
    <div class="list">
      <div class="row" style="--c:var(--t-collect)"><span class="pri hi">!!!</span><div class="nm">收集 · 遗落补给箱 ×4<small>旧矿道 B1 · 沿巡逻路线</small></div><span class="st wait">下一项</span></div>
      <div class="row" style="--c:var(--t-haul)"><span class="pri">!</span><div class="nm">运送 · 蜂窝合金 ×200<small>三号基地 → 装配车间</small></div><span class="st wait">待执行</span></div>
    </div>
  </div>
{tabs('home')}"""

TASKS = f"""
  <div class="top">
    <div><div class="crumb"><i>//</i>远程作业</div><div class="title" style="margin-top:8px">任务<small>TASKS · MK-07 · 今日 6 项</small></div></div>
  </div>
  <div class="body">
    <div class="filters"><span class="on">全部 6</span><span><i style="background:var(--t-gather)"></i>采集</span><span><i style="background:var(--t-collect)"></i>收集</span><span><i style="background:var(--t-haul)"></i>运送</span><span><i style="background:var(--t-patrol)"></i>巡逻</span></div>

    <div class="grp">进行中<b>1</b></div>
    <div class="list">
      <div class="row" style="--c:var(--t-gather)"><span class="pri hi">!!!</span><div class="nm">采集 · 澄砂 ×120<small>旧矿道 B2 · 已采 64 · 剩余约 12 分</small></div><span class="st go">进行中</span><div class="mini"><i style="width:53%"></i></div></div>
    </div>

    <div class="grp g2">待执行<b>3</b></div>
    <div class="list">
      <div class="row pending" style="--c:var(--t-collect)"><span class="pri hi">!!!</span><div class="nm">收集 · 遗落补给箱 ×4<small>旧矿道 B1 · 沿巡逻路线</small></div><span class="drag"><i></i><i></i><i></i></span></div>
      <div class="row pending" style="--c:var(--t-haul)"><span class="pri">!</span><div class="nm">运送 · 蜂窝合金 ×200<small>三号基地 → 装配车间</small></div><span class="drag"><i></i><i></i><i></i></span></div>
      <div class="row pending" style="--c:var(--t-patrol)"><span class="pri">!</span><div class="nm">巡逻 · 雾脊隘口外围<small>每日 20:00 · 定时</small></div><span class="drag"><i></i><i></i><i></i></span></div>
    </div>

    <div class="grp g3">已完成<b>2</b></div>
    <div class="list">
      <div class="row done" style="--c:var(--action)"><span class="pri" style="opacity:0">!</span><div class="nm">采集 · 导能凝胶 ×60<small>08:40 完成 · 用时 22 分</small></div><span class="ghost" aria-hidden="true">DONE</span><span class="stamp">{CHECK}</span></div>
      <div class="row done" style="--c:var(--action)"><span class="pri" style="opacity:0">!</span><div class="nm">运送 · 冷凝管 ×80<small>07:15 完成 · 用时 31 分</small></div><span class="stamp">{CHECK}</span></div>
    </div>
  </div>
  <div class="fab"><i><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6"><path d="M12 5v14M5 12h14"></path></svg></i>新建任务</div>
{tabs('tasks')}"""

DISPATCH = f"""
  <div class="top">
    <span class="back"><svg viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" stroke-width="2.4"><path d="M15 5l-7 7 7 7"></path></svg></span>
    <div class="title" style="font-size:22px">派遣任务</div>
    <span class="step">STEP <b>2</b> / 3</span>
  </div>
  <div class="body">
    <div class="card">
      <div class="k">任务内容</div>
      <div class="v"><span class="ty">采集</span><b>澄砂</b><span class="qty">×120</span></div>
      <div class="pr"><span class="on"><b>!!!</b>紧要 · 优先执行</span><span><b>!</b>次要 · 排队</span></div>
    </div>
    <div class="map">
      <svg viewBox="0 0 350 196" fill="none">
        <defs><pattern id="h" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="8" fill="rgba(255,255,255,.08)"></rect></pattern></defs>
        <g stroke="rgba(255,255,255,.1)" stroke-width="1"><path d="M-10 150c40-30 80-10 120-40s60-50 110-40 70 30 140 10"></path><path d="M-10 170c40-30 90-20 130-50s60-60 120-50 70 40 120 20"></path><path d="M-10 120c40-20 70 0 110-30s60-40 100-30 80 20 150 0"></path><path d="M20 196c30-40 70-30 100-60s50-40 90-36 80 10 150-10"></path></g>
        <path d="M250 0h100v90z" fill="url(#h)"></path>
        <path d="M56 150 C90 140 110 110 150 104 S210 90 248 70" stroke="#f8d34d" stroke-width="3" stroke-dasharray="6 6" stroke-linecap="round"></path>
        <circle cx="56" cy="150" r="9" fill="#1b1c1e" stroke="#fff" stroke-width="2.5"></circle>
        <circle cx="248" cy="70" r="26" stroke="rgba(248,211,77,.5)" stroke-width="1.5"></circle>
        <circle cx="248" cy="70" r="11" fill="#f8d34d"></circle><circle cx="248" cy="70" r="4" fill="#1b1c1e"></circle>
        <circle cx="150" cy="104" r="4" fill="#c9c9c2"></circle>
      </svg>
      <span class="tag" style="left:72px;top:138px">三号基地</span>
      <span class="tag y" style="left:266px;top:28px">澄砂矿点 · B2</span>
      <span class="dist">单程 0.7 KM</span>
    </div>
    <div class="bots">
      <div class="bot on"><div class="f">{bot_face('#f8d34d', EYES_HAPPY)}</div><b>MK-07</b><small>空闲 · 电量 78%</small></div>
      <div class="bot"><div class="f">{bot_face('#1c1c1c', EYES_IDLE)}</div><b>MK-12</b><small>待命 · 电量 41%</small></div>
      <div class="bot off"><div class="f">{bot_face('#1c1c1c', EYES_SLEEP)}</div><b>MK-03</b><small>充电中 · 12%</small></div>
    </div>
    <div class="est">
      <div><span>预计耗时</span><b>18<small>分</small></b></div>
      <div><span>电量消耗</span><b>22<small>%</small></b></div>
      <div><span>往返距离</span><b>1.4<small>km</small></b></div>
    </div>
  </div>
  <div class="ctas">
    <span class="cta secondary">存为模板</span>
    <span class="cta primary"><i><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6"><path d="M4 12h14M13 6l6 6-6 6"></path></svg></i>派遣 MK-07</span>
  </div>"""

Path("RobotHome.dc.html").write_text(shell(HOME), encoding="utf-8")
Path("RobotTasks.dc.html").write_text(shell(TASKS), encoding="utf-8")
Path("RobotDispatch.dc.html").write_text(shell(DISPATCH), encoding="utf-8")
print("ok")
