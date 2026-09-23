const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
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

test('endpoint reveal scrolls only the diagram box and includes the final label', () => {
  const declaration = source.match(/function revealEndpoint\(svg, result\) \{[\s\S]*?\n\}/);
  assert.ok(declaration);
  const reveal = vm.runInNewContext(`${declaration[0]}; revealEndpoint;`);
  const box = { scrollWidth: 600, clientWidth: 300, clientLeft: 2, scrollLeft: 0,
    getBoundingClientRect: () => ({ left: 10 }) };
  const endpoint = { getBoundingClientRect: () => ({ left: 430 - box.scrollLeft, right: 470 - box.scrollLeft }) };
  const label = { getBoundingClientRect: () => ({ left: 400 - box.scrollLeft, right: 510 - box.scrollLeft }) };
  const svg = { parentElement: box, querySelector: (selector) => selector.startsWith('[data-node=') ? endpoint : label };
  reveal(svg, { stoppedAt: 'waf' });
  assert.equal(box.scrollLeft, 210);
  reveal(svg, { stoppedAt: 'waf' });
  assert.equal(box.scrollLeft, 210, 'already-visible endpoint does not move');
  box.scrollLeft = 500;
  reveal(svg, { stoppedAt: null });
  assert.equal(box.scrollLeft, 376, 'move left to include the label');
  box.scrollWidth = box.clientWidth;
  reveal(svg, { stoppedAt: null });
  assert.equal(box.scrollLeft, 376, 'non-overflowing box is unchanged');
  assert.doesNotMatch(declaration[0], /\.scrollIntoView\(|window\.scroll|document\./);
  assert.equal((source.match(/revealEndpoint\(svg, result\);/g) || []).length, 2);
});

test('visual styles preserve node names, emoji fonts and whole result words', () => {
  const css = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
  assert.match(css, /\.node-name\s*\{[^}]*paint-order:\s*stroke;[^}]*stroke:\s*var\(--panel-bg\);[^}]*stroke-width:\s*6px;/);
  assert.match(css, /font-family:\s*"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"/);
  assert.match(css, /\.pattern-table td:nth-last-child\(-n \+ 3\)\s*\{\s*white-space:\s*nowrap;/);
});

test('tooltip focus is keyboard-visible and hover is restricted to hover-capable input', () => {
  const css = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
  assert.doesNotMatch(css, /\.tooltip-container:focus-within|\.tooltip-container:active/);
  assert.match(css, /\.tooltip-container:focus-visible \.tooltip/);
  assert.match(css, /\.tooltip-container:has\(input:focus-visible\) \.tooltip/);
  assert.match(css, /@media \(hover: hover\)\s*\{\s*\.tooltip-container:hover \.tooltip/);
});

test('header centers the desktop title independently of the right-hand buttons', () => {
  const css = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
  assert.match(css, /\.header-content\s*\{[^}]*flex-direction:\s*column;/);
  const desktop = css.slice(css.indexOf('@media (min-width: 601px)'));
  assert.match(desktop, /\.header-content\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*minmax\(0, 1fr\) auto minmax\(0, 1fr\);/);
  assert.match(desktop, /\.header-content h1\s*\{\s*grid-column:\s*2;\s*grid-row:\s*1;/);
  assert.match(desktop, /\.header-buttons\s*\{\s*grid-column:\s*3;\s*grid-row:\s*1;\s*justify-self:\s*end;/);
});
