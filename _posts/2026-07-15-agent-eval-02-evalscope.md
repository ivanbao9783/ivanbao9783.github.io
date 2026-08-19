---
title: "EvalScope的Agent评测系统"
author: ivanbao9783
date: 2026-07-15 15:10:05 +0800
categories: [技术笔记]
tags: [Agent评测, EvalScope, 评测框架]
description: EvalScope 的 Agent 评测系统：从多轮对话到工具调用、从结果评测到过程评测的完整方案。
---

> 搞 LLM 评测，绕不开 EvalScope。但它到底是怎么把 Agent 测起来的？数据集怎么分？内外两套 Agent 怎么接？最后究竟测了什么、又没测什么？这篇把 EvalScope 的 Agent 评测体系一次拆清楚。

## 1. EvalScope Agent 评测系统

### 1.1 EvalScope 基础评测架构

要理解 Agent 评测，先得搞懂 EvalScope 最基础的评测流程是怎么跑的。核心就两个类——**一个当导演，一个当演员**。

#### 1.1.1 关键类：DefaultEvaluator vs DefaultDataAdapter

```plaintext
┌──────────────────────────────────────────────────────────────────────┐
│                  DefaultEvaluator                                    │
│                  ── 流程编排者 ──                                      │
│  eval()  ← 四阶段剧本                                                  │
│    ├─ ① 调用 benchmark.load_dataset()                                 │
│    ├─ ② _collect_work_items() + 缓存管理                               │
│    ├─ ③ _run_pool() + 线程池调度 + 进度条                               │
│    ├─ ④ _aggregate_scores()                                          │
│    └─ ⑤ get_report()                                                 │
│  【责任】并发调度、缓存、进度、错误处理、持久化                               │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ 调用
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  DefaultDataAdapter                                  │
│                  ── 具体实现者 ──                                      │
│  load_dataset()         → 数据加载 + record_to_sample()               │
│  run_inference()        → 推理流程 + 三层 Hook                         │
│  calculate_metrics()    → 评分 + filter + extract + match            │
│  aggregate_scores()     → 指标聚合                                    │
│  generate_report()      → 报告生成                                    │
│ 【责任】数据怎么加载、模型怎么调用、分数怎么算                                │
└──────────────────────────────────────────────────────────────────────┘
```

简单说：`DefaultEvaluator` 只管"流程怎么跑"——并发、缓存、进度条、错误处理，不碰具体业务；`DefaultDataAdapter` 只管"事情怎么做"——数据怎么加载、模型怎么调、分怎么算。**职责切得很干净，这是后面所有扩展的基础。**

#### 1.1.2 DataAdapter 继承体系

顺着 `DefaultDataAdapter` 往下看，它不是孤立的——上面挂着多模态基类，下面分出各种数据集适配器，构成一套继承体系：

```plaintext
┌───────────────────────────────────────────────────────────────────┐
│                     Benchmark 层 (具体数据集)                       │
│   SimpleVQA   InfoVQA   MMMU   MMBench   POPE   SeedBench  ...    │
└────────┬──────────┬──────────┬──────────┬──────────┬──────────────┘
         │          │          │          │          │
┌────────▼──────────▼──────────▼──────────▼──────────▼──────────────┐
│              VisionLanguageAdapter (多模态基类)                     │
│   - 图像压缩 (_max_image_bytes)                                     │
│   - 占位符解析 <image 1> → ContentImage                             │
│   - base64 编码与格式转换                                            │
└────────────────────────────┬──────────────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────────────┐
│                    DefaultDataAdapter (默认基类)                    │
│   - 推理流程编排 (run_inference + 三层 Hook)                          │
│   - 评分流程 (match_score / llm_match_score)                        │
└────────────────────────────┬───────────────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────────────┐
│                       DataAdapter (抽象基类)                        │
│   load_dataset() → run_inference() → calculate_metrics()           │
│   → aggregate_scores() → generate_report()                         │
└────────────────────────────────────────────────────────────────────┘
```

越往上越抽象，越往下越具体。新加一个数据集，只需要在最底层的 Benchmark 层实现几个方法，上面的流程编排、评分骨架都能复用。

#### 1.1.3 评测数据流转全流程

把两个类的职责拼起来，就是一条完整的数据流转链路。一条样本从原始数据到最终报告，要过五道关：

```plaintext
┌──────────────────────────────────────────────────────────────────────────┐
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────┐   ┌────┐  │
│  │ 1.数据加载  │──▶│ 2.工作项    │──▶│ 3.预测+评分 │──▶│4.聚合  │──▶│5.报告│ │
│  │            │   │   收集      │   │            │   │        │   │    │  │
│  └────────────┘   └────────────┘   └────────────┘   └────────┘   └────┘  │
│                                                                          │
│  load_dataset()    _collect_         _run_pool()     _aggregate_  report │
│       │            work_items()         │            scores()     gen    │
│       ▼                 │               │               │          ▼     │
│  record_to_sample      │          ┌─────┴──────┐        │       Report   │
│  ()→Sample             │          │            │        │                │
│       │                ▼          ▼            ▼        ▼                │
│  原始数据→统一格式    缓存检查       预测         评分        指标计算          │
│                      │            │            │                         │
│                      ├─prediction cache        ├─规则匹配 match_score     │
│                      └─review cache            └─LLM裁判 llm_match_score │
└──────────────────────────────────────────────────────────────────────────┘
```

有两个细节值得注意：**一是缓存分两层**——prediction cache 存模型输出，review cache 存评分结果，互不干扰，改了评分逻辑可以只重跑 review；**二是评分有两条路**——规则匹配 `match_score` 走正则/字符串比对，`llm_match_score` 走裁判模型，后者用于开放性问答。

#### 1.1.4 三层 Hook 机制

`DefaultDataAdapter` 最值得说的是它的三层 Hook——典型的**模板方法模式**，把流程骨架锁死，把变化点下放给子类：

```plaintext
┌──────────────────────────────────────────────────────────────────────┐
│              DefaultDataAdapter (模板方法)                             │
│                                                                      │
│  run_inference()  ← 【模板方法】流程骨架，子类通常不重写              │
│    │                                                                 │
│    ├─▶ _on_inference_start()   ← Hook 1: 推理前准备（默认空实现）   │
│    │                                                                 │
│    ├─▶ _on_inference()         ← Hook 2: 真正执行推理                │
│    │      └─ 默认: model.generate(input)                            │
│    │      └─ 多轮: MultiTurnAdapter 重写 → 循环调用                  │
│    │      └─ Agent: AgentAdapter   重写 → 工具调用循环                 │
│    │                                                                 │
│    └─▶ _on_inference_end()     ← Hook 3: 推理后处理                  │
│           └─ 默认: 组装 TaskState                                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

子类扩展示例:
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ DefaultData    │  │ MultiTurn      │  │ Agent          │
│ Adapter        │  │ Adapter        │  │ Adapter        │
│                │  │                │  │                │
│ 全部用默认实现    │  │ 重写            │  │ 重写            │
│                │  │ _on_inference()│  │ _on_inference()│
│                │  │ → 多轮循环       │  │ → AgentLoop     │
└────────────────┘  └────────────────┘  └────────────────┘
```

关键在 Hook 2 `_on_inference()`：默认实现就是单次 `model.generate()`，多轮对话重写它做循环，Agent 重写它做工具调用循环。**Agent 评测的入口，就是从这个 Hook 开始分叉的。**

### 1.2 EvalScope Agent 评测架构

基础架构讲完，进入正题。Agent 评测和普通 LLM 评测最大的不同在于：Agent 要多步推理、要调工具、要和环境交互，单次 `generate()` 那套不够用了。EvalScope 为此重新搭了一套架构。

#### 1.2.1 Agent 评测数据集和分类现状

先看考题——EvalScope 目前支持 17 个 Agent 评测数据集，按能力维度分成 4 类。

##### 支持的数据集

EvalScope Agent 评测数据集：共 17 个。

**类别 1：通用 Agent 推理（2 个）**

> 特征：多步推理 + 工具使用 + 沙箱环境
>
> 场景：模型作为通用智能体完成复杂任务

- `GAIA` — ReAct + bash 工具 + Docker 沙箱
- `ACEBench` — 函数调用 + 多轮对话

这类数据集给模型一个真实世界问题，让它自己规划步骤、用工具、给答案。GAIA 的样例长这样——问的不是知识点，而是需要联网查、算、组合的复杂任务：

样例数据集（GAIA）：

```json
{
  "task_id": "e1fc63a2-da7a-432f-be78-7c4a95598703",
  "Question": "If Eliud Kipchoge could maintain his marathon pace indefinitely, how many hours would it take for him to cover the distance between the Earth and the Moon at its closest approach? Please use the minimum perigee value on the Wikipedia page for the Moon.",
  "Final answer": "17",
  "Level": "1",
  "file_name": "",
  "Annotator Metadata": {
    "Steps": "1. Googled Eliud Kipchoge marathon pace to find 4min 37sec/mile\n2. Converted into fractions of hours.\n3. Found moon periapsis in miles (225,623 miles).\n4. Multiplied the two to find the number of hours and rounded to the nearest 100 hours.",
    "Number of steps": "4",
    "How long did this take?": "20 Minutes",
    "Tools": "1. A web browser.\n2. A search engine.\n3. A calculator.",
    "Number of tools": "3"
  }
}
```

**类别 2：函数调用评测（5 个）**

> 特征：工具选择准确性 + 参数合规性 + 多轮交互
>
> 场景：评估模型 function calling 能力

- `BFCL-v3` — Berkeley Function Calling Leaderboard v3
- `BFCL-v4` — Berkeley Function Calling Leaderboard v4
- `General-FC` — 通用函数调用 + 自定义数据集
- `τ-bench` — 工具-Agent 交互基准
- `τ²-bench` — 多 Agent 协作基准
- `τ³-bench` — τ² 升级版

这类数据集聚焦"模型会不会用工具"——选对工具、填对参数、在多轮对话里连贯调用。BFCL 的数据结构是按 turn 组织的嵌套列表，模拟用户分多次提需求：

样例数据集（BFCL-v3）：

```python
turns = [
    [                                    # ← Turn 0 (第一轮对话)
        {"role": "user", "content": "I want to book a flight to NYC"}
    ],
    [                                    # ← Turn 1 (第二轮对话)
        {"role": "user", "content": "Also book a hotel"}
    ],
    [                                    # ← Turn 2 (第三轮对话)
        {"role": "user", "content": "What's the total cost?"}
    ]
]
```

**类别 3：厂商验证器（3 个）**

> 特征：第三方 API 与官方模型行为一致性验证
>
> 场景：验证厂商部署的 API 是否忠实还原官方模型能力

- `Kimi-Verifier` — 参数合规性验证
- `K2-Verifier` — 工具调用匹配验证
- `MiniMax-Verifier` — 工具调用匹配验证

这类比较特殊——**不是测模型行不行，而是测厂商部署对不对**。用同一套 prompt 分别打厂商 API 和官方基线，比对行为是否一致：

样例数据集（K2-Verifier）：

```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What's the weather in Beijing?"}
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get weather",
        "parameters": {
          "type": "object",
          "properties": {"location": {"type": "string"}},
          "required": ["location"]
        }
      }
    }
  ],
  "should_call_tool": true,
  "official_finish_reason": "tool_calls"
}
```

**类别 4：代码 Agent（7 个）**

> 特征：代码仓库修复 + 终端命令执行 + Docker 沙箱
>
> 场景：评估模型作为编程 Agent 解决实际软件工程问题

- `SWE-bench` 家族
- `SWE-bench Pro`
- `Terminal-Bench v2.0`
- `Terminal-Bench v2.1`

这类数据集让模型当程序员——给一个 GitHub Issue，让它改代码、过测试。SWE-bench 是目前代码 Agent 评测的事实标准。

##### 支持的 Agent

有了考题，还得有考生。EvalScope 支持两类 Agent：

1. **外部 Agent**：Claude Code、Codex
2. **内部 Agent**：自实现一套评测 Agent 系统

外部 Agent 是黑盒，得想办法"截胡"它的请求；内部 Agent 是白盒，通过继承体系接入。下面分别看怎么实现。

#### 1.2.2 Agent 评测基础设施

数据集是考题，基础设施是考场。EvalScope 把 Agent 运行所需的策略、工具、环境、外部集成都打包在了一起：

```plaintext
┌──────────────────────────────────────────────────────────────────────────┐
│                       Agent 基础设施                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─── strategies/ (Agent 策略) ───────────────────────────────────┐     │
│  │  ├─ function_calling.py   ← 原生函数调用策略                    │     │
│  │  ├─ react.py              ← ReAct (Reasoning + Acting)         │     │
│  │  └─ swe_bench/            ← SWE-bench 专用策略                  │     │
│  │     ├─ swe_bench_toolcall.py                                    │     │
│  │     └─ swe_bench_backticks.py                                  │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌─── tools/ (内置工具) ──────────────────────────────────────────┐     │
│  │  ├─ bash.py               ← Bash 命令执行                       │     │
│  │  ├─ python_exec.py        ← Python 代码执行                     │     │
│  │  └─ submit.py             ← 提交答案                            │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌─── environments/ (执行环境) ───────────────────────────────────┐     │
│  │  ├─ enclave.py            ← Docker 沙箱环境                     │     │
│  │  └─ local.py              ← 本地执行环境                        │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌─── external/ (外部 Agent 集成) ────────────────────────────────┐     │
│  │  ├─ claude-code/          ← Claude Code 集成                    │     │
│  │  ├─ codex/                ← OpenAI Codex 集成                   │     │
│  │  └─ mock/                 ← Mock Agent (测试用)                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌─── 核心组件 ───────────────────────────────────────────────────┐     │
│  │  ├─ loop.py               ← AgentLoop (循环控制)                │     │
│  │  └─ runner.py             ← AgentRunner (执行器)                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

四个模块各司其职：`strategies/` 决定 Agent 怎么思考，`tools/` 决定它能干什么，`environments/` 决定它在哪跑，`external/` 决定怎么接外部 Agent。`loop.py` 和 `runner.py` 是串联这一切的核心。

#### 1.2.3 外部 Agent 评测系统实现

外部 Agent（Claude Code、Codex）是现成的 CLI 工具，黑盒运行。如果直接让它调官方 API，会有一堆问题：

> **【矛盾点】** 如果直接让外部 Agent 调官方 API：
>
> 1. 外部 Agent 的 API 格式不同，无法统一处理
> 2. 外部 Agent 对外黑盒，无法统计 token 消耗
> 3. 无法缓存结果
> 4. 无法统一计费

解决办法很直接——**在中间架一个反向代理，把外部 Agent 的 API 调用"截胡"过来**：

> **【解决方案】** `ModelProxyServer`（反向代理桥接服务器）+ `AgentRunner`（外部 Agent 适配层）
>
> **【核心逻辑】** EvalScope 启动一个本地 HTTP 代理，将外部 Agent 的 API 调用重定向到该代理。该代理完成协议转换，再将请求转发给用户在 EvalScope 上配置的 Model API，同时记录完整交互信息。

思路就是：外部 Agent 以为自己在调 Anthropic/OpenAI，实际上请求被重定向到了 EvalScope 的代理，代理做完协议转换再打用户配置的模型。这样既统一了格式，又能统计 token、缓存结果。

##### 核心类 1：ClaudeCodeRunner(AgentRunner)

`AgentRunner` 负责把外部 Agent 跑起来。以 Claude Code 为例，它的职责就三步：装好 CLI、配好环境变量、执行命令。

**职责：**

1. 【安装】在 Docker 容器内安装 Node.js + claude-code CLI
2. 【配置】设置 env 环境变量，将 API 调用重定向到桥接代理
3. 【执行】在容器内执行 `claude --print` 命令

**关键实现：**

```python
async def run(self, task, env, bridge):
    # 1. 构造环境变量 (核心: 重定向 API 到桥接代理)
    env_vars = {
        'ANTHROPIC_BASE_URL': f'{bridge.base_url}/anthropic',
        'ANTHROPIC_API_KEY': bridge.trial_token,
        'ANTHROPIC_AUTH_TOKEN': bridge.trial_token,
        'HOME': '/tmp/evalscope-claude-code-xxx',
        'IS_SANDBOX': '1',
        'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC': '1',   # 禁用更新检查
    }

    # 2. 构造命令
    cmd = [
        'claude', '--print',
        '--no-session-persistence',
        '--output-format', 'text',
        '--dangerously-skip-permissions',    # 无人值守模式，防止评测过程中请求用户权限
        '--model', self._model_name,         # 用户在 EvalScope 上配置的被测模型
        task.instruction,                    # 核心任务，eg："修复这个 GitHub Issue..."
    ]

    # 3. 在 Docker 容器内执行
    result = await env.exec(cmd, timeout=task.timeout, env=env_vars)

    # 4. 返回 stdout 作为 Agent 的输出
    return AgentRunResult(output=result.stdout.strip(), metrics={...})
```

精髓在环境变量：`ANTHROPIC_BASE_URL` 指向代理地址，`ANTHROPIC_API_KEY` 塞的是 trial token 而非真 key。Claude Code 毫无察觉地就把请求发给了 EvalScope。`--dangerously-skip-permissions` 是无人值守的关键，否则评测跑到一半弹窗问你要不要授权，就没法自动化了。

##### 核心类 2：ModelProxyServer

代理服务器干三件事：转协议、转发请求、记轨迹。

**职责：**

1. 【协议转换】外部 Agent 消息格式和 EvalScope 标准格式之间进行转换
2. 【转发请求】将外部 Agent 请求转发到用户配置的模型 API
3. 【轨迹记录】记录评测过程中外部 Agent 完整交互信息

**关键实现：**

```python
# 注册主流 Agent 的 HTTP 路由对应的协议转换函数
app = web.Application()
app.router.add_post('/anthropic/v1/messages', self._handle_anthropic_messages)        # Claude Code 的请求
app.router.add_post('/openai/v1/chat/completions', self._handle_openai_chat_completions)  # OpenAI 的请求
app.router.add_post('/openai/v1/responses', self._handle_openai_responses)
app.router.add_get('/healthz', _healthz)        # 健康检查
app.router.add_route('HEAD', '/{tail:.*}', _head_probe)  # 首次连接的 HEAD 探测
```

三条路由对应三种主流协议。不管外部 Agent 用哪家的 SDK，请求进来都被转成 EvalScope 内部统一格式，再打到被测模型。

**消息样例（三种格式对比）：**

```json
// Anthropic 格式
{
  "system": "You are...",
  "messages": [
    {"role": "user", "content": "Hi"}
  ]
}
```

```json
// OpenAI Chat 格式
{
  "messages": [
    {"role": "system", "content": "You are..."},
    {"role": "user", "content": "Hi"}
  ]
}
```

```python
# EvalScope 统一格式
messages = [
    ChatMessageSystem(content="You are..."),
    ChatMessageUser(content="Hi")
]
```

差别看着不大，但细节里全是坑——Anthropic 把 system 放在顶层字段而非 messages 里，tool_use/tool_result 的组织方式也和 OpenAI 不同。协议转换就是要把这些差异抹平。

#### 1.2.4 内部 Agent 评测系统实现

外部 Agent 靠桥接，内部 Agent 靠继承体系。EvalScope 给内部 Agent 准备了三个 Adapter 基类，**分别对应三种不同的推理范式，这是整个 Agent 评测体系的核心设计**：

**内部 Agent 评测类继承体系**

```plaintext
┌──────────────────────────────────────────────────────────────────────────┐
│                        DataAdapter (抽象基类)                             │
│                     load_dataset / run_inference /                        │
│                     calculate_metrics / generate_report                   │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│                  DefaultDataAdapter (默认实现)                             │
│              三层 Hook 机制 + 默认评分流程                                  │
└──┬──────────────┬──────────────┬────────────────────────────────────────┘
   │              │              │
   ▼              ▼              ▼
┌──────────┐ ┌──────────────┐ ┌────────────────────┐
│ Agent    │ │ AgentLoop    │ │ VendorVerifier     │
│ Adapter  │ │ Adapter      │ │ Adapter            │
│ (自定义类) │ │ (通用编排)     │ │ (厂商验证器)        │
│          │ │              │ │                   │
│ 仅重写    │ │ 接管 _on_     │ │ OpenAI兼容推理 +    │
│ _on_     │ │ inference    │ │ JSON Schema 校验   │
│ inference│ │ 组装AgentLoop │ │                   │
└──────────┘ └──────────────┘ └───────────────────┘
```

三个子类都重写了 `_on_inference()`，但重写的方式完全不同。下面挨个看。

##### 核心类 1：AgentLoopAdapter

> 适合依赖【标准的 Think → Act → Observe 循环 Agent】进行评测的数据集，eg：GAIA

这是最省心的一个——数据集只要能套进"思考-行动-观察"的标准循环，就用它。子类不用重写推理逻辑，只需实现三个 build 方法，把策略、工具、环境配好，剩下的交给 `AgentLoop`：

```plaintext
######### 核心流程 #########

_on_inference(model, sample)
        │
        ├─▶ build_strategy(sample)          --- 构建Agent策略 eg：ReactStrategy()
        │
        ├─▶ build_tools(sample)             --- 构建Agent工具  eg：{'bash': run_bash}
        │
        ├─▶ build_environment(sample)  → EnclaveAgentEnvironment     --- 构建Agent沙箱  eg：docker / local
        │
        └─▶ run_agent_loop(model, strategy, handlers, environment, ...)    --- 循环执行任务
               │
               └─▶ AgentLoop.run(ctx)
                    │
                    └─▶ _inject_system_prompt
                            │
                            └─▶ while ctx.step < max_steps
                                    │
                                    │─▶ strategy.prepare_messages(ctx)         --- 解析消息列表
                                    │
                                    │─▶ strategy.tools(ctx)                    --- 获取工具列表
                                    │
                                    │─▶ model.generate_async(messages, tools)  --- 调用模型 API
                                    │
                                    └─▶ ctx.messages.append(assistant_msg)     --- 追加到对话历史
```

`AgentLoop.run()` 就是那个经典的 while 循环：准备消息 → 拿工具 → 调模型 → 追加回复，直到步数耗尽或任务完成。GAIA 这类任务用它能开箱即用。

##### 核心类 2：AgentAdapter

> 适合通过【自定义推理逻辑】进行评测的数据集，eg：BFCL 系列、τ²-bench 系列

如果标准循环套不进去，就退回到 `AgentAdapter`——它只给一个空壳，推理逻辑完全自己写：

```plaintext
######### 核心流程 #########

_on_inference(model, sample)
        │
        └─▶ customer_inference  --- 自定义的推理逻辑


######### 为什么需要自定义推理逻辑？#########

【差异点 1】
以 BFCL 数据集为例，BFCL 是一个多轮交互（multi-turn）的测试数据集，模拟真实场景下的用户多轮对话。

需要 2 层循环交互：
- 外层循环（turn）：用户驱动的。每个 turn 有新的用户输入，模拟真实多轮对话
- 内层循环（step）：模型驱动的。模型在一次用户输入后，可能需要多次工具调用（搜索→预订→确认）

而 AgentLoopAdapter 适合的是仅模型驱动的内层循环（step），因此需要 AgentAdapter 来自定义推理逻辑


【差异点 2】
BFCL 有一个评测维度是：turn 内工具选择是否正确

需要 Infer 返回特殊构造的 all_model_responses（每轮的调用工具列表 + multi-turn 的状态 + turn 内分组的 fc 调用序列）

而 AgentLoopAdapter 只保留无状态的每轮 messages 和 trace。
```

为什么 BFCL 不能用 `AgentLoopAdapter`？两个原因：**一是循环结构不同**——BFCL 需要外层 turn（用户驱动）+ 内层 step（模型驱动）的两层嵌套，而 `AgentLoopAdapter` 只有内层；**二是评分需要的数据不同**——BFCL 要按 turn 分组保留工具调用序列，`AgentLoopAdapter` 只留无状态的 messages 和 trace。所以必须自己写。

##### 核心类 3：VendorVerifierAdapter

> 适合评测【厂商行为是否符合预期】的数据集

这个最简单，也最特殊——它不跑循环，就单次调一下厂商 API，看行为对不对：

```plaintext
######### 核心流程 #########

_on_inference(model, sample)
        │
        └─▶ model.generate(input, tools)  ---- 调用厂商 API


######### 场景 & 特点 #########
核心特点：厂商验证器不是测"模型行不行"，而是测"部署对不对"

场景 1：自部署开源模型的能力验证（通过和官网 API 对比后，指导调参）
场景 2：API 供应商选型，横向对比几个开放 API 的能力高低
场景 3：模型部署版本升级后的回归测试
```

一句话总结三个 Adapter 的分工：`AgentLoopAdapter` 管标准循环，`AgentAdapter` 管自定义循环，`VendorVerifierAdapter` 管单次校验。**选哪个，取决于数据集的推理范式能不能套进标准循环。**

### 1.3 EvalScope Agent 评测系统究竟测了什么？

架构讲完了，回到一个扎心的问题：这套系统到底测了什么？

| 维度 | 是否采集 | 是否聚合 Report |
| --- | --- | --- |
| 准确率类（acc / resolved / reward） | 是 | 是 |
| 过程数据（step_count / token / tool_call / error / nudge） | 是 | 否 |
| 错误恢复能力（retry 次数 / 错误率 / 错误类型分布） | 否 | 否 |
| 上下文管理能力（上下文健康度、压缩次数、上下文溢出次数） | 否 | 否 |
| 稳定性 pass@k / pass^k | 仅 τ-bench 涉及 | 仅 τ-bench 涉及 |

看这张表就明白了：**过程数据采了，但没上报告**。step_count、token、tool_call、error、nudge 这些都落到了 trace 里，但 Report 里只有 acc。成本没核算，错误恢复没测，上下文管理没测，可靠性只有 τ-bench 涉及。

**EvalScope Agent 评测系统的目标定位：**

> 测的是 **"Agent 系统中的 Model 行不行"**，而非 **"Agent 系统行不行"**。
>
> 前者关心 acc，后者关心 cost / reliability / latency。

说白了，EvalScope 当前回答的是"模型能不能做对"，而不是"这套 Agent 系统部署得行不行"。前者是能力问题，后者是工程问题——而生产环境真正卡脖子的，往往是后者。这也是 Agent 评测下一步要补的课。
