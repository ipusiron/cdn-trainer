const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'theme-init.js'), 'utf8');

// Runs theme-init.js in a fake window with the given saved value and OS setting,
// and returns whether <html> ends up with the dark-mode class.
function run({ saved = null, prefersDark = false, storageThrows = false } = {}) {
  const classes = new Set();
  const window = {
    localStorage: { getItem: () => { if (storageThrows) throw new Error('blocked'); return saved; } },
    matchMedia: () => ({ matches: prefersDark }),
    document: { documentElement: { classList: {
      toggle: (name, force) => { if (force) classes.add(name); else classes.delete(name); }
    } } }
  };
  vm.runInNewContext(source, { window });
  return classes.has('dark-mode');
}

test('without a saved value the page stays light, whatever the OS setting', () => {
  assert.equal(run({ prefersDark: false }), false);
  assert.equal(run({ prefersDark: true }), false);
});

test('the saved value decides the theme', () => {
  assert.equal(run({ saved: 'true' }), true);
  assert.equal(run({ saved: 'false', prefersDark: true }), false);
});

test('an unexpected saved value is ignored', () => {
  assert.equal(run({ saved: 'dark' }), false);
  assert.equal(run({ saved: 'TRUE' }), false);
});

test('a blocked localStorage does not throw and leaves the page light', () => {
  assert.equal(run({ storageThrows: true }), false);
});

test('index.html loads theme-init.js in <head>, after the stylesheet', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.ok(head.includes('<script src="theme-init.js"></script>'), 'theme-init.js is not in <head>');
  assert.ok(head.indexOf('style.css') < head.indexOf('theme-init.js'));
});

test('the dark theme is keyed on <html>, which exists before <body> is parsed', () => {
  const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  assert.match(css, /^html\.dark-mode \{/m);
  assert.doesNotMatch(css, /body\.dark-mode/);
});
