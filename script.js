// 構成パターンの定義
const presets = [
  {
    name: "安全な構成",
    diagram: `
[Client]
   │
   ▼
[CDN]（有効）
   │
   ▼
[WAF]（ON）
   │
   ▼
[Origin Server]
※IP制限：CDNからのみ許可`,
    diagnosis: `
✅ この構成は比較的安全です。

- CDNを通してトラフィックを処理するため、直接攻撃が困難です。
- WAFがONで、アプリ層攻撃にも対応。
- OriginサーバーはCDNのIP範囲からのみアクセスを許可しています。

→ 改善点は特にありませんが、継続的な監視は重要です。
    `
  },
  {
    name: "やや不安な構成",
    diagram: `
[Client]
   │
   ▼
[CDN]（有効）
   │
   ▼
[Origin Server]
※WAFなし、IP制限なし`,
    diagnosis: `
⚠️ CDNは導入されていますが、いくつかリスクがあります。

- WAFが無効なため、XSSやSQLiなどのアプリ層攻撃が通過します。
- Origin Serverが世界中に公開されており、CDNバイパスの可能性があります。

→ WAFの有効化とIP制限の設定を検討しましょう。
    `
  },
  {
    name: "危険な構成",
    diagram: `
[Client]
   │
   ▼
[Origin Server]
※CDNなし、WAFなし、IP制限なし`,
    diagnosis: `
❌ 非常に危険な構成です。

- 全てのアクセスが直接Originに届くため、DDoSやスキャンの対象になります。
- WAFやCDNによる防御が存在しません。
- 攻撃者から見て「開かれたサーバー」となっています。

→ 最低限、CDN＋WAFの導入とIP制限を行ってください。
    `
  }
];

// 構成を選択したときの処理
function selectPreset(index) {
  const diagramBox = document.getElementById("diagram");
  const diagnosisBox = document.getElementById("diagnosis");

  if (presets[index]) {
    diagramBox.textContent = presets[index].diagram;
    diagnosisBox.innerHTML = presets[index].diagnosis.replace(/\n/g, "<br>");
  }
}
