const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
const readVariables = (selector) => {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0);
  return Object.fromEntries([...css.slice(start, css.indexOf('}', start)).matchAll(/--([\w-]+):\s*(#[\da-f]{6});/gi)]
    .map((match) => [match[1], match[2]]));
};
const light = readVariables(':root');
const dark = { ...light, ...readVariables('body.dark-mode') };
const pairs = [
  ['header and table headings', 'header-text', 'header-bg'],
  ['body', 'text', 'page-bg'],
  ['replay button', 'button-text', 'button-bg'],
  ['footer link', 'link', 'page-bg'],
  ['footer', 'muted', 'page-bg'],
  ['diagnosis', 'text', 'diagnosis-bg'],
  ['tooltip', 'tooltip-text', 'tooltip-bg'],
  ['diagram text', 'text', 'panel-bg'],
  ['disabled node', 'disabled', 'panel-bg'],
  ['reached label', 'reached', 'panel-bg'],
  ['blocked label', 'blocked', 'panel-bg'],
  ['best row', 'text', 'best-bg'],
  ['high row', 'text', 'high-bg'],
  ['low row', 'text', 'low-bg'],
  ['worst row', 'text', 'worst-bg'],
  ['misconfiguration row', 'text', 'misconfig-bg']
];

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((byte) => parseInt(byte, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function ratio(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

for (const [theme, variables] of [['light', light], ['dark', dark]]) {
  for (const [name, foreground, background] of pairs) {
    test(`J-1 ${theme}: ${name} >= 4.5:1`, () => {
      assert.ok(variables[foreground] && variables[background], name);
      const value = ratio(variables[foreground], variables[background]);
      assert.ok(value >= 4.5, `${name}: ${value}`);
    });
  }
  test(`J-3 ${theme}: focus contrast >= 3:1`, () => {
    for (const background of ['page-bg', 'panel-bg', 'button-bg', 'diagnosis-bg']) {
      assert.ok(ratio(variables.focus, variables[background]) >= 3, background);
    }
    assert.ok(ratio(variables['header-text'], variables['header-bg']) >= 3);
  });
}
