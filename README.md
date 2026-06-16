# ToolDock

ToolDock 是一个纯静态工具导航站，适合部署到 Vercel。它参考传统网址导航的使用场景，但采用数据驱动、搜索优先和工作台式布局。

## 功能

- 分类导航、标签筛选和关键词搜索
- 精选资源展示
- 本地收藏与深色模式
- 网站提交页，本地保存待审核队列并支持复制 JSON
- 纯静态部署，无需构建命令

## 目录

```text
.
├── index.html
├── submit.html
├── about.html
├── 404.html
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

