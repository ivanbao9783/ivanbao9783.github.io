---
title: "Agent 突然卡了半分钟：一次上下文压缩，为什么让请求变小反而变慢"
author: ivanbao9783
date: 2026-10-23 22:00:00 +0800
categories: [周边领域]
tags: [推理, "KV Cache", "Prefix Cache", 上下文压缩, Agent]
description: "从一次上下文压缩切入，讲清 prefill/decode、KV Cache、prefix cache 与块哈希，解释为什么请求变小反而更慢。"
---

一个跑了三小时的 coding agent，上下文到了 18 万 token。你敲下「继续」，界面先停在「正在压缩上下文…」半分钟；等它恢复，下一句话的首 token 又从平时的 100 毫秒变成接近一秒，然后一切正常。

多数人会把这段卡顿归给网络或模型。真正的原因在服务端：压缩把请求从 18 万 token 砍到 3 万，但也把前缀换掉了。缓存只认从第 0 个 token 开始连续一致的那一段，断点之后全部重算。

> **一句话：压缩的代价不在删了多少，而在删的位置——后面有多少缓存失效，由它决定。**

⏱️ 阅读时间：约 10 分钟

---

## 📋 读完你将了解

- [x] 压缩时那半分钟，和压缩后那一秒，分别慢在哪
- [x] prefill 与 decode 的瓶颈为什么不同，各自的单步下界怎么估
- [x] KV Cache 的显存账怎么算，GQA 省在哪
- [x] prefix cache 为什么能跨请求复用，命中的四个条件
- [x] 块哈希为什么是链式的，为什么一次压缩会让后面全部失效
- [x] 容量规划该看工作集还是 QPS，压测为什么不能剔掉压缩会话

---

## 一、变小却变慢：先看这两条请求

服务端看不到「压缩」这个动作。它只看到两条互不相关的请求：一条 18 万 token，一条 3 万 token。

```
第 N 轮    in=180,000   hash_ids=[0 .. 2812]
第 N+1 轮  in=30,000    hash_ids=[0 .. 203, 2813, 2814, ...]
                        └─ 共享 13,056 ─┘  └── 全新块 ──┘
```

请求小了 83%，但能复用的只剩前 13,056 个 token（204 个 64-token 块），占 43.5%。剩下 16,944 个 token 必须重新 prefill。

于是同一条会话上出现两段卡顿：

| 时刻 | 服务端看到什么 | 缓存命中 | 主要成本 |
| --- | --- | --- | --- |
| 第 N 轮 | in=180,000 | 前缀基本全中 | 新增约 200 token 的 prefill |
| 压缩调用 | in=180,000 + 摘要指令 | 取决于指令插在哪 | 2K token 的长上下文 decode |
| 第 N+1 轮 | in=30,000 | 13,056（43.5%） | 16,944 token 重新 prefill |
| 之后 | 在新前缀上继续 | 恢复高命中 | 正常 |

要解释这两段卡顿，只需要四个概念：**prefill/decode 决定单次成本，KV Cache 决定记住多少，prefix cache 决定能借多少，块哈希决定怎么判定「借得到」。**

> 说明：本文数字以 8B 模型、32 层、8 个 KV 头、head_dim 128、fp16 为例；换成 70B 只改量级，不改结论。

---

## 二、prefill 与 decode：一个并行，一个串行

大模型处理一次请求分两段：

```
输入 50,560 token
  ① prefill：把这 5 万个 token 一次读完，算出中间状态
  ② decode ：一个 token 一个 token 往外蹦，蹦 204 次
输出 204 token
```

prefill 能并行：50,560 个 token 全都已知，可以一次性做矩阵乘；因果掩码只是在 attention 里屏蔽「未来」，不妨碍一次算完。这是一次大 GEMM，瓶颈是算力。

decode 必须串行，因为第 n+1 个 token 是第 n 步的输出。每一步只算 1 个 token，却要把整个模型权重从显存读一遍。8B 模型 fp16 约 16 GB，HBM 带宽约 3 TB/s，单步下界约 5–6 ms；70B fp16 约 140 GB，80 GB 单卡装不下，至少 TP=2，两张卡各读 70 GB，单步约 20–30 ms。

所以提升 decode 的手段是加大 batch（一次读权重，服务多个请求），而不是增加位置并行度。三种常见做法：continuous batching 把多个请求的 decode 拼批；投机解码先猜 D 个 token，再让目标模型一次验证；chunked prefill 把长 prefill 切块插空，避免它长时间占住 GPU。

<iframe class="cc-embed" src="/assets/html/context-compaction/fig-1-two-phases.html" title="一次请求的两段路" style="height:300px" loading="lazy"></iframe>

一句话：**prefill 贵在算，decode 贵在搬。**

---

## 三、KV Cache：decode 不重算的代价

模型每读一个 token，每层都会产生一对 Key/Value 向量。decode 第 2 个 token 时仍要用第 1 个 token 的 K/V，存下来就是 KV Cache。

它的大小是：

```
KV = 2 × 层数 × KV头数 × head_dim × 序列长度 × 每元素字节
```

注意存多少份取决于 **KV 头数**，不是 Q 头数。多头注意力把 4096 维的隐状态投影到 32 组 128 维的子空间，每组独立算一遍注意力；GQA 让多个 Q 头共享同一组 KV：

| 方案 | Q 头 | KV 头 | 每 token KV（32 层 / head_dim 128 / fp16） |
| --- | --- | --- | --- |
| MHA | 32 | 32 | 512 KiB |
| GQA（Llama-3 等主流） | 32 | 8 | 128 KiB |
| MQA | 32 | 1 | 16 KiB |

GQA 把显存降到 1/4，质量损失很小，这就是它成为主流的原因。DeepSeek 的 MLA 更进一步：不存完整 K/V，只存压缩后的 latent，外加解耦的 RoPE 分量，用的时候再投影。

一笔具体的账：8B 模型、32 层、8 个 KV 头、head_dim 128、fp16，每 token 是 128 KiB。一个 100K 上下文的会话约 12.2 GiB（13.1 GB）；8 个这样的会话并发约 98 GiB，已经超过一张 80 GB 卡（约 74.5 GiB 可用），而且这还没算 16 GB 权重、激活和碎片。实际能同时跑的长会话通常只有 4–5 个。

<iframe class="cc-embed" src="/assets/html/context-compaction/fig-2-kv-ledger.html" title="KV Cache 的显存账" style="height:330px" loading="lazy"></iframe>

这就是长会话 Agent 把显存吃光的具体过程：不是模型变大，是 KV 随上下文线性增长。

---

## 四、Prefix Cache：把算过的借给别人

KV Cache 是**一个序列的内部状态**；Prefix Cache 是**跨请求复用已有 K/V 的机制**。

一个常被忽略的事实：多轮对话在服务端就是多条独立请求——第 7 轮和第 8 轮是两个 HTTP 请求，服务端不认「同一个会话」。多轮复用也属于 prefix cache。

为什么可以复用？注意力是因果的：第 100 个 token 只能看到前 99 个。反过来说，前 50,560 个 token 的 K/V 只由它们自己决定，与后面追加什么无关。

```
第 7 轮：[system + tools + 历史 1..6 + 新消息] = 50,560 token
第 8 轮：[system + tools + 历史 1..7 + 新消息] = 50,752 token
                  ↑ 前 50,560 个 token 完全相同
```

命中前缀，就能跳过这段 prefill：不命中时每轮重算 5 万 token，TTFT 几秒；命中时每轮只算新增的 192 个 token，TTFT 百毫秒以内。

复用是「共享同一块」，不是「复制一份」。引擎用引用计数 + 写时复制：块 #17 被请求 A 引用时 refcount=1，请求 B 命中时 refcount=2，不复制；满块是不可变的，只有最后一个 partial block 被某个请求继续写时，才真正复制。

<iframe class="cc-embed" src="/assets/html/context-compaction/fig-3-prefix-reuse.html" title="两轮请求共享前缀" style="height:340px" loading="lazy"></iframe>

命中要同时满足四个条件：

1. 从第 0 个 token 开始逐 token 完全一致，不是语义相似，中间不能缺块；
2. 同一个模型权重、同一套 adapter、同一量化档位、同一套并行切分（TP/PP）；
3. 同一个 tokenizer 和 chat template，否则拼出的 token 序列不同；
4. 请求被路由到同一副本，除非有跨副本共享缓存。

第 4 条解释了一个常见工程现象：**负载均衡会打掉命中率**。所以生产系统常做 cache-aware routing——按前缀哈希把相同前缀的请求送到同一副本。

---

## 五、块与链式哈希：前缀一致怎么判定

逐 token 比对太慢，引擎按固定大小的块索引，常见 16 / 32 / 64 token 一块。轨迹数据集用 64 token 一块，并给每块一个会话内局部编号：

```
第 1 轮： [A B C D] [E F G H]                     hash_ids = [0, 1]
第 2 轮： [A B C D] [E F G H] [X Y I J]           hash_ids = [0, 1, 2]
第 3 轮： [A B C D] [E F G H] [X Y I J] [Z K L M] [N]
                                                   hash_ids = [0, 1, 2, 3, 4]
```

规则：**同号 = 同内容**；编号按「首次出现」顺序递增；残块也占一个编号，展开时按实际长度算，不是固定 64。

关键在于哈希是**链式**的：

```
h_i = H(h_{i-1}, block_i)
```

每块的哈希包含它前面的全部内容。所以改动中间一块，后面所有块的哈希都会变——这就是一次压缩能让「后面全部失效」的机制。

为什么是 64，不是 1 或 128？以一条 88,768 token 的轨迹、68,266 条请求为例：

| 粒度 | 单条轨迹的 ID 数 | 全量体积 | 评价 |
| --- | --- | --- | --- |
| 单 token | 88,768 | 约 24 GB | 体积不可分发，隐私最差 |
| 16 | 5,548 | 约 1.5 GB | 体积 4 倍；细于部分引擎的块，最多高估不到一个服务端块 |
| **64** | **1,387** | **约 380 MB** | **折中：体积可分发，低估 <64 token** |
| 256 | 347 | 约 95 MB | 体积最省；粗于部分引擎的块，最多低估不到一个记录块 |

粒度只影响「你知道多长的共享」，不会改变服务端的实际命中。方向要记对：

- 记录粒度**细于**服务端块（16 对 64）：会把「块内部分一致」误当成可复用，最多**高估**不到一个服务端块；
- 记录粒度**粗于**服务端块（256 对 16）：只会漏掉块内更短的共享，最多**低估**不到一个记录块。

更重要的是，Agent 的前缀共享几乎总是整段对齐的（system 整段、tools 整段、历史整段），64 已经足够表达真实结构。

还有一层常被忽略：**位置也参与缓存**。RoPE 让 key 与位置绑定，即使内容哈希相同，前缀被平移到别的位置，K/V 也变了。所以「原文没变」不等于「能复用」。

由此得到全文最重要的一条规则：

> **命中长度 = 第一个被改写的 token 之前、按服务端块对齐的前缀。**

压缩把摘要插到第 13,056 个 token，后面的内容哪怕一个字没改，也全部落在断点之后。

<iframe class="cc-embed" src="/assets/html/context-compaction/fig-4-hash-break.html" title="链式哈希与压缩后的断裂" style="height:360px" loading="lazy"></iframe>

---

## 六、回到压缩：两段卡顿，各自的原因

### 6.1 压缩调用本身：慢在 decode

上下文接近窗口上限（例如 18 万 token）时，客户端把整段对话发给模型，让它写一份约 2K token 的摘要，然后丢弃全部历史。

这一步的前缀能不能命中，取决于摘要指令插在哪：追加在历史之后，前缀命中，只需 prefill 指令；插在 system/头部，前缀从第 0 个 token 就变了，18 万 token 全部重算。

但无论前缀是否命中，摘要都要一个 token 一个 token 地生成。按 8B/H100 粗算，在 18 万上下文下每步要读约 16 GB 权重 + 22 GiB KV，单步 20–30 ms；2K 步就是 40–60 秒。这就是「正在压缩上下文…」那半分钟的来源——**它是一条长上下文的 decode，不是一次 prefill。**

### 6.2 压缩后的首轮：慢在 prefill

压缩后，请求变成：

```
[system+tools 13,056] + [摘要 2K] + [最近几轮原文 15K] + [本轮新增] ≈ 30K
```

system + tools 还在原位，能命中 13,056 个 token（43.5%）；从摘要开始，后面全部是新的。最近几轮虽然原文没变，却被挪到了摘要之后，位置变了，K/V 不能复用。于是 16,944 个 token 要重新 prefill。

8B/H100 上，17K token 的 prefill 约 0.5–1 秒；更大模型、更长的上下文或排队时，会到数秒。在一条本应平滑的延迟曲线上，这就是一个尖峰。

### 6.3 还没算完的账

- **显存**：旧的 180K KV 若没被淘汰，仍然占着 HBM；新的 30K 前缀又要分配，其中 17K 是新块。一瞬间的驻留量是 180K + 17K ≈ 197K token 的 KV，约 24 GiB。压缩不会立刻省显存，它先让显存更紧张。
- **并发**：压缩通常由 token 阈值触发，会集中在某个上下文长度附近。并发用户越多，压缩事件叠加的概率越大，形成一次小幅的 prefill 洪峰。chunked prefill 能把洪峰削平，但会插队到其他请求的 decode 之间，抬高它们的 p90 ITL。
- **收益**：压缩买到的是窗口容量，付出的是一次长上下文 decode + 一次 1.7 万 token 的 prefill。触发得越早，单位收益越低。

<iframe class="cc-embed" src="/assets/html/context-compaction/fig-5-timeline.html" title="两段卡顿的时间线" style="height:370px" loading="lazy"></iframe>

---

## 七、怎么观测、怎么规划

### 7.1 三个客户端指标

| 指标 | 反映 | 压缩后的表现 |
| --- | --- | --- |
| TTFT | prefill 速度 + 排队 + 缓存命中 | 尖峰 |
| ITL / p90 interactivity | decode 速度 + 并发干扰 | 本请求基本不变；跨请求 p90 会被 prefill 洪峰抬高 |
| TTLT | 端到端 | 随 TTFT 上升 |

### 7.2 命中来自哪一层，客户端测不出来

客户端只知道「请求发出、首 token 到达」，它无法知道 K/V 来自哪一层。所以要看服务端：

| 来源 | 能区分到什么程度 |
| --- | --- |
| 响应的 `usage.prompt_tokens_details.cached_tokens`（OpenAI）或 `usage.cache_read_input_tokens`（Anthropic） | 只知命中多少，不知层级 |
| 引擎指标（如 vLLM 的 `gpu_prefix_cache_hit_rate`；CPU/分层指标随版本和插件而异） | 可区分 GPU / CPU / 卸载层 |
| 分层缓存插件（LMCache 等）的专属指标 | 才能区分 HBM / DRAM / NVMe / 远端 |

跨引擎比较命中率时，必须先确认两边的「命中」定义一致：是按块还是按 token、分母是查询块还是总 prompt。否则数字不可比。更稳的容量指标是「每个请求实际 prefill 了多少 token」，而不是单一的命中率。

### 7.3 压测：别把压缩会话剔掉

如果输入是无意义 token，模型可能在第一个 token 就输出 EOS。不强制 `ignore_eos=true` 并关闭 stop sequence，记录的 `out=204` 可能实际只生成了 1 个 token，decode 工作量降到 1/204，吞吐虚高约 200 倍，ITL 失去意义。

更重要的是：**别把压缩会话当成脏数据剔掉。** 真实生产就是这样，用户聊到 18 万 token 被压缩，下一轮卡一下。剔掉它，排行榜上的 p90 / p99 TTFT 会系统性偏乐观；保留它，才能测出「上下文重置时引擎会不会卡」。

### 7.4 四条工程动作

| 动作 | 做法 | 解决什么 |
| --- | --- | --- |
| 稳定内容前置 | system / tools / 固定示例放最前；日期、会话 ID、git status 放后面 | 避免前缀从头部失效，命中率从 99% 掉到 1% |
| cache-aware routing | 按前缀哈希把同前缀请求送到同一副本 | 负载均衡打掉命中 |
| 压缩策略 | 部分压缩、保留最近原文、把摘要指令追加在尾部 | 降低断裂幅度；避免压缩调用自己全量重算 |
| 容量规划 | 按活跃会话的 KV 工作集估算，不只看 QPS | 4–5 个 10 万 token 的会话就能吃满一张 80 GB 卡 |

固定 8K 输入的压测很难碰到这条线，长会话 Agent 天天碰到。

---

## 八、一句话总结

> **压缩的代价不在删了多少，而在删的位置——后面有多少缓存失效，由它决定。**
>
> 缓存只认从第 0 个 token 开始连续一致的前缀；断点之后，哪怕原文没变，位置变了也不能复用。于是压缩调用要付一次长上下文 decode，压缩后的首轮要付一次 1.7 万 token 的 prefill——这就是那条本应平滑的延迟曲线上的尖峰。

<style>
.cc-embed{display:block;width:100%;height:300px;border:0;margin:24px 0;background:transparent}
</style>

<script>
(function(){
  window.addEventListener('message',function(e){
    var d=e.data;
    if(!d||d.type!=='cc-height'||typeof d.h!=='number')return;
    var fs=document.querySelectorAll('iframe.cc-embed');
    for(var i=0;i<fs.length;i++){
      if(fs[i].contentWindow===e.source){fs[i].style.height=Math.max(60,d.h)+'px';break}
    }
  });
})();
</script>

---

## 📚 参考资料

1. SemiAnalysis《AgentX — InferenceXv3》—— Agent 轨迹数据集与 64-token 块索引的实践 — [原文](https://newsletter.semianalysis.com/p/agentx-inferencexv3-does-cuda-moat)
2. InferenceX《Agentic Benchmark for LLM Inference: Metrics and Methodology》—— TTFT / ITL / TTLT 与 agentic 压测方法 — [原文](https://inferencex.semianalysis.com/blog/agentic-benchmark-agent-benchmark-guide)
3. NVIDIA《Co-Designing AI Models Using Speculative Decoding for Faster LLM Inference》—— decode 访存瓶颈、接受长度与 SPEED-Bench — [原文](https://developer.nvidia.com/blog/co-designing-ai-models-using-speculative-decoding-for-faster-llm-inference/)
4. SPEED-Bench（NVIDIA）—— [论文](https://arxiv.org/abs/2604.09557)
5. vLLM 前缀缓存文档 —— 块哈希、引用计数与命中率指标 — [文档](https://docs.vllm.ai/en/latest/features/prefix_caching.html)
6. SGLang RadixAttention —— 按 token 前缀组织 KV 缓存的另一种实现 — [仓库](https://github.com/sgl-project/sglang)
7. OpenAI Prompt Caching —— `cached_tokens` 字段与命中计费 — [文档](https://platform.openai.com/docs/guides/prompt-caching)
8. Anthropic Prompt Caching —— `cache_read_input_tokens` 字段 — [文档](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
9. kv-cache-tester —— KV Cache 分层测试与 trace 格式参考 — [仓库](https://github.com/callanjfox/kv-cache-tester)
