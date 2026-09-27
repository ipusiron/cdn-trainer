const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const messages = require('../cdn-messages.js');
const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const script = read('script.js');
const i18nSource = read('i18n.js');
const japanese = /[぀-ヿ一-鿿！-｠]/u;
const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
// B-2 deliberately names the target language in its own script, so this key keeps Japanese in English.
const LANGUAGE_NAME_KEYS = new Set(['ui.langAria']);
// Their text or attributes follow interactive state, so data-i18n would roll that state back.
const STATE_DRIVEN_IDS = new Set(['darkModeToggle']);
const STATE_DRIVEN_CLASSES = new Set(['toggle-label']);

// The dictionary and i18n.js are classic scripts; a shared context stands in for the browser.
function load(overrides = {}) {
  const context = vm.createContext({ URLSearchParams, Event, ...overrides });
  return vm.runInContext(`${read('cdn-messages.js')}\n${i18nSource}\n({ CdnMessages, CdnI18n });`, context);
}

class FakeElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.attributes = {};
    this.dataset = {};
    this.textContent = '';
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name.startsWith('data-')) {
      this.dataset[name.slice(5).replace(/-([a-z])/g, (whole, letter) => letter.toUpperCase())] = String(value);
    }
  }
  getAttribute(name) {
    return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
  }
}

function fakeDocument(nodes) {
  const document = new EventTarget();
  document.documentElement = { lang: 'ja' };
  document.querySelectorAll = (selector) => nodes.filter((node) => node.getAttribute(selector.slice(1, -1)) !== null);
  return document;
}

test('the two dictionaries share every key and placeholder, and English keeps no stray Japanese', () => {
  assert.deepEqual(messages.LANGUAGES, ['ja', 'en']);
  const ja = messages.dictionaries.ja;
  const en = messages.dictionaries.en;
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ja).sort());
  assert.deepEqual(messages.keys, Object.keys(ja));
  for (const [key, value] of Object.entries(en)) {
    assert.equal(typeof value, 'string', key);
    assert.ok(value.trim().length > 0, key);
    assert.deepEqual(placeholders(value), placeholders(ja[key]), key);
    if (!LANGUAGE_NAME_KEYS.has(key)) assert.doesNotMatch(value, japanese, key);
  }
  for (const key of LANGUAGE_NAME_KEYS) assert.match(en[key], japanese, key);
  assert.equal(en['ui.langButton'], 'JA');
  assert.equal(ja['ui.langButton'], 'EN');
});

test('every key the page and the scripts ask for exists in both dictionaries', () => {
  const asked = new Set();
  for (const [, key] of html.matchAll(/data-i18n(?:-(?:aria-label|title|placeholder|alt))?="([^"]+)"/g)) asked.add(key);
  for (const source of [script, i18nSource]) {
    for (const [, key] of source.matchAll(/\bt\(\s*'([^']+)'/g)) asked.add(key);
  }
  assert.ok(asked.size >= 40, `keys referenced: ${asked.size}`);
  for (const key of asked) {
    for (const language of messages.LANGUAGES) assert.ok(Object.hasOwn(messages.dictionaries[language], key), `${language}: ${key}`);
  }
  // Template keys such as `assumption.${n}` are covered by the families the UI builds.
  for (const family of [
    ...[1, 2, 3, 4, 5, 6].map((n) => `assumption.${n}`), ...[1, 2, 3].map((n) => `help.usage.${n}`),
    ...[1, 2, 3].map((n) => `help.learning.${n}`), ...[1, 2, 3, 4, 5].map((n) => `explanation.${n}`),
    ...['misconfig', 'best', 'high', 'low', 'worst'].map((level) => `help.level.${level}`)
  ]) for (const language of messages.LANGUAGES) assert.ok(Object.hasOwn(messages.dictionaries[language], family), family);
});

test('data-i18n never sits on an element that owns child elements', () => {
  const owners = [...html.matchAll(/<([a-z][\w-]*)\b[^>]*\sdata-i18n="[^"]+"[^>]*>([\s\S]*?)<\/\1>/gi)];
  assert.ok(owners.length >= 20, `translated elements: ${owners.length}`);
  for (const [, tag, content] of owners) {
    assert.doesNotMatch(content, /</, `${tag} would lose its children when textContent is replaced`);
  }
});

test('state-driven text and attributes are kept out of data-i18n and redrawn on the language event', () => {
  const toggleLabel = html.match(/<span class="toggle-label"[^>]*>/)[0];
  assert.doesNotMatch(toggleLabel, /data-i18n/);
  const darkToggle = html.match(/<button[^>]*id="darkModeToggle"[^>]*>/)[0];
  assert.doesNotMatch(darkToggle, /data-i18n/);
  // The pattern toggle reads aria-expanded and the theme reads the class: never the displayed text.
  assert.match(script, /function renderPatternToggle\(\)[\s\S]*?getAttribute\('aria-expanded'\) === 'true'/);
  assert.match(script, /function updateThemeControl\(\)[\s\S]*?classList\.contains\('dark-mode'\)/);
  assert.doesNotMatch(script, /textContent ===|textContent\.includes|innerText/);
  const redraw = script.match(/function renderGenerated\(\) \{([\s\S]*?)\n\}/)[1];
  for (const call of ['renderStaticLists()', 'renderPatternToggle()', 'updateThemeControl()', 'renderCurrent()']) {
    assert.ok(redraw.includes(call), call);
  }
  assert.match(script, /document\.addEventListener\(CdnI18n\.EVENT, renderGenerated\)/);
  assert.match(script, /getElementById\('langToggle'\)\.addEventListener\('click', \(\) => CdnI18n\.toggle\(\)\)/);
});

test('the lists inside the hidden dialog and the collapsed assumptions are rebuilt, not left in the HTML', () => {
  const lists = script.match(/function renderStaticLists\(\) \{([\s\S]*?)\n\}/)[1];
  for (const id of ['diagramAssumptions', 'helpUsage', 'helpScenarios', 'helpAssumptions', 'helpLevels', 'helpLearning']) {
    assert.ok(lists.includes(`'${id}'`), id);
    assert.match(html, new RegExp(`id="${id}"\\s*>\\s*<`), `${id} starts empty in the HTML`);
  }
});

test('t interpolates, throws on unknown keys and rejects unknown languages', () => {
  const { CdnMessages } = load();
  assert.equal(CdnMessages.getLanguage(), 'ja');
  assert.equal(CdnMessages.t('score', { n: 2 }), '防げた攻撃：2/4');
  CdnMessages.setLanguage('en');
  assert.equal(CdnMessages.getLanguage(), 'en');
  assert.equal(CdnMessages.t('score', { n: 2 }), 'Attacks blocked: 2/4');
  assert.equal(CdnMessages.t('ui.diagramLabel', { scenario: 'A', result: 'B' }), 'A: B');
  assert.equal(CdnMessages.t('cell.score', { n: 0 }), '0/4');
  assert.equal(CdnMessages.t('score'), 'Attacks blocked: {n}/4', 'a missing parameter is left visible');
  assert.throws(() => CdnMessages.t('missing'), /Unknown message key/);
  assert.throws(() => CdnMessages.t('toString'), /Unknown message key/);
  // The script runs in its own realm, so the constructor differs; match the message instead.
  assert.throws(() => CdnMessages.setLanguage('xx'), /Unknown language: xx/);
  assert.throws(() => CdnMessages.setLanguage(null), /Unknown language/);
  assert.equal(messages.setLanguage.length, 1);
  try {
    assert.throws(() => messages.setLanguage('xx'), RangeError);
  } finally {
    messages.setLanguage('ja');
  }
  assert.equal(CdnMessages.getLanguage(), 'en', 'a rejected language leaves the current one alone');
});

test('the initial language prefers ?lang, then storage, then the navigator language', () => {
  let saved = null;
  const storage = {
    getItem: (key) => (key === 'cdn-trainer-language' ? saved : null),
    setItem: (key, value) => { assert.equal(key, 'cdn-trainer-language'); saved = value; }
  };
  const { CdnI18n } = load({ localStorage: storage });
  assert.equal(CdnI18n.STORAGE_KEY, 'cdn-trainer-language');
  for (const [search, navigatorLanguage, expected] of [
    ['?lang=en', 'ja-JP', 'en'], ['?lang=ja', 'en-US', 'ja'], ['', 'ja', 'ja'], ['', 'fr-FR', 'en'],
    ['?lang=xx', 'ja-JP', 'ja'], ['?lang=', 'ja-JP', 'ja'], ['?a=1&lang=en', 'ja', 'en']
  ]) assert.equal(CdnI18n.initialLanguage(search, navigatorLanguage), expected, search);
  CdnI18n.writeLanguage('en');
  assert.equal(CdnI18n.readLanguage(), 'en');
  assert.equal(CdnI18n.initialLanguage('', 'ja-JP'), 'en', 'storage beats the navigator language');
  assert.equal(CdnI18n.initialLanguage('?lang=ja', 'en'), 'ja', 'the query beats storage');
  CdnI18n.writeLanguage('xx');
  assert.equal(CdnI18n.readLanguage(), 'en', 'an invalid language is never written');
  saved = 'klingon';
  assert.equal(CdnI18n.readLanguage(), null, 'an unusable stored value is ignored');
  assert.equal(CdnI18n.initialLanguage('', 'ja-JP'), 'ja');
});

test('language storage is optional, including accessors that throw', () => {
  for (const storage of [
    undefined,
    { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } }
  ]) {
    const { CdnI18n } = load(storage === undefined ? {} : { localStorage: storage });
    assert.equal(CdnI18n.readLanguage(), null);
    assert.doesNotThrow(() => CdnI18n.writeLanguage('en'));
    assert.equal(CdnI18n.initialLanguage('?lang=en', 'ja'), 'en');
    assert.equal(CdnI18n.initialLanguage('', 'ja'), 'ja');
    assert.equal(CdnI18n.initialLanguage('', 'en-GB'), 'en');
  }
});

test('apply translates text and attributes in place, sets html lang and fires one event', () => {
  const heading = new FakeElement('h2');
  heading.setAttribute('data-i18n', 'ui.diagnosis');
  const tooltip = new FakeElement('span');
  tooltip.setAttribute('data-i18n', 'tip.cdn');
  const help = new FakeElement('button');
  help.setAttribute('data-i18n-aria-label', 'ui.helpOpen');
  help.setAttribute('data-i18n-title', 'ui.helpOpen');
  const checkbox = new FakeElement('input');
  checkbox.checked = true;
  const nodes = [heading, tooltip, help, checkbox];
  const document = fakeDocument(nodes);
  const { CdnMessages, CdnI18n } = load({ document, localStorage: { getItem: () => null, setItem: () => {} } });
  let events = 0;
  document.addEventListener(CdnI18n.EVENT, () => { events += 1; });
  CdnI18n.apply('en');
  assert.equal(document.documentElement.lang, 'en');
  assert.equal(heading.textContent, 'Diagnosis');
  assert.equal(tooltip.textContent, CdnMessages.dictionaries.en['tip.cdn']);
  assert.equal(help.getAttribute('aria-label'), 'Show help');
  assert.equal(help.getAttribute('title'), 'Show help');
  assert.equal(checkbox.checked, true, 'form state survives the switch');
  assert.equal(events, 1);
  CdnI18n.apply('ja');
  assert.equal(heading.textContent, '診断コメント');
  assert.equal(document.documentElement.lang, 'ja');
  assert.equal(events, 2);
  assert.throws(() => CdnI18n.apply('xx'), /Unknown language/);
  assert.equal(document.documentElement.lang, 'ja', 'a rejected language changes nothing');
  assert.equal(events, 2);
});

test('setLanguage and toggle store the choice, and init reads the query before the first render', () => {
  const store = new Map();
  const document = fakeDocument([]);
  const { CdnMessages, CdnI18n } = load({
    document,
    localStorage: { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) },
    location: { search: '?lang=en' },
    navigator: { language: 'ja-JP' }
  });
  assert.equal(CdnI18n.init(), 'en', 'the query wins over the Japanese navigator language');
  assert.equal(store.get('cdn-trainer-language'), undefined, 'init alone does not write storage');
  CdnI18n.toggle();
  assert.equal(CdnMessages.getLanguage(), 'ja');
  assert.equal(store.get('cdn-trainer-language'), 'ja');
  CdnI18n.toggle();
  assert.equal(CdnMessages.getLanguage(), 'en');
  assert.equal(store.get('cdn-trainer-language'), 'en');
  CdnI18n.setLanguage('ja');
  assert.equal(store.get('cdn-trainer-language'), 'ja');
});

test('i18n.js is a DOM-free classic script and keeps the language out of the UI storage budget', () => {
  const context = vm.createContext({});
  vm.runInContext(`${read('cdn-messages.js')}\n${i18nSource}`, context);
  assert.deepEqual(Object.keys(context), [], 'no globals leak into the page');
  // The two accesses script.test.js counts belong to the theme; the language is saved here instead.
  assert.doesNotMatch(script, /localStorage\.(?:getItem|setItem)\s*\(\s*['"]cdn-trainer-language/);
  assert.equal((i18nSource.match(/localStorage\.(?:getItem|setItem)\s*\(/g) || []).length, 2);
  const guarded = [...i18nSource.matchAll(/\btry\s*\{[\s\S]*?\}\s*catch\b/g)].map((match) => [match.index, match.index + match[0].length]);
  for (const access of i18nSource.matchAll(/localStorage\.(?:getItem|setItem)\s*\(/g)) {
    assert.ok(guarded.some(([start, end]) => access.index > start && access.index < end), 'every access is inside try/catch');
  }
  assert.doesNotMatch(i18nSource, japanese, 'the dictionary, not i18n.js, holds the text');
});

test('every Japanese string in the HTML is translated, bilingual, or redrawn from state', () => {
  const voids = new Set(['meta', 'link', 'input', 'br', 'hr', 'img']);
  const stack = [];
  let translated = 0;
  for (const token of html.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g)) {
    if (token.startsWith('<!')) continue;
    if (token.startsWith('</')) { stack.pop(); continue; }
    if (token.startsWith('<')) {
      const tag = token.match(/^<([\w-]+)/)[1].toLowerCase();
      const id = (token.match(/\sid="([^"]+)"/) || [])[1];
      for (const [, attribute, value] of token.matchAll(/\s(aria-label|title|placeholder|alt)="([^"]+)"/g)) {
        if (!japanese.test(value) || STATE_DRIVEN_IDS.has(id)) continue;
        assert.ok(token.includes(`data-i18n-${attribute}="`), `${attribute} on ${tag} needs data-i18n-${attribute}`);
      }
      if (!voids.has(tag)) stack.push(token);
      continue;
    }
    if (!japanese.test(token)) continue;
    const owner = stack.at(-1);
    if (/^<noscript\b/.test(owner)) continue;
    const className = (owner.match(/\sclass="([^"]+)"/) || [])[1] || '';
    if (className.split(/\s+/).some((name) => STATE_DRIVEN_CLASSES.has(name))) continue;
    assert.match(owner, /\sdata-i18n="[^"]+"/, `untranslated text: ${token.trim().slice(0, 40)}`);
    translated += 1;
  }
  assert.equal(stack.length, 0, 'the tags balance');
  assert.ok(translated >= 18, `translated text nodes: ${translated}`);
  // Only the toggle label itself is allowed to stay Latin in Japanese, as the target-language cue.
  assert.match(html, /<button[^>]*id="langToggle"[^>]*data-i18n="ui\.langButton"[^>]*>EN<\/button>/);
});
