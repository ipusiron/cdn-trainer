const CdnMessages = (() => {
  'use strict';

  const LANGUAGES = Object.freeze(['ja', 'en']);

  // Keep all generated UI text here. Every key exists in both dictionaries; i18n.js selects the language.
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
      'icon.origin': '🖥️',
      'icon.attack': '🔥',
      'icon.blocked': '🛡️',
      'icon.reached': '💥',
      'app.title': 'CDN Trainer - セキュアなCDN構成を学べる体験型ツール',
      'app.subtitle.1': '攻撃者から見えるサーバーの姿とは？',
      'app.subtitle.2': 'CDN・WAF・オリジン構成の違いを体験しながら学べます。',
      'ui.langButton': 'EN',
      'ui.langAria': 'English',
      'ui.customConfig': '🛠 カスタム構成モード',
      'ui.enableCdn': 'CDNを有効にする',
      'ui.enableWaf': 'WAFを有効にする',
      'ui.enableIplimit': 'OriginにIP制限をかける',
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
      'tip.iplimit': 'オリジン側でCDNのIPアドレスからの接続だけを許可します。CDNが無効なら正規の利用者も届きません。',
      'footer.github': '🔗 GitHubリポジトリーはこちら（',
      'footer.close': '）'
    },
    en: {
      'scenario.app-domain.long': 'Send an application-layer attack, such as SQL injection, through the domain',
      'scenario.app-domain.short': 'App layer, via domain',
      'scenario.flood-domain.long': 'Send a flood of requests (DDoS) through the domain',
      'scenario.flood-domain.short': 'Flood, via domain',
      'scenario.app-direct.long': 'Find the origin IP address and send an application-layer attack to it, bypassing the CDN',
      'scenario.app-direct.short': 'App layer, straight to origin',
      'scenario.flood-direct.long': 'Send a flood of requests to the origin IP address, bypassing the CDN',
      'scenario.flood-direct.short': 'Flood, straight to origin',
      'result.cdn': 'Absorbed by the CDN',
      'result.ip': 'Blocked by the IP restriction',
      'result.waf': 'Blocked by the WAF',
      'result.reached.app': 'Reached the origin',
      'result.reached.flood': 'The origin is overloaded',
      'cell.cdn': 'CDN',
      'cell.ip': 'IP',
      'cell.waf': 'WAF',
      'cell.reached': 'Reaches💥',
      'cell.on': '✅',
      'cell.off': '❌',
      'cell.score': '{n}/4',
      'cell.users.true': 'Reach',
      'cell.users.false': 'Blocked',
      'level.best': 'Best',
      'level.high': 'High',
      'level.low': 'Low',
      'level.worst': 'Worst',
      // Kept short: the level column is nowrap, and a longer word pushes the table into scrolling.
      'level.misconfig': 'Misconfig',
      'score': 'Attacks blocked: {n}/4',
      'users.true': 'Legitimate users: reach the origin',
      'users.false': 'Legitimate users: blocked',
      'explanation.1': 'The CDN is disabled, yet the origin still admits the CDN IP addresses only. '
        + 'Every attack stops, but legitimate users are shut out as well, so the service cannot run.',
      'explanation.2': 'A CDN does not inspect the contents of a request, so application-layer attacks '
        + 'such as SQL injection pass straight through.',
      'explanation.3': 'Nothing absorbs the flood of requests, so the origin is overloaded. '
        + 'With the CDN disabled, the domain route and the direct route are the same road.',
      'explanation.4': 'Once the origin IP address is known, an attacker bypasses the CDN and hits the origin directly. '
        + 'Refusing connections from anywhere but the CDN (an IP restriction) prevents this.',
      'explanation.5': 'This configuration stops all four attacks and still lets legitimate users reach the origin.',
      'assumption.1': 'Traffic through the domain travels attacker to CDN (when enabled) to the origin entrance '
        + '(IP restriction) to the WAF to the origin.',
      'assumption.2': 'Traffic straight to the origin (a CDN bypass) travels attacker to the origin entrance '
        + '(IP restriction) to the WAF to the origin, never touching the CDN.',
      'assumption.3': 'The WAF sits immediately in front of the origin, for example on a load balancer.',
      'assumption.4': 'The IP restriction at the origin entrance admits connections from the CDN IP addresses only.',
      'assumption.5': 'The CDN absorbs floods of requests but does not inspect the contents of application-layer attacks. '
        + 'The WAF stops application-layer attacks but does not absorb floods of requests.',
      'assumption.6': 'When the CDN is disabled, the domain points straight at the origin.',
      'node.client': 'Attacker',
      'node.cdn': 'CDN',
      'node.ip': 'IP limit',
      'node.waf': 'WAF',
      'node.origin': 'Origin',
      'node.disabled': 'Disabled',
      'icon.client': '👤',
      'icon.cdn': '☁️',
      'icon.ip': '🚧',
      'icon.waf': '🧱',
      'icon.origin': '🖥️',
      'icon.attack': '🔥',
      'icon.blocked': '🛡️',
      'icon.reached': '💥',
      'app.title': 'CDN Trainer - Interactive tool for learning secure CDN configurations',
      'app.subtitle.1': 'What does your server look like to an attacker?',
      'app.subtitle.2': 'Try CDN, WAF and origin configurations for yourself and see how they differ.',
      'ui.langButton': 'JA',
      'ui.langAria': '日本語',
      'ui.customConfig': '🛠 Custom configuration',
      'ui.enableCdn': 'Enable the CDN',
      'ui.enableWaf': 'Enable the WAF',
      'ui.enableIplimit': 'Restrict the origin by IP address',
      'ui.replay': 'Replay the attack',
      'ui.replayTip': 'Plays the attack animation again with the same configuration and scenario.',
      'ui.config': 'Defenses',
      'ui.scenario': 'Attack scenario',
      'ui.assumptions': 'Assumptions behind this diagram',
      'ui.diagram': 'Configuration diagram',
      'ui.diagramDescription': 'Shows which gates the selected attack passes and where it stops.',
      'ui.diagramLabel': '{scenario}: {result}',
      'ui.diagnosis': 'Diagnosis',
      'ui.diagnosisDescription': 'Shows how the four attacks fare and whether legitimate users reach the origin.',
      'ui.patternShow': 'Show the table',
      'ui.patternHide': 'Hide the table',
      'ui.patternTitle': 'Security rating of the eight configurations',
      'ui.patternTip': 'Compares the attack results and legitimate-user access of the eight configurations.',
      'ui.tableRegion': 'Ratings of the eight configurations (scrolls sideways)',
      'ui.tableBlocked': 'Blocked',
      'ui.tableUsers': 'Users',
      'ui.tableLevel': 'Level',
      'ui.dark': 'Switch to dark mode',
      'ui.light': 'Switch to light mode',
      'ui.helpOpen': 'Show help',
      'ui.helpClose': 'Close',
      'ui.helpTitle': 'CDN Trainer help',
      'help.aboutTitle': 'About this tool',
      'help.about': 'A tool for learning what a CDN, a WAF and an IP restriction do, and which route an attack takes.',
      'help.usageTitle': 'How to use it',
      'help.usage.1': 'Choose a configuration and a scenario.',
      'help.usage.2': 'Read the diagram and the diagnosis. Replaying the attack shows the same state again.',
      'help.usage.3': 'Open the table and compare the eight configurations.',
      'help.scenariosTitle': 'The four scenarios',
      'help.assumptionsTitle': 'Assumptions',
      'help.levelsTitle': 'How the levels are decided',
      'help.level.misconfig': 'Misconfig: legitimate users cannot reach the origin. This outweighs the number blocked.',
      'help.level.best': 'Best: all four attacks are blocked and legitimate users reach the origin.',
      'help.level.high': 'High: three attacks are blocked and legitimate users reach the origin.',
      'help.level.low': 'Low: one or two attacks are blocked and legitimate users reach the origin.',
      'help.level.worst': 'Worst: not one attack is blocked.',
      'help.learningTitle': 'Points to take away',
      'help.learning.1': 'A CDN on its own does not stop application-layer attacks.',
      'help.learning.2': 'Once the origin IP address is known, the CDN can be bypassed.',
      'help.learning.3': 'An IP restriction without a CDN is a misconfiguration.',
      'tip.cdn': 'Absorbs floods of requests. In this model it does not inspect the contents of application-layer attacks.',
      'tip.waf': 'Stops application-layer attacks in front of the origin. In this model it does not absorb floods.',
      'tip.iplimit': 'Admits connections to the origin from the CDN IP addresses only. '
        + 'With the CDN disabled, legitimate users are shut out too.',
      'footer.github': '🔗 GitHub repository (',
      'footer.close': ')'
    }
  };

  let language = 'ja';

  function getLanguage() {
    return language;
  }

  function setLanguage(value) {
    if (!LANGUAGES.includes(value)) throw new RangeError(`Unknown language: ${value}`);
    language = value;
    return language;
  }

  function t(key, params = {}) {
    const dictionary = dictionaries[language];
    if (!Object.hasOwn(dictionary, key)) throw new Error(`Unknown message key: ${key}`);
    return dictionary[key].replace(/\{(\w+)\}/g, (match, name) =>
      Object.hasOwn(params, name) ? String(params[name]) : match
    );
  }

  return Object.freeze({
    LANGUAGES, dictionaries, t, getLanguage, setLanguage, keys: Object.freeze(Object.keys(dictionaries.ja))
  });
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CdnMessages;
}
