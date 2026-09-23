/*
 * Learning model assumptions (shared with the README and help).
 * Domain: client -> CDN (when enabled) -> origin entrance (IP) -> WAF -> Origin.
 * Direct: client -> origin entrance (IP) -> WAF -> Origin, bypassing the CDN.
 * The WAF is located immediately upstream of the origin, such as on a load balancer.
 * IP restrictions at the origin entrance allow connections only from CDN IP addresses.
 * The CDN absorbs floods, not application attacks; the WAF stops application attacks, not floods.
 * With the CDN disabled, the domain points directly to the origin.
 */
const CdnModel = (() => {
  'use strict';

  const SCENARIOS = Object.freeze([
    { id: 'app-domain', kind: 'app', direct: false },
    { id: 'flood-domain', kind: 'flood', direct: false },
    { id: 'app-direct', kind: 'app', direct: true },
    { id: 'flood-direct', kind: 'flood', direct: true }
  ].map(Object.freeze));
  const CONFIGS = Object.freeze([true, false].flatMap((cdn) =>
    [true, false].flatMap((waf) =>
      [true, false].map((iplimit) => Object.freeze({ cdn, waf, iplimit }))
    )
  ));
  const NODES = Object.freeze(Object.fromEntries(Object.entries({
    client: [50, 80], cdn: [190, 80], ip: [330, 80], waf: [460, 80], origin: [600, 80]
  }).map(([key, point]) => [key, Object.freeze(point)])));
  const BYPASS_Y = 170;

  function validateConfig(config) {
    if (!config || ['cdn', 'waf', 'iplimit'].some((key) => typeof config[key] !== 'boolean')) {
      throw new TypeError('Configuration requires boolean cdn, waf, and iplimit fields');
    }
  }

  function resolveScenario(scenario) {
    const resolved = scenario && SCENARIOS.find((candidate) => candidate.id === scenario.id);
    if (!resolved) throw new TypeError('Unknown scenario');
    return resolved;
  }

  function pathFor(config, direct) {
    validateConfig(config);
    const hops = [];
    if (config.cdn && !direct) hops.push('cdn');
    if (config.iplimit) hops.push('ip');
    if (config.waf) hops.push('waf');
    hops.push('origin');
    return hops;
  }

  function stops(hop, kind, fromCdn) {
    if (hop === 'cdn') return kind === 'flood';
    if (hop === 'ip') return !fromCdn;
    if (hop === 'waf') return kind === 'app';
    return false;
  }

  // The internal user scenario is deliberately not exposed by simulate().
  function simulateInternal(config, scenario) {
    const hops = pathFor(config, scenario.direct);
    const fromCdn = config.cdn && !scenario.direct;
    for (const hop of hops) {
      if (hop === 'origin') return { hops, stoppedAt: null };
      if (stops(hop, scenario.kind, fromCdn)) return { hops, stoppedAt: hop };
    }
    return { hops, stoppedAt: null };
  }

  function simulate(config, scenario) {
    validateConfig(config);
    return simulateInternal(config, resolveScenario(scenario));
  }

  function legitimateReaches(config) {
    return simulateInternal(config, { id: 'user', kind: 'user', direct: false }).stoppedAt === null;
  }

  function evaluate(config) {
    const results = SCENARIOS.map((scenario) => ({ id: scenario.id, ...simulate(config, scenario) }));
    const blocked = results.filter((result) => result.stoppedAt !== null).length;
    const usersReach = legitimateReaches(config);
    let level;
    if (!usersReach) level = 'misconfig';
    else if (blocked === 4) level = 'best';
    else if (blocked === 3) level = 'high';
    else if (blocked >= 1) level = 'low';
    else level = 'worst';
    return { results, blocked, total: SCENARIOS.length, usersReach, level };
  }

  function pathPoints(config, scenario) {
    const resolved = resolveScenario(scenario);
    const { hops, stoppedAt } = simulate(config, resolved);
    const end = stoppedAt ?? 'origin';
    const pts = [NODES.client];
    if (resolved.direct && config.cdn) {
      const first = NODES[hops[0]];
      pts.push([NODES.client[0], BYPASS_Y], [first[0], BYPASS_Y]);
    }
    for (const hop of hops) {
      pts.push(NODES[hop]);
      if (hop === end) break;
    }
    return pts;
  }

  return Object.freeze({ SCENARIOS, CONFIGS, NODES, BYPASS_Y, pathFor, simulate, legitimateReaches, evaluate, pathPoints });
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CdnModel;
}
