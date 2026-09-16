---
title: "为 Agent 编写的《五年高考三年模拟》：一套评测范式的工程化落地"
author: ivanbao9783
date: 2026-09-16 16:00:00 +0800
categories: [技术笔记]
tags: [Agent评测, Harbor, 评测框架, CI/CD]
description: 以"考试制度"为隐喻拆解开源评测框架 Harbor：N×M 适配困境的 N+M 解法，编排、沙箱、判卷三大核心机制，以及从轨迹归因到 CI/CD 化的落地实践。
math: true
---

> 3 个 Agent × 2 个数据集 = 6 套适配代码——Agent 评测的 N×M 困境，意味着每换一次模型、改一次 prompt，就要重新交一遍"适配税"。
>
> 这篇文章以"考试制度"为隐喻，拆解开源评测框架 Harbor 如何把这笔账改写成 N+M：统一考卷、隔离考场、独立判卷、归一化分数；以及拿到分数之后，比分数更重要的两件事——轨迹归因与 CI/CD 化。

⏱️ 阅读时间：约 18 分钟

---

## 📋 读完你将了解

- [x] Agent 评测 N×M 适配困境的根源与 N+M 统一接入范式
- [x] 用"考试制度"隐喻理解评测框架五大组件：Task / Agent / Sandbox / Verifier / Job
- [x] 编排（Trial 矩阵 + 信号量闸门 + 优雅退出）、沙箱（双轨抽象 + 懒加载注册表）、判卷（test.patch 防泄漏 + 无偏 pass@k）三大核心机制
- [x] DeepSWE × mini-swe-agent 实战：从 30 秒起跑到四组产物的归因路径
- [x] "轨迹 > 分数"的迭代逻辑与评测 CI/CD 化的前置条件

---

## 一、Agent 评测的 N×M 困境

先看一个你大概率经历过的场景。

想对比几个 Agent 的真实实力——比如 Claude Code、Codex，还有团队自研的 Agent——在 Terminal Bench 和 DeepSWE 上谁更能打。

需求很朴素，动手才发现不对劲。

两套数据集：任务格式不一样，运行环境不一样，连"跑分"的定义都不一样。另一头的 Agent 也没好到哪去：开源的各有各的接法，自研的虽然知根知底，但评测代码还是得自己从头写。

于是账来了：

> **3 个 Agent × 2 个数据集 = 6 套适配代码。**

现实里是几十个数据集、十几个 Agent，工作量按乘法翻。而这些代码几乎零复用——换个 benchmark，推倒重来。

更糟的是，这税不止交一次。每次换模型、每次改 prompt、每次发版，你都想重新验证一遍——**每次都要重新付一遍这笔适配税**。

![图A：N×M 适配混乱与 N+M 统一接入的对比](/assets/img/blog-figA-pain-comparison.png)

问题出在哪？

回看软件工程的历史，每一轮效率跃进，都伴随一类基础设施的成熟：有了数据库，应用不用手写存储引擎；有了 CI 系统，团队不用人肉部署。

**基础设施的本质，就是把某类人人都需要、但家家手搓的能力，沉淀成一套可复用的标准件。**

Agent 评测，正处在"人人都需要、家家手搓"的阶段。

缺的不是某个团队的努力，是一整层基础设施：**统一的考卷、统一的考生接入、统一的判卷出口。**

> Anthropic 在他们的评测工程实践里也给出了同样的判断：评测不该是一次性的脚本，而应该是可持续迭代的系统性基建。
>
> 📎 **来源：** [Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) — Anthropic Engineering

Harbor 就是奔着这层来的——把 N×M 的账改写成 **N+M**：数据集适配一次，Agent 接入一次，剩下的组合框架替你跑。

> 📎 **项目：** [harbor-framework/harbor](https://github.com/harbor-framework/harbor)（开源评测框架）

怎么做到的？

不急着拆代码。先让我们回顾每个人都经历过的一件事：**考试**。

---

## 二、评测的本质：一场考试的制度设计

从小到大，你参加过几百场考试。但你可能从没想过：一场考试凭什么**可信**？

凭的不是题目难，而是四样东西。

**一份标准的考卷。** 题目格式统一、考点明确，不能语文卷里混进一道微积分。

**一间隔离的考场。** 每人一张桌子——抄不到别人，也毁不了考场。

**一个独立的判卷人。** 阅卷的不能是考生自己，评分标准提前锁死。

**一套统一的分数。** 不同考场、不同批次的卷子，最后换算成可比的成绩。

没有这四样，考试就是走过场。

Agent 评测同理——格式不统一，就是考卷不标准；环境互相污染，就是考场不隔离；Agent 自己验证自己，就是考生判自己的卷。

Harbor 的全部设计，就是把这套考试制度工程化：

| 考试 | Agent 评测 | Harbor 落点 |
|---|---|---|
| 考卷 | Task：任务 + 环境 + 测试 | `task.toml` + `instruction.md` + `tests/` |
| 考生 | Agent：开源 or 自研 | 30+ 内置接入 + 自定义扩展 |
| 考场 | Sandbox：隔离执行环境 | 本地 Docker / 云端双轨 |
| 判卷人 | Verifier：独立验证 | `test.sh` + grader |
| 教务处 | Job：编排调度 + 汇总 | Trial 调度 + pass@k |
| 成绩单 | 结果汇总：收集 + 聚合 | 统一收集 + pass@k 报告 |

![隐喻图：一场 Agent 考试——考卷、考生、考场、判卷人、教务处与成绩单的对应](/assets/img/blog-view1-metaphor.png)

这些抽象的概念落到具象的软件架构上，是这样的：

![Harbor 整体架构：数据层、编排层、沙箱层、结果层自上而下流转](/assets/img/blog-view2-architecture.png)

一条命令敲下去，数据流自上而下走一遍：

**CLI** 是发令枪——你在命令行里指定数据集、Agent 和模型，评测就此启动。

**数据集层** 是题库——DeepSWE 适配成一份份标准 Task，每份 Task 就是一张考卷。

**编排层** 是教务处——Job 把"哪些考生 × 哪些考卷 × 考几次"拆成一个个 Trial，统一调度、并行执行。

**沙箱层** 是考场——每个 Trial 分到一间独立沙箱，本地 Docker 或云端任选其一，考生在各自考场里独立作答。

**结果层** 是成绩单——所有 Trial 从同一个出口交卷：统一收集 patch、reward 和轨迹，再按 agent × model × dataset 汇总成可比的分数。它是编排层的收尾环节，也是整条流水线的最终交付物。

五个环节各司其职，每个只对相邻环节负责。你以后看任何评测框架，都可以拿这套"考试制度"去套。

不过，一个评测框架的真实功力，藏在三个容易出事的地方：**编排层怎么驯服上百个 Trial？沙箱层怎么一套接口管住两种世界？判卷怎么做到独立可信？**

这三问，正好对应流水线上最见功力的三个部件。

---

## 三、拆解：编排 / 沙箱 / 判卷——流水线上最见功力的三个部件

### 3.1 编排层：当上百个 Trial 涌向你的机器

先看一个数字：DeepSWE 全量 113 个任务 × 1 个 Agent × 3 次尝试 = **339 个 Trial**。

如果是 2 个 Agent 对比，就是 600 多个。

没有任何机器能同时跑 600 个沙箱，也不该跑——所以第一个问题来了：**怎么让有限的资源，优雅地消化无限的组合？**

Harbor 的答案是教科书级的：三重循环 + 一个信号量。

```
for attempt in attempts:      # 考几次
    for task in tasks:        # 哪些考卷
        for agent in agents:  # 哪些考生
            spawn_trial(...)
```

组合展开成一张 Trial 矩阵，每个格子 = 1 个 task + 1 个 agent + 1 次评测。然后，全部塞进一个 FIFO 队列。

闸门是一个 **Semaphore**——`--n-concurrent 4` 就意味着只有 4 枚令牌。拿到令牌的 Trial 才能起沙箱开跑，跑完归还令牌，队首补位。

![图B：Job 把任务 × Agent × 尝试展开成 Trial 矩阵，统一调度、并行执行](/assets/img/blog-figB-job-trial-orchestration.png)

`asyncio.Semaphore` 是 Python 里再普通不过的原语——但正因为简单，它可依赖。没有线程池的黑魔法，没有优先级队列的过度设计，一个闸门管住所有洪水。

**真正见功力的，是另一件事：Ctrl-C 的优雅退出。**

评测跑到两小时，你发现配置错了，按下 Ctrl-C。会发生什么？

naive 的实现：进程直接死掉，沙箱成了孤儿，云端账单继续烧，已有结果全部丢失。

Harbor 的处理分四步：**记录状态 → 广播事件 → 抢救输出 → 清理沙箱**。`TaskGroup` 广播取消信号，每个 Trial 在 `shield` 保护下把 patch 和轨迹抢救落盘，沙箱逐一销毁，最后优雅退出——你两小时的电费没白烧。

> 观点：编排层的成熟度，决定了评测能不能进 CI/CD。**一次 Ctrl-C 都处理不好的系统，没人敢挂在流水线上**——CI 里第 100 次运行时被取消的概率，远比你想象的高。

### 3.2 沙箱层：一套抽象，两种世界

考场有两种：本地的 Docker，云端的 Daytona / Modal / E2B……加起来几十种。

几十种环境 × 每种的启动、执行、销毁、取日志方式都不同——怎么管？

Harbor 的答案是一个三层结构：

![图C：沙箱双轨——本地 Docker 或云端环境二选一，每个 Trial 独占一间考场](/assets/img/blog-figC-sandbox-dual-track.png)

最顶层是 `BaseEnvironment`，只暴露五个动作：`start → setup → exec → stop → delete`。编排层从生到死只见这五个动作，**完全不知道底下跑的是 Docker 还是 Daytona**。

中间层是 `_ENVIRONMENT_REGISTRY`——一张朴素的字典：

```python
EnvironmentType.DOCKER: _EnvEntry(
    module="harbor.environments.docker.docker",
    class_name="DockerEnvironment",
)
```

EnvFactory 进来，查表，拿到模块路径和类名。就这么直接——**字典即注册表，没有魔法**。

而且这个 import 是**懒加载**的：用 docker 时，daytona 的 SDK 从未被导入。你不用为一个自己不用的云厂商，付出启动时间和依赖冲突的代价。

还有一个逃生舱：配置里写 `import_path = "my_pkg:MyEnv"`，就能加载任何自定义环境类——**不改 Harbor 一行代码，接入你自己的沙箱**。

**沙箱内部，还有一层设计值得单独说：Trial 的两种模式。**

模式一（SEPARATE）：推理沙箱和验证沙箱是两个容器。推理结束后，通过 collect_hook 把 patch 传递到一间**全新的考场**判卷。

模式二（SHARED）：推理和验证共用一个容器，省去接力开销。

选哪种，按需权衡。但无论哪种——**每个 Trial 永远独占自己的容器**。Agent 隔离不因模式选择而打折。

> 观点：考场隔离不是功能，是评测的可信度本身。**在被人污染过的沙箱里跑出的分数，等于没测。**

### 3.3 判卷层：一份 patch 的最终命运

考试考完了，答案在哪？

推理沙箱里的 Agent 留下了改动——但沙箱马上就要销毁了。所以在停止之前，有个抢救动作：**collect**。通过 service 执行 `git diff`，把改动导出成 `model.patch`。

> 这一步带容错：收集失败不会中断整个 Trial，只是这个 Trial 拿不到分，相当于交了"白卷"。

**防泄漏机制**

然后是最有讲究的一步：**验证环境 = 原始环境 + model.patch + test.patch**。

![图D：判卷与汇总——patch 接力进验证考场，reward 统一收集、汇总成 pass@k](/assets/img/blog-figD-verdict-aggregation.png)

model.patch 好理解——考生的答案。**test.patch 是什么？为什么判卷还要再打一层补丁？**

因为测试用例本身，对 Agent 是保密的。

任务描述会告诉 Agent"修复这个 bug"，但不会附上验证代码。测试在判卷阶段才由 test.patch 注入——Agent 无法针对测试代码做优化，无法猜题，更无法直接改测试文件给自己放水。这个设计继承自 SWE-Bench，是整个 SWE 系评测的信任基石。

判卷执行是两段式的：`test.sh` 只负责编排（搭环境、跑测试），**判分交给 grader**——编排和评分职责分离，评分引擎可以做得通用。

**归一化出口**

分数最终写入 `/logs/verifier/reward.txt`——一个再简单不过的标准化出口：**所有数据集、所有 Agent、所有沙箱，最终都从这一个出口交卷。**

单场考试的分数有了，最后一步：**归一化汇总**。

每个 Trial 产出四样东西：reward、model.patch、ATIF 轨迹（一种标准化的轨迹交换格式，第五章会展开）、日志，落到 `trials/` 目录。Job 结束时按 `{agent}__{model}__{dataset}`（这个分组键叫 **evals_key**）分组，和历史 Trial 一起，算出**无偏 pass@k**：

$$pass@k = 1 - \frac{\binom{n-c}{k}}{\binom{n}{k}}$$

n 个样本里 c 个通过，随机抽 k 个全不中的概率被减掉——不是简单的"跑三次对一次就报 33%"，而是统计意义上的无偏估计。（前提是 reward 严格二元，0 或 1；含糊其辞的分数在这里会被拒绝。）

> 观点：推理与判卷分离，是评测的"三权分立"。**作答的人，永远不能当自己的阅卷人。**

---

## 四、实战切片：DeepSWE × mini-swe-agent

### 4.1 30 秒起跑

```bash
# 安装
uv tool install harbor

# 跑起来：DeepSWE × mini-swe-agent
harbor run --dataset deepswe --agent mini-swe-agent \
  --model openai/deepseek-v4-pro \
  --ae OPENAI_BASE_URL=https://api.deepseek.com/v1 \
  --ae OPENAI_API_KEY=$OPENAI_API_KEY \
  --n-concurrent 4
```

回车，流水线启动：

```
Running trials… ━━━━━━━━━━━━ 12/113
  ts-pattern-match-each__9giF4pL: running agent…
  tomlkit-toml-table-converters__BVG4s9W: verifying…
  abs-module-cache-flags__k3Fq2x: starting environment…
```

谁在推理、谁在起沙箱、谁在判卷，一目了然。

### 4.2 DeepSWE 的考卷长什么样

评测过程中，我们可以趁机了解下考卷内容。每个 DeepSWE 任务，适配后就是一个标准 Task 目录——这是一份真实的：

```
ts-pattern-match-each/
├── task.toml          # 考务信息：超时、资源、元数据
├── instruction.md     # 题面：Agent 看到的全部世界
├── environment/
│   └── Dockerfile     # 推理考场的图纸
├── solution/          # 参考解法（供人查阅与冒烟验证，判卷不用它）
│   ├── solution.patch
│   └── solve.sh
└── tests/             # 判卷部门
    ├── Dockerfile     # 验证考场的图纸
    ├── test.patch     # 隐藏考题：判卷时才注入
    ├── test.sh        # 判卷编排
    ├── grader.py      # 判分引擎
    └── config.json
```

注意 `tests/` 目录——第三章讲的判卷机制，实物全在这里：
- test.patch 就是那个"对 Agent 保密的测试"。
- grader.py 就是那个"独立的判分引擎"。
- tests/Dockerfile 就是 SEPARATE 模式下那间"全新的验证考场"。

再看题面。`instruction.md` 是 Agent 看到的全部世界，真实的题面长这样（英文原文）：

> Please solve this issue: ts-pattern's `match` short-circuits on the first matching pattern. Add a new top-level function `matchEach` that evaluates ALL registered patterns against the input and collects every matching handler's result into an array, returned in the order clauses were declared.
>
> （译：ts-pattern 的 `match` 在首个匹配处短路。请新增顶层函数 `matchEach`：对所有注册模式求值，收集全部命中 handler 的结果，按声明顺序返回数组。）

没有测试代码，没有 hint，没有判分逻辑——**这就是 test.patch 保密设计场景下 Agent 拿到的真实考题**。

### 4.3 分数之外的战场：从产物里做一次归因

评测跑完，终端打出一张汇总表——你拿到一个 pass@1。

数字本身不提供任何行动指引——**它只告诉你"多差"，不告诉你"为什么差"**。

好消息是，判卷需要的所有材料，Harbor 都替你留下来了。打开结果目录，一个 Trial 的产物长这样（真实目录）：

```
ts-pattern-match-each__9giF4pL/
├── result.json                        # 全局档案：配置、耗时、token 成本
├── agent/
│   ├── trajectory.json                # ATIF 轨迹：完整作答过程
│   └── mini-swe-agent.txt             # Agent 原始日志
├── artifacts/
│   └── logs/artifacts/model.patch     # Agent 的最终改动
└── verifier/
    ├── reward.json                    # 判卷结果
    ├── ctrf.json                      # 91 个测试的逐条报告
    ├── test-stdout.txt                # 判卷原始输出
    └── reports/                       # 测试框架原生报告（JUnit XML 等）
```

四组产物，各管一段。归因的时候可以按这个顺序看。

**第一站：verifier/reward.json——分数的解剖图。**

```json
{
  "reward": 1,
  "f2p_total": 85, "f2p_passed": 85,
  "p2p_total": 6,  "p2p_passed": 6
}
```

这一个 Trial 满分。但真正有价值的是两个细分维度：

- **f2p（fail to pass）**：修复前挂掉、修复后必须通过的测试——**这就是考题本身**；
- **p2p（pass to pass）**：修复前就通过、修复后也必须通过的测试——**"别把对的改坏了"**。

**第二站：verifier/test-stdout.txt——判卷现场录像。**

```
[verifier] model.patch applied (33272 bytes)
[verifier] Resetting files touched by test.patch
[verifier] Applying test.patch
PASS tests/match-each.test.ts
  matchEach
    basic behavior
      ✓ should collect all matching handler results (4 ms)
      ✓ should return results in declaration order (1 ms)
      ✓ should NOT short-circuit on first match (1 ms)
      ✓ should behave differently from match (match short-circuits)
      ✓ should return an array with one element when only one matches
    .run() and .exhaustive()
      ✓ .run() should throw NonExhaustiveError when nothing matches (36 ms)
      ✓ .exhaustive() without fallback should throw NonExhaustiveError
      ...
```

这就是这个 Trial 的真实打分实录：**先打 model.patch（考生答案），再注入 test.patch（隐藏考题），然后起测试**。

**第三站：model.patch + trajectory.json——从结果回溯过程。**

model.patch 是 Agent 交出的 diff，改动是否精准落在问题文件，一眼便知。trajectory.json（ATIF 格式）则是完整的过程记录——每一次 LLM 调用、每一次工具执行。

这个 Trial 的轨迹有 88 步，浓缩成骨架长这样：

```json
{
  "schema_version": "ATIF-v1.7",
  "agent": { "name": "mini-swe-agent", "model_name": "openai/deepseek-v4-pro" },
  "steps": [
    { "step_id": 1, "source": "system",
      "message": "You are a helpful assistant that can interact with a computer." },
    { "step_id": 2, "source": "user",
      "message": "Please solve this issue: ts-pattern's `match` short-circuits..." },
    { "step_id": 3, "source": "agent",
      "reasoning_content": "Let me start by exploring the repository structure...",
      "tool_calls": [{ "function_name": "bash",
        "arguments": { "command": "pwd && ls -la && git status" } }],
      "observation": { "results": ["（工具执行输出，略）"] },
      "metrics": { "prompt_tokens": 1707, "completion_tokens": 84 } },
    "...（中间 84 步：读代码 → 写实现 → 跑测试 → 迭代修复，此处略）...",
    { "step_id": 88, "source": "agent",
      "message": "The implementation is complete and committed on branch `feat/match-each`...",
      "tool_calls": [{ "function_name": "bash",
        "arguments": { "command": "echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT" } }] }
  ]
}
```

每一步都是"**思考 → 动作 → 观察**"的三元组：`reasoning_content` 是 Agent 想什么，`tool_calls` 是做什么，`observation` 是看见什么，`metrics` 记下这一步花了多少 token。
重点看两处：**转折点**（从"探索"切到"修改"的那一步，方向对不对）和**最后几步**（是改完跑测试挂了，还是上下文耗尽草草收场）。

**第四站：result.json——全局账本。**

```json
{
    "agent_result": {
        "n_input_tokens": 6729515,
        "n_cache_tokens": 6645376,
        "n_output_tokens": 59270
    },
    "started_at": "2026-09-07T08:04:34.202557Z",
    "finished_at": "2026-09-07T08:28:54.046154Z",
    "environment_setup": {
        "started_at": "2026-09-07T08:04:34.260281Z",
        "finished_at": "2026-09-07T08:04:37.156134Z"
    },
    "agent_setup": {
        "started_at": "2026-09-07T08:06:27.877439Z",
        "finished_at": "2026-09-07T08:06:28.399597Z"
    },
    "agent_execution": {
        "started_at": "2026-09-07T08:06:28.399741Z",
        "finished_at": "2026-09-07T08:28:11.207601Z"
    },
    "verifier": {
        "started_at": "2026-09-07T08:28:25.866457Z",
        "finished_at": "2026-09-07T08:28:54.046140Z"
    }
}
```

从 result.json 可以看出，这个 Trial 花了 24 分钟，其中推理 22 分钟、判卷 28 秒；烧了 670 万 input token（其中 660 万命中缓存）。

总体来说：**reward 看判定，stdout 看现场，patch 看结果，轨迹看过程** —— 四组产物交叉对照，一个 Trial 的死活基本就清楚了。

这也是为什么 Harbor 把轨迹和 patch 当作一等公民产物，和 reward 一起落盘。

---

## 五、统一的红利：拿到分数之后，比赛才刚开始

前面一直在讲"统一"：统一的考卷、统一的考场、统一的判卷。但统一到底买来了什么？

少写几套适配代码，只是最浅的红利。

真正的红利是两个词：
- **可比**——所有结果从同一个出口交卷，今天能和历史基线比；
- **可自动化**——所有环节只有标准接口，机器能接管整个流程。

而这两样加起来，指向同一件事：**评测可以从"跑一次"变成"一直跑"**。

你修好了"编辑过头"，下次跑分，可能"上下文管理"又开始出问题。单次评测发现的问题，永远追不上 Agent 的变化速度，这个问题的解法从来不是把单次评测做得更好，而是让评测便宜到可以随便跑。

这就是统一的深水区，两件事决定胜负。

### 5.1 轨迹 > 分数

一个 Agent 的迭代循环长这样：

```
跑评测 → 归因 badcase → 改 prompt/工具/流程 → 再跑评测 → 和上一次比
```

这个循环里，分数只出现在头尾两处，中间所有的判断——改什么、为什么改、改得对不对——**全部依赖轨迹**。没有轨迹，循环就断在第一环：你知道 54% 的失败率，但你不知道该打开哪个文件。

而且分数是会骗人的。换一个模型，pass@1 从 46% 涨到 51%——涨在哪了？如果是运气好的采样波动，你就是在为一个噪声欢呼。要回答"真的变好了吗"，得回到轨迹：是探索更高效了，还是编辑更稳了，还是只是这次运气好。

这也解释了为什么 ATIF 把轨迹定义成**标准交换格式**，而不是某个框架的私有日志——轨迹要在工具之间流动：viewer 里看、脚本里批量分析、LLM 归因工具里解读。

**分数是结论，轨迹是证据；结论会过时，证据永远可以重新审视。**

### 5.2 从"跑一次"到"每次提交都跑"

把评测搬进 CI/CD —— 让"可自动化"这份红利兑现。

之所以 N×M 的适配成本不可承受，不只是因为"写 6 套代码"累——而是因为**一次性脚本配不上持续迭代的节奏**。手工跑评测，你的迭代循环是"周"；CI/CD 化之后，是"每次提交"。

而评测要进 CI/CD，门槛比看起来高得多。这篇文章拆过的每个机制，其实都在为这一天铺路：

- **Semaphore 令牌闸门**——CI 机器资源有限，不能让评测把流水线冲垮；
- **Ctrl-C 优雅退出**——CI 里任务被取消是家常便饭，孤儿沙箱和丢失结果是流水线的定时炸弹；
- **统一的 reward 出口**——今天和历史比、这周和上周比，前提是所有结果长得一样、落在同一个地方；
- **evals_key 分组**——`{agent}__{model}__{dataset}` 是天然的基线坐标，新结果自动和历史对齐。

换句话说：**前文拆的每个"边角料"，都是 CI/CD 化的主路径。** 一个 Ctrl-C 都处理不好的评测系统，没人敢挂在流水线上；而处理好了这些细节的系统，挂上去只是顺手的事。

---

## 六、结语

评测的可信度来自制度设计，不是数据集和 Agent 数量的堆砌。

考卷标准化、考场隔离、判卷独立、分数统一，这套传统考试原则在 Agent 时代不仅没有过时，反而愈发重要。

Agent 竞赛的下半场，拼的不是谁的模型跑分高，而是谁的评测迭代快。

模型会过时，榜单会通胀，但一套可信、可比、持续运转的评测基建，会一直复利。
