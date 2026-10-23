"""Render forward-test artboards (.dc.html) to PNG with Playwright.

Usage: python render.py <Name.dc.html> [out.png] [scale]
Prints the #board box so canvas.json frames can be matched.
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

src = Path(sys.argv[1]).resolve()
out = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else src.with_suffix(".png")
scale = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1600, "height": 900}, device_scale_factor=scale)
    page.goto(src.as_uri())
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(1500)
    box = page.evaluate(
        "() => {const e=document.querySelector('#board');"
        "return {w:e.scrollWidth,h:e.scrollHeight,cw:e.clientWidth,ch:e.clientHeight,"
        "fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family).filter((v,i,a)=>a.indexOf(v)===i)};}"
    )
    print("board:", box)
    page.query_selector("#board").screenshot(path=str(out))
    browser.close()
print(out)
