# 样例源文件

README 里三张预览图的源文件。每个 `.dc.html` 是一块**画板（artboard）**，可以直接用浏览器打开查看——文件头部的 `support.js` 只在 Claude Design 画布里生效，缺失不影响渲染。

| 文件 | 画板 | 尺寸 |
| --- | --- | --- |
| `Main.dc.html` | 干员体检中心 · 桌面端 | 1440 × 2056 |
| `ExamMobile.dc.html` | 干员体检中心 · 手机端 | 390 × 1391 |
| `RobotHome.dc.html` | 小机远程作业 · 状态页 | 390 × 844 |
| `RobotTasks.dc.html` | 小机远程作业 · 任务列表 | 390 × 844 |
| `RobotDispatch.dc.html` | 小机远程作业 · 派遣页 | 390 × 844 |
| `BubbleTitle.dc.html` | 龙泡泡大冒险 · 标题画面 | 1280 × 720 |
| `BubblePlay.dc.html` | 龙泡泡大冒险 · 关卡游玩 | 1280 × 720 |
| `BubbleClear.dc.html` | 龙泡泡大冒险 · 关卡完成 | 1280 × 720 |

`canvas.json` 是画布布局清单：三页分组、画板坐标，以及每页的决策记录便签（动词 · 家族 · 视觉锚 · 主题 · signature）。文件名 `Main.dc.html` 是画布格式要求的入口名，不代表它比其他画板更重要。

## 重新生成 / 截图

机器人与游戏两组画板由脚本生成（共享同一套精灵与样式表，改一处全组同步）：

```bash
python gen_robot.py
```

```bash
python gen_bubble.py
```

体检站两块是手写的，直接改 `Main.dc.html` / `ExamMobile.dc.html`。

截图用 Playwright，按 `#board` 元素的实际尺寸导出：

```bash
python render.py Main.dc.html
```

## 关于内容

题材、角色名、机构名、全部数值与日期均为**原创虚构或占位内容**，不代表任何官方设定。人物立绘位是空白 IMAGE SLOT，仓库不内置官方图片；龙泡泡与机器人表情为原创绘制。

字体走 Google Fonts（Barlow / Noto Sans SC / Fredoka / ZCOOL KuaiLe），离线打开时会回退到系统字体，版式不受影响。
