const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const messages = require('../cdn-messages.js');

test('B-3 required keys exist and every message is a nonempty string', () => {
  const required = [
    ...['app-domain', 'flood-domain', 'app-direct', 'flood-direct'].flatMap((id) =>
      ['long', 'short'].map((length) => `scenario.${id}.${length}`)),
    ...['cdn', 'ip', 'waf', 'reached.app', 'reached.flood'].map((id) => `result.${id}`),
    ...['cdn', 'ip', 'waf', 'reached'].map((id) => `cell.${id}`),
    ...['best', 'high', 'low', 'worst', 'misconfig'].map((id) => `level.${id}`),
    'score', 'users.true', 'users.false',
    ...[1, 2, 3, 4, 5].map((n) => `explanation.${n}`),
    ...[1, 2, 3, 4, 5, 6].map((n) => `assumption.${n}`),
    'ui.replay', 'ui.patternShow', 'ui.patternHide', 'ui.dark', 'ui.light', 'ui.helpOpen', 'ui.helpClose'
  ];
  for (const key of [...required, ...messages.keys]) {
    assert.equal(typeof messages.t(key), 'string', key);
    assert.ok(messages.t(key).trim().length > 0, key);
  }
});

test('unknown keys throw; score and multi-parameter substitutions work', () => {
  assert.throws(() => messages.t('missing'), /Unknown message key/);
  assert.throws(() => messages.t('toString'), /Unknown message key/);
  assert.equal(messages.t('score', { n: 3 }), '防げた攻撃：3/4');
  assert.equal(messages.t('cell.score', { n: 0 }), '0/4');
  assert.equal(messages.t('ui.diagramLabel', { scenario: 'A', result: 'B' }), 'A：B');
});

test('shield, desktop and cloud icons explicitly select emoji presentation', () => {
  const needsEmoji = new Set([0x1f6e1, 0x1f5a5, 0x2601]);
  for (const key of messages.keys.filter((name) => name.startsWith('icon.'))) {
    const points = Array.from(messages.t(key), (character) => character.codePointAt(0));
    points.forEach((point, index) => {
      if (needsEmoji.has(point)) assert.equal(points[index + 1], 0xfe0f, key);
    });
  }
  for (const [key, point] of [['blocked', 0x1f6e1], ['origin', 0x1f5a5], ['cdn', 0x2601]]) {
    assert.equal(messages.t(`icon.${key}`), String.fromCodePoint(point, 0xfe0f));
  }
});

test('model and UI have no Japanese literals outside comments', () => {
  const ranges = [[0x3040, 0x30ff], [0x4e00, 0x9fff], [0xff01, 0xff60]];
  const pattern = new RegExp(`[${ranges.map(([start, end]) => `${String.fromCodePoint(start)}-${String.fromCodePoint(end)}`).join('')}]`, 'u');
  for (const file of ['cdn-model.js', 'script.js']) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
    assert.doesNotMatch(source, pattern, file);
    assert.doesNotMatch(source, /[\u{1f000}-\u{1ffff}\u2600-\u27bf]/u, file);
  }
});

test('dictionary also runs as a DOM-free classic script', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../cdn-messages.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(context), []);
  assert.equal(vm.runInContext("CdnMessages.t('cell.score', {n:4})", context), '4/4');
});
