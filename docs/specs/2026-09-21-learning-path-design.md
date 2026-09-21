# 学习路径规划（Learning Path）设计文档

> 日期：2026-09-21
> 关联：`docs/specs/2026-09-20-knowledge-starmap-design.md`（星图基础设施）
> 数据源：`_data/starmap.yml`（本设计不修改）

## 1. 背景与目标

知识星图（4 星团 / 15 节点 / 13 篇博文）已上线。本设计在其上规划后续半年的学习路径，服务于**评测工程师岗位求职**这一最终目的。

**核心原则：站点页面上不体现任何面试相关内容。** 求职导向信息（考点速记、冲刺清单、项目叙事）只存在于 `docs/`（已被 `_config.yml` exclude，不公开渲染）；公开可见的只有节点页的领域总览。

### 岗位画像配比

- A. LLM/Agent 评测系统岗（harness/CI/诊断）：**60%** → 路径主干
- B. 评测数据与考题设计岗（数据集构建/Rubric）：**30%** → 次干
- C. 算法+评测复合岗（模型底层）：**10%** → 轻量涉猎

### 策略

方案 A（状态驱动补全）为主体：按 planned → seeded → deep 逐级升级，产出固化为博文；最终以方案 B（capstone 项目）收尾，端到端夯实。

## 2. 路径总结构（优先级驱动，不绑定月份）

路径按优先级分层表述，站长按自己的时间安排、依优先级高低自行调度每个阶段的学习内容。

| 优先级 | 主题 | 节点任务 |
|---|---|---|
| P0 | 评分指标体系 | metrics: planned → deep |
| P0 | 诊断能力深耕 | observability → deep、anomaly → deep |
| P1 | 数据集构建与数据质量 | construction → deep、compression → deep、hotspot → deep |
| P2 | Agent 知识 | agent → seeded |
| P2 | 推理/训练/模型轻量 | inference / training / model-arch / performance → seeded；hardware → deep |
| P3 | capstone：mini 评测平台 | 端到端贯通，系列博文反哺各节点 |

- P0（核心圈补全，A 向 60% 主干）→ P1（数据侧深耕，B 向 30%）→ P2（外圈扩展，C 向 10% 及收尾）→ P3（项目夯实）
- P3 为最终收尾阶段，建议在 P0-P2 主体完成后启动（详细设计届时单独脑暴）
- 升级标准沿用星图状态系统：planned→seeded 需 ≥1 篇博文；seeded→deep 需 ≥2 篇 + 实践产出
- 外圈节点（agent/inference/training/model-arch）与 performance 到 seeded 即止，不追求 deep

## 3. 全节点夯实计划（15/15）

每个节点在路径文档中都有独立条目：学习目标、产出标准、面试考点速记（仅文档层）。按星团分组：

> **开放性约定**：以下每节点的计划为初始基线，站长可自行向任意节点追加学习条目（自定主题、工具实践、论文精读等）；路径文档中为每节点预留「自定补充」小节，追加后与基线条目同等对待。

### 3.1 评测系统（核心圈）

| 节点 | 现状 | 计划类型 | 夯实计划 |
|---|---|---|---|
| harness 评测框架 | deep | 持续深耕 | 全程维护性补充（框架源码对比、CI 集成细节）；P3 作为 capstone 主载体 |
| paradigm 评测范式 | deep | 持续深耕 | 补 1 篇 LLM-as-judge 偏差与校准专题；P3 输出范式选型方法论 |
| hotspot 评测热点 | seeded | 升级（P1） | 第 2 篇：动态跟踪机制化（污染/泄漏事件复盘），升 deep |
| hardware 硬件评测 | seeded | 升级（P2） | 第 2 篇：硬件评测方法论与指标体系，升 deep |
| performance 性能评测 | planned | 升级（P2） | 第 1 篇：LLM 推理性能基准（吞吐/延迟/SLO），升 seeded |

### 3.2 数据集

| 节点 | 现状 | 计划类型 | 夯实计划 |
|---|---|---|---|
| corpus 开源数据集全景 | deep | 持续深耕 | 持续输出新数据集解读（延续现有系列）；P3 为 capstone 出题做选型储备 |
| construction 数据集构建 | planned | 升级（P1） | 2 篇：构建方法论（合成/人工/真实任务抽取）+ 污染防控；P3 在 capstone 中实践出题，升 deep |
| compression 数据集压缩 | seeded | 升级（P1） | 第 2 篇：压缩对评测结论稳定性的影响，升 deep |

### 3.3 评分与诊断

| 节点 | 现状 | 计划类型 | 夯实计划 |
|---|---|---|---|
| metrics Rubric 与指标设计 | planned | 升级（P0） | 2 篇：Rubric 设计模式 + 确定性指标 vs LLM-judge 指标体系（呼应用户既有 CI 门禁理念），升 deep |
| observability 可观测性 | seeded | 升级（P0） | 第 2 篇：trace 分析与回归定位工作流（基于 Langfuse 实践），升 deep |
| anomaly 异常检测 | seeded | 升级（P0） | 第 2 篇：评测结果异常的统计检验方法，升 deep |

### 3.4 周边领域（外圈，轻量）

| 节点 | 现状 | 计划类型 | 夯实计划 |
|---|---|---|---|
| agent Agent 知识 | planned | 升级（P2） | 第 1 篇：Agent 架构与工具调用评测视角综述，升 seeded |
| model-arch 模型结构 | planned | 升级（P2） | 第 1 篇：评测工程师所需的最小模型结构知识（注意力/长上下文/多模态），升 seeded |
| inference 推理知识 | planned | 升级（P2） | 第 1 篇：推理栈（量化/KV cache/服务化）对评测的影响，升 seeded |
| training 训练知识 | planned | 升级（P2） | 第 1 篇：训练范式（SFT/RLHF/RL）与评测的关系，升 seeded |

### 3.5 P3 capstone：mini 评测平台

贯通星图流水线语义的端到端实战：**出题（construction）→ 跑分（harness）→ 评分（metrics）→ 诊断（observability/anomaly）**。

- 同时是面试的核心项目故事（此定位仅记录于文档层）与各节点博文的最后补给
- 详细设计在 P0-P2 主体完成后、基于届时知识储备单独脑暴，本设计只定骨架方向

## 4. 站点呈现（零面试痕迹）

- **首页星图完全不动**；节点实心/空心状态天然承担进度可视化
- **starmap.yml 结构不动**，不新增路径/优先级字段
- **15 个节点页（`_domains/{cluster}/{node}.md`）**：每页补极简总览，统一结构：
  1. 领域定位（该节点在评测流水线中的角色，1 段）
  2. 核心问题（该领域要解决的关键问题，1 段）
  3. 代表工作（代表工具/数据集/论文，自然带出已固化博文链接，1 段或短列表）
- 总览措辞保持领域中性，不出现面试、求职、考点等字眼

## 5. 文档层（docs/，不公开渲染）

新建 `docs/plans/2026-09-21-learning-path.md`，内容：

1. 路径总览（§2 的优先级表 + 学习原则：优先级驱动、站长自行调度）
2. 全 15 节点夯实计划（§3 逐节点展开：学习目标、产出标准、**面试高频考点速记**、自定补充小节）
3. P3 冲刺准备：capstone 项目复盘叙事线、跨节点考点串联、模拟面试清单

## 6. 工程实施范围

| 任务 | 内容 |
|---|---|
| ① 撰写路径文档 | `docs/plans/2026-09-21-learning-path.md` |
| ② 节点页总览 | 15 个 `_domains/**/*.md` 补极简总览 |

- 不改动 starmap.yml、布局、JS、CSS
- 验证：`bundle exec jekyll serve` 本地预览节点页渲染 + CI（Pages Deploy）
- 提交遵循既有惯例：展示变更摘要，站长确认后 commit

## 7. 成功标准

- 15/15 节点页均有总览，站点无任何面试痕迹
- 路径文档完整覆盖 15 节点夯实计划、考点速记与自定补充小节
- 路径完成时（不限时限，按优先级推进）星图目标状态为 deep×10、seeded×5（外圈 4 + performance），13 篇存量 + 约 15 篇新增博文
