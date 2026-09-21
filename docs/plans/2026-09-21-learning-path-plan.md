# 学习路径规划（Learning Path）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 落地学习路径设计——创建优先级驱动的路径文档（含面试考点速记，仅 docs/ 层）+ 为全部 15 个节点页补充极简总览（站点零面试痕迹）。

**Architecture:** 纯文档任务，零代码改动。任务①产出 `docs/plans/2026-09-21-learning-path.md`（docs/ 已被 `_config.yml` exclude，不公开渲染）；任务②为 `_domains/{cluster}/{node}.md` ×15 追加总览正文（保留 front matter）。不改动 starmap.yml / 布局 / JS / CSS。

**Tech Stack:** Jekyll + Markdown；验证用 Grep 措辞检查 + GitHub Actions CI（**不做本地 bundle 验证**——Windows 装 bundler 易卡死子代理，一律推 CI 验证）。

**设计文档:** `docs/specs/2026-09-21-learning-path-design.md`

**环境注意（Windows/PowerShell）:**
- 所有命令在仓库根目录 `c:\Users\BaoYifan\Code\ivanbao.github.io` 下执行
- 每个任务的提交步骤：**提交前向站长展示变更摘要，获得确认后再 commit**
- PowerShell 不支持 heredoc，commit message 直接用双引号包裹

---

## 文件结构总览

| 动作 | 路径 | 职责 |
|---|---|---|
| Create | `docs/plans/2026-09-21-learning-path.md` | 学习路径文档（含 15 节点夯实计划 + 考点速记 + P3 冲刺准备） |
| Modify | `_domains/eval-system/{harness,paradigm,hotspot,hardware,performance}.md` ×5 | 评测系统星团节点页总览 |
| Modify | `_domains/dataset/{corpus,construction,compression}.md` ×3 | 数据集星团节点页总览 |
| Modify | `_domains/scoring/{metrics,observability,anomaly}.md` ×3 | 评分与诊断星团节点页总览 |
| Modify | `_domains/edge/{agent,model-arch,inference,training}.md` ×4 | 周边领域星团节点页总览 |

**节点页总览统一结构**（front matter 之后追加，中文，每页 3 小节）：

```markdown
## 领域定义

（站在业内视角给该领域下定义：业内如何界定、边界在哪里，1 段）

## 核心价值

（该领域解决什么问题、为什么不可或缺，1 段）

## 知识版图与规划

（该领域的知识版图：关键问题/方法/工具/代表性工作，以及本站的后续内容规划——查缺补漏视角；已有博文自然带出但不作为内容锚点，1 段或短列表）
```

**措辞红线**：节点页不得出现 面试/求职/考点/简历/offer/冲刺 等求职导向字眼，也不得出现 星图/星团/节点 等站点承载概念（评测领域自身术语除外）。领域描述以业内话语体系为准。

---

### Task 1: 创建学习路径文档

**Files:**
- Create: `docs/plans/2026-09-21-learning-path.md`

- [ ] **Step 1: 写入完整文档**

内容如下（全文写入，front matter 无需，纯 Markdown）：

````markdown
# 学习路径 · 评测工程师能力夯实计划

> 岗位画像配比：A 评测系统岗 60% / B 数据与考题设计岗 30% / C 模型底层 10%。
> 本文档为私有规划（docs/ 不公开渲染），站点页面零面试痕迹。
> 每节点含「自定补充」小节：站长自行追加的学习条目与基线同等对待。

## 1. 路径总览（优先级驱动，不绑定月份）

| 优先级 | 主题 | 节点任务 |
|---|---|---|
| P0 | 评分指标体系 | metrics: planned → deep |
| P0 | 诊断能力深耕 | observability → deep、anomaly → deep |
| P1 | 数据集构建与数据质量 | construction → deep、compression → deep、hotspot → deep |
| P2 | Agent 知识 | agent → seeded |
| P2 | 推理/训练/模型轻量 | inference / training / model-arch / performance → seeded；hardware → deep |
| P3 | capstone：mini 评测平台 | 端到端贯通，系列博文反哺各节点 |

- 排序原则：P0（核心圈补全，A 向主干）→ P1（数据侧深耕，B 向）→ P2（外圈扩展，C 向及收尾）→ P3（项目夯实，最终收尾）
- 升级标准：planned→seeded 需 ≥1 篇博文；seeded→deep 需 ≥2 篇 + 实践产出
- 外圈节点（agent/inference/training/model-arch）与 performance 到 seeded 即止
- P3 建议在 P0-P2 主体完成后启动，详细设计届时单独脑暴

## 2. 全节点夯实计划（15/15）

### 2.1 评测系统（核心圈）

#### harness 评测框架（deep · 持续深耕 · 全程）

- **学习目标**：掌握评测框架的架构设计要素（沙箱隔离、并行调度、结果收集、防作弊），具备从零设计 harness 的能力
- **产出标准**：全程维护性博文 ≥2 篇（框架源码对比、CI 集成细节）；P3 作为 capstone 主载体
- **面试考点速记**：
  - harness 设计要素：沙箱隔离 / 环境一致性 / 并行调度 / 结果收集
  - test.patch 防作弊机制：评分期注入、agent 不可见
  - EvalScope / Harbor 等框架的架构对比
  - 评测如何接入 CI/CD：门禁指标选择（确定性、低延迟）
- **自定补充**：（站长追加）

#### paradigm 评测范式（deep · 持续深耕）

- **学习目标**：系统掌握从静态 benchmark 到 agentic 评测的范式演进；深入 LLM-as-judge 的偏差与校准
- **产出标准**：补 1 篇 LLM-as-judge 偏差与校准专题；P3 输出范式选型方法论
- **面试考点速记**：
  - 范式演进：静态基准 → 动态/交互式 → agentic
  - LLM-as-judge 偏差类型：位置偏差 / 长度偏差 / 自我偏好
  - 校准方法：人工标注对齐、多 judge 投票、偏差量化
  - 评测范式与产品形态的匹配逻辑
- **自定补充**：（站长追加）

#### hotspot 评测热点（seeded → deep · P1）

- **学习目标**：将热点跟踪机制化——建立污染/泄漏/新基准的跟踪与复盘方法
- **产出标准**：第 2 篇博文：污染/泄漏事件复盘；累计 ≥2 篇升 deep
- **面试考点速记**：
  - 数据污染的检测方法（n-gram 重叠 / embedding 相似度）与防控
  - 知名污染/泄漏事件案例
  - 如何评价一个"新基准"的价值与可信度
- **自定补充**：（站长追加）

#### hardware 硬件评测（seeded → deep · P2）

- **学习目标**：硬件评测方法论与指标体系；能力评测与硬件性能在端侧的耦合
- **产出标准**：第 2 篇博文：硬件评测方法论与指标体系；累计 ≥2 篇升 deep
- **面试考点速记**：
  - 端侧评测的指标体系（延迟/能耗/内存）
  - 能力-性能联合评测的思路
- **自定补充**：（站长追加）

#### performance 性能评测（planned → seeded · P2）

- **学习目标**：LLM 推理性能基准：指标定义、测量方法、与能力评测的关系
- **产出标准**：第 1 篇博文：LLM 推理性能基准（吞吐/延迟/SLO）
- **面试考点速记**：
  - 吞吐 / 延迟 / SLO 的定义与测量口径
  - 性能-能力权衡：量化/上下文长度对两者的影响
- **自定补充**：（站长追加）

### 2.2 数据集

#### corpus 开源数据集全景（deep · 持续深耕 · 全程）

- **学习目标**：持续扩展数据集版图认知：分类体系、版本演进、选型依据
- **产出标准**：持续输出数据集解读（延续现有系列）；P3 为 capstone 出题做选型储备
- **面试考点速记**：
  - 主流基准构成与版本演进（SWE-bench 家族、ALE、AutomationBench 等）
  - 给定场景的基准选型逻辑
  - 数据集质量评估维度
- **自定补充**：（站长追加）

#### construction 数据集构建（planned → deep · P1）

- **学习目标**：从消费数据集到生产数据集：构建 pipeline、质量控制、污染防控
- **产出标准**：2 篇博文（构建方法论：合成/人工/真实任务抽取 + 污染防控）；P3 在 capstone 中实践出题，升 deep
- **面试考点速记**：
  - 构建 pipeline 三模式：合成 / 人工标注 / 真实任务抽取，各自优劣与成本
  - 质量控制：一致性校验、难度分层、去重
  - 污染防控：时间切分、私有测试集、动态更新
- **自定补充**：（站长追加）

#### compression 数据集压缩（seeded → deep · P1）

- **学习目标**：数据集压缩技术及其对评测结论稳定性的影响
- **产出标准**：第 2 篇博文：压缩对评测结论稳定性的影响；累计 ≥2 篇升 deep
- **面试考点速记**：
  - 压缩/采样方法：代表性子集选择、蒸馏
  - 压缩后评测结论与全量的一致性如何验证
- **自定补充**：（站长追加）

### 2.3 评分与诊断

#### metrics Rubric 与指标设计（planned → deep · P0）

- **学习目标**：Rubric 设计模式与指标体系设计；确定性指标与 LLM-judge 指标的分工
- **产出标准**：2 篇博文（Rubric 设计模式 + 确定性 vs LLM-judge 指标体系），升 deep
- **面试考点速记**：
  - Rubric 设计模式：二值 / 打分 / 加权 / 分维度
  - 确定性指标 vs LLM-judge：适用场景、成本、可复现性
  - pass@k、consensus@k 等指标的定义与计算
  - CI 门禁指标选择原则：确定性、低延迟（门禁用）、LLM-judge（趋势分析用）
- **自定补充**：（站长追加）

#### observability 可观测性（seeded → deep · P0）

- **学习目标**：评测全链路的可观测：trace 采集、分析、回归定位工作流
- **产出标准**：第 2 篇博文：trace 分析与回归定位工作流（基于 Langfuse 实践）；累计 ≥2 篇升 deep
- **面试考点速记**：
  - trace 数据模型：span / 链路 / 评分关联
  - 回归定位工作流：从分数下降定位到具体环节
  - Langfuse / 其他观测工具的实践对比
- **自定补充**：（站长追加）

#### anomaly 异常检测（seeded → deep · P0）

- **学习目标**：评测结果异常的统计检验方法与异常分类处置
- **产出标准**：第 2 篇博文：评测结果异常的统计检验方法；累计 ≥2 篇升 deep
- **面试考点速记**：
  - 统计检验方法：显著性与置信区间、多重比较
  - 异常分类：分数异常 / 行为异常 / 环境异常
  - 异常处置流程：定位 → 归因 → 修复 → 回归验证
- **自定补充**：（站长追加）

### 2.4 周边领域（外圈，轻量）

#### agent Agent 知识（planned → seeded · P2）

- **学习目标**：被测对象的本体知识：Agent 架构（规划/记忆/工具调用）与评测的映射
- **产出标准**：第 1 篇博文：Agent 架构与工具调用评测视角综述
- **面试考点速记**：
  - Agent 架构要素：规划 / 记忆 / 工具调用 / 反思
  - Agent 评测与单轮 LLM 评测的本质差异（多步、环境交互、成本）
- **自定补充**：（站长追加）

#### model-arch 模型结构（planned → seeded · P2）

- **学习目标**：评测工程师所需的最小模型结构知识集
- **产出标准**：第 1 篇博文：注意力 / 长上下文 / 多模态等结构特性对评测设计的影响
- **面试考点速记**：
  - 注意力机制与上下文窗口：对长文本评测的影响
  - 多模态评测的特殊性
- **自定补充**：（站长追加）

#### inference 推理知识（planned → seeded · P2）

- **学习目标**：推理栈（量化 / KV cache / 服务化）对评测结果的影响
- **产出标准**：第 1 篇博文：推理栈作为评测变量的分析方法
- **面试考点速记**：
  - 量化精度对能力分数的影响
  - KV cache / 批处理对延迟类指标的影响
  - 服务化配置（并发/超时）如何成为评测噪声
- **自定补充**：（站长追加）

#### training 训练知识（planned → seeded · P2）

- **学习目标**：训练范式（SFT / RLHF / RL）与评测的关系
- **产出标准**：第 1 篇博文：训练范式与评测的互动关系
- **面试考点速记**：
  - SFT / RLHF / RL 各阶段评测什么、怎么评
  - 评测如何反馈训练（reward model、在线评测）
  - 训练-评测闭环中的过拟合风险
- **自定补充**：（站长追加）

## 3. P3 capstone：mini 评测平台（面试冲刺准备）

骨架方向：**出题（construction）→ 跑分（harness）→ 评分（metrics）→ 诊断（observability/anomaly）** 端到端贯通。

### 3.1 项目复盘叙事线（面试用）

1. 为什么自建：现有工具链的缺口
2. 架构决策：数据格式、沙箱选型、评分分层
3. 关键难点：防作弊、结果稳定性、异常归因
4. 量化结果：效率提升 / 结论一致性数据

### 3.2 跨节点考点串联

- 一道题的旅程：从 construction 出题到 anomaly 归因，串起 15 节点
- 指标体系辩护：为什么这里用确定性指标、那里用 LLM-judge
- 污染防控全景：从出题到评测到发布

### 3.3 模拟面试清单

- 项目深挖：架构图白板复现、失败案例、如果重来
- 八股：LLM-as-judge 偏差、pass@k 计算、污染检测
- 系统设计：设计一个 XX 评测系统（开放题）
- 反问环节：团队评测基础设施现状、岗位成长路径

> 详细设计（技术选型、里程碑、验收标准）在 P0-P2 主体完成后单独脑暴，届时替换本节骨架。
````

- [ ] **Step 2: 验证文档零站点泄露**

Run: 确认文件位于 `docs/plans/` 下（已在 `_config.yml` exclude 列表，`docs` 条目，无需改动）
Expected: 构建产物 `_site/` 中不存在 `docs/` 目录

- [ ] **Step 3: 向站长展示变更摘要，确认后提交**

```powershell
git add docs/plans/2026-09-21-learning-path.md
git commit -m "docs: add learning path plan (priority-driven, 15-node consolidation, interview prep)"
```

---

### Task 2: 评测系统星团节点页总览（5 页）

**Files:**
- Modify: `_domains/eval-system/harness.md`
- Modify: `_domains/eval-system/paradigm.md`
- Modify: `_domains/eval-system/hotspot.md`
- Modify: `_domains/eval-system/hardware.md`
- Modify: `_domains/eval-system/performance.md`

- [ ] **Step 1: harness.md 追加总览**（保留原 front matter，正文追加）

```markdown
## 领域定义

评测框架是执行基准测试的标准化基础设施：给定任务集与被测系统，框架负责环境准备、任务分发、运行隔离、结果收集与评分计算。业内从 lm-evaluation-harness 到 SWE-bench 的专用 harness，再到 Harbor 这类多 agent 评测编排系统，框架的形态随评测对象从模型走向 agent 而不断演化。

## 核心价值

没有统一的框架，分数就不可比、结果就不可复现。框架将「跑一场评测」工程化：沙箱隔离保证环境一致，防作弊机制（如评分期才注入 test.patch、对被测 agent 不可见）保证分数可信，并行调度与失败重试保证评测效率。它是评测结论公信力的技术底座。

## 知识版图与规划

关键问题：沙箱隔离与环境一致性、任务分发与并行调度、防作弊设计、评测与 CI/CD 的集成。代表工作：lm-evaluation-harness、EvalScope、SWE-bench harness、Harbor。已有实践记录（EvalScope/Harbor 源码剖析、agentperf）见本页博文列表；后续规划：框架源码横向对比、CI 集成细节深化。
```

- [ ] **Step 2: paradigm.md 追加总览**

```markdown
## 领域定义

评测范式回答「考什么、怎么考、怎么判」的根本问题，它随被测对象的能力形态演进：从静态基准的固定题库问答，到动态/交互式评测的环境适应，再到 agentic 评测的多步任务执行。范式的每一次迁移，都对应着判分方式从精确匹配走向 LLM-as-judge、再到过程性评价的扩展。

## 核心价值

范式决定了评测的天花板：用静态范式考 agent，如同用笔试考司机。选对范式，评测才能区分「看起来会」与「真的会」；同时 LLM-as-judge 的偏差（位置、长度、自我偏好）与校准是范式可信度的核心议题。

## 知识版图与规划

关键问题：范式演进谱系与适用场景、LLM-as-judge 的偏差类型与校准方法、评测范式与产品形态的匹配。代表工作：IBM CLEAR、从 LLM judge 到 agent judge 的演进研究。已有实践记录（范式迁移、IBM CLEAR、LLM-to-Agent-Judge）见本页博文列表；后续规划：judge 偏差与校准专题。
```

- [ ] **Step 3: hotspot.md 追加总览**

```markdown
## 领域定义

评测热点是评测社区的动态情报面：新基准发布、越狱与安全攻防、数据污染与泄漏事件、榜单争议。它不是独立的学术领域，而是对评测生态变化的持续跟踪与研判。

## 核心价值

评测领域变化极快，静态知识半年即陈旧。跟踪热点能捕获范式信号（如某类新基准的兴起预示能力焦点转移）、提前布局自身评测体系，并从污染/泄漏事件中吸取防控教训。

## 知识版图与规划

关键问题：热点背后的范式信号识别、事件复盘方法论（污染如何发生、如何被发现、如何防控）、对新基准价值与可信度的判断框架。已有实践记录（OpenAI/HF 越狱评测等热点解读）见本页博文列表；后续规划：热点跟踪机制化、污染事件复盘专题。
```

- [ ] **Step 4: hardware.md 追加总览**

```markdown
## 领域定义

硬件评测将评测对象从「模型能力」扩展到「模型 × 硬件」的组合系统：在端侧、边缘设备等资源受限场景下，考察能力与延迟、能耗、内存等硬件指标的联合表现，是 MLPerf 等系统级基准传统在 LLM 时代的延伸。

## 核心价值

模型最终要跑在具体硬件上。只报能力分数不报硬件代价的评测，无法支撑部署决策。硬件视角补全了评测的另一半拼图：什么样的模型在什么硬件上、以什么代价、达到什么能力。

## 知识版图与规划

关键问题：端侧评测指标体系（延迟/能耗/内存）、能力-性能联合评测的设计、硬件异构性与结果可比性。代表工作：MLPerf、AgentPerf 等硬件视角基准。已有实践记录（agentperf 解读）见本页博文列表；后续规划：硬件评测方法论与指标体系深化。
```

- [ ] **Step 5: performance.md 追加总览**

```markdown
## 领域定义

性能评测关注推理系统的效率基准：吞吐、延迟、SLO 达成率等指标的统一定义、测量口径与优化实践。它与能力评测正交互补——能力回答「答得多好」，性能回答「以什么代价答」。

## 核心价值

生产系统的决策 = 能力 × 性能 × 成本。性能基准（如吞吐-延迟曲线）让推理服务化配置（并发、批处理、量化档位）的选择有据可依，也为能力评测结果的解读提供必要的运行时语境。

## 知识版图与规划

关键问题：性能指标的测量口径与陷阱、量化精度对能力与性能的双向影响、推理栈配置作为评测变量的控制。代表工作：vLLM/SGLang 等推理引擎的性能基准实践。本页内容规划中：LLM 推理性能基准（吞吐/延迟/SLO）首篇。
```

- [ ] **Step 6: 提交并推送，CI 验证**

不做本地 bundle 构建（Windows 环境易卡死）。向站长展示变更摘要，确认后：

```powershell
git add _domains/eval-system/
git commit -m "docs(domains): add overview to eval-system cluster node pages"
git push
```

Expected: GitHub Actions Pages Deploy 工作流通过（推送后在 Actions 页确认）；通过后线上 `/domains/eval-system/*/` 各页均显示「领域定义」小节

---

### Task 3: 数据集 + 评分与诊断星团节点页总览（6 页）

**Files:**
- Modify: `_domains/dataset/corpus.md`
- Modify: `_domains/dataset/construction.md`
- Modify: `_domains/dataset/compression.md`
- Modify: `_domains/scoring/metrics.md`
- Modify: `_domains/scoring/observability.md`
- Modify: `_domains/scoring/anomaly.md`

- [ ] **Step 1: corpus.md 追加总览**

```markdown
## 领域定义

开源数据集全景是对评测数据集版图的系统梳理：任务类型（代码/工具使用/知识/多模态）、构建方式、规模与难度分布、版本演进与维护状态。它是评测选型的「地图」，回答「业内有哪些考题可用」。

## 核心价值

数据集是评测的起点，选错基准则一切后续工作失去意义。掌握全景才能做对选型：理解各基准测什么、不测什么、分数边界在哪里，也才能识别基准的版本演进对分数可比性的影响。

## 知识版图与规划

关键问题：数据集分类体系与选型框架、版本演进与分数可比性、数据集质量与污染识别。代表工作：MMLU/HumanEval 等经典基准、SWE-bench 系列、ALE、AutomationBench、DeepSWE、WorldScore。已有实践记录（多篇数据集解读）见本页博文列表；后续规划：持续扩展解读版图。
```

- [ ] **Step 2: construction.md 追加总览**

```markdown
## 领域定义

数据集构建研究「如何科学地出题」：从任务设计、样本生成（合成/人工标注/真实任务抽取）、质量校验到污染防控的完整方法论。它对应业内 benchmark engineering 的方向——SWE-bench 从真实 PR 抽取任务、合成数据方法的兴起，都是这一领域的实践。

## 核心价值

高质量数据集是评测的命脉：出题偏差直接导致评测结论失真。掌握构建方法论，才能从「使用别人出的题」进阶到「为自己的场景出对题」，也才能在数据污染日益严重的环境下守住评测的公信力。

## 知识版图与规划

关键问题：构建 pipeline 三模式（合成/人工/真实任务抽取）的成本与质量权衡、质量控制（一致性校验、难度分层、去重）、污染防控（时间切分、私有测试集、动态更新）。代表工作：SWE-bench 的真实任务抽取、各类合成数据集方法。本页内容规划中：构建方法论与污染防控首篇。
```

- [ ] **Step 3: compression.md 追加总览**

```markdown
## 领域定义

数据集压缩探索用更小的数据集逼近全量评测的结论：通过代表性子集选择、样本重要性加权等方法，在保持结论一致性的前提下降低评测成本，对应业内 efficient benchmarking 的研究方向。

## 核心价值

全量评测动辄数千样本 × 高昂推理成本，迭代速度受限。压缩后的「迷你评测」让快速筛选、频繁回归成为可能；其核心承诺是「以 1/10 的成本得到方向一致的结论」，而验证这一承诺本身就是该领域的核心问题。

## 知识版图与规划

关键问题：压缩/采样方法（代表性子集选择、蒸馏）、压缩后结论与全量结论的一致性度量、压缩率与一致性的权衡曲线。已有实践记录（mini 数据集压缩）见本页博文列表；后续规划：压缩对评测结论稳定性的影响专题。
```

- [ ] **Step 4: metrics.md 追加总览**

```markdown
## 领域定义

Rubric 与指标设计是评测的「判卷标准」学：如何把模型/agent 的输出转化为可信、可复现、可比的分数。涵盖 Rubric 设计模式（二值判定、打分制、加权、分维度）、确定性指标（精确匹配、单元测试通过率、pass@k）与 LLM-judge 指标的分工体系。

## 核心价值

指标是评测与决策之间的桥梁：指标设计失当，再严谨的执行也产误导结论。好的指标体系要在可信度（可复现、抗偏差）与覆盖度（能衡量开放性产出）之间做系统性权衡——这正是确定性指标与 LLM-judge 各司其职的原因。

## 知识版图与规划

关键问题：Rubric 设计模式的适用场景、确定性 vs LLM-judge 指标的分工（门禁用确定性、趋势分析用 judge）、pass@k 等指标的计算与误用。代表工作：HELM 的指标体系、各类 LLM-as-judge 研究。本页内容规划中：Rubric 设计模式与指标体系首篇。
```

- [ ] **Step 5: observability.md 追加总览**

```markdown
## 领域定义

可观测性将软件工程的观测实践引入评测：对评测全链路（输入、推理过程、工具调用、评分）进行 trace 采集与分析，使评测过程可追溯、问题可定位——从「拿到一个分数」到「理解分数为何如此」。

## 核心价值

分数只是结果，决策需要归因。没有可观测性，评测回归时无法定位是模型退化、环境漂移还是评分抖动；对 agent 评测，多步执行中的失败环节（规划/工具调用/反思）也只有靠 trace 才能诊断。它是评测系统持续可靠运行的保障。

## 知识版图与规划

关键问题：trace 数据模型（span/链路/评分关联）、回归定位工作流（分数下降 → 环节定位）、观测工具链选型。代表工作：Langfuse、OpenTelemetry 在 LLM 场景的应用。已有实践记录（Langfuse 集成）见本页博文列表；后续规划：trace 分析与回归定位工作流专题。
```

- [ ] **Step 6: anomaly.md 追加总览**

```markdown
## 领域定义

异常检测是评测结果的质量守门员：用统计检验与行为分析识别评测产出中的异常——分数突变、分布漂移、异常行为模式，防止错误结论流入下游决策。它横跨统计方法（显著性检验、置信区间）与领域知识（什么样的模型行为属于异常）。

## 核心价值

评测自动化程度越高，异常被静默放过的风险越大。一次未察觉的环境漂移、一个静默失败的测试、一段退化却被噪声掩盖的能力——都可能演变成错误的产品决策。异常检测让评测系统具备「自我体检」能力。

## 知识版图与规划

关键问题：评测结果异常的统计检验方法、异常分类（分数异常/行为异常/环境异常）、处置流程（定位→归因→修复→回归验证）。已有实践记录（LLM 响应异常检测）见本页博文列表；后续规划：统计检验方法在评测中的应用专题。
```

- [ ] **Step 7: 提交并推送，CI 验证**

不做本地 bundle 构建（Windows 环境易卡死）。向站长展示变更摘要，确认后：

```powershell
git add _domains/dataset/ _domains/scoring/
git commit -m "docs(domains): add overview to dataset and scoring cluster node pages"
git push
```

Expected: GitHub Actions Pages Deploy 工作流通过；线上 `/domains/dataset/*/` 与 `/domains/scoring/*/` 各页均显示「领域定义」小节

---

### Task 4: 周边领域星团节点页总览（4 页）

**Files:**
- Modify: `_domains/edge/agent.md`
- Modify: `_domains/edge/model-arch.md`
- Modify: `_domains/edge/inference.md`
- Modify: `_domains/edge/training.md`

- [ ] **Step 1: agent.md 追加总览**

```markdown
## 领域定义

Agent 知识是被测对象的本体知识：Agent 以 LLM 为核心控制器，通过规划、记忆、工具调用、反思等机制在环境中多步执行任务。理解其架构（ReAct、plan-and-execute、multi-agent 协作）是设计 agent 评测的前提——不懂考生，无法出题。

## 核心价值

Agent 评测的本质差异——多步决策、环境交互、长时程、成本敏感——都源自 agent 架构本身。掌握本体知识，才能设计出考察规划能力而非运气的任务、定义过程性而非仅结果性的指标、并合理控制评测成本。

## 知识版图与规划

关键问题：架构要素（规划/记忆/工具调用/反思）与评测维度的映射、agent 评测与单轮 LLM 评测的差异、评测环境的设计（可复现性与真实性的权衡）。代表工作：ReAct、各类 agent 框架（LangChain/AutoGen 等）与 agent 基准的交互。本页内容规划中：Agent 架构与工具调用的评测视角综述首篇。
```

- [ ] **Step 2: model-arch.md 追加总览**

```markdown
## 领域定义

模型结构是评测工程师的最小模型知识集：注意力机制、上下文窗口、多模态架构等核心结构特性。不求能训模型，但求能读懂结构如何决定行为——为什么长上下文会「迷失中间」、为什么不同架构的能力剖面不同。

## 核心价值

评测中的许多现象只有结构知识才能解释：分数差异可能源于架构差异而非能力差异；长文本评测的设计必须理解上下文机制；多模态评测的指标设计依赖对模态融合方式的认知。结构知识是评测解读的显微镜。

## 知识版图与规划

关键问题：注意力与上下文窗口对长文本评测的影响、多模态评测的特殊性、结构特性如何转化为评测变量。代表工作：Transformer 及其变体、长上下文与多模态架构研究。本页内容规划中：面向评测的模型结构知识首篇。
```

- [ ] **Step 3: inference.md 追加总览**

```markdown
## 领域定义

推理知识覆盖模型的部署与执行层：量化、KV cache、批处理、服务化框架（vLLM、SGLang 等）如何影响模型的实际输出。对评测而言，推理栈是隐变量——同一模型在不同配置下可能得到不同分数。

## 核心价值

不控制推理变量，评测结论就有系统性偏差：量化档位改变能力分数、并发与批处理扰动延迟指标、服务化配置引入难复现的噪声。理解推理栈，才能把「模型能力」与「部署配置」对评测的影响解耦。

## 知识版图与规划

关键问题：量化精度对能力分数的影响、KV cache 与批处理对延迟指标的影响、服务化配置作为评测噪声源的控制方法。代表工作：vLLM、SGLang 等推理引擎的基准实践。本页内容规划中：推理栈作为评测变量的分析首篇。
```

- [ ] **Step 4: training.md 追加总览**

```markdown
## 领域定义

训练知识是评测的上游语境：预训练、SFT、RLHF、RL 等训练阶段决定了模型「学过什么、被优化向什么方向」。理解训练目标，才能理解模型行为模式及其能力边界，也才能理解各阶段分别需要评什么。

## 核心价值

训练与评测构成闭环：训练阶段的选择决定了评测的侧重点（RLHF 后的对齐评测、RL 训练后的策略评测），评测又是训练的反馈信号（reward model、在线评测）。理解这一闭环，才能避免训练-评测过拟合，也才能把评测结果翻译成可行动的训练建议。

## 知识版图与规划

关键问题：各训练阶段（SFT/RLHF/RL）的评测侧重、评测如何反馈训练、训练-评测闭环中的过拟合风险。代表工作：InstructGPT/RLHF 流程中的评测环节、RL 训练的 reward 评估。本页内容规划中：训练范式与评测的互动关系首篇。
```

- [ ] **Step 5: 提交并推送，CI 验证**

不做本地 bundle 构建（Windows 环境易卡死）。向站长展示变更摘要，确认后：

```powershell
git add _domains/edge/
git commit -m "docs(domains): add overview to edge cluster node pages"
git push
```

Expected: GitHub Actions Pages Deploy 工作流通过；线上 `/domains/edge/*/` 各页均显示「领域定义」小节

---

### Task 5: 全站验证（零面试痕迹 + 15/15 覆盖）

- [ ] **Step 1: 零面试痕迹与去站点概念检查**

用 Grep 工具（非 shell grep）检查 `_domains/` 目录，pattern：`面试|求职|考点|简历|offer|冲刺|星图|星团`
Expected: 0 匹配。若有匹配，修改对应措辞后重查。

- [ ] **Step 2: 15/15 覆盖检查**

用 Grep 工具检查 `_domains/` 目录，pattern：`## 领域定义`，output_mode: count
Expected: 15 个文件各 1 次匹配

- [ ] **Step 3: CI 全量验证（不做本地构建）**

Task 2-4 已逐任务推送触发 CI；本步骤确认最后一次推送的 GitHub Actions Pages Deploy 工作流通过（构建成功即代表 15 页 Liquid 渲染无误）。站点首页星图不受影响（本计划未改 starmap.yml，无需额外验证）。

Expected: Actions 工作流绿色通过，线上 15 个节点页均显示总览
