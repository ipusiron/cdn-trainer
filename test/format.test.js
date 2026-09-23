const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

const files = ['cdn-model.js', 'cdn-messages.js', 'script.js', 'style.css',
  ...fs.readdirSync(__dirname).map((name) => `test/${name}`)];
for (const file of files) {
  test(`line length at most 160: ${file}`, () => {
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => assert.ok(Array.from(line).length <= 160, `${file}:${index + 1}`));
  });
}

test('HTML line length at most 250', () => {
  const lines = fs.readFileSync(path.join(root, 'index.html'), 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => assert.ok(Array.from(line).length <= 250, `index.html:${index + 1}`));
});

for (const [file, minimum] of [['style.css', 300], ['index.html', 100], ['script.js', 120], ['cdn-model.js', 60]]) {
  test(`unminified line count: ${file} >= ${minimum}`, () => {
    assert.ok(fs.readFileSync(path.join(root, file), 'utf8').trimEnd().split(/\r?\n/).length >= minimum);
  });
}
