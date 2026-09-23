const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const model = require('../cdn-model.js');
const { t } = require('../cdn-messages.js');
const root = path.join(__dirname, '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8').replace(/\r\n/g, '\n');

function section(title, level = 2) {
  const heading = `${'#'.repeat(level)} ${title}\n`;
  assert.ok(readme.includes(heading), heading);
  return readme.split(heading)[1].split(new RegExp(`\\n#{1,${level}} `))[0];
}

test('README eight configurations match the model and dictionary in all ten cells', () => {
  const rows = section('8パターン表', 3).split('\n').filter((line) => /^\| [✅❌]/u.test(line));
  assert.equal(rows.length, 8);
  const actual = rows.map((row) => row.split('|').slice(1, -1).map((cell) => cell.trim()));
  const expected = model.CONFIGS.map((config) => {
    const result = model.evaluate(config);
    return [
      ...['cdn', 'waf', 'iplimit'].map((key) => t(config[key] ? 'cell.on' : 'cell.off')),
      ...result.results.map((entry) => t(`cell.${entry.stoppedAt || 'reached'}`)),
      t('cell.score', { n: result.blocked }), t(`cell.users.${result.usersReach}`), t(`level.${result.level}`)
    ];
  });
  actual.forEach((row) => assert.equal(row.length, 10));
  assert.deepEqual(actual, expected);
});

test('README keeps metadata keys, order, block sequences and fixed repository fields', () => {
  const match = readme.match(/^<!--\n---\n([\s\S]*?)\n---\n-->/);
  assert.ok(match, 'YAML remains inside the HTML comment');
  const metadata = match[1];
  assert.deepEqual([...metadata.matchAll(/^([a-z_]+):/gm)].map((entry) => entry[1]), [
    'id', 'slug', 'title', 'subtitle_ja', 'subtitle_en', 'description_ja', 'description_en',
    'category_ja', 'category_en', 'difficulty', 'tags', 'repo_url', 'demo_url', 'hub'
  ]);
  for (const key of ['category_ja', 'category_en', 'tags']) {
    assert.match(metadata, new RegExp(`^${key}:\\n(?:  - .+\\n?)+`, 'm'));
  }
  for (const line of [
    'id: day026', 'slug: cdn-trainer', 'repo_url: "https://github.com/ipusiron/cdn-trainer"',
    'demo_url: "https://ipusiron.github.io/cdn-trainer/"', 'hub: true'
  ]) assert.ok(metadata.split('\n').includes(line), line);
});

test('README annotated tree lists every repository file and existing directory', () => {
  const tree = section('📁 ディレクトリー構造').match(/```text\n([\s\S]*?)\n```/);
  assert.ok(tree);
  const lines = tree[1].split('\n');
  const columns = new Set(lines.map((line) => line.indexOf('#')));
  assert.equal(columns.size, 1, 'comment columns align');
  assert.match(lines[0], /^cdn-trainer\/ +# \S/);
  const directories = [];
  const files = [];
  const parents = [];
  for (const line of lines.slice(1)) {
    const match = line.match(/^((?:(?:│   |    ))*)(?:├── |└── )([^#]+?) +# (\S.*)$/u);
    assert.ok(match, `annotated tree line: ${line}`);
    const depth = match[1].length / 4;
    const name = match[2].trim();
    parents.length = depth;
    const relative = [...parents, name.replace(/\/$/, '')].join('/');
    assert.ok(fs.existsSync(path.join(root, relative)), relative);
    if (name.endsWith('/')) {
      directories.push(relative);
      parents[depth] = name.slice(0, -1);
    } else files.push(relative);
  }
  // Include new untracked task files locally, as well as tracked files in CI.
  const listed = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean).filter((name) => !name.startsWith('.claude/'));
  assert.deepEqual(files.sort(), [...new Set(listed)].sort());
  const expectedDirectories = new Set();
  listed.forEach((file) => {
    const parts = file.split('/');
    while (parts.length > 1) {
      parts.pop();
      expectedDirectories.add(parts.join('/'));
    }
  });
  assert.deepEqual(directories.sort(), [...expectedDirectories].sort());
});

test('README references all three screenshots and each has one caption', () => {
  const images = [...readme.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)].map((match) => match[1]);
  assert.deepEqual(images, ['assets/screenshot.png', 'assets/screenshot2.png', 'assets/screenshot3.png']);
  images.forEach((file) => assert.ok(fs.existsSync(path.join(root, file)), file));
  const actual = fs.readdirSync(path.join(root, 'assets')).filter((name) => name.endsWith('.png'));
  assert.deepEqual(actual.sort(), images.map((name) => name.slice(7)).sort());
  assert.equal((section('📸 スクリーンショット').match(/^> \*.+\*$/gm) || []).length, 3);
});

test('README explains seven tests and has one learning section without the old score', () => {
  const names = fs.readdirSync(__dirname).filter((name) => name.endsWith('.test.js'));
  assert.equal(names.length, 7);
  names.forEach((name) => assert.ok(section('🧪 テスト').includes(`test/${name}`), name));
  assert.equal((readme.match(/^## .*?(?:セキュリティ)?学習のポイント$/gm) || []).length, 1);
  assert.doesNotMatch(readme, /n\/3|3項目で判定|npx serve|Certificate Pinning/);
});

test('README model assumptions and level criteria agree with help dictionary', () => {
  const assumptions = section('前提', 3);
  for (let n = 1; n <= 6; n += 1) assert.ok(assumptions.includes(t(`assumption.${n}`)));
  const levels = section('レベルの基準', 3);
  for (const key of ['misconfig', 'best', 'high', 'low', 'worst']) assert.ok(levels.includes(t(`help.level.${key}`)));
});
