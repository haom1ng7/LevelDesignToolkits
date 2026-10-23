# 官方来源登记表

本文件登记本 Skill 设计结论所依据的官方素材**来源元数据**，供维护者与公开读者判断每条结论的可复核程度。它不包含任何官方图片，也不是普通生成任务的必读文件；Build / Audit / Redesign 在没有这些素材、没有网络的情况下照常工作。

本登记表记录维护者使用的官方素材类别与派生关系，不归档官方原图。2026-09-05 起的新来源提供可访问的页面或原帖链接；历史条目尚未全部补链。链接内容可能变化，证据编号不保证历史画面可逐项复现。渠道发现方法见 `official-sources.md`。

## 可用性等级

| 等级 | 含义 |
| --- | --- |
| `official-web-observation` | 来自官方网页（endfield.hypergryph.com）的观察，具体可见状态按日期与验证范围记录；内容可能随更新变化 |
| `official-published-material` | 来自官方公开发布的运营物料或 KV；新条目链接原帖，历史未补链条目可在官方渠道检索同名物料 |
| `private-game-capture` | 维护者本地持有的游戏实机截图，不随仓库分发；公开读者无法直接复核，只能视为维护者观察 |

置信度：`high` = 多张画面支持，或其派生规则同时被其他条目交叉支持；`medium` = 单一画面、特征明确，但只支持家族/条件层结论；`low` = 未细读或仅粗略浏览。

派生规则以"文件 › 章节"指向，不另设规则编号。

## 公开网页

| ID | 来源 | 类型 | 可用性 | 观察日期 | 置信度 | 派生规则 |
| --- | --- | --- | --- | --- | --- | --- |
| EV-WEB-01 | endfield.hypergryph.com 首页 hero（墨迹+角色群像+版本章节 chip） | official-web | official-web-observation | 2026-08-22 | high | SKILL › 中性材质；web › 宏观结构；surface-families › H |
| EV-WEB-02 | 同站 LORE 区（黄带头+暗色内容板+黑底分页器） | official-web | official-web-observation | 2026-08-22 | high | web › 分节语法；surface-families › H |
| EV-WEB-03 | 同站 GAMEPLAY 区（巨型 // 跑马幽灵字+黄色竖排侧签+圆形翻页钮） | official-web | official-web-observation | 2026-08-22 | high | web › 分节语法；official-motifs › 描边大字 |
| EV-WEB-04 | 同站嵌入的交互式版本日历 | official-web | official-web-observation | 2026-08-22 | high | infographic › 时间轨型；surface-families › J |
| EV-WEB-05 | [官网「雪凇幽梦」](https://endfield.hypergryph.com/)：窄屏首页、干员、LORE、GAMEPLAY、AIC（453 × 822）；宽屏首屏与 LORE 已复核（1440 × 900、1568 × 783），其余分节宽屏画面与轮播操作未验证 | official-web | official-web-observation | 2026-09-05 | high | web › 视觉语言、响应式；surface-families › H；official-motifs › 技术副层 |
| EV-WEB-06 | [官网版本日历](https://endfield.hypergryph.com/#calendar)「雪凇幽梦」刊头、时间轴与正文三张静态资产（含时间轴像素取色）；页面显隐与交互未验证 | official-web | official-web-observation | 2026-09-05 | high | infographic › 时间轨型；surface-families › J；official-motifs › 主题专用层 |

## 游戏实机界面（维护者本地截图）

| ID | 素材 | 类型 | 可用性 | 观察日期 | 置信度 | 派生规则 |
| --- | --- | --- | --- | --- | --- | --- |
| EV-UI-01 | 主界面（径向枢纽：中央圆形地图+弧线磁贴+胶囊货币） | game-ui | private-game-capture | 2026-08-22 | medium | surface-families › A；app-ui › 系统 chrome |
| EV-UI-02 | 实机 HUD（角落成组、圆形技能环、键位提示层、导航路径带） | game-ui | private-game-capture | 2026-08-22 | high | surface-families › A；official-motifs › 圆弧 |
| EV-UI-03 | 区域地图（暗底地形挤出+等高线+斜纹未探索区+选区光柱） | game-ui | private-game-capture | 2026-08-22 | medium | surface-families › B |
| EV-UI-04 | 地区建设（暗底+青色主题+白色管理卡+网点化 3D 巨物） | game-ui | private-game-capture | 2026-08-22 | medium | surface-families › B；SKILL › 颜色角色（青=地区主题） |
| EV-UI-05 | 地区事务总览 ×2（青柠 / 青蓝同构换色表格页） | game-ui | private-game-capture | 2026-08-22 | high | SKILL › 主题接管；surface-families › B/F |
| EV-UI-06 | 干员总览 ×3（摄影棚+左数据列+右黄色斜楔；天赋提示） | game-ui | private-game-capture | 2026-08-22 | high | surface-families › C；official-motifs › 斜楔 |
| EV-UI-07 | 能力扩延（整页黄色扇面组织技能条与天赋节点） | game-ui | private-game-capture | 2026-08-22 | medium | SKILL › 空间层级；surface-families › C |
| EV-UI-08 | 角色潜能 ×2（实体道具拼贴画布+黄色角标签+富文本详情板） | game-ui | private-game-capture | 2026-08-22 | high | surface-families › C；official-motifs › 实体道具与人的痕迹 |
| EV-UI-09 | 编队（站位刻度圈+幽灵大数字+浮动名牌+白胶囊行动） | game-ui | private-game-capture | 2026-08-22 | medium | surface-families › C；app-ui › 形状语义 |
| EV-UI-10 | 角色装备 / 角色武器 / 角色升级（装备卡、套装富文本、右缘停靠轨） | game-ui | private-game-capture | 2026-08-22 | medium | surface-families › C；app-ui › 颜色与主题 |
| EV-UI-11 | 干员 Box（名册卡橙色 LV 带、选中角括号） | game-ui | private-game-capture | 2026-08-22 | high | SKILL › 颜色角色（橙）；app-ui › 交互状态 |
| EV-UI-12 | 贵重品库（浅底等高线+白卡矩阵+稀有度底部渐变+倒计时胶囊） | game-ui | private-game-capture | 2026-08-22 | high | surface-families › D；techniques › 稀有度渐变 |
| EV-UI-13 | 礼包商城（胶囊类目条+实体商品摄影卡+徽章叠层） | game-ui | private-game-capture | 2026-08-22 | high | surface-families › D |
| EV-UI-14 | 装备制造（暗色工坊+白色反转页签+圆形展台+白胶囊 CTA） | game-ui | private-game-capture | 2026-08-22 | high | surface-families › D；app-ui › 形状语义 |
| EV-UI-15 | 武器图鉴 / 武器升级 / 武器潜能（稀有度底边条、准星占位、规格铭牌、荧光绿增益） | game-ui | private-game-capture | 2026-08-22 | high | SKILL › 颜色角色；surface-families › D |
| EV-UI-16 | 工业技能树（浅纸底+黄色图标板节点+直角折线+幽灵分期数字） | game-ui | private-game-capture | 2026-08-22 | high | surface-families › E |
| EV-UI-17 | 工业简报（深色数据行带+行内面积图+蓝/黄/红数字语义；2026-08-22 复核取色：生产蓝 #2a84b4） | game-ui | private-game-capture | 2026-08-22 | high | surface-families › F；infographic › 数据简报型；SKILL › 颜色角色（蓝） |
| EV-UI-18 | 干员聊天（深色会话行+黄色未读横幅+双色气泡+像素装饰条） | game-ui | private-game-capture | 2026-08-22 | high | surface-families › G；SKILL › 形状语义 |
| EV-UI-19 | 游戏内百科 ×2（蓝图网格图纸式图标+幽灵编号+黑色标本竖带） | game-ui | private-game-capture | 2026-08-22 | high | surface-families › G；official-motifs › 网格 |
| EV-UI-20 | 任务 / 每日任务（优先级语义、选中白色反转、完成态深底黄区） | game-ui | private-game-capture | 2026-08-22 | high | SKILL › 形状语义（状态反转）；app-ui › 交互状态 |
| EV-UI-21 | 好友列表（浅外壳+深色行带+个性化头像框） | game-ui | private-game-capture | 2026-08-22 | medium | surface-families › G |
| EV-UI-22 | 干员寻访 / 武器寻访（角色主题整页接管、×1/×10 白黄按钮对） | game-ui | private-game-capture | 2026-08-22 | high | SKILL › 主题接管；app-ui › 形状语义 |
| EV-UI-23 | 活动中心 / 常驻活动 / 影拓丰碑画廊（微缩场景画布、彩色头带卡、全息徽章） | game-ui | private-game-capture | 2026-08-22 | high | surface-families › I；official-motifs › 实体道具与人的痕迹 |
| EV-UI-24 | 主界面磁贴特写（双框偏移、黑色象形图标、橙色通知菱形） | game-ui | private-game-capture | 2026-08-22 | medium | app-ui › 系统 chrome |
| EV-UI-26 | 通行证任务页（经验条与任务进度条灰轨+黄填充、完成行降灰+COMPLETED 幽灵字、+6% 荧光绿增益 chip、白胶囊前往、品红通行证刊头） | game-ui | private-game-capture | 2026-08-22 | medium | SKILL › 颜色角色（黄=进度）；surface-families › G |
| EV-UI-25 | 武器列表卡 ×4（稀有度底部渐变 蓝/紫/金/橙，最高档叠斜纹；NEW 黄签；锁定=左下锁图标；等高线底纹；装备者圆头像）；渐变实测 #24bafc / #904ef6 / #fcba00 / #fc6c00 | game-ui | private-game-capture | 2026-08-22 | high | SKILL › 颜色角色（稀有度、黄=新内容）；techniques › 稀有度渐变；surface-families › D |

## 官方运营物料与 KV

| ID | 素材 | 类型 | 可用性 | 观察日期 | 置信度 | 派生规则 |
| --- | --- | --- | --- | --- | --- | --- |
| EV-ED-01 | 版本日历「向渊行」长图 | editorial | official-web-observation（同 EV-WEB-04） | 2026-08-22 | high | infographic › 时间轨型；surface-families › J |
| EV-ED-02 | 干员介绍备忘（紫色主题、// 章节、访谈、留言板、手写批注） | editorial | official-published-material | 2026-08-22 | high | infographic › 档案型（人物备忘） |
| EV-ED-03 | 威胁档案（水墨、红黑白、中文数字层级轨、档案道具） | editorial | official-published-material | 2026-08-22 | high | infographic › 档案型（威胁档案） |
| EV-ED-04 | 集成工业气体说明（编号章节带、红笔批注、荧光笔） | editorial | official-published-material | 2026-08-22 | high | infographic › 系统图解型；official-motifs › 人的痕迹 |
| EV-ED-05 | 云·终末地测试公告（标签行、Q&A、荧光笔、价格卡） | editorial | official-published-material | 2026-08-22 | high | infographic › 通告型 |
| EV-ED-06 | 武器档案预告（竖排毛笔刊头、规格铭牌、紫色接管） | editorial | official-published-material | 2026-08-22 | medium | infographic › 档案型（武器档案） |
| EV-ED-07 | 战争回响赛季预告（红青故障、编号轮换区块） | editorial | official-published-material | 2026-08-22 | medium | imagegen › 战斗主题；surface-families › I |
| EV-ED-08 | 版本前瞻系列 ×9（寻访、故事、玩法、活动×2、KV、更新、系统优化、未来） | editorial | official-published-material | 2026-08-22 | high | infographic › 前瞻/回顾卷轴型、更新日志；surface-families › J |
| EV-ED-09 | 武陵旅社活动期刊 ×13（吉祥物主持、固定刊头、地点标签卡） | editorial | official-published-material | 2026-08-22 | high | infographic › 期刊/杂志型 |
| EV-ED-10 | 角色叙事活动 KV（拍立得拼贴+胶带+紫故障） | kv | official-published-material | 2026-08-22 | high | imagegen › 照片拼贴；surface-families › I |
| EV-ED-11 | 竞技大会 KV（扁平宣传画：巨型拳头+有限色板+速度斜纹） | kv | official-published-material | 2026-08-22 | high | imagegen › 扁平宣传画 |
| EV-ED-12 | 早期活动图 ×3 | kv | official-published-material | 2026-08-22 | low | 未单独派生规则 |
| EV-ED-13 | 明日方舟终末地：[后勤备忘 - 独家揭秘!｜提弗洛斯](https://www.skland.com/article?id=6277775)，1 张人物长图 | editorial | official-published-material | 2026-09-05 | high | infographic › 档案型；surface-families › J |
| EV-ED-14 | 明日方舟终末地：[高校认证已上线](https://www.skland.com/article?id=6271978)，2 张活动说明长图 | editorial | official-published-material | 2026-09-05 | high | infographic › 参与招募与奖励说明型；surface-families › J |
| EV-ED-15 | 森空岛塔卫二勘测局：[雪域旅行摄影](https://www.skland.com/article?id=6274041)，正文及横幅、相机示意、奖励图 3 张 | editorial | official-published-material | 2026-09-05 | medium | infographic › 参与招募与奖励说明型；surface-families › J |
| EV-ED-16 | 明日方舟终末地山团团：[「雪凇夜泊」周边介绍](https://www.skland.com/article?id=6279270)，正文 9 图中选看入口、活动说明、商品详情与实物展示 4 图 | editorial | official-published-material | 2026-09-05 | high | infographic › 商品目录型、色彩、形状与排印；surface-families › J；official-motifs › 实体道具与人的痕迹 |
| EV-ED-17 | 终末地Delta机器人：[Delta 勘探实录——雪松林](https://www.skland.com/article?id=6263875)，6 张场景预览 | scene-preview | official-published-material | 2026-09-05 | medium | surface-families › I；official-motifs › 主题专用层 |
| EV-ED-18 | 终末地蓬蓬：[特邀嘉宾Q&A-梨诺](https://www.skland.com/article?id=6198094)，1 张问答长图 | editorial | official-published-material | 2026-09-05 | medium | infographic › 主持问答与幕后讲解型；surface-families › J |
| EV-ED-19 | 终末地蓬蓬：[茶歇时间4](https://www.skland.com/article?id=5930982)，3 张静态图与 2 张动图（首/中/末帧），主题为体积云制作 | editorial | official-published-material | 2026-09-05 | high | infographic › 主持问答与幕后讲解型；surface-families › J |
| EV-ED-20 | 塔卫二记事社：[这是秘密武器？](https://www.skland.com/article?id=6282722)，《加油吧！终末地》第 12 话，封面、正文与尾页共 5 图 | comic | official-published-material | 2026-09-05 | medium | infographic › 连载漫画型；surface-families › J；official-motifs › 主题专用层 |

## 维护规则

- 新增来源时补一行：类别、可用性、观察日期、置信度与派生规则；不登记本地路径、哈希或文件名（那些写在本地私有索引里）。
- 一条规则若只有单张画面支持（无论公开与否），应在对应文件中保持为家族/条件/主题层而非核心 DNA；进入核心 DNA 需至少两个独立界面、主题或媒介交叉支持，或明确的官方设计规范。同一活动的转发与裁片不重复计票。
- 官方网页更新后，`official-web-observation` 条目需复核；旧观察保留日期与适用版本。无法再支持其原结论的条目降低置信度或撤回，不将历史画面冒充当前验证。
- 新图从登记到验收的完整步骤见 `evidence-map.md › Study 操作流程`；本表只管来源元数据与派生规则列，不记录观察内容。
