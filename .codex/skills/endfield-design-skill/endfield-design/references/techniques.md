# 实现技法工具箱

按需使用，不要求一个作品实现全部技法。先确定组件语义和界面家族，再选择最简单、可维护的实现。

## 形状系统

### 可参数化切角

```css
.cut-corner {
  --cut: 10px;
  clip-path: polygon(
    0 0,
    100% 0,
    100% calc(100% - var(--cut)),
    calc(100% - var(--cut)) 100%,
    0 100%
  );
}
```

切角适合行动、导航、机械面板和重点标签。不要默认应用到正文卡、聊天、筛选和所有按钮。需要可见边框或焦点轮廓时，注意 `clip-path` 会裁切 outline；可在外层绘制焦点或使用伪元素。

### 斜楔但保持文字正立

使用伪元素绘制倾斜底板，让文字和命中区域保持正常坐标。角度按当前构图选择，不建立全系统唯一 `-12deg` 常量。

```css
.slanted-label {
  position: relative;
  isolation: isolate;
}

.slanted-label::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  background: var(--label-bg);
  content: "";
  transform: skewX(var(--label-skew, -10deg));
}
```

### 圆形与胶囊

- 图标按钮、技能、头像和仪表使用 `aspect-ratio: 1` 与 `border-radius: 50%`。
- 资源、筛选和短状态使用足够大的半径或胶囊；不要把长段落放进胶囊。
- 同一组件族共享半径 token，如 `--radius-control`，而不是全站共享一个“现代圆角”。

### 角括号选中态

选中用四角短括号而不是整圈发光；用伪元素或独立叠层绘制，避免占用 outline（焦点仍用 `:focus-visible`）。

```css
.slot.is-selected { position: relative; }
.slot.is-selected::after {
  /* --c 用橙：官方名册卡与贵重品库的选中角括号实测为橙（EV-UI-12、15），是“选中=黄”的例外 */
  --b: 2px; --len: 10px; --c: var(--notify);
  content: ""; position: absolute; inset: 0; pointer-events: none;
  /* 每角两条 --b 粗、--len 长的短线拼成 L 形；改 --b 即改线宽 */
  background:
    linear-gradient(var(--c), var(--c)) 0 0 / var(--len) var(--b),
    linear-gradient(var(--c), var(--c)) 0 0 / var(--b) var(--len),
    linear-gradient(var(--c), var(--c)) 100% 0 / var(--len) var(--b),
    linear-gradient(var(--c), var(--c)) 100% 0 / var(--b) var(--len),
    linear-gradient(var(--c), var(--c)) 0 100% / var(--len) var(--b),
    linear-gradient(var(--c), var(--c)) 0 100% / var(--b) var(--len),
    linear-gradient(var(--c), var(--c)) 100% 100% / var(--len) var(--b),
    linear-gradient(var(--c), var(--c)) 100% 100% / var(--b) var(--len);
  background-repeat: no-repeat;
}
```

### 稀有度底部渐变

物品卡的稀有度用底部向上消散的渐变或底边条，映射 `--rarity-*` 色阶；不要用整框描边抢走内容。

```css
.item-card { position: relative; overflow: hidden; }
.item-card::before {
  content: ""; position: absolute; inset: auto 0 0 0; height: 28%;
  background: linear-gradient(to top, color-mix(in srgb, var(--rarity, var(--rarity-3)) 55%, transparent), transparent);
  pointer-events: none;
}

/* 最高档在渐变上叠细斜纹（官方 6★ 武器卡）：稀有度越高装饰越多，低档保持纯渐变 */
.item-card.is-rarity-4::before {
  background:
    repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.22) 0 2px, transparent 2px 7px),
    linear-gradient(to top, color-mix(in srgb, var(--rarity-4) 60%, transparent), transparent);
}
```

未获得/锁定按场景表达：列表卡用左下角锁图标、卡面不变灰；图鉴格用准星占位符。

### 幽灵描边字

章节索引、完成庆祝可用巨型描边词；装饰层必须裁切、禁用交互并从辅助技术隐藏。

```css
.ghost-word {
  position: absolute; z-index: 0; pointer-events: none; user-select: none;
  font-weight: 800; letter-spacing: .02em;
  /* 不用 currentColor：fill 已透明，currentColor 也会透明。
     描边色优先读祖先设定的 --ghost-ink（主题接管时在容器上覆盖），否则退回正文色 22% */
  color: transparent;
  -webkit-text-stroke: 1.5px var(--ghost-ink, color-mix(in srgb, var(--text-primary) 22%, transparent));
}
/* 标记 aria-hidden="true"；父级用 overflow: clip 裁切出血 */
```

## 空间与网格

- 使用不等宽轨道和局部跨列创造偏心结构，例如 `minmax(0, 1.6fr) minmax(16rem, .8fr)`。
- 所有可能包含长内容的 flex/grid 子项使用 `min-width: 0`；图片轨道使用 `minmax(0, 1fr)`。
- 停靠信息区优先使用正常文档流、grid areas 或 sticky；绝对定位保留给不会影响阅读顺序的叠层。
- 装饰出血放入 `pointer-events: none` 的局部容器并裁切，不用全局隐藏溢出来掩盖布局问题。

## 颜色 token

按语义命名，而不是把黄色写进组件 API：

```css
:root {
  --surface-paper: #f1f1ee;
  --surface-concrete: #c7c7c3;
  --surface-smoke: #1b1c1e;
  --text-primary: #1c1c1c;
  --text-on-dark: #f5f5f1;
  --action: #f8d34d;      /* 系统黄：导航、选中、行动 */
  --selected: #fffa00;
  --notify: #ff7d1a;      /* 橙：通知、倒计时、等级带、数量强调 */
  --gain: #d8f21d;        /* 荧光黄绿：增益 chip、经验增量、新数值；不做进度条填充 */
  --danger: #d9302c;
  --success: #13cf70;     /* 绿：确认、充裕倒计时（商城实测 #00d872） */
  --data: #2a84b4;        /* 蓝：量值图表、流程（产耗行面积图实测）；进度/完成度条用 --action */
  --region: #06a2a2;      /* 青：地区/机构主题（地区建设实测） */
  --special: #8a5cf6;     /* 紫：战术/特殊物品 */
  --rarity-1: #24bafc;    /* 稀有度色阶：蓝→紫→金→橙（武器卡渐变实测） */
  --rarity-2: #904ef6;
  --rarity-3: #fcba00;
  --rarity-4: #fc6c00;    /* 最高档另叠斜纹，见上方技法 */
}
```

- 为半透明纹理提供 RGB 通道或 `color-mix()`，不要在组件中硬编码旧主题的 RGBA。
- 主题（活动、角色、地区）可以覆盖 `--action`、展示字体和纹理强度，甚至整页接管，但不覆盖危险/成功语义，也不与数据语义色（蓝/黄/红）冲突。
- 多色图表建立独立数据 palette，并检查色盲与灰阶可辨性。

## 排印

- CJK 正文与拉丁正文分别定义角色 token；不要让数字字体强行接管长文本。
- 数值列使用 `font-variant-numeric: tabular-nums`；大数字只有在它是主要信息时才放大。
- 微标签控制字距和长度。CJK 小字不要套用过大的拉丁字距。
- 展示标题允许不同字体家族，但正文和控件保持稳定，防止主题页变成字体样张。

## 纹理与技术层

- 网格、点阵、斜纹、等高线和半调优先使用 CSS/SVG 独立层，设置低对比并从辅助技术隐藏。
- 使用 mask 或渐变让纹理集中在需要的区域，而不是均匀覆盖整个页面。
- 描边字和巨型水印在小屏重新定位、裁切或移除，防止造成横向滚动。
- 装饰性测量线不能与真实流程线、图表轴或可点击路径视觉相同。

## 交互反馈

选择适合组件的反馈，而不是统一套黄条：

- 列表/导航：侧脊、底条、背景反转或位置变化；
- 地图：区域填充、轮廓、角钩和详情联动；
- 头像/技能：选中环、刻度或小状态角标；
- 卡片：内容显隐、边框或平面层变化；
- 主行动：实色填充、方向性擦入或短距离压下。

所有反馈同时支持 `:focus-visible`；动画关闭后状态仍清楚。

## 动效

- 小控件通常 120–240ms；大型空间转场按内容需要调整。
- 机械感可以来自擦除、路径推进、刻度变化和局部位移，不只来自斜纹平移。
- 不用持续动画填满静止页面；尊重 `prefers-reduced-motion`。
- 避免让文字在用户阅读时不断故障、闪烁或漂移。

## 图片回退与内容安全

- 重要图片使用稳定尺寸容器、合理 `object-fit` 和文本/图形回退。
- 不在生产 HTML 使用内联 `onerror` 作为唯一错误策略；按项目框架处理加载和失败状态。
- 不可控字符串测试中文、英文长词、数字和缺失值；需要时换行，不默认全部省略号。

## 静态导出

固定画布导出可复用 `engineering.md` 的字体等待、图片等待、溢出检测和 PNG 尺寸检查。画布宽度、根选择器和允许资源应由当前项目配置，不存在品牌级的固定画布宽度。
