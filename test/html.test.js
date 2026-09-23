const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const model = require('../cdn-model.js');
const messages = require('../cdn-messages.js');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const tags = [...html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)].map((match) => ({
  tag: match[1].toLowerCase(),
  attrs: Object.fromEntries([...match[2].matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map((entry) => [entry[1].toLowerCase(), entry[2] ?? entry[3]])),
  source: match[0]
}));
const byId = (id) => tags.find((tag) => tag.attrs.id === id);

test('strict CSP, referrer and noscript match H-1 and H-2', () => {
  const csp = tags.find((tag) => tag.tag === 'meta' && tag.attrs['http-equiv'] === 'Content-Security-Policy');
  assert.ok(csp);
  assert.deepEqual(csp.attrs.content.split(';').map((item) => item.trim()).filter(Boolean), [
    "default-src 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self' data:",
    "object-src 'none'", "base-uri 'none'", "form-action 'none'"
  ]);
  assert.doesNotMatch(csp.attrs.content, /unsafe-inline|unsafe-eval|frame-ancestors/);
  assert.equal(tags.find((tag) => tag.tag === 'meta' && tag.attrs.name === 'referrer').attrs.content, 'no-referrer');
  assert.match(html, /<noscript>このツールはJavaScriptを使います。<\/noscript>/);
});

test('three local classic scripts are loaded in H-7 order', () => {
  const scripts = tags.filter((tag) => tag.tag === 'script');
  assert.deepEqual(scripts.map((tag) => tag.attrs.src), ['cdn-messages.js', 'cdn-model.js', 'script.js']);
  scripts.forEach((tag) => assert.equal(tag.attrs.type, undefined));
  assert.doesNotMatch(html, /<script\b[^>]*>\s*\S[^<]*<\/script>/);
});

test('no inline styles or event handlers; external links have both rel protections', () => {
  for (const tag of tags) {
    assert.doesNotMatch(tag.source, /\s(?:style|on\w+)\s*=/i);
    if (tag.tag === 'a' && /^https?:/.test(tag.attrs.href)) {
      assert.deepEqual(tag.attrs.rel.split(/\s+/).sort(), ['noopener', 'noreferrer']);
    }
  }
});

test('main ids exist exactly once and every explicit label points to an element', () => {
  const ids = tags.map((tag) => tag.attrs.id).filter(Boolean);
  assert.equal(ids.length, new Set(ids).size);
  for (const id of [
    'cdn', 'waf', 'iplimit', 'replayButton', 'diagram', 'diagnosis', 'patternToggle',
    'patternTableSection', 'helpToggle', 'darkModeToggle', 'helpModal'
  ]) assert.ok(byId(id), id);
  tags.filter((tag) => tag.tag === 'label' && tag.attrs.for).forEach((tag) => assert.ok(byId(tag.attrs.for), tag.attrs.for));
});

test('scenario controls have the prescribed order, count and default', () => {
  const radios = tags.filter((tag) => tag.tag === 'input' && tag.attrs.name === 'scenario');
  assert.equal(radios.length, 4);
  assert.deepEqual(radios.map((tag) => tag.attrs.value), model.SCENARIOS.map((scenario) => scenario.id));
  assert.ok(radios.every((tag) => tag.attrs.type === 'radio'));
  assert.equal(radios.filter((tag) => /\schecked\b/.test(tag.source)).length, 1);
  assert.match(radios[0].source, /\schecked\b/);
});

test('dialog, status and table toggle use accessible semantics', () => {
  assert.equal(byId('helpModal').attrs.role, 'dialog');
  assert.equal(byId('helpModal').attrs['aria-modal'], 'true');
  assert.ok(byId(byId('helpModal').attrs['aria-labelledby']));
  assert.equal(byId('diagnosis').attrs.role, 'status');
  assert.equal(byId('diagnosis').attrs['aria-live'], 'polite');
  assert.equal(byId('patternToggle').tag, 'button');
  assert.equal(byId('patternToggle').attrs['aria-expanded'], 'false');
  assert.equal(byId('patternToggle').attrs['aria-controls'], 'patternTableSection');
  assert.match(byId('patternTableSection').source, /\shidden\b/);
  for (const id of ['helpToggle', 'darkModeToggle']) assert.ok(byId(id).attrs['aria-label']);
  assert.equal(byId('darkModeToggle').attrs['aria-pressed'], 'false');
  assert.ok(tags.filter((tag) => tag.tag === 'button').every((tag) => tag.attrs.type === 'button'));
});

test('table results are generated, and visible-text keys all resolve', () => {
  const tbody = /<tbody[^>]*>([\s\S]*?)<\/tbody>/.exec(html);
  assert.ok(tbody);
  assert.doesNotMatch(tbody[1], /<tr\b/);
  tags.filter((tag) => tag.attrs['data-message']).forEach((tag) => assert.ok(messages.t(tag.attrs['data-message'])));
});
