# 知识星图（Knowledge Starmap）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将个人主页重构为「LLM & Agent 评测知识星图」：首页为星系图 SVG，点击节点进入领域落地页，博文流迁至 /archives/。

**Architecture:** 单一事实源 `_data/starmap.yml`（星团/节点/状态/连线/博文归属）→ Jekyll 构建时 Liquid 服务端渲染静态 SVG 与落地页；零前端依赖，仅 ~100 行原生 JS（tooltip/主题切换）；双主题令牌（羊皮纸默认 + 深空预留）。

**Tech Stack:** Jekyll + jekyll-theme-chirpy 7.6（gem theme）、Liquid、原生 JS/CSS/SVG、自定义 Jekyll Hook 插件（Ruby）。

**设计文档:** `docs/specs/2026-09-20-knowledge-starmap-design.md`

**环境注意（Windows/PowerShell）:**
- 所有命令在仓库根目录 `c:\Users\BaoYifan\Code\ivanbao.github.io` 下用 PowerShell 执行
- 每个任务的提交步骤：**提交前向站长展示变更摘要，获得确认后再 commit**（站长明确要求代码改动需授权）

---

## 文件结构总览

| 动作 | 路径 | 职责 |
|---|---|---|
| Create | `_data/starmap.yml` | 单一事实源：星团、节点、状态、连线、博文归属 |
| Create | `_layouts/domain.html` | 领域落地页布局（面包屑/降级标记/博文聚合） |
| Create | `_domains/{cluster}/{node}.md` ×13 | 落地页骨架（全量建好，curated: false） |
| Create | `_includes/starmap-svg.html` | Liquid → 静态 SVG（星团/节点/连线/图例） |
| Create | `_layouts/starmap.html` | 首页布局（含主题令牌 CSS 内联 + 主题切换按钮） |
| Create | `assets/js/starmap.js` | tooltip / 主题切换 / localStorage |
| Create | `_layouts/post-feed.html` | 博文卡片流布局（无分页，迭代全部 posts） |
| Create | `_plugins/starmap-backlink-hook.rb` | 博文底部注入「所属领域」反向链接 |
| Modify | `_config.yml` | 新增 domains collection + defaults |
| Modify | `index.html` | layout: home → starmap |
| Modify | `_tabs/archives.md` | layout: archives → post-feed，标题改「文章」 |
| Modify | `_data/locales/zh-CN.yml`（从主题 gem 复制） | 首页 Tab 名改「知识星图」 |
| 不动 | `_layouts/home.html` | 保留（不再被引用；是否删除由站长后续决定） |

---

### Task 1: 数据文件 starmap.yml（单一事实源）

**Files:**
- Create: `_data/starmap.yml`

- [ ] **Step 1: 创建数据文件**

> 博文归属映射为草案（依据设计文档 §7），执行到 Task 11 验证时请站长逐条确认。

```yaml
# 知识星图 · 单一事实源
# status: deep(已深耕,≥2篇) | seeded(有内容,1篇) | planned(规划中,0篇)
# kind: tool 的节点为「晋升的明星工具」，url 指向其 parent 的落地页
theme_default: paper # paper(羊皮纸) | space(深空)

clusters:
  - id: eval-system
    title: 评测系统
    ellipse: { cx: 300, cy: 400, rx: 270, ry: 310 }
    nodes:
      - id: harness
        title: 评测框架
        status: deep
        x: 300
        y: 250
        posts:
          - 2026-07-15-agent-eval-harness.md
          - 2026-07-15-agent-eval-02-evalscope.md
          - 2026-09-16-agent-eval-harbor.md
      - id: harbor
        title: Harbor
        kind: tool
        parent: harness
        status: deep
        x: 455
        y: 265
        url: /domains/eval-system/harness/
        posts: []
      - id: paradigm
        title: 评测范式演进
        status: deep
        x: 165
        y: 400
        posts:
          - 2026-07-15-agent-eval-01-paradigm-shift.md
          - 2026-07-15-agent-eval-04-ibm-clear.md
          - 2026-07-24-eval-system-llm-to-agent-judge.md
      - id: observability
        title: 可观测性
        status: seeded
        x: 435
        y: 415
        posts:
          - 2026-07-15-agent-eval-03-langfuse.md
          - 2026-08-29-llm-response-anomaly-detection.md
      - id: engineering
        title: 评测工程化
        status: seeded
        x: 250
        y: 545
        posts:
          - 2026-07-24-eval-hotspot-openai-hf-jailbreak.md
      - id: hardware
        title: 硬件评测
        status: seeded
        x: 110
        y: 585
        posts:
          - 2026-07-15-eval-system-aa-agentperf.md
      - id: performance
        title: 性能评测
        status: planned
        x: 380
        y: 610
        posts: []
  - id: dataset
    title: 数据集
    ellipse: { cx: 700, cy: 225, rx: 175, ry: 155 }
    nodes:
      - id: corpus
        title: 开源数据集全景
        status: deep
        x: 650
        y: 170
        posts:
          - 2026-07-15-eval-system-worldscore.md
          - 2026-07-20-agent-eval-05-swe-family.md
      - id: compression
        title: 数据集压缩
        status: seeded
        x: 765
        y: 290
        posts:
          - 2026-08-19-eval-data-mini-data-compression.md
  - id: rubric
    title: Rubric
    ellipse: { cx: 670, cy: 480, rx: 125, ry: 95 }
    nodes:
      - id: metrics
        title: Rubric 评判指标
        status: planned
        x: 670
        y: 480
        posts: []
  - id: edge
    title: 边缘领域
    ellipse: { cx: 1010, cy: 520, rx: 235, ry: 225 }
    nodes:
      - id: agent
        title: Agent 知识
        status: planned
        x: 925
        y: 420
        posts: []
      - id: model-arch
        title: 模型结构
        status: planned
        x: 1090
        y: 405
        posts: []
      - id: inference
        title: 推理知识
        status: planned
        x: 905
        y: 600
        posts: []
      - id: training
        title: 训练知识
        status: planned
        x: 1085
        y: 610
        posts: []

edges:
  - from: dataset.compression
    to: eval-system.engineering
    type: cost
    label: 评测成本
  - from: eval-system.paradigm
    to: rubric.metrics
    type: method
    label: 评判方法
```

- [ ] **Step 2: 校验文件名与 posts 目录一致**

Run: `Get-ChildItem _posts -Name`
Expected: 输出中逐一存在上面 `posts:` 引用的全部 13 个文件名（拼写完全一致，含日期前缀与 `.md` 后缀）

- [ ] **Step 3: 构建校验**

Run: `bundle exec jekyll build`
Expected: `Regenerating: done` 无报错（新数据文件暂未被引用，不产生输出）

- [ ] **Step 4: 提交（先向站长展示变更）**

```powershell
git add _data/starmap.yml
git commit -m "feat(starmap): add starmap.yml single source of truth"
```

---

### Task 2: 领域落地页布局 domain.html

**Files:**
- Create: `_layouts/domain.html`

- [ ] **Step 1: 创建布局**

依赖 Task 1 的 `_data.starmap`。四段式骨架中的概述/概念/学习路径由页面正文（`{{ content }}`）自由承载；布局负责面包屑、状态徽标、降级横幅、博文自动聚合。

```liquid
---
layout: default
---
{% include lang.html %}
{% assign map = site.data.starmap %}
{% assign cluster = map.clusters | where: "id", page.cluster | first %}
{% assign node = cluster.nodes | where: "id", page.node | first %}
{% assign node_posts = site.posts | where_exp: "p", "node.posts contains p.name" %}

<article class="domain-page">

  <nav class="domain-breadcrumb" style="font-size:0.9rem;color:#6c757d;padding:0.5rem 0 1rem;">
    <a href="{{ '/' | relative_url }}">知识星图</a> / {{ cluster.title }} / <strong>{{ page.title }}</strong>
    <a href="{{ '/' | relative_url }}" style="float:right;">← 返回星图</a>
  </nav>

  <header>
    <h1>{{ page.title }}</h1>
    <p style="color:#6c757d;font-size:0.9rem;">
      {{ node.posts | size }} 篇博文 ·
      {% if page.curated %}已整理{% else %}<span style="background:#fff3cd;color:#856404;padding:0.1rem 0.5rem;border-radius:0.25rem;font-size:0.8rem;">整理中</span>{% endif %}
    </p>
  </header>

  {% unless page.curated %}
  <blockquote style="border-left:4px solid #d8bd7f;background:#fdf9ef;padding:0.75rem 1rem;border-radius:0 0.4rem 0.4rem 0;">
    该领域还在整理中——当前为自动聚合视图，后续会补充概述、核心概念与学习路径。
  </blockquote>
  {% endunless %}

  <div class="content">
    {{ content }}
  </div>

  <section class="domain-posts" style="margin-top:2.5rem;">
    <h2>相关博文</h2>
    {% if node_posts.size > 0 %}
    <ul style="list-style:none;padding-left:0;">
      {% for post in node_posts %}
      <li style="padding:0.5rem 0;border-bottom:1px solid #eee;">
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        <time style="color:#adb5bd;font-size:0.85rem;">· {{ post.date | date: "%Y-%m-%d" }}</time>
      </li>
      {% endfor %}
    </ul>
    {% else %}
    <p style="color:#6c757d;">暂无博文，规划中。</p>
    {% endif %}
  </section>

</article>
```

- [ ] **Step 2: 构建校验**

Run: `bundle exec jekyll build`
Expected: 构建成功（布局暂无页面引用）

- [ ] **Step 3: 提交**

```powershell
git add _layouts/domain.html
git commit -m "feat(starmap): add domain landing page layout"
```

---

### Task 3: domains collection 配置 + 13 个落地页骨架

**Files:**
- Modify: `_config.yml`（collections 与 defaults 两处）
- Create: `_domains/` 下 13 个 .md 文件

- [ ] **Step 1: _config.yml 增加集合与默认值**

在 `_config.yml` 的 `collections:` 块中追加（与现有 `tabs` 并列）：

```yaml
collections:
  tabs:
    output: true
    sort_by: order
  domains:
    output: true
```

在 `defaults:` 列表末尾（`type: tabs` 那条之后）追加：

```yaml
  - scope:
      path: ""
      type: domains
    values:
      layout: domain
      permalink: /domains/:path/
      curated: false
```

- [ ] **Step 2: 创建 13 个落地页骨架**

每个文件正文留空（`curated: false` 时布局自动渲染「整理中」横幅 + 博文聚合，即设计文档定义的降级态）。13 个文件的 front matter 依次为：

```yaml
# _domains/eval-system/harness.md
---
title: 评测框架
cluster: eval-system
node: harness
---
```

```yaml
# _domains/eval-system/paradigm.md
---
title: 评测范式演进
cluster: eval-system
node: paradigm
---
```

```yaml
# _domains/eval-system/observability.md
---
title: 可观测性
cluster: eval-system
node: observability
---
```

```yaml
# _domains/eval-system/engineering.md
---
title: 评测工程化
cluster: eval-system
node: engineering
---
```

```yaml
# _domains/eval-system/hardware.md
---
title: 硬件评测
cluster: eval-system
node: hardware
---
```

```yaml
# _domains/eval-system/performance.md
---
title: 性能评测
cluster: eval-system
node: performance
---
```

```yaml
# _domains/dataset/corpus.md
---
title: 开源数据集全景
cluster: dataset
node: corpus
---
```

```yaml
# _domains/dataset/compression.md
---
title: 数据集压缩
cluster: dataset
node: compression
---
```

```yaml
# _domains/rubric/metrics.md
---
title: Rubric 评判指标
cluster: rubric
node: metrics
---
```

```yaml
# _domains/edge/agent.md
---
title: Agent 知识
cluster: edge
node: agent
---
```

```yaml
# _domains/edge/model-arch.md
---
title: 模型结构
cluster: edge
node: model-arch
---
```

```yaml
# _domains/edge/inference.md
---
title: 推理知识
cluster: edge
node: inference
---
```

```yaml
# _domains/edge/training.md
---
title: 训练知识
cluster: edge
node: training
---
```

- [ ] **Step 3: 构建并抽查 URL 生成**

Run: `bundle exec jekyll build; Get-ChildItem _site\domains -Recurse -Directory | Select-Object -ExpandProperty FullName`
Expected: 生成 `_site\domains\eval-system\harness\`、`_site\domains\rubric\metrics\` 等 13 个目录，各含 `index.html`

- [ ] **Step 4: 抽查一个页面的博文聚合（本地起服务）**

Run: `bundle exec jekyll serve`（后台运行后访问 http://127.0.0.1:4000/domains/eval-system/harness/）
Expected: 面包屑「知识星图 / 评测系统 / 评测框架」；「整理中」徽标与横幅；「相关博文」列出 3 篇（Harness、EvalScope、Agent Evaluation Harness）

- [ ] **Step 5: 提交**

```powershell
git add _config.yml _domains/
git commit -m "feat(starmap): add domains collection with 13 landing page skeletons"
```

---

### Task 4: SVG 渲染组件 starmap-svg.html

**Files:**
- Create: `_includes/starmap-svg.html`

- [ ] **Step 1: 创建组件**

节点半径公式：`r = 16 + 6×博文数`（上限 40；tool 节点固定 20）。状态→透明度：deep 1.0 / seeded 0.85 / planned 0.45（planned 另加虚线描边，由 CSS 类控制）。

```liquid
{% assign map = site.data.starmap %}

<div class="starmap-viewport" id="starmap">

  <svg viewBox="0 0 1280 800" role="img" aria-label="LLM 与 Agent 评测知识星图" text-rendering="geometricPrecision">
    {% comment %} 连线垫底 {% endcomment %}
    {% for edge in map.edges %}
      {% assign from_parts = edge.from | split: "." %}
      {% assign to_parts = edge.to | split: "." %}
      {% assign from_cluster_id = from_parts[0] %}
      {% assign from_node_id = from_parts[1] %}
      {% assign to_cluster_id = to_parts[0] %}
      {% assign to_node_id = to_parts[1] %}
      {% assign fc = map.clusters | where: "id", from_cluster_id | first %}
      {% assign fn = fc.nodes | where: "id", from_node_id | first %}
      {% assign tc = map.clusters | where: "id", to_cluster_id | first %}
      {% assign tn = tc.nodes | where: "id", to_node_id | first %}
      {% assign mx = fn.x | plus: tn.x | divided_by: 2 %}
      {% assign my = fn.y | plus: tn.y | divided_by: 2 %}
      <g class="starmap-edge starmap-edge-{{ edge.type }}">
        <path d="M {{ fn.x }} {{ fn.y }} Q {{ mx }} {{ my | minus: 60 }} {{ tn.x }} {{ tn.y }}"></path>
        <text x="{{ mx }}" y="{{ my | minus: 30 }}">{{ edge.label }}</text>
      </g>
    {% endfor %}

    {% comment %} 星团边界与标题 {% endcomment %}
    {% for cluster in map.clusters %}
      <g class="starmap-cluster">
        <ellipse cx="{{ cluster.ellipse.cx }}" cy="{{ cluster.ellipse.cy }}" rx="{{ cluster.ellipse.rx }}" ry="{{ cluster.ellipse.ry }}"></ellipse>
        <text class="starmap-cluster-title" x="{{ cluster.ellipse.cx }}" y="{{ cluster.ellipse.cy | minus: cluster.ellipse.ry | plus: 24 }}">{{ cluster.title }}</text>
      </g>
    {% endfor %}

    {% comment %} 节点（<a> 原生点击跳转，无需 JS） {% endcomment %}
    {% for cluster in map.clusters %}
      {% for node in cluster.nodes %}
        {% assign r = node.posts.size | times: 6 | plus: 16 %}
        {% if r > 40 %}{% assign r = 40 %}{% endif %}
        {% if node.kind == "tool" %}{% assign r = 20 %}{% endif %}
        {% if node.url %}
          {% assign node_url = node.url %}
        {% else %}
          {% assign node_url = '/domains/' | append: cluster.id | append: '/' | append: node.id | append: '/' %}
        {% endif %}
        <a href="{{ node_url | relative_url }}"
           class="starmap-node starmap-node-{{ node.status }}"
           data-cluster="{{ cluster.title }}"
           data-title="{{ node.title }}"
           data-posts="{{ node.posts.size }}">
          <circle cx="{{ node.x }}" cy="{{ node.y }}" r="{{ r }}"></circle>
          <text x="{{ node.x }}" y="{{ node.y | plus: r | plus: 16 }}">{{ node.title }}</text>
        </a>
      {% endfor %}
    {% endfor %}
  </svg>

  <div class="starmap-legend">
    <span><i class="legend-dot legend-deep"></i>已深耕</span>
    <span><i class="legend-dot legend-seeded"></i>有内容</span>
    <span><i class="legend-dot legend-planned"></i>规划中</span>
    <span>节点大小 = 博文数量 · 虚线椭圆 = 一级领域</span>
  </div>

</div>
```

- [ ] **Step 2: 构建校验**

Run: `bundle exec jekyll build`
Expected: 构建成功（组件暂未被引用）。若报 Liquid 错误，常见原因是 YAML 中 `posts: []` 与 `plus` 运算，确认 `node.posts.size` 为 0 时 `16 + 0 = 16` 正常

- [ ] **Step 3: 提交**

```powershell
git add _includes/starmap-svg.html
git commit -m "feat(starmap): add liquid-rendered SVG component"
```

---

### Task 5: 首页布局 starmap.html（含双主题令牌 CSS）

**Files:**
- Create: `_layouts/starmap.html`
- Create: `assets/js/starmap.js`
- Modify: `index.html`

- [ ] **Step 1: 创建首页布局（CSS 主题令牌内联，双主题即换肤点）**

```liquid
---
layout: default
---
{% include lang.html %}

<style>
  .starmap-page {
    --map-bg: #f7f4ec;
    --map-dot: #d8d2c4;
    --cluster-stroke: #7a8ba3;
    --cluster-title: #3a4a5f;
    --node-fill: #5e87b0;
    --node-stroke: #3d6288;
    --node-label: #3a4a5f;
    --edge-stroke: #8a94a8;
    --edge-label: #6b7686;
    position: relative;
    background-color: var(--map-bg);
    background-image: radial-gradient(var(--map-dot) 1px, transparent 1px);
    background-size: 22px 22px;
    border-radius: 0.6rem;
    padding: 1rem 1.5rem 1.5rem;
    margin-top: -0.5rem;
  }
  .starmap-page.theme-space {
    --map-bg: #0a1524;
    --map-dot: #1d2f4a;
    --cluster-stroke: #2d4a6b;
    --cluster-title: #cfe4f5;
    --node-fill: #4a90c2;
    --node-stroke: #a8d4f0;
    --node-label: #cfe4f5;
    --edge-stroke: #3d5568;
    --edge-label: #5a7a9a;
    background-image: radial-gradient(var(--map-dot) 1px, transparent 1px);
  }
  .starmap-header { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; padding: 0.5rem 0 1rem; }
  .starmap-header h1 { font-size: 1.5rem; margin: 0; color: var(--cluster-title); }
  .starmap-header p { margin: 0; color: var(--edge-label); font-size: 0.9rem; flex: 1; }
  .starmap-viewport svg { width: 100%; height: auto; display: block; }
  .starmap-cluster ellipse { fill: none; stroke: var(--cluster-stroke); stroke-width: 1.5; stroke-dasharray: 8 6; }
  .starmap-cluster-title { font-size: 20px; font-weight: 700; fill: var(--cluster-title); letter-spacing: 2px; }
  .starmap-node { cursor: pointer; text-decoration: none; }
  .starmap-node circle { fill: var(--node-fill); stroke: var(--node-stroke); stroke-width: 2; transition: opacity .2s; }
  .starmap-node text { fill: var(--node-label); font-size: 13px; text-anchor: middle; }
  .starmap-node:hover circle { stroke-width: 3.5; }
  .starmap-node-deep circle { opacity: 1; }
  .starmap-node-seeded circle { opacity: 0.85; }
  .starmap-node-planned circle { opacity: 0.45; stroke-dasharray: 4 3; }
  .starmap-edge path { fill: none; stroke: var(--edge-stroke); stroke-width: 1.5; stroke-dasharray: 2 4; }
  .starmap-edge text { fill: var(--edge-label); font-size: 11px; text-anchor: middle; }
  .starmap-legend { display: flex; gap: 1.25rem; flex-wrap: wrap; font-size: 0.85rem; color: var(--edge-label); padding-top: 0.75rem; }
  .legend-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 0.35rem; vertical-align: -1px; background: var(--node-fill); border: 2px solid var(--node-stroke); }
  .legend-deep { opacity: 1; }
  .legend-seeded { opacity: 0.85; }
  .legend-planned { opacity: 0.45; border-style: dashed; }
  .starmap-tooltip { position: fixed; pointer-events: none; background: var(--cluster-title); color: var(--map-bg); padding: 0.35rem 0.7rem; border-radius: 0.4rem; font-size: 0.85rem; z-index: 1000; display: none; }
  .starmap-theme-toggle { border: 1px solid var(--cluster-stroke); background: transparent; color: var(--cluster-title); border-radius: 0.4rem; padding: 0.2rem 0.7rem; cursor: pointer; font-size: 0.85rem; }
</style>

<div class="starmap-page theme-{{ site.data.starmap.theme_default | default: 'paper' }}" id="starmap-page">

  <header class="starmap-header">
    <h1>LLM &amp; Agent 评测知识星图</h1>
    <p>ivanbao 的领域学习全景 · 点击节点进入领域页</p>
    <button id="starmap-theme-toggle" class="starmap-theme-toggle" type="button" title="切换 羊皮纸/深空 主题">🌗 换肤</button>
  </header>

  {% include starmap-svg.html %}
</div>

<div class="starmap-tooltip" id="starmap-tooltip"></div>

<script src="{{ '/assets/js/starmap.js' | relative_url }}" defer></script>
```

- [ ] **Step 2: 创建 starmap.js（tooltip + 主题切换，原生 JS 零依赖）**

```js
// 知识星图交互：tooltip + 主题切换（羊皮纸 paper / 深空 space）
(function () {
  'use strict';

  var STORAGE_KEY = 'starmap-theme';
  var page = document.getElementById('starmap-page');
  var toggle = document.getElementById('starmap-theme-toggle');
  var tooltip = document.getElementById('starmap-tooltip');

  // 主题：localStorage 记忆 > 数据文件默认（初始 class 由 Liquid 输出）
  function setTheme(theme) {
    page.classList.remove('theme-paper', 'theme-space');
    page.classList.add('theme-' + theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* 隐私模式下忽略 */ }
  }
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'paper' || saved === 'space') setTheme(saved);
  } catch (e) { /* 忽略 */ }

  if (toggle) {
    toggle.addEventListener('click', function () {
      setTheme(page.classList.contains('theme-space') ? 'paper' : 'space');
    });
  }

  // tooltip：跟随鼠标，显示 领域名 · 所属星团 · N 篇博文
  if (tooltip) {
    document.querySelectorAll('.starmap-node').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        var count = el.getAttribute('data-posts') || '0';
        var word = count === '0' ? '暂无博文，规划中' : count + ' 篇博文';
        tooltip.textContent = el.getAttribute('data-title') + ' · ' + el.getAttribute('data-cluster') + ' · ' + word;
        tooltip.style.display = 'block';
      });
      el.addEventListener('mousemove', function (ev) {
        tooltip.style.left = (ev.clientX + 14) + 'px';
        tooltip.style.top = (ev.clientY + 14) + 'px';
      });
      el.addEventListener('mouseleave', function () {
        tooltip.style.display = 'none';
      });
    });
  }
})();
```

- [ ] **Step 3: 首页切换布局**

将 `index.html` 全文替换为：

```yaml
---
layout: starmap
---
```

> 说明：`paginate: 10` 配置保留无害——jekyll-paginate 只作用于引用 `paginator` 的页面，index.html 已不再引用。

- [ ] **Step 4: 本地验证首页**

Run: `bundle exec jekyll serve`，访问 http://127.0.0.1:4000/
Expected:
- 首屏为羊皮纸星图（4 个虚线椭圆星团、14 个节点、2 条带标签连线、角落图例）
- 悬停节点出 tooltip；点击「评测框架」跳 `/domains/eval-system/harness/`
- 右上「🌗 换肤」按钮可切换深空主题，刷新后记忆保持

- [ ] **Step 5: 构建校验**

Run: `bundle exec jekyll build`
Expected: 构建成功

- [ ] **Step 6: 提交**

```powershell
git add _layouts/starmap.html assets/js/starmap.js index.html
git commit -m "feat(starmap): replace homepage with parchment/space dual-theme starmap"
```

---

### Task 6: 博文流迁移至 /archives/

**Files:**
- Create: `_layouts/post-feed.html`
- Modify: `_tabs/archives.md`

- [ ] **Step 1: 创建 post-feed 布局（卡片流，无分页）**

从现有 `_layouts/home.html` 的卡片标记移植，以 `site.posts` 全量迭代替代 paginator。文件全文：

```liquid
---
layout: default
---

{% include lang.html %}

{% assign feed_posts = site.posts | where_exp: "item", "item.pin != true and item.hidden != true" %}
{% assign pinned_posts = site.posts | where: "pin", "true" %}
{% assign feed_posts = pinned_posts | concat: feed_posts %}

<div id="post-list" class="flex-grow-1 px-xl-1">
  {% for post in feed_posts %}
    <article class="card-wrapper card">
      <a href="{{ post.url | relative_url }}" class="post-preview row g-0 flex-md-row-reverse">
        {% assign card_body_col = '12' %}

        {% if post.image %}
          {% assign src = post.image.path | default: post.image %}

          {% if post.media_subpath %}
            {% unless src contains '://' %}
              {% assign src = post.media_subpath
                | append: '/'
                | append: src
                | replace: '///', '/'
                | replace: '//', '/'
              %}
            {% endunless %}
          {% endif %}

          {% if post.image.lqip %}
            {% assign lqip = post.image.lqip %}

            {% if post.media_subpath %}
              {% unless lqip contains 'data:' %}
                {% assign lqip = post.media_subpath
                  | append: '/'
                  | append: lqip
                  | replace: '///', '/'
                  | replace: '//', '/'
                %}
              {% endunless %}
            {% endif %}

            {% assign lqip_attr = 'lqip="' | append: lqip | append: '"' %}
          {% endif %}

          {% assign alt = post.image.alt | xml_escape | default: 'Preview Image' %}

          <div class="col-md-5">
            <img src="{{ src }}" alt="{{ alt }}" {{ lqip_attr }}>
          </div>

          {% assign card_body_col = '7' %}
        {% endif %}

        <div class="col-md-{{ card_body_col }}">
          <div class="card-body d-flex flex-column">
            <h1 class="card-title my-2 mt-md-0">{{ post.title }}</h1>

            <div class="card-text content mt-0 mb-3">
              <p>{% include post-summary.html %}</p>
            </div>

            <div class="post-meta flex-grow-1 d-flex align-items-end">
              <div class="me-auto">
                <i class="far fa-calendar fa-fw me-1"></i>
                {% include datetime.html date=post.date lang=lang %}

                {% if post.categories.size > 0 %}
                  <i class="far fa-folder-open fa-fw me-1"></i>
                  <span class="categories">
                    {% for category in post.categories %}
                      {{ category }}
                      {%- unless forloop.last -%},{%- endunless -%}
                    {% endfor %}
                  </span>
                {% endif %}
              </div>

              {% if post.pin %}
                <div class="pin ms-1">
                  <i class="fas fa-thumbtack fa-fw"></i>
                  <span>{{ site.data.locales[lang].post.pin_prompt }}</span>
                </div>
              {% endif %}
            </div>
          </div>
        </div>
      </a>
    </article>
  {% endfor %}
</div>

<!-- 不蒜子访问量统计 -->
<style>
  .site-traffic {
    text-align: center;
    padding: 1rem 0;
    margin: 1rem 0;
    color: var(--text-muted-color, #6c757d);
    font-size: 0.9rem;
    border-top: 1px solid var(--main-border-color, #dee2e6);
  }
  .site-traffic span {
    color: var(--text-color, #212529);
    font-weight: 600;
    margin: 0 0.3rem;
  }
</style>

<div class="site-traffic">
  <i class="fas fa-chart-line"></i>
  总访问量 <span id="busuanzi_value_site_pv"></span> 次
  ·
  总访客 <span id="busuanzi_value_site_uv"></span> 人
</div>

<script async src="https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
```

> 注：当前 13 篇博文不需要分页（YAGNI）；若未来超过 ~30 篇，再引入 jekyll-paginate-v2，届时另立计划。

- [ ] **Step 2: 修改 archives Tab**

`_tabs/archives.md` 全文替换为：

```yaml
---
layout: post-feed
icon: fas fa-archive
order: 3
title: 文章
---
```

> `title: 文章` 用于导航 Tab 显示名（Chirpy 支持 tab front matter title 覆盖默认「归档」）。原时间线归档视图被替换，分类/标签索引不受影响。

- [ ] **Step 3: 本地验证**

Run: `bundle exec jekyll serve`，访问 http://127.0.0.1:4000/archives/
Expected: 顶部导航出现「文章」Tab；页面为 13 张博文卡片流（样式与原首页一致）+ 不蒜子统计

- [ ] **Step 4: 提交**

```powershell
git add _layouts/post-feed.html _tabs/archives.md
git commit -m "feat(starmap): move post feed to /archives/ tab"
```

---

### Task 7: 博文反向链接插件

**Files:**
- Create: `_plugins/starmap-backlink-hook.rb`

- [ ] **Step 1: 创建插件（参照现有 `_plugins/posts-lastmod-hook.rb` 的钩子模式）**

```ruby
# frozen_string_literal: true

# 知识星图反向链接：在每篇博文末尾注入「所属领域」链接与返回星图入口。
# 归属关系来自 _data/starmap.yml（单一事实源），博文 front matter 不做任何改动。
Jekyll::Hooks.register :posts, :post_convert do |post|
  map = post.site.data["starmap"]
  next if map.nil?

  links = []
  map["clusters"].each do |cluster|
    next if cluster["nodes"].nil?
    cluster["nodes"].each do |node|
      next if node["posts"].nil?
      next unless node["posts"].include?(post.name)

      links << "<a href=\"/domains/#{cluster['id']}/#{node['id']}/\">#{node['title']}</a>（#{cluster['title']}）"
    end
  end

  next if links.empty?

  footer = +"\n\n<hr>\n<p><strong>所属领域</strong>：#{links.join(' · ')}</p>\n<p><a href=\"/\">← 返回知识星图</a></p>\n"
  post.content = post.content.dup.concat(footer)
end
```

- [ ] **Step 2: 本地验证**

Run: `bundle exec jekyll serve`，访问任一已归属博文，如 http://127.0.0.1:4000/posts/agent-eval-harbor/（实际 slug 以文章 URL 为准，可在 /archives/ 点入）
Expected: 文末出现「所属领域：评测框架（评测系统）」与「← 返回知识星图」链接，且链接可达

- [ ] **Step 3: 提交**

```powershell
git add _plugins/starmap-backlink-hook.rb
git commit -m "feat(starmap): inject domain backlinks into posts via hook"
```

---

### Task 8: 首页 Tab 更名「知识星图」

**Files:**
- Create: `_data/locales/zh-CN.yml`（从主题 gem 复制后修改）

- [ ] **Step 1: 定位主题 locale 文件并确认 tabs 键结构**

```powershell
$gem = bundle info jekyll-theme-chirpy --path
Select-String -Path "$gem\_data\locales\zh-CN.yml" -Pattern "tabs" -Context 0,8
```
Expected: 显示 `tabs:` 块，含 `Home: 首页` 一类的键值

- [ ] **Step 2: 复制到站点数据目录并修改 Home 键**

```powershell
New-Item -ItemType Directory -Force -Path _data\locales | Out-Null
Copy-Item "$gem\_data\locales\zh-CN.yml" _data\locales\zh-CN.yml
```

然后用编辑器打开 `_data/locales/zh-CN.yml`，在 `tabs:` 块中把 Home 行的值改为：

```yaml
  Home: 知识星图
```

（站点 `_data` 整文件覆盖主题同名文件，其余键原样保留）

- [ ] **Step 3: 本地验证**

Run: `bundle exec jekyll serve`，访问 http://127.0.0.1:4000/
Expected: 顶部导航第一个 Tab 显示「知识星图」（指向 /），整站其余文案不变

- [ ] **Step 4: 提交**

```powershell
git add _data/locales/zh-CN.yml
git commit -m "feat(starmap): rename home tab to 知识星图"
```

---

### Task 9: 全量验证与回归

**Files:** 无新增（只读验证 + 可能的微调）

- [ ] **Step 1: 生产构建 + 链接检查**

Run（bash 可用时，等价于 CI）: `bash tools/test.sh`
或 PowerShell 分步:

```powershell
bundle exec jekyll build
bundle exec htmlproofer _site --disable-external --ignore-urls "/^http:\/\/127.0.0.1/,/^http:\/\/0.0.0.0/,/^http:\/\/localhost/"
```
Expected: 构建成功，htmlproofer 0 failures（SVG 内 14 个节点 `<a>` 与落地页链接全部可达）

- [ ] **Step 2: 桌面端人工清单（jekyll serve 逐项过）**

| # | 检查项 | 预期 |
|---|---|---|
| 1 | 首页 | 羊皮纸星图，4 星团/14 节点/2 连线，图例齐全 |
| 2 | 悬停 | tooltip 显示 领域·星团·博文数；planned 显示「暂无博文，规划中」 |
| 3 | 点击节点 | 全部 13 个非 tool 节点跳对应落地页；Harbor 跳评测框架页 |
| 4 | 落地页 | 面包屑 + 整理中徽标（curated:false）+ 博文聚合（数量与 starmap.yml 一致） |
| 5 | 博文页 | 文末「所属领域」反链 + 返回星图 |
| 6 | 「文章」Tab | 13 张卡片流 + 不蒜子统计 |
| 7 | 换肤 | 深空主题正常，刷新记忆保持（localStorage） |
| 8 | 移动端 | 浏览器 DevTools 手机视口：SVG 等比缩放可读，布局不破 |

- [ ] **Step 3: 站长确认博文归属映射表**

向站长展示 13 篇 → 节点映射（starmap.yml 中的 `posts:`），逐条确认；有异议则改 YAML 后重复 Step 1-2

- [ ] **Step 4: （经站长确认后）可选清理**

- `_layouts/home.html` 已无引用：询问站长是否删除
- PWA 缓存可能延迟显示新版：提示站长用 Ctrl+F5 强刷（已知教训）

- [ ] **Step 5: 最终提交**

```powershell
git status   # 确认无遗漏文件
# 若有微调：
git add -A
git commit -m "chore(starmap): post-verification adjustments"
```

---

## 任务依赖关系

```
Task 1 (数据) ─→ Task 2 (domain布局) ─→ Task 3 (集合+页面)
Task 1 ─→ Task 4 (SVG组件) ─→ Task 5 (首页)
Task 6 (博文流迁移) 独立（依赖 Task 5 完成后再切 index.html 更稳妥，建议顺序执行）
Task 7 (反链插件) 依赖 Task 1 + Task 3（链接目标存在）
Task 8 (Tab更名) 独立
Task 9 (全量验证) 依赖全部
```

## 已知风险与对策

| 风险 | 对策 |
|---|---|
| `where_exp` 中 `contains` 行为不符预期 | Task 3 Step 4 即验证聚合，失败则改为双循环 `{% for p in site.posts %}{% if node.posts contains p.name %}` |
| locale 文件键结构与预期不符 | Task 8 Step 1 先 `Select-String` 探查再改 |
| htmlproofer 对 SVG 内链接误报 | 若失败，给 htmlproofer 加 `--ignore-urls` 覆盖 SVG 锚点（先跑再定） |
| GitHub Pages 不支持自定义插件 | 仓库用 GitHub Actions（`.github/workflows/pages-deploy.yml`）部署而非原生 Pages，插件可用；部署前跑一次 CI 确认 |
| PWA 缓存旧页面 | 验证时 Ctrl+F5 强刷（项目已知教训） |
