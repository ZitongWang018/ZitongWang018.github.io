# 个人主页修改指南

本文档说明如何修改 WeChat 二维码、个人照片、论文、页面宽度，以及如何写博客（含文字与图片）。

---

## 1. WeChat 二维码

- **图片位置**：把二维码图片放到项目根目录下的 **`images/`** 文件夹。
- **文件名**：默认使用 **`wechat.png`**。若用其他名字，在 **`_config.yml`** 里找到 `author` → `wechat_image`，改成你的文件名（例如 `wechat-qr.png`）。
- **点击行为**：侧栏的 WeChat 链接会打开该图片（新标签页）。

---

## 2. 个人照片（头像）

- **图片位置**：把个人照片放到 **`images/`** 文件夹。
- **文件名**：在 **`_config.yml`** 里找到 `author` → `avatar`，当前为 **`aa.jpg`**。  
  - 若继续用 `aa.jpg`，只需把新照片命名为 `aa.jpg` 并放进 `images/` 覆盖即可。  
  - 若用别的文件名（如 `profile.jpg`），在 `avatar` 处改为 `"profile.jpg"`，并把照片放到 `images/` 下。

---

## 3. 主页显示的论文（Publications）

- **数据位置**：每篇论文对应 **`_publications/`** 下的一个 Markdown 文件，格式为：  
  **`YYYY-MM-DD-英文短标题.md`**（例如 `2024-01-15-my-paper.md`）。
- **修改已有论文**：直接编辑对应 `.md` 文件中的 front matter 和正文：
  - `title`：论文标题  
  - `venue`：期刊/会议名  
  - `date`：日期  
  - `excerpt`：简短摘要  
  - `paperurl`：论文 PDF 链接  
  - `citation`：引用格式  
  - 正文可写更详细的介绍。
- **新增论文**：在 **`_publications/`** 下新建一个 **`YYYY-MM-DD-url-slug.md`**，参考现有文件的 front matter 和内容格式复制一份再改。
- **首页/Publications 页列表**：列表已改为自动从 **`_publications/`** 中读取并按时间倒序显示，无需再写“Coming soon”。

---

## 4. 页面主内容区变宽

- **已做修改**：在 **`_sass/_variables.scss`** 中，主内容区最大宽度已由 `925px` 改为 **`1100px`**（变量 `$large`）。
- **继续加宽**：在同一文件中找到 `$large : 1100px`，把数值改大（如 `1200`）即可。

---

## 5. Podcast 改为 Blog（英文）及图文支持

- **导航**：顶栏的 “Podcast” 已改为 **“Blog”**，链接为 **`/blog/`**。旧链接 **`/podcast/`** 会自动跳转到 **`/blog/`**。
- **博客列表**：**`/blog/`** 页面会列出 **`_posts/`** 下的所有文章（按时间倒序）。
- **写新博客（文字 + 图片）**：
  1. 在 **`_posts/`** 下新建文件，命名格式：**`YYYY-MM-DD-英文标题短名.md`**（例如 `2025-02-14-hello-world.md`）。
  2. 在文件开头写 front matter，例如：

     ```yaml
     ---
     title: 'Your Post Title'
     date: 2025-02-14
     permalink: /posts/2025/02/hello-world/
     tags:
       - tag1
       - tag2
     ---
     ```

  3. 正文用 **Markdown** 写，可包含：
     - 标题、段落、列表、链接等；
     - **图片**：把图片放到 **`images/`**（或 `images/blog/` 等子目录），在文中用  
       `![描述](/images/your-image.jpg)`  
       插入（若站点有 baseurl，则用 `{{ site.baseurl }}/images/your-image.jpg`）。
  4. **可选：列表缩略图**：若希望博客列表页显示封面图，在 front matter 中加：
     - `header:
         teaser: "your-teaser.jpg"`  
     图片同样放在 `images/`，teaser 写相对路径或文件名即可。

- **示例**（带图的一篇 post）：

  ```markdown
  ---
  title: 'My First Blog Post'
  date: 2025-02-14
  permalink: /posts/2025/02/first-post/
  header:
    teaser: /images/blog/cover.jpg
  ---

  Here is some text.

  ![My photo](/images/blog/photo.jpg)

  More text...
  ```

---

## 6. 修改后如何查看

- **本地预览**：在项目根目录执行 `bundle exec jekyll serve`，浏览器打开提示的地址（如 `http://localhost:4000`）即可查看。
- **修改 `_config.yml` 后**：需要重启一次 `jekyll serve` 才能生效。

---

## 7. 文件位置速查

| 内容           | 文件/目录 |
|----------------|-----------|
| WeChat 二维码  | `images/wechat.png`（或 _config 中 `wechat_image` 指定） |
| 个人头像       | `images/` + `_config.yml` 中 `author.avatar` |
| 论文列表项     | `_publications/*.md` |
| 主内容区宽度   | `_sass/_variables.scss` 中 `$large` |
| 导航菜单       | `_data/navigation.yml` |
| 博客文章       | `_posts/*.md` |
| Blog 页面      | `_pages/blog.html` |

如有新需求，可在上述对应位置扩展或再问。
