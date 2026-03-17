<div align="center">

<img src="icons/icon128.png" alt="OpenInfinity" width="96" />

# OpenInfinity

**A secure, transparent, and feature-complete new tab extension**

The open-source, privacy-first alternative to Infinity New Tab Pro

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-0d0d0d?style=flat-square)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Manifest_V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-18c964?style=flat-square)](#contributing)
[![Stars](https://img.shields.io/github/stars/Boulea7/OpenInfinity?style=flat-square&color=f0a500)](https://github.com/Boulea7/OpenInfinity/stargazers)

<br/>

[中文](./README.md) · [日本語](./README_JA.md) · [Report Issues](https://github.com/Boulea7/OpenInfinity/issues) · [Feature Requests](https://github.com/Boulea7/OpenInfinity/discussions)

</div>

---

## Why OpenInfinity?

In 2025, Infinity New Tab Pro — once a beloved extension with **4.3 million users and a 4.9/5 rating** — was discovered to contain the **ShadyPanda malware**, which:

- Silently hijacked searches to affiliate networks
- Stole browsing history and cookies
- Remotely disabled ad blockers and security extensions

OpenInfinity is the answer: **feature-equivalent, fully open-source, and zero-tracking.**

---

## Preview

```
┌─────────────────────────────────────────────────────────┐
│  🔍  Search anything...                    ⛅ 72°F      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   [GitHub] [Gmail] [YouTube] [Notion]  [+]              │
│   [Figma]  [Vercel] [Claude]  [Reddit]                   │
│   📁 Work   📁 Study                                     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [Todo] [Notes] [Weather] [Bookmarks] [History]  ⚙️      │
└─────────────────────────────────────────────────────────┘
```

---

## Features

### Icons & Navigation

- **Smart grid**: iOS-style drag-and-drop sorting; hover 500ms to merge into folders
- **100+ presets**: One-click add from a curated library of popular websites
- **Custom icons**: URL, Emoji, text labels, or local image upload
- **Quick-add popup**: Add the current page from any tab via `Ctrl+Shift+A`

### Wallpaper Engine

| Source | Description |
|--------|-------------|
| Unsplash | High-quality photography, keyword search |
| Pexels | Free commercial-use image library |
| Bing Daily | Microsoft's daily pick, auto-rotates |
| Wallhaven | Anime, scenery, photography |
| Local Upload | Use your own images |
| Solid / Gradient | Clean, minimal backgrounds |

### Sidebar Widgets

- **Todo**: Subtasks, priorities, due dates
- **Markdown Notes**: CodeMirror syntax highlighting, live preview, pinned notes
- **Weather**: Open-Meteo / QWeather / OpenWeatherMap
- **Bookmarks**: Visual Chrome bookmark manager
- **History**: Search and delete browsing history
- **Extensions**: Enable / disable installed extensions

### Search

- Google, Baidu, Bing, DuckDuckGo, Brave, and more
- Add any custom search engine
- Search URLs are always visible — no hijacking, ever

### Customization

- Light / Dark theme + auto system follow
- Clock styles: digital, analog, minimal; multi-timezone
- Layout: custom column count, icon size, spacing
- Minimal mode: hides all widgets, just search and icons
- Animation toggle (friendly for low-end devices)
- i18n: Chinese, English, Japanese

---

## Privacy Promise

OpenInfinity will **never**:

- Collect any user data or behavior logs
- Connect to its own servers (no backend, no accounts)
- Inject ads, promotions, or affiliate links
- Hijack searches or navigation
- Use Google Analytics or any third-party tracking

OpenInfinity **guarantees**:

- 100% open-source code, auditable by anyone
- All data stored locally in IndexedDB, never synced to the cloud
- All network permissions are **optional** — requested only when a feature needs them
- Only `storage` + `alarms` are required at install time

---

## Getting Started

### Option 1: Chrome Web Store (coming soon)

> Under review. Stay tuned.

### Option 2: Manual Load (available now)

```bash
# 1. Clone the repo
git clone https://github.com/Boulea7/OpenInfinity.git
cd OpenInfinity

# 2. Install dependencies
npm install

# 3. Build
npm run build
```

Then in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` directory

Your new tab is immediately replaced.

### Development

```bash
npm run dev        # Dev server with hot reload
npm run type-check # TypeScript check
npm run lint       # ESLint
npm run build      # Production build
```

---

## Tech Stack

| Area | Technology |
|------|------------|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 5 |
| State | Zustand |
| Styling | Tailwind CSS |
| Storage | IndexedDB + Dexie.js |
| Editor | CodeMirror 6 |
| Drag & Drop | dnd-kit |
| Rich Text | TipTap |
| i18n | i18next |
| Standard | Manifest V3 |

---

## Comparison

| Product | Features | Privacy | Open Source | Localization |
|---------|----------|---------|-------------|-------------|
| Infinity New Tab Pro | ⭐⭐⭐⭐⭐ | ❌ Malware | ❌ | ✅ |
| Momentum | ⭐⭐ | ⭐⭐⭐⭐ | ❌ | Limited |
| Tabliss | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | Limited |
| **OpenInfinity** | **⭐⭐⭐⭐⭐** | **⭐⭐⭐⭐⭐** | **✅** | **✅** |

---

## Contributing

All contributions are welcome:

- 🐛 Bug reports via [Issues](https://github.com/Boulea7/OpenInfinity/issues)
- 💡 Feature requests via [Discussions](https://github.com/Boulea7/OpenInfinity/discussions)
- 🌐 Translation improvements (EN / ZH / JA)
- 🔧 Code contributions (Fork → Branch → PR)

Before submitting a PR, please ensure:
- `npm run type-check` and `npm run lint` pass
- Code follows the existing style (concise, minimal comments)
- PR description clearly explains the change

---

## License

Code: [MIT License](LICENSE) · Documentation: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

---

<div align="center">

**OpenInfinity** · Redefine your new tab. Respect your privacy.

If this project helps you, a ⭐ goes a long way.

</div>
