# 活动 KV、主体视觉与图片生成

本文件用于两类任务：构思 KV/横幅的主体视觉，以及为图片生成模型编写可观察、可调整的提示词。最终文字、日期、标志和精确信息通常应后期排版。

## 先选择图像策略

不是所有终末地物料都需要微缩模型。按内容选择：

- **微缩工业景观**：设施、地区、活动玩法或机械主题；
- **角色主导摄影棚**：人物、装备、角色活动；
- **空间/建筑主导**：世界观、章节、探索；
- **物件静物**：档案、纪念品、奖励、制造主题；
- **照片拼贴**：拍立得照片堆 + 胶带/贴纸 + 故障色偏，适合角色叙事与偶像向活动；
- **扁平宣传画**：巨型图形符号（拳头、箭头、器械剪影）+ 三四色有限色板 + 速度斜纹与放射线，适合竞技、运动、挑战主题；
- **编辑拼贴**：版本日历、总结、密集运营内容；
- **水墨/叙事海报**：章节、地域文化与电影化预告；
- **整幅绘画**：版本 KV 与世界观场景，可配符文化装饰字题字系统（符文只装饰不表意）；
- **纯排印/CSS 图形**：信息已经足够强，不需要额外生成主体。

先说明主体、叙事瞬间和预留文案区域，再添加材质、布光和图形叠层。

## 构图原则

- 主体和标题区形成不对称拉力；标题区的位置由主体朝向、透视和负空间决定，不默认右置。
- 使用前、中、后三层组织空间：主体或模型、图形/测绘叠层、低对比环境纹理。
- 大几何色块、巨型字、路径或测量线应与主体的地面、运动方向或功能关系对齐。
- 一张 KV 选择一套主要图形系统。半调、故障、网格、准星和描边字不应全部出现。

## 可观察风格属性

按需组合以下描述，不要机械全部加入：

- neutral paper-white, concrete-gray or smoked-charcoal studio field;
- off-center industrial subject with edge-docked information space;
- miniature resin, matte plastic, machined metal or architectural model materials;
- controlled softbox lighting with crisp material separation;
- technical survey overlays, contour paths, measurement ticks or wireframe callouts;
- hard-edged color planes aligned to perspective;
- restrained halftone, crop marks, hatching or outline typography;
- one theme anchor plus functional semantic colors;
- editorial CJK title area reserved for post-production.

## 提示词结构

使用这个顺序编写提示词：

`主体与动作 → 场景/尺度 → 镜头与构图 → 材质 → 布光 → 主题色 → 技术叠层 → 预留排版区 → 排除项`

示例骨架：

> A compact automated processing station unfolding on a pale concrete display table, toy-scale architectural model with matte polymer housings and small machined metal joints, off-center three-quarter view, large negative space above the left edge for an editorial title, controlled softbox lighting, charcoal and warm-white base with a jade-green activity anchor, sparse contour paths and two measurement callouts aligned to the machine, one cropped outline word in the background, crisp industrial editorial composition.

这个骨架描述视觉属性，不依赖游戏名称。根据任务替换主体、主题色、镜头、材料和叠层。

## 按家族调整

- **微缩工业景观**：强调模型尺度、真实材料、地台、浅景深与测绘叠层；不要把所有背景都做成虚化灯光。
- **角色主导**：强调轮廓、姿态、装备材料和主题色；技术图形避开面部与关键动作。
- **照片拼贴**：生成单张"照片"素材（自然姿态、偏日常构图），白边、胶带、故障色偏与散落角度在后期排版完成；主题色可用角色色（如紫）统一。
- **扁平宣传画**：描述 flat vector poster、single bold pictogram、limited palette（例：black, signal red, teal, cream, accent yellow）、diagonal speed stripes；排除摄影质感与 3D 渲染词汇。
- **水墨叙事**：使用大留白、墨色方向性笔触、少量冷暖色和竖排文字空间；移除微缩与 AR 词汇。
- **战斗/高能主题**：可用红青故障双色（anaglyph offset、glitch slivers）；控制在主体边缘，不吞噬可读性。
- **编辑拼贴**：生成独立素材或背景层，最终拼贴和文字层在设计工具中完成。
- **HUD 主体**：生成干净场景或对象，不让模型生成不可读的完整 UI；UI 后期重建。

## 排除项不是全局禁令

只排除与当前概念冲突的内容。例如微缩工业 KV 可以排除：

`generic neon cyberpunk, excessive hexagons, rainbow glow, illegible interface text, fake logos, lens flare obscuring the subject, decorative telemetry everywhere`

不要把 `rounded corners`、`serif typography`、`watercolor` 或 `soft shadows` 永久放进所有负面词；它们在聊天、档案、水墨叙事或摄影棚布光中可能合理。

## 后期排版

- 活动名称、日期、服务器时间、奖励数字和法律注脚使用真实文字后期叠加。
- 标题块可以是开放排印、档案标签、纵向标题、侧边轨或独立色块，不固定为四行右置卡。
- 检查生成图的机械结构、手指/人物、透视、重复零件和伪文字；有问题先修主体，再排字。

## 来源与权利

- 不要求模型复刻官方角色、标志或现成 KV。
- 用户提供官方图作为研究参考时，提炼构图、材质、色彩和层级，不默认把原图作为图生图底图。
- 对外发布前提醒用户核实角色、商标、图片、字体和生成服务条款；不要替用户作授权结论。
