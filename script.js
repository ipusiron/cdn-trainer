function selectPreset(index) {
  const diagramBox = document.getElementById('diagram');
  const diagnosisBox = document.getElementById('diagnosis');

  const presets = [
    {
      name: '安全な構成',
      svg: `
<svg width="100%" height="100" xmlns="http://www.w3.org/2000/svg">
  <text x="20" y="50">👤 Client</text>
  <line x1="80" y1="45" x2="140" y2="45" stroke="black" />
  <text x="150" y="50">☁️ CDN</text>
  <line x1="210" y1="45" x2="270" y2="45" stroke="black" />
  <text x="280" y="50">🧱 WAF</text>
  <line x1="340" y1="45" x2="400" y2="45" stroke="black" />
  <text x="410" y="50">🖥 Origin</text>
</svg>
    `,
      diagnosis: `
✅ この構成は比較的安全です。

- CDNを通してトラフィックを処理するため、直接攻撃が困難です。
- WAFがONで、アプリ層攻撃にも対応。
- OriginサーバーはCDNのIP範囲からのみアクセスを許可しています。

→ 改善点は特にありませんが、継続的な監視は重要です。
    `,
    },
    {
      name: 'やや不安な構成',
      svg: `
<svg width="100%" height="100" xmlns="http://www.w3.org/2000/svg">
  <text x="20" y="50">👤 Client</text>
  <line x1="80" y1="45" x2="140" y2="45" stroke="black" />
  <text x="150" y="50">☁️ CDN</text>
  <line x1="210" y1="45" x2="270" y2="45" stroke="black" />
  <text x="280" y="50">🖥 Origin</text>
</svg>
    `,
      diagnosis: `
⚠️ CDNは導入されていますが、いくつかリスクがあります。

- WAFが無効なため、XSSやSQLiなどのアプリ層攻撃が通過します。
- Origin Serverが世界中に公開されており、CDNバイパスの可能性があります。

→ WAFの有効化とIP制限の設定を検討しましょう。
    `,
    },
    {
      name: '危険な構成',
      svg: `
<svg width="100%" height="100" xmlns="http://www.w3.org/2000/svg">
  <text x="20" y="50">👤 Client</text>
  <line x1="80" y1="45" x2="140" y2="45" stroke="red" stroke-dasharray="5,5"/>
  <text x="150" y="50">🖥 Origin</text>
</svg>
    `,
      diagnosis: `
❌ 非常に危険な構成です。

- 全てのアクセスが直接Originに届くため、DDoSやスキャンの対象になります。
- WAFやCDNによる防御が存在しません。
- 攻撃者から見て「開かれたサーバー」となっています。

→ 最低限、CDN＋WAFの導入とIP制限を行ってください。
    `,
    },
  ];

  const preset = presets[index];
  if (preset) {
    diagramBox.innerHTML = preset.svg;
    diagnosisBox.innerHTML = preset.diagnosis.replace(/\n/g, '<br>');
  }
}
