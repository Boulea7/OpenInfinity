# OpenInfinity

> **安全、透明、高性能的新标签页浏览器扩展**  
> Infinity New Tab Pro 的开源、道德化替代品

---

## 🎯 项目简介

OpenInfinity 是一个完全开源的浏览器新标签页扩展，旨在复刻 Infinity New Tab Pro 的所有核心功能，同时彻底摒弃其恶意追踪和隐私侵犯行为。

### 为什么要做 OpenInfinity？

Infinity New Tab Pro 曾是一款优秀的产品（300,000+ 用户，4.9/5 评分），但在 2025 年被发现涉及 **"ShadyPanda" 恶意软件活动**，导致 430 万用户受影响，包括：
- 🔴 搜索劫持到 affiliate networks
- 🔴 远程代码执行（DGA 域名生成算法）
- 🔴 窃取用户浏览历史和 Cookies
- 🔴 禁用广告拦截器和安全插件

**OpenInfinity 的使命**：为流失的 30-50 万用户提供一个功能完整、安全透明的替代品。

---

## ✨ 核心特性

### 🎨 功能完整（对标 Infinity Pro）

- ✅ **图标管理系统**：类 iOS 的拖拽网格、文件夹、自定义图标
- ✅ **壁纸引擎**：Unsplash API、Bing 每日壁纸、本地上传、视觉特效
- ✅ **搜索功能**：多引擎切换、智能联想、分类搜索
- ✅ **侧边栏微件**：待办事项、Markdown 笔记、天气、书签、历史记录

### 🛡️ 安全优先（超越 Infinity Pro）

- ✅ **零权限设计**：仅申请 `storage` 权限，拒绝 `*://*/*`、`webRequest` 等危险权限
- ✅ **本地优先**：所有数据仅存储在用户设备（IndexedDB），绝不上传云端
- ✅ **搜索透明化**：搜索 URL 用户可见，禁止劫持和重定向
- ✅ **零追踪**：无 Google Analytics，无遥测，无广告

### 💎 体验升级（超越原版）

- ✅ **Markdown 笔记**：支持代码高亮、实时预览（原版仅纯文本）
- ✅ **子任务支持**：树状结构待办事项（原版不支持）
- ✅ **快捷键系统**：Ctrl+K 命令面板、Alt+1-9 快速打开
- ✅ **性能模式**：Lite Mode 关闭动画，0 延迟加载

---

## 🚀 技术栈

| 技术领域 | 选型 | 理由 |
|---------|------|------|
| 前端框架 | React 18 + TypeScript 5 | 类型安全、成熟生态 |
| 构建工具 | Vite 5 | 极速构建（比 Webpack 快 10-20 倍） |
| 状态管理 | Zustand | 轻量级（1KB）、零样板代码 |
| UI 框架 | Tailwind CSS | 原子化 CSS、暗黑模式支持 |
| 拖拽系统 | dnd-kit | 无障碍支持、高性能 |
| 存储方案 | IndexedDB + Dexie.js | 大容量、异步、本地优先 |
| Manifest | V3 | 最新标准、更安全 |

---

## 📂 项目文档

### 核心文档（根目录）

1. [PRD.md](./PRD.md) - 产品需求文档
2. [AppFlow.md](./AppFlow.md) - 应用流程文档 ✅
3. [tech-base.md](./tech-base.md) - 技术基础文档 ✅
4. [ImplementationPlan.md](./ImplementationPlan.md) - 实施计划 ✅
5. [前端架构文档.md](./前端架构文档.md) - 前端架构 ✅
6. [本地后端结构文档.md](./本地后端结构文档.md) - 本地后端 ✅

### 调研文档（/docs 目录）

- [调研汇总](./docs/research-summary.md) - 完整调研概览
- [Gemini 调研报告](./docs/gemini-research-report.md) - Gemini Deep Research 结果
- [隐私安全调研](./docs/privacy-security-research.md) - 隐私和安全分析
- [技术架构调研](./docs/technical-architecture-research.md) - 技术实现细节
- [已解决问题](./docs/research-resolved.md) - Q&A 格式的调研结果
- [未解决问题](./docs/unresolved-questions.md) - 待补充调研清单
- [下一步行动](./docs/NEXT_STEPS.md) - 行动指南和补充调研提示词

---

## 🎯 开发路线图

### Phase 1: MVP（2-3 周）
- 基础图标管理（无拖拽）
- 简单壁纸系统
- 搜索框 + 多引擎
- 本地存储（IndexedDB）

### Phase 2: 核心功能（6-8 周）
- 拖拽排序 + 文件夹（500ms 触发）
- Unsplash/Bing API 集成
- 侧边栏微件（待办、笔记、天气）
- 数据导出/导入

### Phase 3: 高级功能（4-6 周）
- Markdown 笔记 + 代码高亮
- 子任务支持
- 快捷键系统
- 云同步（BYOS）

### Phase 4: 测试与发布（2-3 周）
- 单元测试 + E2E 测试
- 性能优化（< 500ms 冷启动）
- Chrome Web Store 上架

**总计**: 14-20 周（3.5-5 个月）

---

## 📊 市场定位

### 目标用户

1. **Infinity Pro 流失用户**（30-50 万）
   - 因安全事件卸载但怀念功能的用户
   
2. **隐私敏感用户**
   - 不满 Momentum 功能简陋
   - 不信任闭源产品

3. **技术爱好者**
   - 开发者、极客
   - 追求可定制化和透明度

### 竞品对比

| 产品 | 用户数 | 功能 | 隐私 | 开源 |
|-----|--------|------|------|------|
| Infinity Pro | ~430万 | ⭐⭐⭐⭐⭐ | ❌ 恶意 | ❌ 闭源 |
| Momentum | ~370万 | ⭐⭐ | ⭐⭐⭐⭐ | ❌ 闭源 |
| Tabliss | ~31万 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ 开源 |
| **OpenInfinity** | **目标** | **⭐⭐⭐⭐⭐** | **⭐⭐⭐⭐⭐** | **✅ 开源** |

---

## 🔐 隐私承诺

### OpenInfinity 绝不

- ❌ 收集任何用户数据
- ❌ 连接任何自有服务器
- ❌ 使用 Google Analytics 或统计服务
- ❌ 注入广告或推广链接
- ❌ 劫持搜索结果
- ❌ 申请危险权限（`*://*/*`、`webRequest`、`management`）

### OpenInfinity 保证

- ✅ 所有代码 100% 开源（GitHub 公开审计）
- ✅ 数据完全本地化（IndexedDB）
- ✅ GDPR 完全合规
- ✅ 零权限设计（仅申请 `storage`）
- ✅ 可选权限按需请求（天气、书签、历史）

---

## 🛠️ 快速开始

### 安装

**从 Chrome Web Store**:
```
[即将上线]
```

**手动安装**（开发版）:
```bash
# 1. 克隆项目
git clone https://github.com/Boulea7/OpenInfinity.git
cd OpenInfinity

# 2. 安装依赖
npm install

# 3. 构建扩展
npm run build

# 4. 加载到浏览器
# Chrome: chrome://extensions → 开发者模式 → 加载已解压的扩展 → 选择 dist/ 目录
```

### 开发

```bash
# 启动开发服务器（热重载）
npm run dev

# 运行测试
npm test

# 类型检查
npm run type-check

# 代码格式化
npm run format
```

---

## 📖 了解更多

- 🌐 [官方网站](https://openinfinity.dev)（筹备中）
- 📚 [完整文档](./docs/)
- 🐛 [问题反馈](https://github.com/Boulea7/OpenInfinity/issues)
- 💬 [讨论区](https://github.com/Boulea7/OpenInfinity/discussions)

---

## 🤝 贡献

OpenInfinity 是一个社区驱动的开源项目，欢迎任何形式的贡献：

- 🐛 报告 Bug
- 💡 提出功能建议
- 📝 改进文档
- 🔧 提交代码
- 🎨 设计图标和主题

查看 [贡献指南](./CONTRIBUTING.md) 了解详情。

---

## 📄 许可证

- **代码**: MIT License
- **文档**: CC BY-SA 4.0

---

## 🙏 致谢

- 感谢 Infinity New Tab Pro 团队的产品创意（尽管后期变质）
- 感谢 Koi Security 揭露 ShadyPanda 恶意软件活动
- 感谢所有开源社区的贡献者

---

## ⚠️ 免责声明

OpenInfinity 是一个独立的开源项目，与 Infinity New Tab Pro 无任何关联。本项目旨在：

- ✅ 学习和研究目的
- ✅ 为用户提供安全替代品
- ✅ 提高社区对隐私和安全的认识

**不得用于**：
- ❌ 恶意攻击或破解
- ❌ 侵犯知识产权
- ❌ 其他非法用途

---

**OpenInfinity** - 重新定义新标签页，尊重你的隐私

⭐ 如果觉得有用，请给我们一个 Star！
