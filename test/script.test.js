const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');

test('UI uses DOM construction and cancelable animation, without legacy rendering', () => {
  assert.doesNotMatch(source, /innerHTML|evaluateConfig|onclick/);
  assert.match(source, /createElementNS/);
  assert.match(source, /cancelAnimationFrame/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(source, /\.style\./);
});

test('every localStorage operation is inside try/catch', () => {
  const guarded = [...source.matchAll(/\btry\s*\{[\s\S]*?\}\s*catch\b/g)]
    .map((match) => [match.index, match.index + match[0].length]);
  const accesses = [...source.matchAll(/localStorage\.(?:getItem|setItem)\s*\(/g)];
  assert.equal(accesses.length, 2);
  accesses.forEach((match) => assert.ok(guarded.some(([start, end]) => match.index > start && match.index < end)));
  assert.match(source, /savedDarkMode === 'true' \|\| savedDarkMode === 'false'/);
});

test('UI evaluation is delegated to the model and user controls register listeners', () => {
  assert.match(source, /CdnModel\.evaluate\(config\)/);
  assert.match(source, /CdnModel\.CONFIGS\.map/);
  assert.match(source, /CdnModel\.evaluate\(candidate\)/);
  assert.match(source, /addEventListener\('change', renderCurrent\)/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /event\.key === 'Tab'/);
});
