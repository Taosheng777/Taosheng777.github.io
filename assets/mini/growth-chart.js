// 自动生成：scripts/sync-miniprogram.mjs；来源 1.5.1 骨龄圆点修订。请勿手改。
import dependency0 from './growth-4-18.js';
import dependency1 from './who.js';
import dependency2 from './who-reference.js';
// 坐标与渲染独立于页面。所有参考线在同一 LMS 插值上取样，不做视觉平滑。
const growth = dependency0;
const who = dependency1;
const infant = dependency2;
const PERCENTILES = [3, 10, 25, 50, 75, 90, 97];

function normalQuantile(p) {
  if (!(p > 0 && p < 1)) throw new Error('百分位概率必须在 0 与 1 之间');
  if (p === 0.5) return 0;
  // Acklam 正态逆分布近似；与独立标准分位数校验，误差远小于表格精度。
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  if (p < 0.02425 || p > 0.97575) {
    const q = Math.sqrt(-2 * Math.log(p < 0.5 ? p : 1 - p));
    const z = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    return p < 0.5 ? z : -z;
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

function referenceCurves({ mode, standard, sex, metric, lineMode = 'percentile' }) {
  const rows = mode === 'who03'
    ? (infant.lms[sex][metric] || []).map((row, month) => [month, ...row])
    : growth.rowsFor(standard, sex, metric);
  if (!rows || !rows.length) return [];
  const levels = lineMode === 'sd' ? growth.Z_LINES.map(z => ({ z, label: `${z > 0 ? '+' : ''}${z}` })) : PERCENTILES.map(p => ({ z: normalQuantile(p / 100), label: `P${p}` }));
  const min = rows[0][0]; const max = rows[rows.length - 1][0];
  return levels.map(level => {
    const points = [];
    for (let month = min; month <= max; month++) {
      const lms = growth.lookupLMS(rows, month);
      points.push({ month, value: growth.calcValueAtZ(lms.l, lms.m, lms.s, level.z) });
    }
    return { ...level, points };
  });
}

function niceStep(span) {
  const raw = span / 6;
  if (raw <= 1) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  return [1, 2, 5, 10].find(n => n * power >= raw) * power;
}

function ageLabel(month, unit) {
  if (unit === 'length') return `${month} cm`;
  if (unit === 'months') return `${month}月龄`;
  const years = Math.floor(month / 12); const months = Math.round((month % 12) * 10) / 10;
  return `${years}岁${months ? `${months}个月` : ''}`;
}

function curveValueAt(points, x) {
  const right = points.findIndex(point => point.x >= x);
  if (right < 0 || x < points[0].x) return null;
  if (points[right].x === x || right === 0) return points[right].y;
  const a = points[right - 1]; const b = points[right];
  return a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x);
}

function chartModel({ curves, current, comparison, width, height, viewport = 'full', ageUnit = 'years', yLabel = '身高（cm）' }) {
  const normalized = curves.map(c => ({ ...c, label: c.label || `${c.z > 0 ? '+' : ''}${c.z}`, points: c.points.filter(p => Number.isFinite(p.value)).map(p => ({ x: p.month === undefined ? p.x : p.month, y: p.value })) }));
  if (!normalized.length || !normalized[0].points.length) return null;
  const first = normalized[0].points;
  const domain = [first[0].x, first[first.length - 1].x];
  const markers = [current && { ...current, kind: 'actual', label: '实际年龄' }, comparison && { ...comparison, kind: 'bone', label: '按骨龄投点' }].filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= domain[0] && p.x <= domain[1]);
  let xMin = domain[0]; let xMax = domain[1];
  if (viewport === 'near' && markers.length) {
    const pad = ageUnit === 'years' ? 24 : 6;
    xMin = Math.max(domain[0], Math.floor(Math.min(...markers.map(p => p.x)) - pad));
    xMax = Math.min(domain[1], Math.ceil(Math.max(...markers.map(p => p.x)) + pad));
  }
  const visible = normalized.map(c => ({ ...c, points: c.points.filter(p => p.x >= xMin && p.x <= xMax) }));
  const ys = visible.flatMap(c => c.points.map(p => p.y)).concat(markers.map(p => p.y));
  const step = yLabel.includes('cm') ? Math.min(10, niceStep(Math.max(...ys) - Math.min(...ys))) : niceStep(Math.max(...ys) - Math.min(...ys));
  const yMin = Math.floor((Math.min(...ys) - step * 0.35) / step) * step;
  const yMax = Math.ceil((Math.max(...ys) + step * 0.35) / step) * step;
  const plot = { left: 40, right: width - 46, top: 27, bottom: height - 41 };
  const xTicks = [];
  const xStep = ageUnit === 'years' ? ((xMax - xMin) > 96 ? 24 : 12) : niceStep(xMax - xMin);
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) xTicks.push(x);
  const yTicks = [];
  for (let y = yMin; y <= yMax + step * 0.01; y += step) yTicks.push(y);
  // 当前年龄的参考值独立于视窗，缩放只改坐标，不改变参照值。
  const referenceValues = current ? normalized.map(c => ({ label: c.label, z: c.z, value: curveValueAt(c.points, current.x) })).filter(item => Number.isFinite(item.value)) : [];
  return { width, height, curves: visible, markers, xMin, xMax, yMin, yMax, xTicks, yTicks, plot, ageUnit, yLabel, referenceValues };
}
function projectPoint(model, point) {
  const p = model.plot;
  return { x: p.left + (point.x - model.xMin) / (model.xMax - model.xMin) * (p.right - p.left), y: p.bottom - (point.y - model.yMin) / (model.yMax - model.yMin) * (p.bottom - p.top) };
}
function hitTest(model, x, y) {
  return model.markers.filter(p => { const s = projectPoint(model, p); return Math.hypot(s.x - x, s.y - y) <= 24; });
}
function draw(context, model) {
  const { width, height, plot } = model;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height);
  context.font = '12px sans-serif'; context.textBaseline = 'middle';
  const line = (x1, y1, x2, y2, color, weight = 1) => { context.strokeStyle = color; context.lineWidth = weight; context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke(); };
  model.yTicks.forEach(y => {
    const s = projectPoint(model, { x: model.xMin, y });
    line(plot.left, s.y, plot.right, s.y, '#e4edf1');
    context.textAlign = 'right'; context.fillStyle = '#526778'; context.fillText(String(y), plot.left - 7, s.y);
  });
  model.xTicks.forEach(x => {
    const s = projectPoint(model, { x, y: model.yMin });
    line(s.x, plot.top, s.x, plot.bottom, '#eef3f6');
    context.textAlign = 'center'; context.fillStyle = '#526778'; context.fillText(String(model.ageUnit === 'years' ? x / 12 : x), s.x, plot.bottom + 16);
  });
  model.curves.forEach(c => {
    const middle = Math.abs(c.z) < 1e-9;
    context.strokeStyle = middle ? '#597e99' : '#b7c9d5'; context.lineWidth = middle ? 1.8 : 1;
    context.beginPath();
    c.points.forEach((point, i) => { const p = projectPoint(model, point); if (!i) context.moveTo(p.x, p.y); else context.lineTo(p.x, p.y); });
    context.stroke();
  });
  const actual = model.markers.find(marker => marker.kind === 'actual');
  if (actual) {
    const point = projectPoint(model, actual);
    context.setLineDash([2, 4]);
    line(point.x, plot.top, point.x, plot.bottom, '#cfa6a0');
    line(plot.left, point.y, point.x, point.y, '#cfa6a0');
    context.setLineDash([]);
  }
  // 末端标签防碰撞，必要时用短引线连接回真实曲线位置。
  const labels = model.curves.map(c => ({ c, p: projectPoint(model, c.points[c.points.length - 1]) })).sort((a, b) => a.p.y - b.p.y);
  const middleIndex = labels.findIndex(l => Math.abs(l.c.z) < 1e-9);
  labels[middleIndex].y = labels[middleIndex].p.y;
  for (let i = middleIndex - 1; i >= 0; i--) labels[i].y = Math.min(labels[i].p.y, labels[i + 1].y - 14);
  for (let i = middleIndex + 1; i < labels.length; i++) labels[i].y = Math.max(labels[i].p.y, labels[i - 1].y + 14);
  labels.forEach(l => {
    const middle = Math.abs(l.c.z) < 1e-9;
    context.strokeStyle = middle ? '#3d6681' : '#8ba4b5'; context.lineWidth = middle ? 1.8 : 1;
    context.beginPath(); context.moveTo(plot.right, l.p.y); context.lineTo(plot.right + 4, l.p.y); context.lineTo(plot.right + 10, l.y); context.stroke();
    context.font = middle ? 'bold 12px sans-serif' : '12px sans-serif';
    context.textAlign = 'left'; context.fillStyle = middle ? '#315e7e' : '#526778'; context.fillText(l.c.label, plot.right + 12, l.y);
  });
  context.font = '12px sans-serif';
  if (model.markers.length === 2) {
    const a = projectPoint(model, model.markers[0]); const b = projectPoint(model, model.markers[1]);
    context.setLineDash([4, 4]); line(a.x, a.y, b.x, b.y, '#2679ad', 1.5); context.setLineDash([]);
  }
  // 两点半径相同；重合时保留蓝色圆环与红色圆心，不移动数据坐标。
  model.markers.forEach(marker => {
    const p = projectPoint(model, marker);
    const bone = marker.kind === 'bone';
    context.lineWidth = bone ? 2 : 2.5; context.beginPath();
    context.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
    context.fillStyle = bone ? '#ffffff' : '#9e221d';
    context.strokeStyle = bone ? '#2679ad' : '#ffffff';
    const overlap = bone && actual && Math.hypot(p.x - projectPoint(model, actual).x, p.y - projectPoint(model, actual).y) < 0.5;
    if (!overlap) context.fill();
    context.stroke();
  });
  model.markers.forEach((marker, i) => {
    const p = projectPoint(model, marker); const color = marker.kind === 'bone' ? '#216793' : '#9e221d';
    const labelWidth = context.measureText(marker.label).width + 10;
    const x = Math.max(plot.left, Math.min(plot.right - labelWidth, p.x - labelWidth / 2));
    const y = Math.max(plot.top + 8, Math.min(plot.bottom - 8, p.y + (i === 0 ? -21 : 23)));
    context.fillStyle = '#ffffff'; context.fillRect(x - 2, y - 9, labelWidth + 4, 18); context.textAlign = 'left'; context.fillStyle = color; context.fillText(marker.label, x + 4, y);
  });
  context.textAlign = 'left'; context.fillStyle = '#526778'; context.fillText(model.yLabel, 2, 9);
  context.textAlign = 'center'; context.fillText(model.ageUnit === 'years' ? '年龄（岁）' : model.ageUnit === 'months' ? '月龄' : '身长 / 身高（cm）', (plot.left + plot.right) / 2, height - 7);
}

export default { PERCENTILES, normalQuantile, referenceCurves, chartModel, projectPoint, hitTest, draw, ageLabel };
