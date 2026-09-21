# 运行输入（每次生成前填写）

```yaml
# 必填
dataset_name:        # 数据集名称（中英文）
paper_url:           # 论文地址（arXiv 等，尽量锚定到具体版本如 v2）
website_url:         # 官方网站
leaderboard_url:     # 官方 leaderboard

# 选填（强烈建议）
repo_url:            # 代码/数据仓库（供挖 task 卡原文）
hf_url:              # HuggingFace 数据集卡地址（字段/规模/splits/license 最全的结构化入口）
paper_pdf_url:       # 论文 PDF 直链（abs 页只有摘要，主结果表/附录任务卡需全文时用）

# 口径（不填走默认值）
platform:            # 知乎（默认）/ 掘金 / 双平台
word_budget:         # 默认 4000-4500 字（对应 15-20 分钟阅读）
snapshot_date:       # 数据时效锚定日，默认运行当天
paper_version:       # 事实表锚定的论文版本（如 v2），防止调研中途 arXiv 更新导致跨版本混引
angle:               # 主推角度或禁区，如"重点讲防作弊机制"、"不要对比表"
compare_exemption:   # 对比豁免（默认 false）。true = 允许正文与其他数据集横向对比（独立解耦原则的例外开关）
```
