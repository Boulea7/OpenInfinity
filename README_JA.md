<div align="center">

<img src="icons/icon128.png" alt="OpenInfinity" width="96" />

# OpenInfinity

**安全・透明・高機能なブラウザ新規タブ拡張機能**

Infinity New Tab Pro のオープンソース・プライバシー優先の代替品

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-0d0d0d?style=flat-square)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Manifest_V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-18c964?style=flat-square)](#コントリビューション)
[![Stars](https://img.shields.io/github/stars/Boulea7/OpenInfinity?style=flat-square&color=f0a500)](https://github.com/Boulea7/OpenInfinity/stargazers)

<br/>

[中文](./README.md) · [English](./README_EN.md) · [バグ報告](https://github.com/Boulea7/OpenInfinity/issues) · [機能提案](https://github.com/Boulea7/OpenInfinity/discussions)

</div>

---

## なぜ OpenInfinity が必要か

2025年、**430万ユーザー・評価4.9/5** を誇った Infinity New Tab Pro に **ShadyPanda マルウェア**が発見されました：

- 検索結果をアフィリエイトネットワークに無断転送
- 閲覧履歴と Cookie の静かな窃取
- 広告ブロッカーやセキュリティ拡張機能のリモート無効化

OpenInfinity はその答えです：**同等の機能を持ち、完全オープンソースで、一切のトラッキングなし。**

---

## プレビュー

```
┌─────────────────────────────────────────────────────────┐
│  🔍  検索...                                ⛅ 22°C    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   [GitHub] [Gmail] [YouTube] [Notion]  [+]              │
│   [Figma]  [Vercel] [Claude]  [Reddit]                   │
│   📁 仕事   📁 勉強                                       │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [Todo] [メモ] [天気] [ブックマーク] [履歴]        ⚙️    │
└─────────────────────────────────────────────────────────┘
```

---

## 主な機能

### アイコンとナビゲーション

- **スマートグリッド**：iOS風ドラッグ&ドロップ並び替え、500msホバーでフォルダに自動合体
- **100以上のプリセット**：人気サイトをワンクリックで追加
- **カスタムアイコン**：URL・絵文字・テキスト・ローカル画像に対応
- **クイック追加**：どのページからでも `Ctrl+Shift+A` で現在のサイトを即座に追加

### 壁紙エンジン

| ソース | 説明 |
|--------|------|
| Unsplash | 高品質写真、キーワード検索対応 |
| Pexels | 商用利用可能な無料画像 |
| Bing デイリー | Microsoftの毎日のおすすめ画像 |
| Wallhaven | アニメ・風景・写真 |
| ローカル画像 | 自分の画像を使用 |
| 単色 / グラデーション | ミニマルな背景 |

### サイドバーウィジェット

- **Todo リスト**：サブタスク・優先度・期限設定
- **Markdown メモ**：CodeMirror シンタックスハイライト、リアルタイムプレビュー、ピン固定
- **天気**：Open-Meteo / QWeather / OpenWeatherMap から選択
- **ブックマーク**：Chrome ブックマークのビジュアル管理
- **閲覧履歴**：検索・削除機能付き
- **拡張機能管理**：インストール済み拡張の有効/無効を一元管理

### 検索

- Google・Baidu・Bing・DuckDuckGo・Brave などに対応
- 任意の検索エンジンをカスタム追加可能
- 検索URLは常に可視化 — ハイジャックは一切なし

### カスタマイズ

- ライト / ダーク テーマ + システム自動追従
- 時計スタイル（デジタル・アナログ・ミニマル）+ 複数タイムゾーン
- レイアウト（列数・アイコンサイズ・間隔）のカスタマイズ
- ミニマルモード（検索とアイコンのみ表示）
- アニメーション切替（低スペック端末にも対応）
- 国際化：中国語・英語・日本語

---

## プライバシーの約束

OpenInfinity は**絶対に**：

- ユーザーデータや行動ログを収集しない
- 自社サーバーに接続しない（バックエンドなし・アカウント不要）
- 広告・プロモーション・アフィリエイトリンクを挿入しない
- 検索やナビゲーションをハイジャックしない
- Google Analytics や第三者トラッキングを使用しない

OpenInfinity が**保証すること**：

- コードは100%オープンソースで誰でも監査可能
- すべてのデータはローカルの IndexedDB にのみ保存
- すべてのネットワーク権限は**オプション**（機能使用時のみ要求）
- インストール時に必要な権限は `storage` + `alarms` の2つのみ

---

## クイックスタート

### 方法1：Chrome Web Store（近日公開）

> 審査準備中です。しばらくお待ちください。

### 方法2：手動インストール（今すぐ利用可能）

```bash
# 1. リポジトリをクローン
git clone https://github.com/Boulea7/OpenInfinity.git
cd OpenInfinity

# 2. 依存関係をインストール
npm install

# 3. ビルド
npm run build
```

Chrome での設定：
1. `chrome://extensions` を開く
2. 右上の**デベロッパーモード**を有効化
3. **パッケージ化されていない拡張機能を読み込む**をクリック
4. `dist/` ディレクトリを選択

新しいタブが即座に置き換わります。

### 開発環境

```bash
npm run dev        # ホットリロード付き開発サーバー
npm run type-check # TypeScript型チェック
npm run lint       # ESLint
npm run build      # 本番ビルド
```

---

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | React 18 + TypeScript 5 |
| ビルド | Vite 5 |
| 状態管理 | Zustand |
| スタイリング | Tailwind CSS |
| ストレージ | IndexedDB + Dexie.js |
| エディター | CodeMirror 6 |
| ドラッグ&ドロップ | dnd-kit |
| リッチテキスト | TipTap |
| 国際化 | i18next |
| 標準 | Manifest V3 |

---

## 競合比較

| 製品 | 機能 | プライバシー | オープンソース | 日本語対応 |
|------|------|------------|--------------|----------|
| Infinity New Tab Pro | ⭐⭐⭐⭐⭐ | ❌ マルウェア | ❌ | ✅ |
| Momentum | ⭐⭐ | ⭐⭐⭐⭐ | ❌ | ❌ |
| Tabliss | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | 限定的 |
| **OpenInfinity** | **⭐⭐⭐⭐⭐** | **⭐⭐⭐⭐⭐** | **✅** | **✅** |

---

## コントリビューション

あらゆる形式のコントリビューションを歓迎します：

- 🐛 バグ報告（[Issues](https://github.com/Boulea7/OpenInfinity/issues)）
- 💡 機能提案（[Discussions](https://github.com/Boulea7/OpenInfinity/discussions)）
- 🌐 翻訳の改善（中国語 / 英語 / 日本語）
- 🔧 コード貢献（Fork → Branch → PR）

PR 提出前に確認してください：
- `npm run type-check` と `npm run lint` がパスすること
- 既存のコードスタイルに従うこと（簡潔・冗長なコメントなし）
- PR の説明に変更の目的を明記すること

---

## ライセンス

コード: [MIT License](LICENSE) · ドキュメント: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

---

<div align="center">

**OpenInfinity** · 新しいタブを再定義し、あなたのプライバシーを守る

このプロジェクトが役立ったなら、⭐ をクリックしてください

</div>
