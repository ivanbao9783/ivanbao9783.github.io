# 个人网站设计 Spec

- **站点域名**: `https://ivanbao.github.io`
- **仓库**: `ivanbao.github.io`（GitHub 用户站点）
- **创建日期**: 2026-08-19
- **状态**: 已确认，待实现

## 1. 目标与范围

### 1.1 目标
将 `ivanbao.github.io` 仓库构建为个人网站，用于：
1. 归档和展示个人博客文章（主要）
2. 未来展示个人项目（次要，后续扩展）

### 1.2 范围（本次实现）
- 基于 Chirpy Starter 模板初始化项目结构
- 配置站点元信息（标题、语言、时区等）
- 配置 GitHub Actions 自动部署工作流
- 建立内容创作约定与目录组织规范
- 提供本地预览能力

### 1.3 非目标（本次不做）
- 项目展示页的具体内容（留待后续扩展）
- 自定义主题外观深度定制
- 第三方集成（评论、分析等）——后续按需添加

## 2. 技术栈与部署策略

### 2.1 技术选型
- **静态站点生成器**: Jekyll
- **主题**: Chirpy（通过 Starter 模板引入，gem 形式便于后续升级）
- **运行时**: Ruby + Bundler（本地预览），Node.js（mermaid 等前端工具链）

### 2.2 部署策略
- **部署方式**: GitHub Actions 自动构建并通过 `actions/deploy-pages` 部署
- **原因**: `ivanbao.github.io` 作为用户站点，GitHub Pages 原生 Jekyll 构建对插件有限制，无法支持 Chirpy 的完整功能（如 mermaid 渲染需 Node 工具链）
- **配置要求**: 仓库 Settings → Pages → Source 设置为 "GitHub Actions"

### 2.3 本地开发
- 预览命令: `bundle exec jekyll s`（访问 `http://127.0.0.1:4000`）
- 更新依赖: `bundle update`

## 3. 目录结构

```
ivanbao.github.io/
├── _config.yml                  # 站点全局配置
├── _data/                       # 数据文件
│   └── contact.yml              # 联系方式配置
├── _posts/                      # 博客文章源文件（Markdown）
│   └── YYYY-MM-DD-title.md      
├── _tabs/                       # 顶层页面
│   ├── about.md                 # 关于页
│   ├── archives.md              # 归档页
│   └── categories.md            # 分类索引页
├── assets/                      # 静态资源（Jekyll 直接对外提供）
│   └── img/                     # 图片资源（favicon、头像、文章配图、Excalidraw 导出图等）
├── .github/
│   └── workflows/
│       └── pages-deploy.yml     # GitHub Actions 部署工作流
├── tools/                       # Chirpy 自带的辅助脚本
├── Gemfile                      # Ruby 依赖声明
├── package.json                 # Node 依赖（mermaid 等前端工具链）
├── .gitignore                   
└── README.md                    
```

### 3.1 内容组织约定
- **`_posts/`**: 所有博客文章，文件名必须遵循 `YYYY-MM-DD-title.md` 格式
- **分类（categories）**: 粗粒度划分，在 front matter 中声明，如 `[技术笔记, 论文解读, 项目记录]`
- **标签（tags）**: 细粒度标记，在 front matter 中声明，如 `[jekyll, mermaid, git]`
- **`assets/img/`**: 存放 mermaid 渲染图、Excalidraw 导出图等富媒体资源，文章中以 `/assets/img/xxx.png` 路径引用

### 3.2 未来项目展示扩展
Chirpy 原生支持项目展示，后续需要时只需：
1. 新增 `_tabs/projects.md` 聚合页
2. 新增 `_data/projects.yml` 项目数据文件
无需改动现有结构。

## 4. 内容创作约定

### 4.1 文章 front matter 模板
```yaml
---
title: "文章标题"
author: ivanbao
date: 2026-08-19
categories: [技术笔记]          # 粗粒度分类
tags: [jekyll, chirpy]          # 细粒度标签
description: "简短描述，用于列表预览和 SEO"
image: /assets/img/YYYY-MM-DD-cover.png  # 可选，封面图
mermaid: true                     # 可选，启用 mermaid 渲染
---
```

### 4.2 富媒体支持
- **Mermaid 图表**: Chirpy 内置支持。文章 front matter 设 `mermaid: true`，正文用 ``` ```mermaid ` 代码块
- **Excalidraw 图**: 通过 Excalidraw MCP 导出为 PNG/SVG 存入 `assets/img/`，文章中以 `![描述](/assets/img/xxx.png)` 引用

## 5. 关键配置

### 5.1 `_config.yml` 关键项
```yaml
title: ivanbao
url: https://ivanbao.github.io
timezone: Asia/Shanghai
lang: zh-CN
theme_mode: auto                 # 跟随系统深浅色
# mermaid 已是 Chirpy 内置能力
```

## 6. 验收标准

- [ ] 仓库初始化为 Chirpy Starter 模板结构
- [ ] `_config.yml` 配置完成（标题、URL、时区、语言、主题模式）
- [ ] `.github/workflows/pages-deploy.yml` 部署工作流就绪
- [ ] 本地 `bundle exec jekyll s` 能正常预览
- [ ] 推送到 main 分支后，GitHub Actions 自动构建并部署成功
- [ ] 访问 `https://ivanbao.github.io` 显示站点首页
- [ ] 一篇示例文章能正确展示分类、标签、mermaid 图表
