<div align="center">

<img src="icons/icon128.png" alt="OpenInfinity" width="96" />

# OpenInfinity

**安全、透明、功能完整的浏览器新标签页扩展**

Infinity New Tab Pro 的开源隐私优先替代品

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-0d0d0d?style=flat-square)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Manifest_V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-18c964?style=flat-square)](#贡献)
[![Stars](https://img.shields.io/github/stars/Boulea7/OpenInfinity?style=flat-square&color=f0a500)](https://github.com/Boulea7/OpenInfinity/stargazers)

<br/>

[English](./README_EN.md) · [日本語](./README_JA.md) · [问题反馈](https://github.com/Boulea7/OpenInfinity/issues) · [功能建议](https://github.com/Boulea7/OpenInfinity/discussions)

</div>

---

## 为什么需要 OpenInfinity？

2025 年，曾拥有 **430 万用户、评分 4.9/5** 的 Infinity New Tab Pro 被发现植入 **ShadyPanda 恶意软件**，导致：

- 搜索被劫持至 affiliate 网络，用户利益被出卖
- 浏览历史和 Cookie 遭到静默窃取
- 广告拦截器和安全插件被远程禁用

OpenInfinity 使命明确：为流失用户提供**功能对等、代码完全开源、永不追踪**的替代品。

---

## 预览

```
┌─────────────────────────────────────────────────────────┐
│  🔍  在此搜索...                          ⛅ 22°C 晴天  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   [GitHub] [Gmail] [YouTube] [Notion]  [+]              │
│   [Figma]  [Vercel] [Claude]  [Reddit]                   │
│   📁 工作   📁 学习                                       │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [待办] [笔记] [天气] [书签] [历史]   📌  ⚙️             │
└─────────────────────────────────────────────────────────┘
```

---

## 核心特性

### 图标与导航

- **智能网格**：类 iOS 的拖拽排序，500ms 悬停自动合并为文件夹
- **海量预设**：内置 100+ 主流网站，一键添加
- **自定义图标**：支持 URL、Emoji、文字、本地图片
- **弹出面板**：在任意页面通过扩展图标快速添加当前网站（`Ctrl+Shift+A`）

### 壁纸引擎

| 来源 | 说明 |
|------|------|
| Unsplash | 高质量摄影作品，支持关键词搜索 |
| Pexels | 免费商业可用图库 |
| Bing 每日壁纸 | 微软精选，自动更换 |
| Wallhaven | 二次元 / 风景 / 摄影 |
| 本地上传 | 使用自己的图片 |
| 纯色 / 渐变 | 极简风格 |

### 侧边栏微件

- **待办事项**：支持子任务、优先级、截止日期
- **Markdown 笔记**：CodeMirror 代码高亮、实时预览、PIN 固定
- **天气**：Open-Meteo / QWeather / OpenWeatherMap 三源可选
- **书签**：Chrome 书签可视化管理
- **历史记录**：快速搜索和删除浏览历史
- **扩展管理**：一键启用/禁用已安装扩展

### 搜索

- 支持 Google、百度、Bing、DuckDuckGo、Brave 等多引擎
- 自定义添加任意搜索引擎
- 搜索 URL 始终可见、拒绝劫持

### 个性化设置

- 明暗主题 + 系统自动跟随
- 时钟样式（数字 / 模拟 / 简约）+ 多时区
- 布局自定义（列数、图标大小、间距）
- 极简模式（隐藏所有微件，只留搜索和图标）
- 动画开关（低性能设备友好）
- 国际化：中文、英文、日文

---

## 隐私承诺

OpenInfinity **绝不**：

- 收集任何用户数据或行为日志
- 连接自有服务器（无后端、无账号系统）
- 注入广告、推广或 affiliate 链接
- 劫持搜索或导航
- 使用 Google Analytics 或任何第三方统计

OpenInfinity **保证**：

- 所有代码 100% 开源，任何人可审计
- 数据仅存储于本地 IndexedDB，不上云
- 所有网络权限为**可选**，功能按需申请
- 安装时仅需 `storage` + `alarms` 两项基础权限

---

## 快速开始

### 方式一：从 Chrome Web Store 安装（即将上线）

> 正在准备上架审核，敬请期待。

### 方式二：手动加载（立即可用）

```bash
# 1. 克隆仓库
git clone https://github.com/Boulea7/OpenInfinity.git
cd OpenInfinity

# 2. 安装依赖
npm install

# 3. 构建
npm run build
```

然后在 Chrome 中：
1. 打开 `chrome://extensions`
2. 开启右上角**开发者模式**
3. 点击**加载已解压的扩展**
4. 选择项目的 `dist/` 目录

新标签页即刻生效。

### 开发模式

```bash
npm run dev        # 启动开发服务器（热重载）
npm run type-check # TypeScript 类型检查
npm run lint       # ESLint 代码检查
npm run build      # 生产构建
```

---

## 技术栈

| 领域 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript 5 |
| 构建 | Vite 5 |
| 状态 | Zustand |
| 样式 | Tailwind CSS |
| 存储 | IndexedDB + Dexie.js |
| 编辑器 | CodeMirror 6 |
| 拖拽 | dnd-kit |
| 富文本 | TipTap |
| 国际化 | i18next |
| 标准 | Manifest V3 |

---

## 竞品对比

| 产品 | 功能 | 隐私 | 开源 | 中文支持 |
|------|------|------|------|------|
| Infinity New Tab Pro | ⭐⭐⭐⭐⭐ | ❌ 恶意软件 | ❌ | ✅ |
| Momentum | ⭐⭐ | ⭐⭐⭐⭐ | ❌ | ❌ |
| Tabliss | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | 一般 |
| **OpenInfinity** | **⭐⭐⭐⭐⭐** | **⭐⭐⭐⭐⭐** | **✅** | **✅** |

---

## 贡献

欢迎所有形式的贡献，包括但不限于：

- 🐛 提交 Bug 报告（[Issues](https://github.com/Boulea7/OpenInfinity/issues)）
- 💡 提出新功能建议（[Discussions](https://github.com/Boulea7/OpenInfinity/discussions)）
- 🌐 改进翻译（中/英/日）
- 🔧 提交代码（Fork → Branch → PR）

提交 PR 前请确保：
- 通过 `npm run type-check` 和 `npm run lint`
- 遵循现有代码风格（精简、无冗余注释）
- PR 描述清晰说明变更目的

---

## 许可证

代码采用 [MIT License](LICENSE)，文档采用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。

---

<div align="center">

**OpenInfinity** · 重新定义新标签页，尊重你的隐私

如果这个项目对你有帮助，欢迎点一个 ⭐

</div>
