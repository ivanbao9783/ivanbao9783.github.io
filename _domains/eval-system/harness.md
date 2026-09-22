---
title: 评测框架
cluster: eval-system
node: harness
---

## 领域定义

评测框架是执行基准测试的标准化基础设施：给定任务集与被测系统，框架负责环境准备、任务分发、运行隔离、结果收集与评分计算。业内从 lm-evaluation-harness 到 SWE-bench 的专用 harness，再到 Harbor 这类多 agent 评测编排系统，框架的形态随评测对象从模型走向 agent 而不断演化。

## 核心价值

没有统一的框架，分数就不可比、结果就不可复现。框架将「跑一场评测」工程化：沙箱隔离保证环境一致，防作弊机制（如评分期才注入 test.patch、对被测 agent 不可见）保证分数可信，并行调度与失败重试保证评测效率。它是评测结论公信力的技术底座。

## 知识版图与规划

关键问题：沙箱隔离与环境一致性、任务分发与并行调度、防作弊设计、评测与 CI/CD 的集成。代表工作：lm-evaluation-harness、EvalScope、SWE-bench harness、Harbor。已有实践记录（EvalScope/Harbor 源码剖析、agentperf、IBM CLEAR 拆解）见本页博文列表；后续规划：框架源码横向对比、CI 集成细节深化。
