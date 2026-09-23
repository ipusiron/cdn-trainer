const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

// Existing UI files are intentionally unchanged at Stage 1.
for (const file of ['cdn-model.js', 'cdn-messages.js', ...fs.readdirSync(__dirname).map((name) => `test/${name}`)]) {
  test(`line length at most 160: ${file}`, () => {
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => assert.ok(Array.from(line).length <= 160, `${file}:${index + 1}`));
  });
}

for (const [file, minimum] of [['style.css', 300], ['index.html', 100], ['script.js', 120], ['cdn-model.js', 60]]) {
  test(`unminified line count: ${file} >= ${minimum}`, () => {
    assert.ok(fs.readFileSync(path.join(root, file), 'utf8').trimEnd().split(/\r?\n/).length >= minimum);
  });
}
