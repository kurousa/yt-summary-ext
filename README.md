# YouTube Summarize Sidebar (Chrome 拡張機能)

YouTube の動画メニューからワンクリックで動画 URL を抽出し、**Chrome 純正のサイドパネル内で Gemini を起動して要約プロンプトを自動実行**する Chrome 拡張機能（Manifest V3）です。

---

## 🚀 主な機能・特徴

1. **ワンクリックで要約プロンプトを生成・コピー**
   * YouTube の三点リーダーメニュー（「その他の操作」）内に「**✨ 要約を実行**」ボタンを自動追加。
   * クリックした動画の URL を割り出し、`以下の動画を要約: https://www.youtube.com/watch?v=...` のプロンプトをクリップボードにコピーします。
2. **Chrome 純正 Side Panel とのシームレス連携**
   * YouTube 画面の横に Chrome 純正のサイドパネルとして Gemini（`https://gemini.google.com/app`）を起動。
   * YouTube の動画レイアウトやスクロール操作を崩さずに、動画を見ながら並行して要約を確認できます。
3. **プロンプトの自動貼り付け＆自動送信（実行）**
   * サイドパネルに表示された Gemini の入力欄を検知し、プロンプトを自動入力して送信ボタンを自動クリックします。
4. **最新の YouTube UI（ViewModel / Lit）に対応**
   * YouTube の新旧 UI 構造を自動判別し、デザインに自然に溶け込むメニュー項目を追加します。

---

## 🛠️ インストール・使用方法

### 1. 拡張機能の読み込み（デベロッパーモード）

1. Google Chrome を開き、アドレスバーに `chrome://extensions` と入力してアクセスします。
2. 画面右上の「**デベロッパー モード**」を有効化（オン）します。
3. 画面左上の「**パッケージ化されていない拡張機能を読み込む**」をクリックします。
4. 本リポジトリのディレクトリ（`yt-summary-ext`）を選択します。

### 2. 使い方

1. [YouTube](https://www.youtube.com/) にアクセスします。
2. トップページ、検索結果、チャンネルページ、または動画再生ページの三点リーダーメニュー（`︙`）をクリックします。
3. メニューに追加された「**✨ 要約を実行**」をクリックします。
4. Chrome の右側にサイドパネルが開き、Gemini が起動して自動的に動画の要約が実行されます。

> **Note**  
> 事前にブラウザで [Google Gemini](https://gemini.google.com/app) に Google アカウントでログインした状態にしておいてください。

---

## 📂 ファイル構成

```text
yt-summary-ext/
├── manifest.json       # Chrome 拡張機能の設定ファイル (Manifest V3)
├── background.js      # Side Panel API の制御・メッセージ中継を行う Service Worker
├── content.js         # YouTube 上でのメニュー項目注入および動画URL抽出スクリプト
├── sidepanel.html     # サイドパネルの HTML (Gemini iframe を内包)
├── sidepanel.js       # サイドパネル側でプロンプトを受け取り iframe に伝達するスクリプト
├── gemini.js          # Gemini 側でプロンプトを自動入力・自動送信するスクリプト
├── rules.json         # declarativeNetRequest ルール (Gemini の iframe 埋め込み許可)
└── README.md          # 本ドキュメント
```

---

## ⚙️ 技術仕様・権限

* **Manifest Version**: 3
* **Permissions**:
  * `sidePanel`: Chrome 純正サイドパネル API の利用
  * `clipboardWrite`: プロンプトのクリップボード自動コピー
  * `declarativeNetRequest`: サイドパネル内での Gemini 表示を許可するためのヘッダー調整
* **Host Permissions**:
  * `https://www.youtube.com/*`
  * `https://gemini.google.com/*`
