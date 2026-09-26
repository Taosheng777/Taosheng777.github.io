// 自动生成：scripts/sync-miniprogram.mjs；来源 1.5.1 骨龄圆点修订。请勿手改。
import dependency0 from './who-reference.js';
// 工具箱只做单次即时计算，不保存输入。
// LMS 参数与 Z 分算法与个人网页及 reference/who-0-3/who-reference.ts 同源，口径不得另开一套。
const reference = dependency0;

const Z_LINES = [-3, -2, -1, 0, 1, 2, 3];

function parseDateParts(value) {
  const parts = String(value).slice(0, 10).split('-');
  return { year: Number(parts[0]), month: Number(parts[1]), day: Number(parts[2]) };
}

// 足月数：日历月差，测量日的「日」小于出生日时减一个月。
function ageInMonths(birthDate, atDate) {
  const birth = parseDateParts(birthDate);
  const at = parseDateParts(atDate);
  if (!birth.year || !at.year) return null;
  let months = (at.year - birth.year) * 12 + (at.month - birth.month);
  if (at.day < birth.day) months -= 1;
  return months;
}

// 画点用的横坐标，按 WHO anthro 的 30.4375 日/月换算，保留小数。
function ageInExactMonths(birthDate, atDate) {
  const birth = parseDateParts(birthDate);
  const at = parseDateParts(atDate);
  if (!birth.year || !at.year) return null;
  const birthUtc = Date.UTC(birth.year, birth.month - 1, birth.day);
  const atUtc = Date.UTC(at.year, at.month - 1, at.day);
  return (atUtc - birthUtc) / 86400000 / 30.4375;
}

function calcValueAtZ(l, m, s, z) {
  if (Math.abs(l) < 1e-12) return m * Math.exp(s * z);
  const q = 1 + l * s * z;
  return q > 0 ? m * Math.pow(q, 1 / l) : NaN;
}

function zLms(y, l, m, s, adjusted) {
  if (!(y > 0)) return null;
  let z = Math.abs(l) < 1e-12 ? Math.log(y / m) / s : (Math.pow(y / m, l) - 1) / (s * l);
  if (!adjusted || !isFinite(z)) return z;
  const sd3p = calcValueAtZ(l, m, s, 3);
  const sd3n = calcValueAtZ(l, m, s, -3);
  const sd2p = calcValueAtZ(l, m, s, 2);
  const sd2n = calcValueAtZ(l, m, s, -2);
  if (z > 3) z = 3 + (y - sd3p) / (sd3p - sd2p);
  if (z < -3) z = -3 + (y - sd3n) / (sd2n - sd3n);
  return z;
}

function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const value = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * value);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-value * value);
  return sign * y;
}

function percentileText(z) {
  if (z === null || !isFinite(z)) return '';
  const p = 100 * 0.5 * (1 + erf(z / Math.SQRT2));
  if (p < 0.1) return '<P0.1';
  if (p > 99.9) return '>P99.9';
  return `P${p.toFixed(1)}`;
}

function lmsRow(sex, metric, month) {
  const table = reference.lms[sex];
  if (!table) return null;
  const rows = table[metric];
  if (!rows || month < 0 || month > reference.maxMonth) return null;
  return rows[month] || null;
}

function rowByLength(sex, table, value) {
  const rows = reference.lengthLms[table] && reference.lengthLms[table][sex];
  if (!rows || rows.length === 0) return null;
  const first = rows[0];
  const last = rows[rows.length - 1];
  if (value < first[0] || value > last[0]) return null;
  const position = (value - first[0]) / 0.1;
  const lowerIndex = Math.floor(position + 1e-9);
  const fraction = position - lowerIndex;
  if (lowerIndex >= rows.length - 1) return last;
  const lower = rows[lowerIndex];
  const upper = rows[lowerIndex + 1];
  return [
    value,
    lower[1] + fraction * (upper[1] - lower[1]),
    lower[2] + fraction * (upper[2] - lower[2]),
    lower[3] + fraction * (upper[3] - lower[3])
  ];
}

// 年龄别体重沿用 WHO 对 |Z|>3 的调整算法，年龄别身长/身高用原始 LMS Z 分。
function assess(sex, metric, month, value) {
  const row = lmsRow(sex, metric, month);
  if (!row) return null;
  const z = zLms(value, row[0], row[1], row[2], metric === 'w');
  if (z === null || !isFinite(z)) return null;
  return { z, percentile: percentileText(z) };
}

function referenceCurves(sex, metric) {
  const table = reference.lms[sex];
  if (!table || !table[metric]) return [];
  const rows = table[metric];
  return Z_LINES.map(z => ({
    z,
    points: rows.map((row, month) => ({ month, value: calcValueAtZ(row[0], row[1], row[2], z) }))
  }));
}

function lengthReferenceCurves(sex, table) {
  const rows = reference.lengthLms[table] && reference.lengthLms[table][sex];
  if (!rows) return [];
  return Z_LINES.map(z => ({
    z,
    points: rows.map(row => ({ x: row[0], value: calcValueAtZ(row[1], row[2], row[3], z) }))
  }));
}

function round2(value) {
  return value === null || !isFinite(value) ? null : Math.round(value * 100) / 100;
}

function assessAll(input) {
  const sex = input.sex;
  const ageMissing = input.ageMonths === '' || input.ageMonths === undefined || input.ageMonths === null;
  const ageMonths = Number(input.ageMonths);
  const weightMissing = input.weight === undefined || input.weight === null || String(input.weight).trim() === '';
  const rawWeight = weightMissing ? null : Number(input.weight);
  const weightValid = rawWeight !== null && rawWeight > 0 && rawWeight <= 30;
  const weightError = !weightMissing && !weightValid ? '请填写有效体重（0–30 kg）' : '';
  const weight = weightValid ? rawWeight : null;
  const lengthHeight = Number(input.lengthHeight);
  const head = input.head === '' || input.head === undefined || input.head === null ? null : Number(input.head);
  if (sex !== 'M' && sex !== 'F') throw new Error('请选择男孩或女孩');
  if (ageMissing || !Number.isInteger(ageMonths) || ageMonths < 0 || ageMonths > reference.maxMonth) {
    throw new Error(`月龄请输入 0–${reference.maxMonth} 的整数`);
  }
  if (weightError && !input.allowPartial) throw new Error(weightError);
  if (!(lengthHeight > 0 && lengthHeight <= 120)) throw new Error('请填写有效身长或身高（0–120 cm）');
  if (head !== null && !(head > 0 && head <= 60)) throw new Error('头围数值无效（0–60 cm）');

  const weightResult = weightValid ? assess(sex, 'w', ageMonths, weight) : null;
  const lengthResult = assess(sex, 'lh', ageMonths, lengthHeight);
  const headResult = head === null ? null : assess(sex, 'hc', ageMonths, head);
  const isLength = ageMonths < 24;
  const table = isLength ? 'wfl' : 'wfh';
  const lengthRow = rowByLength(sex, table, lengthHeight);
  const whzRaw = lengthRow && weightValid ? zLms(weight, lengthRow[1], lengthRow[2], lengthRow[3], true) : null;

  return {
    sex,
    ageMonths,
    weight,
    weightError,
    lengthHeight,
    head,
    isLength,
    waz: round2(weightResult && weightResult.z),
    lhaz: round2(lengthResult && lengthResult.z),
    whz: round2(whzRaw),
    hcz: round2(headResult && headResult.z),
    wazRaw: weightResult && weightResult.z,
    lhazRaw: lengthResult && lengthResult.z,
    whzRaw,
    hczRaw: headResult && headResult.z,
    weightPercentile: weightResult ? weightResult.percentile : '',
    lengthPercentile: lengthResult ? lengthResult.percentile : '',
    whPercentile: percentileText(whzRaw),
    headPercentile: headResult ? headResult.percentile : ''
  };
}

export default {
  ageInMonths,
  ageInExactMonths,
  assess,
  assessAll,
  calcValueAtZ,
  datasetSha256: reference.datasetSha256,
  lengthReferenceCurves,
  hcMaxMonth: reference.hcMaxMonth,
  maxMonth: reference.maxMonth,
  percentileText,
  referenceCurves,
  subsetSha256: reference.subsetSha256,
  zLms,
  Z_LINES
};
