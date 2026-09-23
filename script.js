// The model is the single source of results; UI code only renders its output.
const t = CdnMessages.t;
let animationFrame = null;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function svgElement(tag, attributes, text) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

function readConfig() {
  return Object.fromEntries(['cdn', 'waf', 'iplimit'].map((key) =>
    [key, document.getElementById(key).checked]
  ));
}

function readScenario() {
  const id = document.querySelector('input[name="scenario"]:checked').value;
  return CdnModel.SCENARIOS.find((scenario) => scenario.id === id);
}

function resultLabel(result, scenario) {
  return t(result.stoppedAt ? `result.${result.stoppedAt}` : `result.reached.${scenario.kind}`);
}

function stopAnimation() {
  if (animationFrame !== null) cancelAnimationFrame(animationFrame);
  animationFrame = null;
}

function drawDiagram(config, scenario, result) {
  const svg = svgElement('svg', {
    viewBox: '0 0 680 220', role: 'img',
    'aria-label': t('ui.diagramLabel', { scenario: t(`scenario.${scenario.id}.short`), result: resultLabel(result, scenario) })
  });
  svg.append(svgElement('line', { x1: 50, y1: 80, x2: 600, y2: 80, class: 'route' }));
  const points = CdnModel.pathPoints(config, scenario);
  if (scenario.direct && config.cdn) {
    const first = CdnModel.NODES[result.hops[0]];
    svg.append(svgElement('polyline', {
      points: `50,80 50,170 ${first[0]},170 ${first[0]},80`, class: 'route route-bypass'
    }));
  }
  svg.append(svgElement('polyline', {
    id: 'attackPath', points: points.map((point) => point.join(',')).join(' '),
    class: 'route route-selected'
  }));
  for (const [key, [x, y]] of Object.entries(CdnModel.NODES)) {
    const enabled = key === 'client' || key === 'origin' || config[key === 'ip' ? 'iplimit' : key];
    const node = svgElement('g', { class: `node${enabled ? '' : ' is-disabled'}`, 'data-node': key });
    node.append(svgElement('text', { x, y: y - 40, class: 'node-icon', 'text-anchor': 'middle' }, t(`icon.${key}`)));
    node.append(svgElement('text', { x, y: y + 35, 'text-anchor': 'middle' }, t(`node.${key}`)));
    if (!enabled) node.append(svgElement('text', { x, y: y + 60, 'text-anchor': 'middle' }, t('node.disabled')));
    svg.append(node);
  }
  const fire = svgElement('text', {
    id: 'attack-fire', x: points[0][0], y: points[0][1],
    class: 'attack-icon', 'text-anchor': 'middle', 'dominant-baseline': 'central'
  }, t('icon.attack'));
  svg.append(fire);
  document.getElementById('diagram').replaceChildren(svg);
  playAttack(svg, fire, points, result, scenario);
}

function playAttack(svg, fire, points, result, scenario) {
  const lengths = points.slice(1).map((point, index) =>
    Math.hypot(point[0] - points[index][0], point[1] - points[index][1])
  );
  const total = lengths.reduce((sum, length) => sum + length, 0);
  const setPoint = (point) => {
    fire.setAttribute('x', point[0]);
    fire.setAttribute('y', point[1]);
  };
  const finish = () => {
    animationFrame = null;
    const end = points[points.length - 1];
    setPoint(end);
    fire.textContent = t(result.stoppedAt ? 'icon.blocked' : 'icon.reached');
    svg.append(svgElement('text', {
      x: end[0], y: 208, class: result.stoppedAt ? 'label-blocked' : 'label-reached',
      'text-anchor': end[0] < 100 ? 'start' : end[0] > 580 ? 'end' : 'middle'
    }, resultLabel(result, scenario)));
  };
  if (reducedMotion.matches) {
    finish();
    return;
  }
  const startedAt = performance.now();
  function frame(now) {
    const progress = Math.min((now - startedAt) / 1600, 1);
    if (progress >= 1) {
      finish();
      return;
    }
    let distance = total * progress;
    for (let index = 0; index < lengths.length; index += 1) {
      if (distance <= lengths[index]) {
        const fraction = lengths[index] === 0 ? 1 : distance / lengths[index];
        setPoint(points[index].map((value, axis) =>
          value + (points[index + 1][axis] - value) * fraction
        ));
        break;
      }
      distance -= lengths[index];
    }
    animationFrame = requestAnimationFrame(frame);
  }
  animationFrame = requestAnimationFrame(frame);
}

// This live summary is expanded with all scenarios and explanations in Stage 3.
function renderDiagnosis(config, evaluation) {
  document.getElementById('diagnosis').replaceChildren(
    element('span', t(`level.${evaluation.level}`), `level-badge level-${evaluation.level}`),
    element('p', t('score', { n: evaluation.blocked })),
    element('p', t(`users.${evaluation.usersReach}`))
  );
}

function renderCurrent() {
  stopAnimation();
  const config = readConfig();
  const scenario = readScenario();
  const evaluation = CdnModel.evaluate(config);
  const result = evaluation.results.find((entry) => entry.id === scenario.id);
  renderDiagnosis(config, evaluation, scenario);
  drawDiagram(config, scenario, result);
}

document.querySelectorAll('[data-message]').forEach((node) => {
  node.textContent = t(node.dataset.message);
});
document.getElementById('diagramAssumptions').replaceChildren(
  ...[1, 2, 3, 4, 5, 6].map((number) => element('li', t(`assumption.${number}`)))
);
document.getElementById('replayButton').addEventListener('click', renderCurrent);
document.querySelectorAll('#configForm input, input[name="scenario"]').forEach((input) => {
  input.addEventListener('change', renderCurrent);
});
reducedMotion.addEventListener('change', renderCurrent);
window.addEventListener('pagehide', stopAnimation);

// パターン一覧表のトグル機能
document.getElementById('patternToggle').addEventListener('change', function() {
  const tableSection = document.getElementById('patternTableSection');
  if (this.checked) {
    tableSection.classList.add('show');
  } else {
    tableSection.classList.remove('show');
  }
});

// ヘルプモーダル機能
const helpToggle = document.getElementById('helpToggle');
const helpModal = document.getElementById('helpModal');
const closeBtn = helpModal.querySelector('.close');

helpToggle.addEventListener('click', function() {
  helpModal.style.display = 'block';
});

closeBtn.addEventListener('click', function() {
  helpModal.style.display = 'none';
});

// モーダルの外側をクリックしたら閉じる
window.addEventListener('click', function(event) {
  if (event.target === helpModal) {
    helpModal.style.display = 'none';
  }
});

// ダークモード切り替え機能
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

// 保存されたダークモード設定を読み込む
const isDarkMode = localStorage.getItem('darkMode') === 'true';
if (isDarkMode) {
  body.classList.add('dark-mode');
}

darkModeToggle.addEventListener('click', function() {
  body.classList.toggle('dark-mode');
  const isDark = body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  
  // The existing SVG inherits theme colors; do not restart its animation.
});

renderCurrent();
