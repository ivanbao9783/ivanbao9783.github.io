# Badcase 复盘方法论 · 索引

> 本目录是知识星图「Badcase 分析」星位的经验底座：一套把**单个失败样本**加工成**可复用经验资产**的方法论，
> 含 5 张 badcase 模式卡、单案分析报告模板与案例索引。
> 新案例进场时：先按 `SOP.md` 走一遍能力流水线（M0–M7），再按下方「案例 → 模式卡 投射表」**多标签**归档，最后把证据**融合**进对应模式卡。

## 目录导航

| 文件 | 角色 | 何时用 |
|---|---|---|
| `SOP.md` | 方法论主文档（能力流水线、卡点、中间件约定、失败处理） | 每个案例 |
| `_TEMPLATE.md` | 单案分析报告模板（①–⑩ 结构） | M1–M4 成文时 |
| `_TAXONOMY.md` | badcase 类型谱（模式清单 + 判定基准） | M4 归档时 |
| `cards/` | 5 张模式卡（识别 / 还原 / 资产 / 归因 / 修复 / 案例） | M4 投射 + M5 融合时 |

## 模式卡一览

| 卡 | 模式 | 识别指纹 | 代表案例 |
|---|---|---|---|
| [`cards/config-regression.md`](cards/config-regression.md) | 配置退化型 | 换配置后某类任务分数下降 | 推理档退化 |
| [`cards/near-miss-completeness.md`](cards/near-miss-completeness.md) | 近失完备性型 | 稳定只差极少数断言 | 近失完备性 |
| [`cards/structural-budget.md`](cards/structural-budget.md) | 结构性预算型 | 跨配置稳定撞步数上限 | 结构性预算 |
| [`cards/deterministic-zero.md`](cards/deterministic-zero.md) | 确定性全零型 | 跨运行稳定 0 分且未撞限 | 确定性全零 |
| [`cards/all-or-nothing-flip.md`](cards/all-or-nothing-flip.md) | 全有全无翻转型 | 同任务跨运行 0↔1 翻转 | 步数悬崖 |

## 案例 → 模式卡 投射表（多标签）

> 一个案例可命中多张卡（**多标签**）：主模式 = 主导根因所在卡，次模式 = 同时暴露的次要机制。
> 「融合」= 把该案例的证据（断言原文 / 工具调用密度 / 终态快照 / 修复项）写进对应卡的「代表案例 / 证据锚点」小节。

| 案例 | 主模式 | 次模式 | 落地状态 |
|---|---|---|---|
| AutomationBench · 确定性全零 | 确定性全零型 | — | ✅ 已融合（博文已发布） |
| AutomationBench · 推理档退化 | 配置退化型 | 结构性预算型 | ✅ 已融合（博文已发布） |
| AutomationBench · 步数悬崖 | 全有全无翻转型 | 结构性预算型 | ⏳ 待复盘（博文筹备中） |
| AutomationBench · 近失完备性 | 近失完备性型 | 全有全无翻转型 | ⏳ 待复盘（博文筹备中） |
| AutomationBench · 结构性预算 | 结构性预算型 | 配置退化型 | ⏳ 待复盘（博文筹备中） |

## 已发布博文（知识星图「Badcase 分析」星位）

| 博文 | 覆盖模式 |
|---|---|
| [AutomationBench Badcase 复盘：11 道跨配置稳定 0 分的题](/posts/automationbench-deterministic-zero/) | 确定性全零型 |
| [AutomationBench Badcase 复盘：推理档拉到 max，sales 域不升反降](/posts/automationbench-effort-regression/) | 配置退化型 |

## 类型统计

| 类型 | 案例数 |
|---|---|
| 配置退化型 | 1 |
| 全有全无翻转型 | 1 |
| 确定性全零型 | 1 |
| 近失完备性型 | 1 |
| 结构性预算型 | 1 |