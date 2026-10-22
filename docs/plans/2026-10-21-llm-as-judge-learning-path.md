# 学习路径 · LLM-as-Judge 裁判模型专项

> 本专项是知识星图 **scoring（评分与诊断）→ judge（裁判体系）** 星球的内容主体；与 **eval-system.paradigm（评测范式）**、**scoring.metrics（Rubric 与指标设计）** 两个节点交叉。
> 私有规划（`docs/` 已被 `_config.yml` exclude，不公开渲染）；站点侧只留博文，零规划痕迹。
> 博文归属：新建独立子系列 `judge-XX`，类目沿用 `评测系统`。
> 篇目不是"想写几篇"，而是**业内优秀资料实际覆盖面的映射结果**（见第 2 节覆盖地图）。

---

## 1. 定位与边界

**目标深度**：工程落地为主 + 统计校准深化。终点不是"会调 judge prompt"，而是——

> 能独立设计一套生产级 judge 流水线：判分边界划得清、rubric 可判定、偏差可量化、与人一致性可对账、聚合有成本-精度依据、换尺子有版本治理、被对抗时有兜底。

**三大重心**（用户明确的高关注点，全文按此加权）

1. **裁判体系设计**——判分边界、评分形态、元评测选型、聚合与治理
2. **Rubric 设计**——原子化、可判定、与需求一一对应、防漂移
3. **系统性问题与可靠性/稳定性保证**——偏差分层、人工对齐、一致性统计、门禁与对抗

**能力终点三层画像**

| 层 | 能力 | 判定方式 |
|---|---|---|
| 判分设计层 | 划分确定性检查 vs 语义检查；评分形态选型；rubric 原子化到可判定 | 拿到陌生评测需求，能先产出失败分类，再产出可执行 rubric 草案 |
| 校准统计层 | Golden Set 流程；一致率 / κ / AC1 / 相关性 / 混淆矩阵；κ 悖论识别 | 能解释"一致率 92% 但 κ 0.31"，并给出正确读法 |
| 治理对抗层 | judge 版本治理、CI 门禁、分层抽检、聚合选型、对抗失效排查 | 能给出一份"judge 上线 checklist"并指出每条不满足时的后果 |

**不做的事**：不做 reward model 训练与 RLHF 调参（只关心它作为裁判候选的选型）；不做评测平台整体架构（属 harness 节点与 P3 capstone）；不追 judge 私有榜单排名（只建立"如何自己选裁判"的方法）。

**里程碑颗粒度**：6 个里程碑、9 篇博文。**验收标准 = 博文产出为主**（每篇可独立发布），实验为可选加分项。

---

## 2. 业内覆盖地图（本次调研的直接产物）

范围：英文一线实践者的长文与专栏（Hamel Husain、Eugene Yan、Anthropic、Arize/Phoenix、Evidently、Langfuse）、评测平台的官方评测指南，以及研究侧的综述与偏差基准。

| 业内来源 | 实际覆盖的写作单元 |
|---|---|
| Hamel Husain《Your AI Product Needs Evals》+ Evals FAQ | 三层 eval 分层（单测 / 人工+模型 / A-B）；断言优先；**错误分析与数据查看器**；judge 当分类器看；人工评审员自身先对齐 |
| Eugene Yan《Evaluating the Effectiveness of LLM-Evaluators》 | 采纳前决策（基线是什么、三种评分形态、分类指标 vs 相关指标）；提示技巧；与人对齐；微调裁判；偏差批评 |
| Anthropic《Demystifying evals for AI agents》 | grader 分类学（代码断言 / rubric 打分 / 自然语言断言 / 成对比较 / 参考物比对 / 多裁判共识）；task·trial·grader·transcript·outcome·harness 术语；多次 trial；轨迹 vs 结果 |
| Arize / Phoenix 指南 + 对齐 field guide | 预置 judge 选用与改 rubric；用"被人工审过"的样本验证 judge；evaluator 版本与被评数据一起看；human-human 一致率当天花板；precision/recall 定位失败方向；binary vs score 实证；解释与 CoT 的实证；自评偏差 |
| Evidently AI《LLM-as-a-judge: a complete guide》 | judge 类型（成对 / 按标准 / 参考物）；提示模板与版本管理；生产监控；优缺点与替代方案 |
| Langfuse / LangSmith / Braintrust / Promptfoo | 测试 vs 评测的术语剥离；数据集 + 实验运行器 + evaluator 三件套；CI 门禁按"回归"而非"满分"；prompt 版本与实验对比；标注队列 |
| 研究侧（survey / JudgeBiasBench / COBBLER / Judging the Judges / PoLL / 非传递性） | 偏差分类学（4 维 12 类）；去偏策略系统性比较；元评测基准谱系；多裁判 panel；排名与非传递性；对抗攻击面（注入 / 后缀 / 后门） |

**地图收敛出的结论**

1. 领域实际覆盖约 **9 个独立写作单元**——每个单元在至少两个来源里都被单独成章，不是同一个主题的切分。因此不按"压缩到几篇"倒推，按覆盖走。
2. 旧稿（7 里程碑 9 篇）**缺了业内共识的起点**：**先做错误分析、先看数据**（Hamel 的第一条、Arize 指南的开篇都是"从要抓的失败开始"）。本次补为开篇。
3. 业内把"与人对齐"拆成**指标读法**与**校准流程**两章（Arize 专门一篇 field guide；Eugene Yan 一个完整大节）；本专项同样拆两篇，统计扫盲全部绑在流程上讲，不设独立工具箱章节。
4. 业内把"选裁判"（元评测基准）与"组合裁判"（panel / 集成 / 排名协议）分开讲；本专项同样拆两篇。

**可合并项（时间紧张时的降级方案）**：judge-04 + judge-05 可合为"给裁判做体检"长文；judge-06 + judge-07 可合为"选一个裁判，还是组一个裁判团"。合并代价是单篇过长、扫盲节奏被打散；默认不合并。

---

## 3. 里程碑与博文总览

| 里程碑 | 主题 | 博文 | 状态 |
|---|---|---|---|
| M1 | 错误分析与判分边界 | judge-01 | published |
| M2 | Rubric 原子化与可判定化 | judge-02 | published |
| M3 | 偏差地图与分层去偏 | judge-03 | planned |
| M4 | 人工对齐与一致性统计 | judge-04、judge-05 | planned |
| M5 | 裁判选型与多裁判组合 | judge-06、judge-07 | planned |
| M6 | 上线治理与对抗失效 | judge-08、judge-09 | planned |

顺序不可乱：**看数据 → 划边界 → 写尺子 → 查偏差 → 对账 → 选型组合 → 治理 → 对抗**。跳过 M4 直接做 M5，只会得到"更贵的、同样无法解释的分数"。

---

## 4. 逐篇规划

### M1 · judge-01 先定义失败，再写尺子

- **覆盖**：Hamel 的错误分析与三层 eval；Anthropic 的 grader 分类学；Evidently 的 judge 类型；Arize 的"能用代码断言的就别用模型"。
- **学习目标**：建立"先定义失败"的纪律；把"哪些检查根本不该交给模型"划清；掌握四种评分形态（程序断言 / 单点打分 / 成对比较 / 参考物比对）各自的判别力与适用场域。
- **核心问题**
  - 顺序错了全错：**先定义失败**——裁判拿不到失败定义时会自补一个默认刻度（"读起来像不像好答案"），这才是分数失真的根源。定义失败的手段是读数据、给失败归类、挑出代表样本当 Golden Set 种子。
  - 断言 vs 模型代判的划分标准是**判定是否唯一**，不是"难不难"。
  - eval 分三层、成本递增（单测 / 人工+模型 / A-B 实验），运行节奏由成本决定；**通过率是产品决策，不必 100%**。
  - 单点打分的病根是分数通胀（大量样本挤在 4/5 分），不是 prompt 不够狠。
  - 成对比较判别力最高但给不出绝对质量；参考物比对需要有人工锚，但能显著压低主观性。
  - 组合原则：**成对比较做版本选择，按标准打分做日常监控，断言守红线。**
- **产出标准**：`judge-01` 发布即达成。
- **能力锚点**：失败分类法；断言 vs 模型代判的边界论证；四形态判别力-成本对比；分数通胀的诊断与转向策略。

### M2 · judge-02 把 rubric 写成可判定的断言

- **覆盖**：Google 原子化 rubric 方法（微信原文）；Arize 关于"解释与 CoT"的实证；Shapley 归因的严格度研究。
- **学习目标**：把"好不好"改造成一组 TRUE/FALSE 可观察条件；掌握 rubric 与用户需求的一一对应原则（不加戏）。
- **核心问题**
  - 可判定 rubric 三要素：**可观察特征 + 每档正反例 + 明确不扣分的情形**。
  - 维度贪多的反效果：超过 6 个维度注意力稀释，一致性反而下降。
  - 抽象目标要降维成可观察事实——"安全方案是否全面"必须落成"是否提到身份认证 / 权限控制 / 限流 / 输入校验 / 敏感数据保护"。
  - **二元判断 vs 连续打分**：什么时候必须二元（红线、门禁），什么时候才需要分档。
  - 参考物与证据必须随题给到裁判：判"这句话是否被材料支持"要有材料，否则 judge 只能猜。
  - 要不要让裁判给解释 / 走 CoT：有实证支持，但会拉长输出、增加成本，需要按场景决定。
  - 权重设计（`correct_answer: 5`、`output_format: 2`）与检查项之间的依赖关系。
  - 关键实证：**严格度主要由 rubric 内容决定，而不是裁判模型**——手写 check 对正确报告的通过率 96–98%，模型自动生成的 check 只有 2–8%（微软 Shapley 归因研究）。
  - **rubric 交给模型自审会漂移**：自审倾向于加需求、删"模糊"的覆盖检查，正确通过率可从 97% 掉到 6%。
- **产出标准**：`judge-02` 发布即达成。
- **能力锚点**：原子化 rubric 设计法；rubric 与需求映射表；二元/分档/权重选型；rubric 修订的变更控制（只删不加 / provenance freeze）。

### M3 · judge-03 裁判的偏心住在哪一层

- **覆盖**：Judging the Judges（9 种去偏策略系统对比）；JudgeBiasBench / COBBLER（偏差分类学）；Eugene Yan 的偏差批评节。
- **学习目标**：把偏差按"住在哪一层"分类，而不是笼统地"去偏"；掌握每类偏差的测量手段与对应修复层级。
- **核心问题**
  - 偏差三处住址：**prompt 层**（位置偏差 → 换序双跑，只采一致结论）、**模型偏好层**（长度 / 格式 / 风格 → prompt 改不掉，只能改测量：长度回归、长度写进不评分项、格式剥离）、**权重层**（自我偏好 → 只能换裁判族，别让选手自评）。
  - 量级反差：位置偏差实测很小（≤0.04），**style/格式偏差才是主导（基线 0.10–0.76，多数偏好 markdown 而非朴素散文）**，但业内关注度刚好相反——反直觉点，值得写。
  - 长度偏差是异质的，不是普适规律：按长度校正后 Llama / Gemini 系偏好长答案（+0.24~+0.44），Claude Sonnet 4 反过来偏好简洁（−0.12），GPT-4o 基本中性（−0.04）。
  - 截断对照实验说明模型多数情况下能区分"质量"与"长度"（0.88–1.00 准确），所以**要区分"对长度的偏好"与"不会判质量"**。
  - 自我偏好量级：GPT-4 对自己约 +10%，Claude-v1 约 +25%。
  - 偏移不止四类：**严格度漂移**（今天严明天松）、**任务难度混淆**（judge 在难题上自己就会错，噪声被当成结论）、**非传递性**（A>B>C>A）、**平局处理**（换序反转的样本应记平局或转人工，不能硬算）。
  - 去偏策略不是越多越好：实测中"组合预算"策略收益最高（Gemini Flash 配置达 71.0% 一致、κ=0.549，成本约为最强前沿配置的 1/15），但各策略收益需过多重比较校正才站得住。
- **产出标准**：`judge-03` 发布即达成。
- **能力锚点**：偏差分层归因表；换序协议与成本；长度控制的统计做法；去偏策略的选择与显著性判读。

### M4 · 人工对齐与一致性统计（本专项的深水区）

#### judge-04 一致率 92%、κ 只有 0.31

- **覆盖**：Arize 的 human-LLM judge alignment field guide；κ 悖论文献；实践者的 judge 验证流程。
- **学习目标**：能正确读一份一致性报告，并识别 κ 悖论。
- **核心问题**
  - **先把人工参照物做成参照物**：human-human 一致率是天花板，人自己不一致就没有资格要求模型一致——所以要先有标注指南、先解决人际分歧。
  - 把 judge 当分类器看：Precision / Recall / F1 / 混淆矩阵，比单一一致率更能定位失败方向（漏放还是误杀）。
  - **κ 悖论**：类别流行率极不均衡时（例如 90% 样本都是"通过"），一致率很高但 κ 会被压到接近 0，导致误判"没有一致性"。这不是计算错误，是 κ 的已知缺陷（Feinstein–Cicchetti）。
  - 替代与并列指标：Gwet's AC1（对流行率更稳健）、PABAK（粗但快）、Krippendorff α（支持缺失与序数）、连续分数用 ICC。
  - 排序场景换指标：Spearman / Kendall，且平局处理方式必须写明。
  - **报告纪律：报 κ 必须同框给出「一致率 + 边际分布 + 样本量 + 置信区间」**，否则读者无法判断是不是悖论。
  - 分层读法：按难度层、维度层、语言层分别看——多语言场景一致性普遍很差，不要拿中文结论覆盖其他语种。
- **产出标准**：`judge-04` 发布即达成。
- **能力锚点**：一致性指标选用与陷阱；κ 悖论的识别与替代；混淆矩阵定位失败方向；置信区间与最小样本量。

#### judge-05 给裁判做体检：一次完整校准

- **覆盖**：Hamel 的 Level 2 人工/模型评测流程；Anthropic 的 trial 与方差视角；实践者的"标 200 条再上"流程。
- **学习目标**：独立完成一次 judge 校准并正确归因失败。
- **核心问题**
  - 校准流程纪律：抽样 50–100 条覆盖好/中/差 + 边界争议 → **至少两人独立标注并先解决人际分歧** → judge 打同一批 → 算一致性 → 不达标先改 rubric，**不要去调温度凑分数**。
  - 验收阈值怎么定：一致率达到人工之间一致率的什么比例才算可用；κ 低于约 0.6 通常不能上线。
  - 失败归因顺序：**先怀疑 rubric，再怀疑样本，最后才怀疑模型**。
  - 稳定性 ≠ 正确性：同一输入多次 trial 的方差（多次运行的一致性）要单独测；低方差只是可复现，不代表判得对。
  - 校准要定期重做——**人工结果不是真理，只是当前参照物**。
  - 去掉"我这次校准到底有没有变好"的歧义：改动前后用配对样本 + 配对检验（如 McNemar），别用两批不同样本比总分。
- **产出标准**：`judge-05` 发布即达成；跑通一次真实 Golden Set 校准（≥50 条、双人标注）视为加分，并成为后续博文的实测素材。
- **能力锚点**：Golden Set 构造；校准 SOP 与验收阈值；配对检验与显著性判读；失败归因顺序。

### M5 · 裁判选型与多裁判组合

#### judge-06 裁判也是被测对象

- **覆盖**：Eugene Yan 的"采纳前决策 + 微调裁判"；元评测基准谱系；成本-精度实验。
- **学习目标**：掌握"如何自己选裁判"的元评测方法，而不是抄榜单。
- **核心问题**
  - 裁判候选三族：专用 reward model（便宜、可批量、泛化差）、前沿 LLM 提示式裁判（知识面广、贵、自我偏好）、推理模型 CoT 裁判（结构化任务更强、成本最高）。
  - 先问基线是谁：对齐"人"和超越"微调分类器"是两个难度完全不同的目标。
  - 元评测基准地图与各自测什么：MT-Bench 人一致性、LLMBar（指令遵循的对抗样本）、JudgeBench（难题对）、RewardBench 2（事实/聚焦/数学/精确 IF/安全五类）、RubricEval（rubric 级）、RuVerBench（agentic 场景 rubric 验证）。
  - 为什么公开榜单不能替代自测：榜单数据与你的业务分布、语言、任务类型都不同；跨榜单的分数不可比。
  - 成本-精度前沿：不是越贵越准；实测里中等模型配好策略可以超过前沿模型（见 M3 的 71.0% / 1/15 成本）。
  - 换成自建裁判（微调小模型）的时机与代价：需要标注数据、需要持续维护，收益是延迟和单位成本。
- **产出标准**：`judge-06` 发布即达成。
- **能力锚点**：judge 选型决策树（预算 × 任务类型 × 语言）；元评测基准的选用；自建 vs 提示式裁判的取舍。

#### judge-07 多裁判投票真的更准吗

- **覆盖**：PoLL（异构 panel）；RewardBench 2 上的聚合实验；非传递性与 Bradley-Terry 文献。
- **学习目标**：掌握聚合策略的收益与成本边界，以及成对比较的排名方法。
- **核心问题**
  - 聚合手段的实测收益：**criteria injection 约 +3.0pp（近零成本）、ensemble k=8 约 +9.8pp（5.3× 成本）**；便宜模型靠集成反而更划算（mini k=8 用 0.4–1.2× 成本逼近全尺寸模型）。
  - 聚合的有效条件与失效：偏差需要近似相互独立才能被投票抵消；**同族模型的偏差高度相关，投票接近无效**。
  - 投票到底投什么：投标签、投分数、还是投票后重新取中位数/多数——不同聚合方式收敛结果不同。
  - 顺序效应带出的排名方法：round-robin 全循环 + Bradley-Terry 建模，比单轮比较稳健；**锚点选择会显著影响与人排名的相关性**。
  - 非传递性怎么报：出现 A>B>C>A 时，不能假装有全局排名；要么只报相邻对比，要么显式给出循环证据。
  - 成本-精度前沿：给出"什么预算下选什么裁判与几个裁判"。
- **产出标准**：`judge-07` 发布即达成。
- **能力锚点**：聚合的收益-成本计算；偏差独立性的判断；排名协议与平局规则；非传递性的检测与处理。

### M6 · 上线治理与对抗失效

#### judge-08 换裁判等于换尺子

- **覆盖**：Hamel 的 CI 化单测与趋势跟踪；Arize 的"evaluator 版本与数据一起看"；实践者的"门禁按回归而非满分"；Evidently 的提示版本管理。
- **学习目标**：把 judge 当成一个受版本管理的生产组件，而不是一段 prompt。
- **核心问题**
  - **换 rubric / 换裁判模型 / 改解码参数 = 换了一把尺子**，跨版本直接比分数得到的"提升 12%"是假的。版本号需要同时记录脚本本 + rubric 文本 + 裁判模型与版本 + 解码参数。
  - 跨版本只比方向，不比绝对值；要讲因果必须用同一批样本回放（replay）。
  - 门禁设计：红线项走断言或绝对判断、不过不进平均分；**CI 失败条件写成"通过率跌破基线"而不是"没拿满分"**，抬高基线走一次受审的提交。
  - 抽检分层：低分样本、分数突变样本、新出现的意图类型必看；高分样本按比例随机看。**抽检结论必须回流 rubric，否则等于白看。**
  - 严格度漂移的监控：用固定基准问题定期重跑 judge，观察自身一致性随时间的变化。
  - 留档：输入、答案、评分理由一起留，事后争议才有得查。
- **产出标准**：`judge-08` 发布即达成。
- **能力锚点**：judge 版本号设计；跨版本可比性规则；CI 门禁与回归基线；分层抽检方案。

#### judge-09 当选手开始研究裁判

- **覆盖**：对抗攻击面文献（注入 / 对抗后缀 / 表示层 / 后门）；Shapley 归因的 rubric 漂移治理；Anthropic 的轨迹评测；站内 `agent-eval` 系列与 Agent-as-a-Judge 专题。
- **学习目标**：理解"被测者会研究裁判"这一博弈；把 judge 从单轮输出延伸到含轨迹的 Agent 场景。
- **核心问题**
  - Goodhart / reward hacking：当 judge 分数成为优化目标，分数就不再反映质量；如何识别"被优化掉的指标"。
  - judge 自身的攻击面：被测内容里夹带指令（注入）、格式诱导（markdown/emoji 抬分）、论证性包装、置信语气讨好（authority）。
  - rubric 自审漂移的机制与治理：Shapley 归因可给出每条 check 的 catch credit / false-fail blame / unique catches，配合变更门禁 + 来源冻结把漂移链钉回起点质量。
  - Agent 场景的转移：outcome 与 process（轨迹）的分工、rubric 在 agentic 场景的可靠性、batching 与多数投票对 rubric 验证的影响、多次 trial 处理随机性。
  - 裁判看得见终点，轨迹诊断是下一层范式：与 `agent-eval` 系列、`Agent-as-a-Judge` 专题的衔接。
- **产出标准**：`judge-09` 发布即达成；本专项关闭时同步更新 `_domains/scoring/judge.md` 的产出标准与 `_data/starmap.yml` 状态。
- **能力锚点**：judge 的攻击面清单；自审漂移的检测与门禁；reward hacking 的识别信号；轨迹级评测的接入点。

---

## 5. 统计概念：绑在流程里扫盲（不设独立工具箱章节）

每个概念只回答"它在裁判流程的哪一步被用来做判断"，写到哪篇、跟哪个动作绑定，见下表。

| 概念 | 用它回答什么问题 | 绑定在哪个流程环节 | 出现篇目 |
|---|---|---|---|
| 一致率 Agreement | 总体判对占比是多少 | 校准第一步读数 | judge-04 |
| 边际分布 / 流行率 | 类别是不是极度不均衡 | 判断读数是否失真，必须与 κ 同框 | judge-04 |
| Cohen's κ | 扣掉随机后的一致性 | 双人/人机对齐主指标 | judge-04 |
| Fleiss' κ | 多评分者的一致性 | 多标注员、多裁判场景 | judge-04 |
| Gwet's AC1 / PABAK | 高流行率下 κ 被压低时怎么办 | κ 悖论的替代读法 | judge-04 |
| Krippendorff α | 有缺失值、序数档位的一致性 | 分档 rubric 跨标注者 | judge-04 |
| ICC | 连续分数的一致性 | 打分型 rubric 的稳定性 | judge-04 |
| Spearman ρ / Kendall τ | 排名是否一致 | 成对比较、模型排名场景 | judge-04、judge-07 |
| Precision / Recall / F1 | 失败方向是漏放还是误杀 | 定位 judge 的失败模式、定修改优先级 | judge-04、judge-05 |
| 置信区间 / 最小样本量 | 这个结论是不是小样本噪声 | 定 Golden Set 规模、给结论配误差条 | judge-04、judge-05 |
| 多次 trial 方差 | 同一个判断是否可复现 | 稳定性 ≠ 正确性，独立于正确性测量 | judge-05 |
| McNemar 等配对检验 | 这次修改是不是真的变好了 | 校准前后对比同一批样本 | judge-05 |
| 多重比较校正 | 试了 9 种策略，谁是真的有效 | 去偏策略选型、实验结论去伪 | judge-03 |
| 成本-精度前沿 | 这个预算下该选什么裁判 | 选型与聚合决策 | judge-06、judge-07 |

**一条必须写进博文的纪律**：报 κ 时必须同框给出「一致率 + 边际分布 + 样本量 + 置信区间」。只报 κ 的评测结论不可信。

---

## 6. 博文清单速览（子系列 `judge-XX`）

| 编号 | 建议文件名 | 标题方向 | 核心论点 | 必配图表 |
|---|---|---|---|---|
| judge-01 | `2026-10-22-judge-01-define-failure-first.md` | 先定义失败，再写尺子 | 错误分析 → 判分边界 → 评分形态选型；三层 eval 与运行节奏 | 失败分类法示例；断言 vs 模型代判分工图；四形态判别力/成本矩阵 |
| judge-02 | `2026-10-22-judge-02-rubric-as-assertions.md` | 把 rubric 写成断言 | 原子化 TRUE/FALSE；需求一一对应；二元 vs 分档；自审会漂移 | 抽象目标→可观察检查项的降维示例；严格度由 rubric 决定的对比表 |
| judge-03 | `2026-XX-XX-judge-03-where-bias-lives.md` | 裁判的偏心住在哪一层 | prompt 层可修、偏好层只能改测量、权重层只能换裁判 | 偏差住址-量级-可修复性三列对照表；换序协议流程 |
| judge-04 | `2026-XX-XX-judge-04-kappa-paradox.md` | 一致率 92%、κ 只有 0.31 | κ 悖论成因与 AC1/PABAK 替代；报告纪律 | 流行率-κ 曲线示意；同意矩阵与混淆矩阵示例 |
| judge-05 | `2026-XX-XX-judge-05-judge-calibration.md` | 给裁判做体检 | Golden Set 校准全流程、验收阈值与失败归因顺序 | 校准流程图；指标选用决策图 |
| judge-06 | `2026-XX-XX-judge-06-judge-meta-eval.md` | 裁判也是被测对象 | 元评测基准地图与裁判选型决策树 | 基准谱系图（各测什么）；三族裁判成本-能力对比 |
| judge-07 | `2026-XX-XX-judge-07-multi-judge-aggregation.md` | 多裁判投票真的更准吗 | 聚合收益/成本边界与偏差独立性条件；排名协议 | 成本-精度前沿曲线；偏差相关性→聚合失效示意 |
| judge-08 | `2026-XX-XX-judge-08-judge-versioning.md` | 换裁判等于换尺子 | 版本治理、回放、分层抽检与 CI 门禁 | judge 版本号字段设计；门禁 vs 趋势项分工图 |
| judge-09 | `2026-XX-XX-judge-09-adversarial-judge.md` | 当选手开始研究裁判 | judge 攻击面、rubric 自审漂移、Agent 场景延伸 | 攻击面清单图；Shapley 归因定位漂移检查示意 |

> judge-02 附加资产：`docs/plans/assets/judge-02-rubric-selftest.html`（可判定性自检小工具，不发布；judge-05 做真实校准时可改样本复用）。

**每篇统一结构**（沿用站内既有风格）

1. 开篇痛点场景（一段真实感强的翻车现场）→ 2. `读完你将了解` 清单 → 3. 正文分节（原理 → 实证数据 → 落地做法）→ 4. 常见误区 → 5. 一句话总结 → 6. 参考资料

**系列内链**：每篇首尾互链上下篇，形成可顺序阅读的连载；judge-09 末尾回链 `agent-eval` 系列与 `Agent-as-a-Judge` 专题。

---

## 7. 写作与素材纪律

- **数字必须可溯源**：标明来源 + 被测模型版本 + 数据集规模。二手引述（"据某综述引述"）要显式标注为转引，不与自己实测的数据混用。
- **front matter**：`categories: [评测系统]`，`tags` 至少含 `LLM-as-Judge` 与子系列标识；含 mermaid 图必须 `mermaid: true`。
- **配图**：流程图/结构图存 `assets/html/<post-slug>/`（多图共享一份 `fig-style.css`），博文内以 `<iframe>` 引用并配高度上报脚本（做法同 judge-01）；需要光栅图时存 `assets/img/<post-slug>/`。文件名不含空格。
- **日期纪律**：post 的 `date` 必须**早于实际推送时间**，否则会被 `future: false` 静默跳过（详见 project memory）。
- **本地不验证构建**：交给 GitHub Actions CI 验证，不做本地 `bundle exec jekyll build`。
- **不做纯综述**：每篇至少给一个可执行产出（表格 / 检查清单 / 决策树 / 脚本骨架），否则不写。

---

## 8. 参考素材

**已核验（可直接引用）**

- [Hamel Husain《Your AI Product Needs Evals》](https://hamel.dev/blog/posts/evals/)：三层 eval（单测 / 人工+模型 / A-B）、断言优先、CI 化与趋势跟踪、通过率是产品决策
- [Eugene Yan《Evaluating the Effectiveness of LLM-Evaluators》](https://eugeneyan.com/writing/llm-evaluators/)：基线选择、三种评分形态、分类指标 vs 相关指标、提示技巧、与人对齐、微调裁判、偏差批评
- [Anthropic《Demystifying evals for AI agents》](https://www.anthropic.com/research/demystifying-evals-for-ai-agents)：grader 分类学（断言 / rubric 打分 / 自然语言断言 / 成对比较 / 参考物 / 多裁判共识）、task·trial·grader·transcript·outcome·harness 术语、多次 trial
- [Arize《LLM-as-a-Judge: Guide & Pre-built Evaluators》](https://arize.com/guides/llm-as-a-judge/)：预置 evaluator、用被审过的样本验证、evaluator 版本与被评数据一起看、judge vs Agent-as-a-Judge
- [Arize《How to measure human-LLM judge alignment》](https://arize.com/blog/how-to-measure-human-llm-judge-alignment/)：human-human 一致率作天花板、人机对比、用 precision/recall 诊断错误
- [Evidently AI《LLM-as-a-judge: a complete guide》](https://www.evidentlyai.com/llm-guide/llm-as-a-judge)：judge 类型、提示模板、生产监控、优缺点与替代方案
- [Langfuse《LLM Testing: A Practical Guide》](https://langfuse.com/blog/2025-10-21-testing-llm-applications.md)：测试 vs 评测的术语剥离、数据集 + 实验运行器 + evaluator
- [实践者的评测门禁笔记（Golden Set / LLM-as-judge / CI gate）](https://dev.to/ahmed_mahmoud360/how-i-test-an-llm-feature-field-notes-on-golden-sets-llm-as-judge-and-eval-gates-in-ci-3aog)：先跑确定性断言、裁判固定模型 ID、门禁按回归而非满分
- [LLM-as-judge 评分器从设计到校准的六步](https://xzhibot.com/3715.html)：检查项分工、四种评分形态、三类偏差、人工校准、版本管理、抽检门禁、四个误区
- [把主观评分拆成原子判断（Google 方法）](https://mp.weixin.qq.com/s/hZKdUaPuLqOWVVoOiTP4ow)：原子化 rubric、需求一一对应、TRUE/FALSE 稳定性、Golden Set 与 κ、权重设计
- [Judging the Judges: 偏差缓解策略的系统评测](https://arxiv.org/abs/2604.23178)：9 种去偏策略对比；style bias 主导（基线 0.10–0.76）vs position bias ≤0.04；长度偏差异质；中等模型 + 组合策略达 71.0%（κ=0.549）约为前沿配置 1/15 成本
- [Practical LLM-as-a-Judge Improvement Techniques on RewardBench 2](https://arxiv.org/html/2604.13717v1)：criteria injection +3.0pp、ensemble k=8 +9.8pp、成本-精度分析
- [Rubrics Carry the Standard: Shapley Attribution](https://arxiv.org/pdf/2610.24971)：rubric 内容决定严格度（96–98% vs 2–8%）；rubric 自审漂移与变更门禁
- [A survey on LLM-as-a-judge（Innovation, Gu et al.）](https://pubmed.ncbi.nlm.nih.gov/42254963/)：judge 流水线四阶段（输入模态与提示格式 → 模型选择 → 后处理 → 结果形态）、偏差与一致性分类、可靠性评估
- [JudgeBiasBench: 偏差分类学与去偏训练](https://arxiv.org/html/2603.08091)：4 维 12 类偏差；区分"判断错误"与"判断偏差"；生成式/判别式裁判跨范式对比
- [COBBLER: Benchmarking Cognitive Biases in LLMs as Evaluators](https://aclanthology.org/anthology-files/anthology-files/anthology-files/pdf/findings/2024.findings-acl.29.pdf)：6 类认知偏差；机器偏好与人偏好的 RBO 仅约 44%
- [Perspective on the κ 悖论与 Gwet's AC1](https://pmc.ncbi.nlm.nih.gov/articles/PMC5712640/)：高一致高流行率下 κ 被低估；AC1 更稳健
- [Cohen's κ vs Gwet's AC1 实证比较](https://pubmed.ncbi.nlm.nih.gov/23627889/)：AC1 对流行率与边际概率更不敏感
- [LLM-as-judge 工具横向对比（验证能力视角）](https://dev.to/maya_andersson_dev/llm-as-judge-tools-compared-the-question-is-not-which-one-scores-it-is-which-one-you-can-trust-3526)：主流工具都缺"judge vs 人工 + 混淆矩阵"的一键链路；κ 低于约 0.6 不上线
- [Reward Model / LLM-as-Judge 榜单与基准说明](https://awesomeagents.ai/leaderboards/reward-model-judge-leaderboard/)：RewardBench v1/v2、JudgeBench、MT-Bench 一致率谱系
- 站内既有：[从 LLM-as-a-Judge 到 Agent-as-a-Judge](file:///c:/Users/BaoYifan/Code/ivanbao.github.io/_posts/2026-07-24-eval-system-llm-to-agent-judge.md)（judge-09 的前置阅读）

**待补（抓取被拦截，需要原文）**

- `https://mp.weixin.qq.com/s/FWlfsZpMSqzYvIX7AQVFlg`
- `https://mp.weixin.qq.com/s/I4P850sBVoJ-XPHB4OTMzA`
- `https://mp.weixin.qq.com/s/QF72IWS68QPZS84Zjx7Q3g`

**仍缺的关键素材（建议补充检索）**

- 中文/多语言场景下 judge 与人工一致性的实测数据（Fleiss κ 约 0.3 的证据链）
- 一家头部厂商公开的 judge 校准 SOP（含样本量、验收阈值）
- 成对比较场景的胜率稳定性（同向率）与样本量估算实践

**候选补充文献线索**

- Zheng et al., *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*（位置偏差 ~65% 自洽的原始出处）
- Wataoka et al., *Self-Preference Bias in LLM-as-a-Judge*（自我偏好量级）
- Dubois et al., *Length-Controlled AlpacaEval*（长度控制的统计做法）
- Verga et al., *PoLL: Panel of LLM Evaluators*（多裁判异构集成）
- Tan et al., *JudgeBench*；Zeng et al., *LLMBar*；Fu & Liu, *How Reliable is Multilingual LLM-as-a-Judge?*（Fleiss κ ≈ 0.3）
- Xu et al., *Investigating Non-Transitivity in LLM-as-a-Judge*（round-robin + Bradley-Terry）
