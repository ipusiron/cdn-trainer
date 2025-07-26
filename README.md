# CDN Trainer - セキュアなCDN構成を学べる体験型ツール

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/cdn-trainer?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/cdn-trainer?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/cdn-trainer)
![GitHub license](https://img.shields.io/github/license/ipusiron/cdn-trainer)

**Day026 - 生成AIで作るセキュリティツール100**

**CDN Trainer** は、CDN・WAF・オリジンサーバ構成の良し悪しを体験的に学べる教育用Webツールです。

プリセット構成の選択により、構成図と診断コメントを通してセキュリティのリスクや改善点を視覚的に学ぶことができます。

---

## 🔍 デモページ

👉 [https://ipusiron.github.io/cdn-trainer/](https://ipusiron.github.io/cdn-trainer/)

---

## 📸 スクリーンショット

>![ダミー](assets/screenshot.png)
>
>*ダミー*

---

## 🎯 主な機能

- ✅ 3種類の構成プリセットをワンクリックで切り替え
- ✅ 構成図を図解形式で表示
- ✅ セキュリティ的観点からの診断コメントを出力
- ✅ WAFやCDNの役割について簡単に理解できる

---

## 🧾 用語集

| 用語 | 解説 |
|------|------|
| **CDN（Content Delivery Network）** | Webサーバーの代わりに、世界中の中継サーバーがコンテンツを届けてくれる仕組み。攻撃を防ぐ盾としても使える。 |
| **WAF（Web Application Firewall）** | Webアプリへの不正アクセス（例：SQLインジェクション）を検知・防御する仕組み。CDNとセットで導入されることが多い。 |
| **オリジンサーバー（Origin Server）** | あなたの本来のWebサーバー。CDNの裏側にある本体。攻撃から守るべき対象。 |
| **IP制限** | 特定のIPアドレス（例：CDN経由のアクセス）のみに通信を許可することで、直接の攻撃を防ぐ技術。 |
| **CDNバイパス** | CDNを通さずに直接オリジンサーバーへアクセスされてしまう状態。構成ミスで起こりやすく危険。 |
| **構成図** | ネットワークの流れや防御の位置関係を図で表したもの。視覚的に理解しやすい。 |

---

## 📁 ファイル構成

cdn-trainer/
├── index.html ... メインUI
├── style.css ... スタイル定義
├── script.js ... ロジックと診断切り替え
└── README.md

---

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)をご覧ください。

---

## 🛠 このツールについて

本ツールは、「生成AIで作るセキュリティツール100」プロジェクトの一環として開発されました。
このプロジェクトでは、AIの支援を活用しながら、セキュリティに関連するさまざまなツールを100日間にわたり制作・公開していく取り組みを行っています。

プロジェクトの詳細や他のツールについては、以下のページをご覧ください。

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
