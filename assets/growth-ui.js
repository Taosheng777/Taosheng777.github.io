import { assessGrowth, resolveAge } from './growth-assessment.js';
import ageService from './mini/age.js';
import chart from './mini/growth-chart.js';
import who from './mini/who.js';
import './target-height-ui.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const form = document.querySelector('#growthForm');
const output = document.querySelector('#growthResult');
const error = document.querySelector('#growthError');
const charts = document.querySelector('#growthCharts');
const hint = document.querySelector('#ageHint');
const boneFields = document.querySelector('#boneFields');
let assessment = null;
let printMode = false;
const today = ageService.todayISO();
form.elements.measurementDate.value = today;
form.elements.measurementDate.defaultValue = today;
form.elements.measurementDate.max = today;
function inputs() {
  const values = Object.fromEntries(new FormData(form));
  values.birthPrecision = document.querySelector('#exactBirth').checked ? 'day' : 'month';
  if (boneFields.hidden || !boneFields.open) values.boneAgeYears = '';
  if (document.querySelector('#headField').hidden) values.head = '';
  return values;
}
function invalidate() {
  assessment = null; output.hidden = true; charts.replaceChildren(); error.textContent = '';
  for (const id of ['growthCards', 'referenceCaption', 'measurementNote', 'boneResult']) document.getElementById(id).replaceChildren();
}
function updateAge() {
  const birth = form.elements.ageInputMode.value === 'birth';
  // 测量日期两种方式共用；手工年龄时仍然可见和可修改。
  document.querySelector('#birthDate').closest('label').hidden = !birth;
  document.querySelector('.precision-control').hidden = !birth;
  document.querySelector('#manualFields').hidden = birth;
  try {
    const age = resolveAge(inputs());
    const older = age.completedMonths >= 48;
    hint.textContent = `${age.label}${age.rangeLabel ? ' · ' + age.rangeLabel : ''} · ${older ? '中国参照 · 4–18岁' : 'WHO · 4岁以下'}`;
    boneFields.hidden = !older;
    if (!older) { boneFields.open = false; form.elements.boneAgeYears.value = ''; }
    document.querySelector('#headField').hidden = older;
    document.querySelector('#heightLabel').textContent = `${age.completedMonths < 24 ? '身长' : '身高'}（cm）`;
  } catch (e) {
    hint.textContent = form.elements.birthDate.value || form.elements.ageYears.value ? e.message : '4岁以下自动采用 WHO，4岁起采用中国参照。';
    boneFields.hidden = true;
    document.querySelector('#headField').hidden = true;
  }
}
form.addEventListener('input', () => { invalidate(); updateAge(); });
form.addEventListener('change', event => {
  if (event.target.id === 'exactBirth') {
    const field = form.elements.birthDate;
    const month = field.value.slice(0, 7);
    field.type = event.target.checked ? 'date' : 'month';
    field.value = event.target.checked ? '' : month;
    document.querySelector('#birthLabel').textContent = event.target.checked ? '完整出生日期' : '出生年月';
  }
  invalidate(); updateAge();
});
boneFields.addEventListener('toggle', () => { if (assessment) invalidate(); });
form.addEventListener('reset', () => {
  invalidate();
  form.elements.measurementDate.defaultValue = ageService.todayISO();
  // reset事件发生在浏览器恢复默认值之前；UI重置放到默认动作之后。
  setTimeout(() => {
    form.elements.measurementDate.value = ageService.todayISO();
    form.elements.birthDate.type = 'month';
    document.querySelector('#birthLabel').textContent = '出生年月';
    boneFields.open = false;
    document.querySelector('input[name="lineMode"][value="percentile"]').checked = true;
    document.querySelector('input[name="viewport"][value="full"]').checked = true;
    updateAge();
  });
});
function cardMarkup(item) {
  return `<article class="metric-card" data-level="${esc(item.token)}"><p class="metric-name">${esc(item.name)}</p><h3>${esc(item.label)}</h3><p class="metric-value">${esc(item.value)}</p><p>${item.z === null ? '—' : `${esc(item.percentile)} · Z ${item.z.toFixed(2)}`}</p><p class="field-help">${esc(item.basis)}</p></article>`;
}
function chartDefinitions(a) {
  const r = a.result;
  if (a.mode === 'growth418') return ['hfa', 'wfa', 'bfa'].filter(metric => r.results[metric].state === 'ok').map(metric => ({
    metric, title: metric === 'hfa' ? '身高曲线' : metric === 'wfa' ? '体重曲线' : 'BMI 曲线',
    unit: metric === 'hfa' ? 'cm' : metric === 'wfa' ? 'kg' : 'kg/m²', ageUnit: 'years',
    current: { x: r.month, y: r.results[metric].value },
    comparison: metric === 'hfa' && r.boneAge?.state === 'ok' ? { x: r.boneAge.month, y: r.height } : null,
    percentile: r.results[metric].percentile
  }));
  const definitions = [{ metric: 'lh', title: '身长 / 身高曲线', unit: 'cm', ageUnit: 'months', current: { x: r.ageMonths, y: r.lengthHeight }, percentile: r.lengthPercentile }];
  if (r.weight !== null) definitions.push({ metric: 'w', title: '体重曲线', unit: 'kg', ageUnit: 'months', current: { x: r.ageMonths, y: r.weight }, percentile: r.weightPercentile },
    { metric: 'wfl', title: '身长 / 身高别体重', unit: 'kg', ageUnit: 'length', current: { x: r.lengthHeight, y: r.weight }, percentile: r.whPercentile });
  if (r.head !== null) definitions.push({ metric: 'hc', title: '头围曲线', unit: 'cm', ageUnit: 'months', current: { x: r.ageMonths, y: r.head }, percentile: r.headPercentile });
  return definitions;
}
function drawCharts() {
  if (!assessment || output.hidden) return;
  const lineMode = document.querySelector('input[name="lineMode"]:checked').value;
  const viewport = document.querySelector('input[name="viewport"]:checked').value;
  charts.replaceChildren();
  for (const [i, def] of chartDefinitions(assessment).entries()) {
    const section = document.createElement('section'); section.className = 'growth-chart';
    section.innerHTML = `<h3>${def.title}</h3><p class="chart-range"></p><canvas tabindex="0" role="img" aria-label="${def.title}，数值与图例见图下说明"></canvas><div class="chart-marker-actions"></div><p class="chart-detail" aria-live="polite"></p>${i === 0 ? '<div class="reference-values"></div>' : ''}`;
    charts.append(section);
    const canvas = section.querySelector('canvas');
    const width = printMode ? 720 : canvas.clientWidth; const height = 360;
    const curves = def.metric === 'wfl' ? who.lengthReferenceCurves(assessment.result.sex, assessment.result.isLength ? 'wfl' : 'wfh') :
      chart.referenceCurves({ mode: assessment.mode, standard: 'cn', sex: assessment.result.sex, metric: def.metric, lineMode });
    const model = chart.chartModel({ curves, current: def.current, comparison: def.comparison, width, height, viewport: def.ageUnit === 'length' ? 'full' : viewport, ageUnit: def.ageUnit, yLabel: `${def.title.replace('曲线', '')}（${def.unit}）` });
    if (!model) continue;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    const context = canvas.getContext('2d'); context.scale(ratio, ratio); chart.draw(context, model);
    const range = `${chart.ageLabel(model.xMin, def.ageUnit)}–${chart.ageLabel(model.xMax, def.ageUnit)}`;
    section.querySelector('.chart-range').textContent = `当前视窗：${range}；右端标签对应 ${chart.ageLabel(model.xMax, def.ageUnit)}${def.metric === 'wfl' ? '（本图固定显示 SD 线）' : ''}`;
    const detail = section.querySelector('.chart-detail');
    function describe(marker) {
      return `${marker.kind === 'bone' ? '按骨龄投点' : def.ageUnit === 'length' ? '实测点' : '实际年龄'}：${chart.ageLabel(marker.x, def.ageUnit)}，${marker.y.toFixed(1)} ${def.unit} · ${marker.kind === 'bone' ? assessment.result.boneAge.reference.percentile : def.percentile}`;
    }
    canvas.addEventListener('click', event => {
      const bounds = canvas.getBoundingClientRect();
      const hits = chart.hitTest(model, (event.clientX - bounds.left) * width / bounds.width, (event.clientY - bounds.top) * height / bounds.height);
      detail.textContent = hits.map(describe).join('；');
    });
    for (const marker of model.markers) {
      const button = document.createElement('button'); button.type = 'button'; button.className = `marker-button ${marker.kind}`;
      button.textContent = describe(marker);
      button.addEventListener('click', () => { detail.textContent = describe(marker); });
      section.querySelector('.chart-marker-actions').append(button);
    }
    if (i === 0) {
      section.querySelector('.reference-values').innerHTML = `<p>本次年龄对应的参考身高（cm）</p><table><thead><tr>${model.referenceValues.map(v => `<th scope="col">${esc(v.label)}${lineMode === 'sd' ? ' SD' : ''}</th>`).join('')}</tr></thead><tbody><tr>${model.referenceValues.map(v => `<td${Math.abs(v.z) < 1e-9 ? ' class="median"' : ''}>${v.value.toFixed(1)}</td>`).join('')}</tr></tbody></table>`;
    }
  }
}
form.addEventListener('submit', event => {
  event.preventDefault(); invalidate();
  try {
    assessment = assessGrowth(inputs());
    const { age, result } = assessment;
    document.querySelector('#referenceCaption').textContent = `${result.sex === 'M' ? '男' : '女'} · ${age.label} · ${assessment.reference}`;
    document.querySelector('#measurementNote').textContent = [age.rangeLabel, age.precision === 'month' ? '按出生年月估算；补填出生日可消除月龄不确定性。' : '', result.weightError || (result.weight === null ? '未输入体重，体重与体型未计算；身高结果可正常查看。' : '')].filter(Boolean).join(' · ');
    document.querySelector('#growthCards').innerHTML = assessment.cards.map(cardMarkup).join('');
    const boneResult = document.querySelector('#boneResult'); const b = result.boneAge;
    boneResult.hidden = !b;
    boneResult.textContent = b ? b.message || `骨龄 ${b.years} 岁 · ${b.differenceText} · 按骨龄投点 ${b.reference.percentile}（Z ${b.reference.z.toFixed(2)}）` : '';
    output.hidden = false; drawCharts(); document.querySelector('#growthResultTitle').focus();
  } catch (e) { invalidate(); error.textContent = e.message; }
});
for (const field of document.querySelectorAll('.chart-controls input')) field.addEventListener('change', drawCharts);
let previousWidth = 0;
new ResizeObserver(entries => { const width = entries[0].contentRect.width; if (Math.abs(width - previousWidth) > 1) { previousWidth = width; drawCharts(); } }).observe(charts);
document.querySelector('#printGrowth').addEventListener('click', () => window.print());
window.addEventListener('beforeprint', () => { printMode = true; drawCharts(); });
window.addEventListener('afterprint', () => { printMode = false; drawCharts(); });
window.addEventListener('pagehide', () => form.reset());
updateAge();
