const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const model = require('../cdn-model.js');

const expected = [
  ['111', ['waf', 'cdn', 'ip', 'ip'], 4, true, 'best'],
  ['110', ['waf', 'cdn', 'waf', null], 3, true, 'high'],
  ['101', [null, 'cdn', 'ip', 'ip'], 3, true, 'high'],
  ['100', [null, 'cdn', null, null], 1, true, 'low'],
  ['011', ['ip', 'ip', 'ip', 'ip'], 4, false, 'misconfig'],
  ['010', ['waf', null, 'waf', null], 2, true, 'low'],
  ['001', ['ip', 'ip', 'ip', 'ip'], 4, false, 'misconfig'],
  ['000', [null, null, null, null], 0, true, 'worst']
];
const configFor = (bits) => Object.fromEntries(
  ['cdn', 'waf', 'iplimit'].map((key, index) => [key, bits[index] === '1'])
);
const scenarioFor = (id) => model.SCENARIOS.find((scenario) => scenario.id === id);

test('scenario and configuration order exactly match A-3', () => {
  assert.deepEqual(model.SCENARIOS, [
    { id: 'app-domain', kind: 'app', direct: false },
    { id: 'flood-domain', kind: 'flood', direct: false },
    { id: 'app-direct', kind: 'app', direct: true },
    { id: 'flood-direct', kind: 'flood', direct: true }
  ]);
  assert.deepEqual(model.CONFIGS, expected.map(([bits]) => configFor(bits)));
  assert.equal(model.SCENARIOS.length, 4);
  assert.equal(model.CONFIGS.length, 8);
});

for (const [bits, stops, blocked, usersReach, level] of expected) {
  test(`A-5: all four results and evaluation for ${bits}`, () => {
    const config = configFor(bits);
    const value = model.evaluate(config);
    assert.deepEqual(value.results.map((result) => result.stoppedAt), stops);
    assert.deepEqual(value.results.map((result) => result.id), model.SCENARIOS.map((scenario) => scenario.id));
    assert.deepEqual(Object.keys(value).sort(), ['blocked', 'level', 'results', 'total', 'usersReach']);
    assert.equal(value.blocked, blocked);
    assert.equal(value.total, 4);
    assert.equal(value.usersReach, usersReach);
    assert.equal(value.level, level);
    assert.equal(model.legitimateReaches(config), usersReach);
    for (const [index, scenario] of model.SCENARIOS.entries()) {
      assert.deepEqual(model.simulate(config, scenario), {
        hops: model.pathFor(config, scenario.direct), stoppedAt: stops[index]
      });
    }
  });
}

for (const [bits, direct, hops] of [
  ['111', false, ['cdn', 'ip', 'waf', 'origin']],
  ['111', true, ['ip', 'waf', 'origin']],
  ['100', false, ['cdn', 'origin']],
  ['100', true, ['origin']],
  ['010', false, ['waf', 'origin']],
  ['010', true, ['waf', 'origin']]
]) {
  test(`A-5 pathFor: ${bits}, direct=${direct}`, () => {
    assert.deepEqual(model.pathFor(configFor(bits), direct), hops);
  });
}

for (const [bits, id, points] of [
  ['111', 'app-domain', [[50, 80], [190, 80], [330, 80], [460, 80]]],
  ['111', 'flood-domain', [[50, 80], [190, 80]]],
  ['111', 'app-direct', [[50, 80], [50, 170], [330, 170], [330, 80]]],
  ['110', 'app-direct', [[50, 80], [50, 170], [460, 170], [460, 80]]],
  ['110', 'flood-direct', [[50, 80], [50, 170], [460, 170], [460, 80], [600, 80]]],
  ['101', 'app-domain', [[50, 80], [190, 80], [330, 80], [600, 80]]],
  ['100', 'app-direct', [[50, 80], [50, 170], [600, 170], [600, 80]]],
  ['011', 'flood-domain', [[50, 80], [330, 80]]],
  ['010', 'flood-domain', [[50, 80], [460, 80], [600, 80]]],
  ['010', 'app-direct', [[50, 80], [460, 80]]],
  ['001', 'app-direct', [[50, 80], [330, 80]]],
  ['000', 'flood-direct', [[50, 80], [600, 80]]]
]) {
  test(`A-6 pathPoints: ${bits} ${id}`, () => {
    assert.deepEqual(model.pathPoints(configFor(bits), scenarioFor(id)), points);
  });
}

test('fixed nodes and bypass coordinate match A-3', () => {
  assert.deepEqual(model.NODES, { client: [50, 80], cdn: [190, 80], ip: [330, 80], waf: [460, 80], origin: [600, 80] });
  assert.equal(model.BYPASS_Y, 170);
});

test('invalid configurations and unknown public scenarios throw TypeError', () => {
  for (const config of [null, undefined, {}, { cdn: 'yes', waf: true, iplimit: true }]) {
    assert.throws(() => model.simulate(config, model.SCENARIOS[0]), TypeError);
    assert.throws(() => model.evaluate(config), TypeError);
    assert.throws(() => model.legitimateReaches(config), TypeError);
    assert.throws(() => model.pathFor(config, false), TypeError);
  }
  for (const scenario of [null, undefined, {}, 'app-domain', { id: 'unknown' }, { id: 'user', kind: 'user', direct: false }]) {
    assert.throws(() => model.simulate(model.CONFIGS[0], scenario), TypeError);
    assert.throws(() => model.pathPoints(model.CONFIGS[0], scenario), TypeError);
  }
});

test('objects with the same scenario id use canonical kind and route', () => {
  assert.deepEqual(model.simulate(model.CONFIGS[0], { id: 'app-domain' }), model.simulate(model.CONFIGS[0], model.SCENARIOS[0]));
  assert.deepEqual(model.simulate(model.CONFIGS[0], { id: 'app-domain', kind: 'flood', direct: true }), {
    hops: ['cdn', 'ip', 'waf', 'origin'], stoppedAt: 'waf'
  });
});

test('K-3 invariants across all eight configurations', () => {
  for (const config of model.CONFIGS) {
    if (config.cdn && !config.waf) assert.equal(model.simulate(config, scenarioFor('app-domain')).stoppedAt, null);
    if (!config.cdn) {
      for (const kind of ['app', 'flood']) {
        assert.deepEqual(model.simulate(config, scenarioFor(`${kind}-domain`)), model.simulate(config, scenarioFor(`${kind}-direct`)));
      }
    }
    assert.equal(model.legitimateReaches(config), !(!config.cdn && config.iplimit));
  }
});

test('classic script exposes just CdnModel and does not require a DOM', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../cdn-model.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(context), []);
  assert.equal(vm.runInContext('CdnModel.evaluate(CdnModel.CONFIGS[0]).blocked', context), 4);
});

test('evaluation does not mutate its inputs or leak mutable shared constants', () => {
  const config = Object.freeze({ cdn: true, waf: true, iplimit: true });
  const scenario = Object.freeze({ id: 'app-direct' });
  assert.deepEqual(model.pathPoints(config, scenario), [[50, 80], [50, 170], [330, 170], [330, 80]]);
  assert.ok(Object.isFrozen(model.NODES.client));
  assert.ok(Object.isFrozen(model.SCENARIOS[0]));
});
