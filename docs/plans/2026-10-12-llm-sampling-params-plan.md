# LLM 采样参数博文（temperature / top_p / top_k）写作计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 产出一篇机制科普博文，讲清 LLM 推理时 `temperature` / `top_p` / `top_k` 如何控制下一个词的采样，面向较广读者，偏重机制与可视化。

**Architecture:** 纯内容任务，零站点结构改动。正文落 `_posts/`，配图落 `assets/img/<slug>/`；末尾把本文挂到星图 `edge.inference`（推理知识）节点，使其 `planned → seeded`。

**Tech Stack:** Jekyll + Markdown；配图用 mermaid（管线图）与 Excalidraw（手绘风对比图）；验证用 GitHub Actions CI（**不做本地 bundle 构建**——Windows 装 bundler 易卡死子代理）。

**定位决策（本会话已定）:**
- 角度 = **A. 纯机制科普**（评测内容仅作一句背景式呼应，不展开）
- 分类 = `[周边领域]`（对应星图 edge 星团）
- 星图落点 = `edge.inference`（推理知识，当前 `planned`）
- 目标阅读时长 = 12–15 分钟

**环境注意（Windows/PowerShell）:**
- 所有命令在仓库根目录 `c:\Users\BaoYifan\Code\ivanbao.github.io` 下执行
- 每个任务的提交步骤：**提交前向站长展示变更摘要，获得确认后再 commit**（站长明确要求内容/代码改动需授权）
- PowerShell 不支持 heredoc；commit message 用双引号包裹
- **发文时间红线**：post front matter 的 `date` 必须早于实际 push 时刻（Jekyll 对 `future: false` 的文章，若 HH:MM 晚于 CI 构建时间会静默消失）；用「push 时刻 - 几分钟」设置

---

## 一、文件结构总览

| 动作 | 路径 | 职责 |
|---|---|---|
| Create | `_posts/2026-XX-XX-llm-sampling-params.md` | 博文正文（头部钩子 + 7 节 + 速查表） |
| Create | `assets/img/llm-sampling-params/temperature-distribution.png` | 温度对分布形状的影响（脚本生成） |
| Create | `assets/img/llm-sampling-params/sampling-order-pipeline.excalidraw` | 执行顺序 + 输入输出图源文件 |
| Create | `assets/img/llm-sampling-params/topk-vs-topp.excalidraw` | top_k vs top_p 截断对比图源文件 |
| Create | `assets/img/llm-sampling-params/*.png` | 由上述 Excalidraw 源文件导出（站长操作）；**提交前必须已存在**（正文会引用） |
| Modify | `_data/starmap.yml` | 将本文挂到 `edge.inference`，status `planned → seeded` |
| 不动 | `_domains/edge/inference.md` | 已有总览正文，无需改动 |
| 不动 | 布局 / JS / CSS | 本任务不改动站点承载层 |

---

## 二、Front matter 草案

```yaml
---
title: "LLM 是怎么“掷骰子”的：温度、top_p、top_k 到底在控制什么？"
author: ivanbao9783
date: 2026-XX-XX HH:MM:00 +0800   # 见「发文时间红线」
categories: [周边领域]
tags: [LLM, 推理, 采样, temperature, top_p, top_k]
description: "从 logits 到下一个词：拆解 temperature / top_p / top_k 三个参数分别在控制什么。"
mermaid: true
---
```

**标题（已定稿）**
《LLM 是怎么"掷骰子"的：温度、`top_p`、`top_k` 到底在控制什么？》

---

## 三、文章结构（分节内容计划）

| # | 小节 | 核心内容 | 参考字数 | 配图 |
|---|---|---|---|---|
| — | 开场钩子 | 同一问题问两次、答案却不同——不是"发挥不稳"，而是每次都在按概率抽签 | ~200 | — |
| — | 📋 读完你将了解 | 5 条清单（掷骰子心智模型 / 三参数分工 / 执行顺序 / 典型取值 / 速查表） | ~80 | — |
| 1 | 模型每一步，其实在"掷骰子" | logits 是什么 → softmax 变概率 → 贪心 vs 采样 | ~500 | 执行顺序 + 输入输出图（**真实版**，突出三参数） |
| 2 | 温度：控制骰子"偏"到什么程度 | 公式 `p = softmax(z/T)`；T<1 锐化 / T>1 拉平；`T→0` 退化为贪心；`T=0` 实现特判 | ~600 | 温度三合一分布对比图 |
| 3 | `top_k`：只留分数最高的 k 个 | 机制；"固定数量"的软肋（不随置信度自适应） | ~400 | （并入下节对比图） |
| 4 | `top_p`：留到累积概率够 p 为止 | 核采样机制；数量自适应；为何比 top_k 更主流；引用 Holtzman et al. 2019 | ~450 | top_k vs top_p 截断对比图（Excalidraw） |
| 5 | 三者一起用时，顺序有讲究 | `top_k` 只看排序、不受温度影响；`top_p` 依赖概率、受温度影响；不同框架默认顺序不同 | ~450 | 引用第 1 节流程图（不另配图） |
| 6 | 常见误区 | `temperature=0` 未必可复现；`top_k`/`top_p` 可叠加；贪心/beam search 下三者基本失效 | ~350 | — |
| 7 | 一页速查表 | 参数 · 作用对象 · 机制 · 典型取值 · 效果 | ~150 | 原生表格 |
| — | 结尾 | 一句背景式呼应：这也是评测里必须锁死采样参数的原因 | ~100 | — |

**写作原则**：渐进式层级、短句、留白；每节先给直觉再补公式；不炫技、不做源码考古（源码细节仅作一句提及）。

---

## 四、配图清单（预埋位置 + 内容指令）

| 图 | 位置 | 形式 | 内容指令 |
|---|---|---|---|
| 执行顺序 + 输入输出图（流程总览，**真实版**） | 第 1 节（第 5 节引用） | **两步**：① mermaid 草图（**构图已确认**）→ ② 转 Excalidraw（圆角 + 手写字体），源文件存 `sampling-order-pipeline.excalidraw`，PNG 由站长导出 | **忠于 HF/vLLM 实现**：主干全程是 **logits**，`top_k`/`top_p` 都在 logits 上做掩码，`softmax` **只在最后做一次**；`top_p` 的正式输入是 logits，仅内部临时算一次概率判断阈值。**颜色编码**：灰=logits / 蓝=概率 / 黄=三参数。<br/>**内置真实样例**（示意 prompt「我养了一只 ___」，候选 猫/狗/动物/宠物/房子/汽车）：<br/>原始 logits `3.0 / 2.0 / 1.2 / 0.8 / -1.0 / -2.0` →[温度 T=0.5]→ `6.0 / 4.0 / 2.4 / 1.6 / -2.0 / -4.0` →[top_k=4]→ `6.0 / 4.0 / 2.4 / 1.6 / -∞ / -∞` →[top_p=0.9]→ `6.0 / 4.0 / -∞ / -∞ / -∞ / -∞` →[softmax]→ `猫0.881 / 狗0.119` →[采样]→ `猫`。`top_p` 节点配**虚线气泡**："内部临时算概率：0.851 → 0.966 ≥ 0.9"。<br/>**图下脚注**：顺序随实现/版本而异；部分教程把 softmax 提前、结果等价 |
| 温度三合一分布图 | 第 2 节 | PNG（生成图） | 同一组 logits 下三条分布对比：T=0.5（尖锐）/ T=1.0（原样）/ T=2.0（拉平）；横轴为 top-N 候选，纵轴为概率；需一眼看出"形状变化而非排序变化" |
| top_k vs top_p 截断对比图 | 第 3–4 节交界 | Excalidraw→PNG | 左：top_k 固定砍到剩 4 个（数量固定）；右：top_p 累积到 90% 自适应保留（数量随分布变）；手绘风、圆角、手写字体 |
| 速查表 | 第 7 节 | 原生表格 | 参数 / 作用对象 / 机制 / 典型取值 / 一句话效果 |

**图片存放**：`assets/img/llm-sampling-params/`，文件名不含空格；引用用 `/assets/img/llm-sampling-params/<filename>`（根绝对路径）。

---

## 五、事实核查清单（已全部核实，结论如下）

- [x] **执行顺序**：主流顺序 = **`重复惩罚 → 温度 → top_k → top_p → (min_p)`**。
  - **当前 HF Python（transformers）**：`_get_logits_processor` 先应用 `RepetitionPenalty` 等；`_get_logits_warper` 内的顺序为 **`TemperatureLogitsWarper → TopKLogitsWarper → TopPLogitsWarper`**（即 温度 → top_k → top_p）。来源：DeepWiki《Generation System Internals》（索引 2025-11），`src/transformers/generation/utils.py`。
  - **顺序随版本而变**：老版 HF Python（**v3.5.1**）`_get_logits_warper` 为 **`top_k → top_p → temperature`**，与现行相反（来源：HF v3.5.1 官方源码页）。→ **正文以当前版为准，脚注说明"顺序会随框架/版本变化"**。
  - **实现细节**：`top_k`/`top_p` 均在 **logits** 上做掩码，`softmax` **只在最后做一次**；`top_p` 内部临时算一次概率判断阈值（→ 第 1 节配图按此"真实版"绘制）。
- [x] **框架差异（vLLM）**：vLLM v1 `Sampler` 官方步骤：先在 logits 上做惩罚 → **应用温度** → 应用 argmax-invariant 处理器（**min_p**）→ **top_k 和/或 top_p** → 采样。即顺序同为 **温度 → 过滤**，与 HF 一致；差异仅在 `min_p` 的插入位置（vLLM 在 top_k/top_p **之前**，HF Swift 在**之后**）。
- [x] **`temperature=0` 的处理**：
  - **vLLM**：`temperature` 文档明确"**Zero means greedy sampling**"；采样器以 `_SAMPLING_EPS = 1e-5` 为界，`temperature < eps` 时回退到 greedy。
  - **HF（transformers）**：`TemperatureLogitsWarper` 要求温度**严格为正**，传 0 会报错并提示"If you're looking for greedy decoding strategies, set `do_sample=False`"。
  - → 正文表述：**`T→0` 数学上退化为 one-hot/贪心**；工程实现里 `temperature=0` 通常被特判为贪心（vLLM）或改用 `do_sample=False`（HF）。
- [x] **核采样出处**：**Holtzman, Buys, Forbes, Choi (2019)《The Curious Case of Neural Text Degeneration》, arXiv:1904.09751**（2019-04-22）。标题、年份无误。
- [x] **公式与边界**：`p_i = softmax(z_i / T)`；`T→0⁺` 时分布趋于 **one-hot（argmax）**；`T` 单调变换不改变排序 → **`top_k` 结果与温度无关**（只看排序），而 **`top_p` 依赖概率、受温度影响**（温度升高会放大 nucleus，来源：Ultralytics 术语页"top-p 在温度之后计算，温度越高 nucleus 越大"）。
- [x] **延伸项 `min_p`**：来源 **Nguyen et al.《Turning Up the Heat: Min-p Sampling for Creative and Coherent LLM Outputs》, arXiv:2407.01082（2024-07-01 提交，ICLR 2025 Oral）**，已被 HF Transformers、vLLM 等采纳。定义：`p_i ≥ min_p × p_max`（锚定相对峰值）。→ **结尾提一句，不展开**。
- [x] **典型默认值**（供速查表）：HF `temperature=1.0`、`top_k=50`、`top_p=1.0`（默认即禁用过滤）。

> 核查结论直接写进正文对应小节，并在文档内以脚注/引用形式标注来源。

---

## 六、Tasks（写作任务分解）

### Task 1: 事实核查
**Files:** 只读检索（HF 源码 / 论文），不改文件。
- [ ] **Step 1**：翻 HF `logits_process.py` 与 `_get_logits_processor`，确认三者执行顺序，记录版本号
- [ ] **Step 2**：核对 vLLM/SGLang 的顺序差异（可不深挖，记录结论即可）
- [ ] **Step 3**：核对 Holtzman 2019 论文标题/年份
- [ ] **Step 4**：把结论整成一段"顺序说明"，供第 5 节直接引用

### Task 2: 生成配图
**Files:** Create `assets/img/llm-sampling-params/` 下的图片与 Excalidraw 源文件。
- [ ] **Step 1（执行顺序图）**：先用 mermaid 出草图 → 站长确认构图 → 转 Excalidraw 手绘（圆角 + 手写字体），源文件存 `sampling-order-pipeline.excalidraw`
- [ ] **Step 2（温度图）**：生成"温度三合一分布图"（T=0.5/1.0/2.0 对比，需体现形状变化），存 `temperature-distribution.png`
- [ ] **Step 3（截断对比图）**：用 Excalidraw 画"top_k vs top_p 截断对比图"（圆角 + 手写字体），源文件存 `topk-vs-topp.excalidraw`
- [ ] **Step 4**：确认源文件/图片位于对应目录、文件名无空格；**两张 Excalidraw 的 PNG 由站长导出**，且提交前必须已存在

### Task 3: 撰写正文
**Files:** Create `_posts/2026-XX-XX-llm-sampling-params.md`
- [ ] **Step 1**：按第三节结构写全文（含 mermaid 管线图与内嵌图片引用）
- [ ] **Step 2**：自检：`mermaid: true` 已设 / 图片路径均为根绝对路径 / 无未来日期（见时间红线）
- [ ] **Step 3**：向站长展示全文摘要，确认内容无误

### Task 4: 更新星图归属
**Files:** Modify `_data/starmap.yml`
- [ ] **Step 1**：在 `edge.inference` 节点的 `posts` 加入本文文件名，`status: planned → seeded`
- [ ] **Step 2**：确认 YAML 缩进与既有条目一致

### Task 5: 提交 + CI 验证
- [ ] **Step 1**：向站长展示变更摘要（正文 + 2 图 + starmap.yml），确认后提交
```powershell
git add _posts/ assets/img/llm-sampling-params/ _data/starmap.yml
git commit -m "post: how temperature/top_p/top_k control LLM sampling"
git push
```
- [ ] **Step 2**：确认 GitHub Actions Pages Deploy 工作流通过
- [ ] **Step 3**：线上确认文章可见（必要时 Ctrl+F5 硬刷新）、星图"推理知识"节点变为有内容状态

---

## 七、开放项（待定）

- [x] **标题**：已定稿 —— 《LLM 是怎么"掷骰子"的：温度、`top_p`、`top_k` 到底在控制什么？》
- [x] **`min_p`**：已定 —— 结尾提一句，不展开（注意与 `top_p` 的区别：锚定相对峰值 vs 绝对总量）
- [ ] **post 日期/slug**：发文时按推送时刻确定（slug 默认 `llm-sampling-params`）
- [ ] **星图视觉**：`edge.inference` 升为 seeded 后，是否需要额外确认星图渲染（改动仅 posts/status，预计无需改 SVG 组件）