function evaluateConfig() {
  const cdn = document.getElementById("cdn").checked;
  const waf = document.getElementById("waf").checked;
  const iplimit = document.getElementById("iplimit").checked;

  const diagram = document.getElementById("diagram");
  const diagnosis = document.getElementById("diagnosis");

  // SVG構成図の構築
  let svg = `<svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
    <text x="20" y="50">👤 Client</text>`;

  let x = 80;
  let components = [];
  
  if (cdn) {
    svg += `<line x1="${x}" y1="45" x2="${x + 60}" y2="45" stroke="black" />`;
    svg += `<text x="${x + 70}" y="50">☁️ CDN</text>`;
    components.push({type: 'cdn', x: x + 70});
    x += 130;
  }
  if (waf) {
    svg += `<line x1="${x}" y1="45" x2="${x + 60}" y2="45" stroke="black" />`;
    svg += `<text x="${x + 70}" y="50">🧱 WAF</text>`;
    components.push({type: 'waf', x: x + 70});
    x += 130;
  }
  svg += `<line x1="${x}" y1="45" x2="${x + 60}" y2="45" stroke="black" />`;
  svg += `<text x="${x + 70}" y="50">🖥 Origin</text>`;
  let originX = x + 70;
  
  // IP制限の視覚的表現
  if (iplimit) {
    svg += `<rect x="${originX - 10}" y="30" width="80" height="40" stroke="red" stroke-width="2" fill="none" stroke-dasharray="5,5" />`;
    svg += `<text x="${originX}" y="85" font-size="12" fill="red">IP制限</text>`;
  }

  // 💥攻撃アニメーションの初期位置
  svg += `<text id="attack-fire" x="20" y="90" fill="red">💥</text></svg>`;

  diagram.innerHTML = svg;

  // SVG内アニメーション処理
  const fire = document.getElementById("attack-fire");
  let currentX = 20;
  let stopX = originX;

  // 防御構成によって停止位置を調整
  if (components.length > 0) {
    // 最初の防御コンポーネントで止める
    stopX = components[0].x - 10;
  } else if (!iplimit) {
    // 防御なし＆IP制限なしなら完全通過
    stopX = originX + 100;
  }

  function animateFire() {
    if (!fire) return;
    currentX += 4;
    fire.setAttribute("x", currentX);
    if (currentX < stopX) {
      requestAnimationFrame(animateFire);
    } else {
      fire.textContent = "🛡";

      // ブロック位置のラベル表示を追加
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", currentX);
      label.setAttribute("y", 120);
      label.setAttribute("fill", "black");
      label.setAttribute("font-size", "14");
      label.setAttribute("dominant-baseline", "text-before-edge");
      label.setAttribute("text-anchor", "middle");
      if (components.length > 0) {
        const blockedBy = components[0].type;
        label.textContent = blockedBy === 'cdn' ? "CDNでブロック" : "WAFでブロック";
      } else if (iplimit) {
        label.textContent = "IP制限でブロック";
        // IP制限のみの場合は盾アイコンを下にずらす
        fire.setAttribute("y", "110");
      }
      fire.parentNode.appendChild(label); // ブロック演出に切り替え
    }
  }
  animateFire();

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

  if (!cdn && !waf) {
    comment += `<br>・CDNとWAFが無効のため、攻撃が直接Originへ届きます。`;
  } else if (!cdn) {
    comment += `<br>・CDNが無効ですが、WAFで防御されています。`;
  } else if (!waf) {
    comment += `<br>・WAFが無効のため、Originに直接アクセスされた場合はアプリ層攻撃を防げません。`;
  }
  if (!iplimit) comment += `<br>・IP制限がないため、誰でもOriginにアクセス可能です。`;

  diagnosis.innerHTML = comment;
}

// パターン一覧表のトグル機能
document.getElementById('patternToggle').addEventListener('change', function() {
  const tableSection = document.getElementById('patternTableSection');
  if (this.checked) {
    tableSection.classList.add('show');
  } else {
    tableSection.classList.remove('show');
  }
});
