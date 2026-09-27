# 研究日记使用说明

日记公开在 `https://zitongwang018.github.io/research-diary/`。主页最底部的 `↗ field notes` 是入口。这个目录是公开网站的一部分，不适合存放未公开数据、密钥或私密内容。

## 在网站内写作

打开 `https://zitongwang018.github.io/research-diary/write/`（日记页底部也有 Write 入口）。第一次使用时，在 GitHub 创建一个仅授权 `ZitongWang018.github.io` 仓库、`Contents: Read and write` 权限的 fine-grained personal access token。将令牌贴进网页并连接，即可新建或打开文章、预览 Markdown、上传图片，并直接保存发布。令牌仅保存在当前网页的内存里，刷新后需重新输入。不要把令牌写进文章或发给他人。

文章和上传的图片保存后立即进入公开仓库；GitHub Pages 通常需要片刻才会更新网页。离开前请确认保存成功。编辑器只预览常用 Markdown，最终排版以发布后的文章页为准。

## 新增一篇

在 `_research_diary/` 下新建 Markdown 文件，例如 `2026-09-28-reading-notes.md`：

```markdown
---
layout: research-note
title: "今天的标题"
date: 2026-09-28
category: 阅读
summary: "一句话摘要，可省略。"
tags: [LLM, 阅读]
reading_time: 3
---

这里写正文。支持 Markdown 标题、列表、链接、图片和代码块。
```

提交并推送后，GitHub Pages 会自动生成文章页，首页按日期从新到旧展示标题、摘要和日期，`/research-diary/archive/` 按年份归档。`category` 和 `tags` 用于 Tags 页面，`reading_time` 用于显示预计阅读分钟数，三者均可省略。文件名中的英文短名会成为文章网址的一部分。

日记的外观由 `research-diary/style.css`、`research-diary/theme.js`、`_layouts/research-note.html` 和 `_includes/research-*.html` 控制，不依赖个人主页的主题。亮暗主题默认跟随系统，也可用右上角按钮切换；手动选择会保存在当前浏览器。
