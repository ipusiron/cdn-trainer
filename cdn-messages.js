const CdnMessages = (() => {
  'use strict';

  // Keep all generated UI text here. A second language can be added alongside ja.
  const dictionaries = {
    ja: {
      'scenario.app-domain.long': 'アプリ層攻撃（SQLインジェクションなど）をドメイン経由で送る',
      'scenario.app-domain.short': 'アプリ層・ドメイン経由',
      'scenario.flood-domain.long': '大量のリクエスト（DDoS）をドメイン経由で送る',
      'scenario.flood-domain.short': '大量・ドメイン経由',
      'scenario.app-direct.long': 'オリジンのIPアドレスを突き止め、CDNを通さずにアプリ層攻撃を送る',
      'scenario.app-direct.short': 'アプリ層・オリジン直撃',
      'scenario.flood-direct.long': 'オリジンのIPアドレスへ、CDNを通さずに大量のリクエストを送る',
      'scenario.flood-direct.short': '大量・オリジン直撃',
      'result.cdn': 'CDNが吸収',
      'result.ip': 'IP制限が遮断',
      'result.waf': 'WAFが遮断',
      'result.reached.app': 'オリジンに届いた',
      'result.reached.flood': 'オリジンが過負荷',
      'cell.cdn': 'CDN',
      'cell.ip': 'IP制限',
      'cell.waf': 'WAF',
      'cell.reached': '届く💥',
      'cell.on': '✅',
      'cell.off': '❌',
      'cell.score': '{n}/4',
      'cell.users.true': '届く',
      'cell.users.false': '届かない',
      'level.best': '最高',
      'level.high': '高い',
      'level.low': '低い',
      'level.worst': '最低',
      'level.misconfig': '構成ミス',
      'score': '防げた攻撃：{n}/4',
      'users.true': '正規の利用者：届く',
      'users.false': '正規の利用者：届かない',
      'explanation.1': 'CDNが無効なのに、オリジン側で『CDNのIPアドレスだけ許可』にしています。'
        + '攻撃はすべて止まりますが、正規の利用者も届かないため、サービスとして成り立ちません。',
      'explanation.2': 'CDNはリクエストの中身を検査しないため、SQLインジェクションなどのアプリ層攻撃はそのまま通ります。',
      'explanation.3': '大量のリクエストを吸収する層がなく、オリジンが過負荷になります。'
        + 'CDNが無効なので、ドメイン経由とオリジン直撃は同じ道です。',
      'explanation.4': 'オリジンのIPアドレスが知られると、CDNを迂回して直接攻撃されます。'
        + 'オリジン側でCDN以外からの接続を断つ（IP制限）と防げます。',
      'explanation.5': '4つの攻撃をすべて止め、正規の利用者も届く構成です。',
      'assumption.1': 'ドメイン経由は、攻撃者→CDN（有効時）→オリジン側の入口（IP制限）→WAF→Originの順である。',
      'assumption.2': 'オリジン直撃（CDNバイパス）は、攻撃者→オリジン側の入口（IP制限）→WAF→Originの順で、CDNを通らない。',
      'assumption.3': 'WAFはオリジンの手前に置く（ロードバランサーなどに付けるWAF）。',
      'assumption.4': 'IP制限は、オリジン側の入口でCDNのIPアドレスからの接続だけを許可する。',
      'assumption.5': 'CDNは大量のリクエストを吸収するが、アプリ層攻撃の中身は検査しない。'
        + 'WAFはアプリ層攻撃を止めるが、大量のリクエストは吸収しない。',
      'assumption.6': 'CDNが無効なら、ドメインはオリジンを直接指す。',
      'node.client': '攻撃者',
      'node.cdn': 'CDN',
      'node.ip': 'IP制限',
      'node.waf': 'WAF',
      'node.origin': 'Origin',
      'node.disabled': '無効',
      'icon.client': '👤',
      'icon.cdn': '☁️',
      'icon.ip': '🚧',
      'icon.waf': '🧱',
      'icon.origin': '🖥',
      'icon.attack': '🔥',
      'icon.blocked': '🛡',
      'icon.reached': '💥',
      'ui.replay': '攻撃を再生',
      'ui.replayTip': '同じ構成とシナリオで、攻撃のアニメーションをもう一度流します。',
      'ui.config': '防御の構成',
      'ui.scenario': '攻撃のシナリオ',
      'ui.assumptions': 'この図の前提',
      'ui.diagram': '構成図',
      'ui.diagramDescription': '選んだ攻撃がどの関門を通り、どこで止まるかを表示します。',
      'ui.diagramLabel': '{scenario}：{result}',
      'ui.diagnosis': '診断コメント',
      'ui.diagnosisDescription': '4つの攻撃への防御と、正規の利用者が届くかを表示します。',
      'ui.patternShow': '一覧を表示',
      'ui.patternHide': '一覧を隠す',
      'ui.patternTitle': '8パターンのセキュリティ評価一覧',
      'ui.patternTip': '8構成の攻撃結果と正規の利用者の到達可否を比較できます。',
      'ui.tableRegion': '8パターンの評価一覧（横にスクロールできます）',
      'ui.tableBlocked': '防げた',
      'ui.tableUsers': '利用者',
      'ui.tableLevel': 'レベル',
      'ui.dark': 'ダークモードに切り替え',
      'ui.light': 'ライトモードに切り替え',
      'ui.helpOpen': 'ヘルプを表示',
      'ui.helpClose': '閉じる',
      'ui.helpTitle': 'CDN Trainerヘルプ',
      'help.aboutTitle': 'このツールについて',
      'help.about': 'CDN・WAF・IP制限の役割と、攻撃が通る経路を学ぶツールです。',
      'help.usageTitle': '使い方',
      'help.usage.1': '構成とシナリオを選ぶ。',
      'help.usage.2': '図と診断を見る。攻撃を再生すると同じ状態でもう一度確認できる。',
      'help.usage.3': '一覧を開き、8つの構成を比べる。',
      'help.scenariosTitle': '4つのシナリオ',
      'help.assumptionsTitle': '前提',
      'help.levelsTitle': 'レベルの基準',
      'help.level.misconfig': '構成ミス：正規の利用者が届かない。防げた数よりも優先する。',
      'help.level.best': '最高：4つの攻撃を防ぎ、正規の利用者も届く。',
      'help.level.high': '高い：3つの攻撃を防ぎ、正規の利用者も届く。',
      'help.level.low': '低い：1つまたは2つの攻撃を防ぎ、正規の利用者も届く。',
      'help.level.worst': '最低：攻撃を1つも防げない。',
      'help.learningTitle': '学習のポイント',
      'help.learning.1': 'CDNだけではアプリ層攻撃は止まらない。',
      'help.learning.2': 'オリジンのIPアドレスが知られるとCDNを迂回される。',
      'help.learning.3': 'CDNなしのIP制限は構成ミスである。',
      'tip.cdn': '大量のリクエストを吸収します。このモデルではアプリ層攻撃の中身を検査しません。',
      'tip.waf': 'オリジンの手前でアプリ層攻撃を止めます。このモデルでは大量のリクエストを吸収しません。',
      'tip.iplimit': 'オリジン側でCDNのIPアドレスからの接続だけを許可します。CDNが無効なら正規の利用者も届きません。'
    }
  };

  function t(key, params = {}) {
    const dictionary = dictionaries.ja;
    if (!Object.hasOwn(dictionary, key)) throw new Error(`Unknown message key: ${key}`);
    return dictionary[key].replace(/\{(\w+)\}/g, (match, name) =>
      Object.hasOwn(params, name) ? String(params[name]) : match
    );
  }

  return Object.freeze({ t, keys: Object.freeze(Object.keys(dictionaries.ja)) });
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CdnMessages;
}
