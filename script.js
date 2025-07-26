function evaluateConfig() {
  const cdn = document.getElementById('cdn').checked;
  const waf = document.getElementById('waf').checked;
  const iplimit = document.getElementById('iplimit').checked;

  const diagram = document.getElementById('diagram');
  const diagnosis = document.getElementById('diagnosis');

  // SVG構成図の構築
  let svg = `<svg width="100%" height="100" xmlns="http://www.w3.org/2000/svg">
    <text x="20" y="50">👤 Client</text>`;

  let x = 80;
  if (cdn) {
    svg += `<line x1="${x}" y1="45" x2="${x + 60}" y2="45" stroke="black" />`;
    svg += `<text x="${x + 70}" y="50">☁️ CDN</text>`;
    x += 130;
  }
  if (waf) {
    svg += `<line x1="${x}" y1="45" x2="${x + 60}" y2="45" stroke="black" />`;
    svg += `<text x="${x + 70}" y="50">🧱 WAF</text>`;
    x += 130;
  }
  svg += `<line x1="${x}" y1="45" x2="${x + 60}" y2="45" stroke="black" />`;
  svg += `<text x="${x + 70}" y="50">🖥 Origin</text></svg>`;

  diagram.innerHTML = svg;

  // 評価ロジック
  let score = 0;
  if (cdn) score += 1;
  if (waf) score += 1;
  if (iplimit) score += 1;

  let comment = `セキュリティ評価：${score}/3（CDN・WAF・IP制限の3項目で判定）<br>`;

  if (score === 3) {
    comment += `セキュリティレベル：最高<br><br>`;
    comment += `✅ 安全性の高い構成です。複数の防御レイヤーが有効化されています。<br>`;
  } else if (score === 2) {
    comment += `セキュリティレベル：高い<br><br>`;
    comment += `⚠️ 構成には一部リスクがあります。追加の防御が推奨されます。<br>`;
  } else if (score === 1) {
    comment += `セキュリティレベル：低い<br><br>`;
    comment += `⚠️ 複数の重要な防御が無効になっています。構成の見直しを推奨します。<br>`;
  } else {
    comment += `セキュリティレベル：最低<br><br>`;
    comment += `❌ 危険な構成です。CDN/WAF/IP制限を検討してください。<br>`;
  }

  if (!cdn)
    comment += `<br>・CDNが無効のため、トラフィックが直接Originへ届きます。`;
  if (!waf) comment += `<br>・WAFが無効のため、アプリ層攻撃を防げません。`;
  if (!iplimit)
    comment += `<br>・IP制限がないため、誰でもOriginにアクセス可能です。`;

  diagnosis.innerHTML = comment;
}
