# 研究日记使用说明

日记公开在 `https://zitongwang018.github.io/research-diary/`。主页最底部的 `↗ field notes` 是入口。这个目录是公开网站的一部分，不适合存放未公开数据、密钥或私密内容。

## 新增一篇

在 `_research_diary/` 下新建 Markdown 文件，例如 `2026-09-28-reading-notes.md`：

```markdown
---
layout: research-note
title: "今天的标题"
date: 2026-09-28
category: 阅读
summary: "一句话摘要，可省略。"
---

这里写正文。支持 Markdown 标题、列表、链接、图片和代码块。
```

提交并推送后，GitHub Pages 会自动生成文章页，首页按日期从新到旧展示标题、摘要和日期，`/research-diary/archive/` 按年份归档。`category` 可写“阅读”“实验”“想法”等；文件名中的英文短名会成为文章网址的一部分。

日记的外观由 `research-diary/style.css`、`research-diary/theme.js`、`_layouts/research-note.html` 和 `_includes/research-*.html` 控制，不依赖个人主页的主题。亮暗主题默认跟随系统，也可用右上角按钮切换；手动选择会保存在当前浏览器。
