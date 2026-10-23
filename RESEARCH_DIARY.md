# 研究日记

写作入口：https://zitongwang018.github.io/research-diary/write/

- Category 选择 `Day-Note` 或 `Week-Note`。
- 新笔记标题默认为北京时间当天日期 + `DayNote` / `WeekNote`，可手动修改。
- Day-Note 包含 Project、Learning、New 三个模块，每个模块两个直接编辑的内容框；手机上纵向排列。
- Week-Note 使用一个完整的直接编辑内容框。
- 用工具栏设置标题、加粗、斜体、列表、链接、代码和图片。粘贴 Markdown 时会直接渲染，不设置独立预览栏。
- 日夜主题跟随系统，也可点击页眉 Day / Night 切换；浏览器记住选择。
- 草稿保存在当前浏览器。切换类别时，两种模式的内容各自保留，Save 只发布当前类别。
- 点击 New 开始新笔记，Open 下拉框用于重新打开已发布笔记。

## 保存

展开 GitHub，使用仅授权此仓库且具有 Contents: Read and write 权限的 fine-grained token 连接。令牌只保存在当前标签页内存中，不写入草稿。Save 将当前笔记发布到公开仓库，GitHub Pages 随后更新网页。

同一天每个类别使用一个文件；已有同日同类笔记时，请从 Open 打开再修改。并发保存冲突会保留草稿，不覆盖远端内容。

## 文件格式

笔记保存在 `_research_diary/`，含 layout、title、date、category、note_format 和 permalink。正文是净化后的 HTML，保留直接编辑的排版。Day-Note 使用固定的六个 `data-diary-field` 标记，便于再次打开时还原到对应内容框。旧 Markdown 格式可作为单框内容打开。
