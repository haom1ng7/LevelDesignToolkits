# 界面字体

- `Saira.ttf`：既有英文可变字体；完整许可见 `Saira-OFL.txt`。
- `NotoSansSC-UI.woff2`：与思源黑体同源的 Noto Sans SC 中文界面子集；完整许可见 `NotoSansSC-OFL.txt`。不是游戏官方字体。

两款字体与许可都由 `tools/build.mjs` 嵌入离线单页，不发起在线字体请求。中文标题、按钮与正文使用同一字体的真实字重；Saira 继续承担英文标签和编号。中文缺字保留微软雅黑、苹方等系统字体回退；画布、图内文字编辑及图稿导出保留原系统字体。

## Noto Sans SC 来源

- 上游：[Google Fonts / Noto Sans SC](https://github.com/google/fonts/tree/2894aab31764f10f29c421bdfd2340d3b382d384/ofl/notosanssc)。
- 原始文件：`NotoSansSC[wght].ttf`，版本 `2.004-H2`，SHA-256：`a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da`。
- 许可：SIL Open Font License 1.1，Copyright 2014–2021 Adobe，Reserved Font Name “Source”。
- 本地子集：1,976,648 字节，覆盖 7,744 个 Unicode 字符，保留 `wght` 100–900；SHA-256：`073707739de904e0da5be25ed1ae264a129465b226b6f1da6dc8dbc9af1b9620`。

## 子集处理

使用 fontTools 4.67.0（`fontTools.subset`）与 Brotli 1.2.1，保留 ASCII、GB2312 全部可解码字符、`src/` 下 HTML/CSS/JS/JSON 文案中的字符，以及 U+2000–206F、U+3000–303F、U+FF00–FFEF 标点。保留 OpenType 字形布局、名称和连续字重，不将可变字体转为静态字重；仅裁剪字符并压缩为 WOFF2，没有修改字形。

处理参数采用 `subset.Options()` 的默认项，另设 `flavor='woff2'`、`recalc_timestamp=False`，以所需 Unicode 集调用 `Subsetter.populate(unicodes=...)` 与 `Subsetter.subset(font)`，最后设 `font.flavor='woff2'` 保存。此工具仅在准备字体资源时使用；日常构建直接读取随源码提供的 WOFF2，不需要 Python 或新增 npm 依赖。

后续增加文案时，若出现子集不含的字，浏览器会自动回退到系统字体；需要完全一致的字形时，可按上述范围加入新字符并重新生成子集。
