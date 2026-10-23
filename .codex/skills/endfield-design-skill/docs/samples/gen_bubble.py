# Generates the three 龙泡泡 game artboards from shared sprites + stylesheet.
from pathlib import Path

# --- original mascot sprite: round "dragon bubble" with tan ear caps and a yellow strap ---
def mascot(flip=False, mood="happy", scale=1.0, x=0, y=0):
    eyes = {
        "happy": '<path d="M72 94q10-12 20 0" fill="none" stroke="#2a2a27" stroke-width="5" stroke-linecap="round"></path><path d="M112 94q10-12 20 0" fill="none" stroke="#2a2a27" stroke-width="5" stroke-linecap="round"></path>',
        "open": '<circle cx="82" cy="94" r="7" fill="#2a2a27"></circle><circle cx="122" cy="94" r="7" fill="#2a2a27"></circle><circle cx="84" cy="91" r="2.5" fill="#fff"></circle><circle cx="124" cy="91" r="2.5" fill="#fff"></circle>',
        "wow": '<circle cx="82" cy="94" r="8" fill="#2a2a27"></circle><circle cx="122" cy="94" r="8" fill="#2a2a27"></circle><circle cx="85" cy="90" r="3" fill="#fff"></circle><circle cx="125" cy="90" r="3" fill="#fff"></circle>',
    }[mood]
    mouth = '<path d="M96 108q6 6 12 0" fill="none" stroke="#2a2a27" stroke-width="4" stroke-linecap="round"></path>' if mood != "wow" else '<ellipse cx="102" cy="112" rx="7" ry="9" fill="#2a2a27"></ellipse>'
    t = f"translate({x} {y}) scale({-scale if flip else scale} {scale})" + (" translate(-200 0)" if flip else "")
    return f"""<g transform="{t}">
      <ellipse cx="100" cy="186" rx="54" ry="10" fill="rgba(40,40,36,.18)"></ellipse>
      <path d="M150 150q26 10 30 30-22-4-36-16z" fill="#fbf7ee" stroke="#2a2a27" stroke-width="5" stroke-linejoin="round"></path>
      <circle cx="100" cy="110" r="66" fill="#fbf7ee" stroke="#2a2a27" stroke-width="5"></circle>
      <path d="M52 62l10-34 24 24z" fill="#d2a86a" stroke="#2a2a27" stroke-width="5" stroke-linejoin="round"></path>
      <path d="M148 62l-10-34-24 24z" fill="#d2a86a" stroke="#2a2a27" stroke-width="5" stroke-linejoin="round"></path>
      <path d="M40 128q60 34 120 0l4 22q-64 30-128 0z" fill="#f8d34d" stroke="#2a2a27" stroke-width="5" stroke-linejoin="round"></path>
      <rect x="92" y="130" width="18" height="22" rx="3" fill="#2a2a27"></rect>
      <rect x="97" y="135" width="8" height="12" rx="1.5" fill="#f8d34d"></rect>
      <ellipse cx="72" cy="108" rx="9" ry="5" fill="#f5a9b4"></ellipse>
      <ellipse cx="132" cy="108" rx="9" ry="5" fill="#f5a9b4"></ellipse>
      {eyes}{mouth}
      <ellipse cx="70" cy="172" rx="16" ry="10" fill="#fbf7ee" stroke="#2a2a27" stroke-width="5"></ellipse>
      <ellipse cx="130" cy="172" rx="16" ry="10" fill="#fbf7ee" stroke="#2a2a27" stroke-width="5"></ellipse>
    </g>"""


def bubble(cx, cy, r, op=1):
    return (f'<g opacity="{op}"><circle cx="{cx}" cy="{cy}" r="{r}" fill="rgba(255,255,255,.35)" stroke="#fff" stroke-width="3"></circle>'
            f'<circle cx="{cx}" cy="{cy}" r="{r-3}" fill="none" stroke="rgba(127,208,255,.7)" stroke-width="2"></circle>'
            f'<ellipse cx="{cx - r*0.4}" cy="{cy - r*0.45}" rx="{r*0.22}" ry="{r*0.12}" fill="#fff" transform="rotate(-35 {cx - r*0.4} {cy - r*0.45})"></ellipse></g>')


def crate(x, y, w, h, top=True):
    s = f'<g transform="translate({x} {y})"><rect width="{w}" height="{h}" fill="#8f8f88" stroke="#2a2a27" stroke-width="4"></rect>'
    s += f'<rect x="6" y="6" width="{w-12}" height="{h-12}" fill="#a8a8a1" stroke="#2a2a27" stroke-width="3"></rect>'
    if top:
        s += f'<rect x="0" y="-8" width="{w}" height="10" fill="#f8d34d" stroke="#2a2a27" stroke-width="4"></rect>'
        s += f'<rect x="0" y="-8" width="{w}" height="10" fill="url(#hz)"></rect>'
    s += '</g>'
    return s


def cloud(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})" fill="#fff" stroke="#2a2a27" stroke-width="0">'
            '<ellipse cx="0" cy="0" rx="60" ry="26"></ellipse><ellipse cx="-34" cy="8" rx="34" ry="20"></ellipse><ellipse cx="34" cy="6" rx="38" ry="22"></ellipse><ellipse cx="4" cy="-16" rx="34" ry="24"></ellipse></g>')


def spike(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})"><path d="M-40 20 L-28 -18 L-12 4 L0 -36 L12 4 L28 -18 L40 20 Z" fill="#3a3a40" stroke="#1c1c1c" stroke-width="4" stroke-linejoin="round"></path>'
            '<ellipse cx="0" cy="16" rx="40" ry="12" fill="#3a3a40" stroke="#1c1c1c" stroke-width="4"></ellipse>'
            '<circle cx="-12" cy="6" r="4" fill="#7fd0ff"></circle><circle cx="12" cy="6" r="4" fill="#7fd0ff"></circle></g>')


SKYLINE = """<g fill="#b9c7d3" opacity=".8"><rect x="40" y="300" width="60" height="200"></rect><rect x="110" y="360" width="26" height="140"></rect><rect x="150" y="250" width="10" height="250"></rect><rect x="150" y="250" width="120" height="10"></rect><rect x="262" y="250" width="6" height="60"></rect><rect x="330" y="330" width="90" height="170"></rect><rect x="430" y="380" width="40" height="120"></rect><rect x="700" y="320" width="70" height="180"></rect><rect x="790" y="280" width="12" height="220"></rect><rect x="790" y="280" width="140" height="10"></rect><rect x="920" y="280" width="6" height="70"></rect><rect x="1000" y="350" width="110" height="150"></rect><rect x="1140" y="300" width="50" height="200"></rect><rect x="1210" y="390" width="80" height="110"></rect></g>
<g fill="#cfd9e2" opacity=".9"><rect x="0" y="430" width="1280" height="80"></rect><circle cx="620" cy="430" r="70"></circle><rect x="560" y="360" width="14" height="80"></rect><rect x="660" y="380" width="14" height="60"></rect></g>"""

DEFS = """<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe9ff"></stop><stop offset=".6" stop-color="#eef6fb"></stop><stop offset="1" stop-color="#f7f3e8"></stop></linearGradient>
  <pattern id="hz" width="20" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="10" height="10" fill="#2a2a27"></rect></pattern>
  <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke="rgba(42,42,39,.06)" stroke-width="1"></path></pattern>
</defs>"""

CSS = r"""
    x-dc { display: block; }
    body { margin: 0; background: #cfe9ff; font-family: "Fredoka", "ZCOOL KuaiLe", "Noto Sans SC", "Microsoft YaHei", sans-serif; color: #2a2a27; }
    a { color: #2a2a27; text-decoration: none; } a:hover { color: #000; }
    .g * { box-sizing: border-box; }
    .g { position: relative; width: 1280px; height: 720px; overflow: hidden; font-family: "Fredoka", "ZCOOL KuaiLe", "Noto Sans SC", "Microsoft YaHei", sans-serif; color: #2a2a27; font-variant-numeric: tabular-nums; }
    .g .scene { position: absolute; inset: 0; }
    .g .scene svg { width: 100%; height: 100%; display: block; }
    .g .kuai { font-family: "ZCOOL KuaiLe", "Noto Sans SC", "Microsoft YaHei", sans-serif; }
    .g .title { position: absolute; left: 90px; top: 150px; }
    .g .title h1 { margin: 0; font: 400 110px/1 "ZCOOL KuaiLe", "Noto Sans SC", sans-serif; color: #fff; letter-spacing: .02em; -webkit-text-stroke: 10px #2a2a27; paint-order: stroke fill; text-shadow: 8px 10px 0 #2a2a27; white-space: nowrap; }
    .g .title h1 em { font-style: normal; color: #f8d34d; }
    .g .title .sub { display: inline-flex; align-items: center; gap: 12px; margin-top: 24px; padding: 8px 22px; background: #2a2a27; color: #f8d34d; font: 400 30px/1 "ZCOOL KuaiLe", "Noto Sans SC", sans-serif; letter-spacing: .1em; transform: rotate(-2deg); clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%); }
    .g .title .sub small { font: 700 14px/1 "Fredoka"; letter-spacing: .22em; color: #fff; }
    .g .menu { position: absolute; left: 96px; top: 470px; display: flex; flex-direction: column; gap: 14px; }
    .g .btn { display: flex; align-items: center; gap: 14px; height: 64px; padding: 0 34px 0 10px; border-radius: 32px; border: 4px solid #2a2a27; background: #fff; font: 400 28px/1 "ZCOOL KuaiLe", "Noto Sans SC", sans-serif; letter-spacing: .08em; box-shadow: 0 6px 0 #2a2a27; width: max-content; }
    .g .btn i { width: 44px; height: 44px; border-radius: 50%; background: #f8d34d; border: 3px solid #2a2a27; display: grid; place-items: center; }
    .g .btn i svg { width: 20px; height: 20px; }
    .g .btn.dark { background: #2a2a27; color: #fff; box-shadow: 0 6px 0 #8f8f88; height: 52px; font-size: 22px; padding: 0 26px 0 10px; }
    .g .btn.dark i { background: #fff; width: 34px; height: 34px; }
    .g .ver { position: absolute; right: 26px; bottom: 18px; font: 700 12px/1 "Fredoka"; letter-spacing: .2em; color: #5a5a55; }
    .g .ver b { color: #2a2a27; }
    .g .corner { position: absolute; left: 0; top: 0; width: 48px; height: 48px; background:
      linear-gradient(#2a2a27, #2a2a27) 0 0 / 30px 9px no-repeat, linear-gradient(#2a2a27, #2a2a27) 0 0 / 9px 30px no-repeat; }

    /* HUD */
    .g .hud { position: absolute; inset: 0; pointer-events: none; }
    .g .lives { position: absolute; left: 26px; top: 22px; display: flex; gap: 8px; }
    .g .lives i { width: 40px; height: 40px; border-radius: 50%; border: 4px solid #2a2a27; background: #fbf7ee; position: relative; box-shadow: 0 3px 0 #2a2a27; }
    .g .lives i::after { content: ""; position: absolute; left: 7px; right: 7px; top: 16px; height: 7px; background: #f8d34d; border-top: 2px solid #2a2a27; border-bottom: 2px solid #2a2a27; }
    .g .lives i.off { background: #d6d6d0; opacity: .6; box-shadow: none; }
    .g .lives i.off::after { background: #a6a6a0; }
    .g .level { position: absolute; left: 26px; top: 72px; display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: #2a2a27; color: #fff; font: 700 15px/1 "Fredoka"; letter-spacing: .08em; clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%); }
    .g .level b { color: #f8d34d; font: 400 16px/1 "ZCOOL KuaiLe", "Noto Sans SC", sans-serif; letter-spacing: .1em; }
    .g .score { position: absolute; left: 50%; top: 18px; transform: translateX(-50%); display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 22px 0 10px; background: #fff; border: 4px solid #2a2a27; border-radius: 26px; box-shadow: 0 4px 0 #2a2a27; font: 700 30px/1 "Fredoka"; }
    .g .score svg { width: 32px; height: 32px; }
    .g .score small { font: 700 14px/1 "Fredoka"; color: #84847e; letter-spacing: .1em; margin-left: 4px; }
    .g .pause { position: absolute; right: 26px; top: 20px; width: 48px; height: 48px; border-radius: 50%; background: #fff; border: 4px solid #2a2a27; box-shadow: 0 4px 0 #2a2a27; display: grid; place-items: center; }
    .g .pause svg { width: 18px; height: 18px; }
    .g .prog { position: absolute; left: 26px; right: 26px; bottom: 18px; height: 18px; border: 3px solid #2a2a27; background: #fff; border-radius: 9px; overflow: hidden; }
    .g .prog i { position: absolute; left: 0; top: 0; bottom: 0; background: #f8d34d; }
    .g .prog b { position: absolute; top: -2px; width: 3px; height: 14px; background: #2a2a27; }
    .g .flag { position: absolute; right: 26px; bottom: 40px; font: 700 12px/1 "Fredoka"; letter-spacing: .16em; color: #5a5a55; }
    .g .combo { position: absolute; left: 760px; top: 230px; font: 400 40px/1 "ZCOOL KuaiLe", "Noto Sans SC", sans-serif; color: #f8d34d; -webkit-text-stroke: 6px #2a2a27; paint-order: stroke fill; transform: rotate(-8deg); }
    .g .combo small { font: 700 18px/1 "Fredoka"; color: #fff; -webkit-text-stroke: 4px #2a2a27; paint-order: stroke fill; }

    /* CLEAR */
    .g .backdrop { position: absolute; inset: 0; background: #1b1c1e; }
    .g .wedge { position: absolute; right: 0; top: 0; width: 520px; height: 720px; background: #f8d34d; clip-path: polygon(100% 0, 100% 100%, 300px 100%, 0 0); }
    .g .ghost { position: absolute; left: 40px; top: 40px; font: 700 280px/1 "Fredoka"; letter-spacing: .02em; color: transparent; -webkit-text-stroke: 2px rgba(255,255,255,.22); pointer-events: none; white-space: nowrap; }
    .g .clear { position: absolute; left: 90px; top: 150px; color: #fff; }
    .g .clear .kicker { font: 700 16px/1 "Fredoka"; letter-spacing: .3em; color: #f8d34d; }
    .g .clear h2 { margin: 14px 0 0; font: 400 96px/1 "ZCOOL KuaiLe", "Noto Sans SC", sans-serif; letter-spacing: .04em; }
    .g .stars { display: flex; gap: 12px; margin-top: 22px; }
    .g .stars svg { width: 58px; height: 58px; }
    .g .stats { display: grid; grid-template-columns: repeat(3, auto); gap: 26px; margin-top: 30px; }
    .g .stats div span { display: block; font: 700 12px/1 "Fredoka"; letter-spacing: .18em; color: #a6a6a0; }
    .g .stats div b { display: block; margin-top: 8px; font: 700 36px/1 "Fredoka"; }
    .g .stats div b small { font: 700 14px/1 "Fredoka"; color: #a6a6a0; margin-left: 4px; }
    .g .stats div b em { font-style: normal; color: #f8d34d; }
    .g .seal { position: absolute; left: 560px; top: 120px; width: 120px; height: 120px; border: 4px solid #f8d34d; border-radius: 50%; display: grid; place-items: center; text-align: center; color: #f8d34d; font: 400 22px/1.2 "ZCOOL KuaiLe", "Noto Sans SC", sans-serif; letter-spacing: .1em; transform: rotate(-14deg); }
    .g .seal::before { content: ""; position: absolute; inset: 6px; border: 1.5px solid #f8d34d; border-radius: 50%; }
    .g .cmenu { position: absolute; left: 90px; bottom: 70px; display: flex; gap: 14px; }
"""


def shell(inner, bg):
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=ZCOOL+KuaiLe&family=Noto+Sans+SC:wght@500;700;900&display=swap">
  <style>{CSS}  </style>
</helmet>
<div class="g" id="board" style="background:{bg}">
{inner}
</div>
</x-dc>
<script data-dc-script data-props='{{"$preview":{{"width":1280,"height":720}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
"""


TITLE = f"""
  <div class="scene"><svg viewBox="0 0 1280 720">{DEFS}
    <rect width="1280" height="720" fill="url(#sky)"></rect>
    <rect width="1280" height="720" fill="url(#grid)"></rect>
    {cloud(200, 90, 1)}{cloud(980, 70, 1.3)}{cloud(640, 150, .7)}{cloud(1180, 250, .8)}
    {SKYLINE}
    <rect x="0" y="500" width="1280" height="220" fill="#dcd6c6"></rect>
    <rect x="0" y="500" width="1280" height="12" fill="#2a2a27"></rect>
    <rect x="0" y="512" width="1280" height="6" fill="#f8d34d"></rect>
    {crate(700, 420, 120, 80)}{crate(820, 420, 120, 80)}{crate(760, 340, 120, 80)}{crate(1040, 450, 100, 50)}
    {bubble(600, 300, 26)}{bubble(1000, 220, 34)}{bubble(1120, 330, 20)}{bubble(660, 420, 16, .8)}
    {mascot(x=540, y=310, scale=1.05, mood="happy")}
    {mascot(x=850, y=150, scale=.82, mood="wow", flip=True)}
    {bubble(878, 240, 74, .9)}
    {spike(1190, 486, .8)}
  </svg></div>
  <span class="corner"></span>
  <div class="title">
    <h1>龙泡泡<em>大冒险</em></h1>
    <div class="sub">横版跳跃吧！<small>BUBBLE DRAGON · JUMP!</small></div>
  </div>
  <div class="menu">
    <span class="btn"><i><svg viewBox="0 0 24 24" fill="#2a2a27"><path d="M7 4l13 8-13 8z"></path></svg></i>开始冒险</span>
    <span class="btn dark"><i><svg viewBox="0 0 24 24" fill="#2a2a27"><path d="M4 5h16v3H4zM4 10.5h16v3H4zM4 16h10v3H4z"></path></svg></i>继续 · 第 1-2 关</span>
  </div>
  <div class="ver"><b>DEMO 0.1</b> · 设计样例 · 非官方作品</div>"""

PLAY = f"""
  <div class="scene"><svg viewBox="0 0 1280 720">{DEFS}
    <rect width="1280" height="720" fill="url(#sky)"></rect>
    <rect width="1280" height="720" fill="url(#grid)"></rect>
    {cloud(160, 120, .8)}{cloud(720, 80, 1.1)}{cloud(1150, 140, .7)}
    {SKYLINE}
    <!-- pipes -->
    <rect x="0" y="560" width="1280" height="160" fill="#dcd6c6"></rect>
    <rect x="0" y="560" width="1280" height="12" fill="#2a2a27"></rect>
    <rect x="0" y="572" width="1280" height="6" fill="#f8d34d"></rect>
    <rect x="300" y="380" width="26" height="180" fill="#9aa7b0" stroke="#2a2a27" stroke-width="4"></rect>
    <rect x="292" y="372" width="42" height="16" fill="#9aa7b0" stroke="#2a2a27" stroke-width="4"></rect>
    <!-- platforms -->
    {crate(120, 470, 110, 90)}{crate(230, 470, 110, 90)}
    {crate(470, 400, 110, 60)}{crate(580, 400, 110, 60)}
    {crate(800, 320, 110, 60)}
    {crate(1020, 440, 110, 60)}{crate(1130, 440, 110, 60)}
    <!-- gap / hazard -->
    <rect x="350" y="560" width="110" height="160" fill="#1b1c1e"></rect>
    <rect x="350" y="560" width="110" height="18" fill="url(#hz)"></rect>
    <!-- bubbles to collect -->
    {bubble(520, 330, 18)}{bubble(560, 300, 18)}{bubble(600, 300, 18)}{bubble(640, 330, 18)}
    {bubble(860, 240, 22)}{bubble(960, 300, 18)}{bubble(1180, 360, 18)}
    <!-- enemies -->
    {spike(690, 546, .9)}{spike(1090, 428, .7)}
    <!-- checkpoint flag -->
    <rect x="1230" y="330" width="6" height="110" fill="#2a2a27"></rect>
    <path d="M1236 330h44l-12 16 12 16h-44z" fill="#f8d34d" stroke="#2a2a27" stroke-width="4"></path>
    <!-- player mid-jump -->
    {mascot(x=330, y=190, scale=.9, mood="open")}
    <path d="M380 400q20 30 50 36" fill="none" stroke="rgba(42,42,39,.25)" stroke-width="6" stroke-dasharray="10 10" stroke-linecap="round"></path>
    <!-- floating +1 -->
    <text x="642" y="270" font-family="Fredoka" font-weight="700" font-size="28" fill="#fff" stroke="#2a2a27" stroke-width="6" paint-order="stroke">+1</text>
  </svg></div>
  <div class="hud">
    <div class="lives"><i></i><i></i><i class="off"></i></div>
    <div class="level">1-2 <b>旧矿道</b></div>
    <div class="score"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="rgba(127,208,255,.35)" stroke="#2a2a27" stroke-width="3"></circle><ellipse cx="11" cy="10" rx="3.5" ry="2" fill="#fff" transform="rotate(-35 11 10)"></ellipse></svg>×24<small>/ 30</small></div>
    <span class="pause"><svg viewBox="0 0 24 24" fill="#2a2a27"><path d="M6 4h4v16H6zM14 4h4v16h-4z"></path></svg></span>
    <div class="combo">COMBO ×3<small> nice!</small></div>
    <div class="prog"><i style="width:46%"></i><b style="left:33%"></b><b style="left:66%"></b></div>
    <span class="flag">CHECKPOINT ▸ 2 / 3</span>
  </div>"""

CLEAR = f"""
  <div class="backdrop"></div>
  <div class="wedge"></div>
  <div class="ghost" aria-hidden="true">CLEAR</div>
  <div class="scene"><svg viewBox="0 0 1280 720">{DEFS}
    {bubble(1060, 520, 40, .9)}{bubble(1180, 300, 26, .8)}{bubble(960, 250, 18, .7)}{bubble(1220, 600, 16, .6)}
    {mascot(x=900, y=330, scale=1.3, mood="happy")}
    <g fill="#f8d34d" stroke="#2a2a27" stroke-width="3"><path d="M860 260l8 16 18 2-13 12 3 18-16-9-16 9 3-18-13-12 18-2z"></path><path d="M1200 180l6 12 13 2-9 9 2 13-12-7-12 7 2-13-9-9 13-2z"></path></g>
  </svg></div>
  <div class="clear">
    <div class="kicker">STAGE 1-2 · 旧矿道</div>
    <h2>关卡完成！</h2>
    <div class="stars">
      <svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.6 6 21l1.3-6.8-5-4.7 6.8-.8z" fill="#f8d34d" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"></path></svg>
      <svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.6 6 21l1.3-6.8-5-4.7 6.8-.8z" fill="#f8d34d" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"></path></svg>
      <svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.6 6 21l1.3-6.8-5-4.7 6.8-.8z" fill="none" stroke="#8f8f88" stroke-width="1.5" stroke-linejoin="round"></path></svg>
    </div>
    <div class="stats">
      <div><span>收集泡泡</span><b><em>24</em><small>/ 30</small></b></div>
      <div><span>用时</span><b>1:42</b></div>
      <div><span>最佳</span><b>1:37</b></div>
    </div>
  </div>
  <div class="seal">还差<br>6 个<br>泡泡</div>
  <div class="cmenu">
    <span class="btn"><i><svg viewBox="0 0 24 24" fill="#2a2a27"><path d="M7 4l13 8-13 8z"></path></svg></i>下一关</span>
    <span class="btn dark"><i><svg viewBox="0 0 24 24" fill="none" stroke="#2a2a27" stroke-width="3"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"></path></svg></i>重玩</span>
    <span class="btn dark"><i><svg viewBox="0 0 24 24" fill="#2a2a27"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"></path></svg></i>选关</span>
  </div>"""

Path("BubbleTitle.dc.html").write_text(shell(TITLE, "#cfe9ff"), encoding="utf-8")
Path("BubblePlay.dc.html").write_text(shell(PLAY, "#cfe9ff"), encoding="utf-8")
Path("BubbleClear.dc.html").write_text(shell(CLEAR, "#1b1c1e"), encoding="utf-8")
print("ok")
