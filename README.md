# 个人工作台

一个移动优先的 PWA 个人工作台应用，支持离线使用，包含任务管理、知识库、股票复盘、项目跟踪等 7 大模块。

## 功能模块

| 模块 | 功能 |
|------|------|
| 任务管理 | 待办清单、优先级、状态看板、截止日期、标签 |
| 知识管理 | 笔记（Markdown）、全文搜索、标签分类 |
| 数据看板 | 任务统计、习惯完成率、项目进度、图表可视化 |
| 项目跟踪 | 项目管理、里程碑、进度条、状态流转 |
| 内容创作 | 笔记编辑 + 日记（心情、天气） |
| 工具集成 | 快捷入口、链接收藏、计算器、内嵌网页 |
| 个人习惯 | 习惯打卡、热力图、连续天数、目标追踪 |
| 股票复盘 | A 股实时行情、K 线图、自选股、复盘笔记 |

## 技术栈

- **React 18** + **TypeScript** + **Vite**
- **TailwindCSS**（温暖柔和主题）
- **Dexie.js**（IndexedDB 本地存储）
- **ECharts**（数据可视化）
- **vite-plugin-pwa**（PWA 离线支持）

## 快速开始

### 开发模式

```bash
cd personal-workbench
npm install
npm run dev
```

### 构建生产版本

```bash
npm run build
```

构建产出在 `dist/` 目录。

### 预览构建结果

```bash
npm run preview
```

## 部署方式

构建后的 `dist/` 目录是纯静态文件，可部署到任何静态文件托管服务：

### 方式 1：Vercel / Netlify（推荐，免费）

1. 将项目推送到 GitHub
2. 在 Vercel/Netlify 导入项目
3. 构建命令填 `npm run build`，输出目录填 `dist`
4. 自动部署完成

### 方式 2：Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/personal-workbench/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 方式 3：任意静态服务器

```bash
cd dist
python3 -m http.server 8080
# 或
npx serve .
```

### 方式 4：直接用手机浏览器打开

将 `dist` 目录整体传到手机，用支持 PWA 的浏览器（Chrome/Safari）打开 `index.html`，然后"添加到主屏幕"即可像原生 App 一样使用。

## PWA 安装

1. 用手机浏览器（Chrome/Safari）打开应用网址
2. 浏览器菜单中选择"添加到主屏幕"
3. 之后从桌面图标启动，全屏运行，支持离线

## 数据说明

- 所有数据存储在浏览器的 IndexedDB 中，完全本地化
- 数据不会上传到任何服务器
- 在设置页面可导出数据为 JSON 备份
- 清除浏览器数据会导致应用数据丢失，请定期导出备份

## 项目结构

```
personal-workbench/
├── src/
│   ├── components/     # 通用组件（Header, Modal, BottomNav 等）
│   ├── pages/          # 页面组件（7 大模块 + 设置等）
│   ├── db/             # 数据库定义（Dexie/IndexedDB）
│   ├── utils/          # 工具函数（日期、股票行情接口）
│   ├── App.tsx         # 路由配置
│   ├── main.tsx        # 入口文件
│   └── index.css       # 全局样式
├── public/             # 静态资源（图标）
├── index.html
├── vite.config.ts      # Vite + PWA 配置
├── tailwind.config.js  # TailwindCSS 主题配置
└── package.json
```
