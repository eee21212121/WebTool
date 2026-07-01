# ToolDock

ToolDock 是一个纯静态工具导航站，适合部署到 Vercel。它参考传统网址导航的使用场景，但采用数据驱动、搜索优先和工作台式布局。

## 功能

- 分类导航、标签筛选和关键词搜索
- 精选资源展示
- 本地收藏与深色模式
- 网站提交页，本地保存待审核队列并支持复制 JSON
- 工具指南与专题文章，补充原创内容和使用场景
- 重点工具详情页，沉淀单个工具的适用场景与使用建议
- `robots.txt` 与 `sitemap.xml`，便于搜索引擎抓取
- 纯静态部署，无需构建命令

## 目录

```text
.
├── index.html
├── submit.html
├── guides.html
├── topics.html
├── tools.html
├── about.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── topics/
│   ├── ai-writing-research.html
│   ├── frontend-launch.html
│   ├── design-assets.html
│   └── productivity-knowledge.html
├── tools/
│   ├── chatgpt.html
│   ├── perplexity.html
│   ├── claude.html
│   ├── github.html
│   ├── vercel.html
│   └── figma.html
├── data/
│   └── tools.json
├── assets/
│   ├── css/styles.css
│   ├── js/app.js
│   ├── js/submit.js
│   └── images/logo.svg
└── vercel.json
```

## 修改导航内容

编辑 `data/tools.json`：

```json
{
  "id": "example",
  "name": "Example",
  "url": "https://example.com/",
  "description": "一句话描述这个工具。",
  "category": "developer",
  "tags": ["开发", "工具"],
  "featured": true
}
```

`category` 需要对应同文件里的分类 `id`。

## 增加原创内容

专题文章位于 `topics/` 目录，专题索引是 `topics.html`。新增页面后建议同步更新：

- 首页或 `guides.html` 的入口链接
- `sitemap.xml` 中的 URL、`lastmod` 和优先级
- 每个页面的 `title`、`description` 和 canonical 链接

工具详情页位于 `tools/` 目录，详情索引是 `tools.html`。如果希望首页卡片显示详情入口，需要在 `data/tools.json` 对应工具里添加 `detailPath`。

## 本地预览

由于页面会读取 JSON 文件，建议通过本地 HTTP 服务访问：

```bash
python3 -m http.server 4173
```

然后打开 `http://localhost:4173`。

## Vercel 部署

1. 将项目推到 GitHub。
2. 在 Vercel 新建项目并导入仓库。
3. Framework Preset 选择 `Other`。
4. Build Command 留空。
5. Output Directory 留空或填 `.`。
6. 部署完成后即可访问。
