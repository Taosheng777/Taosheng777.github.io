// 自动生成：scripts/sync-miniprogram.mjs；来源 1.5.1 骨龄圆点修订。请勿手改。
import dependency0 from './growth-4-18-data.js';
// 4–18 岁工具只做离线单次计算，不保存输入。
// 数据由 scripts/export-growth-4-18-miniprogram.mjs 机械生成，算法不依赖页面状态。
const dataset = dependency0;

const MIN_MONTH = 48;
const MAX_MONTH = 216;
const Z_LINES = [-3, -2, -1, 0, 1, 2, 3];
const RANGES = {
  cn: { hfa: [MIN_MONTH, MAX_MONTH], wfa: [MIN_MONTH, MAX_MONTH], bfa: [MIN_MONTH, MAX_MONTH] },
  who: { hfa: [MIN_MONTH, MAX_MONTH], wfa: [MIN_MONTH, 120], bfa: [MIN_MONTH, MAX_MONTH] }
};

function lookupLMS(rows, month) {
  if (!rows || rows.length === 0 || month < rows[0][0] || month > rows[rows.length - 1][0]) return null;
  let low = 0;
  let high = rows.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (rows[middle][0] === month) return { l: rows[middle][1], m: rows[middle][2], s: rows[middle][3] };
    if (rows[middle][0] < month) low = middle + 1;
    else high = middle - 1;
  }
  const before = rows[high];
  const after = rows[low];
  const ratio = (month - before[0]) / (after[0] - before[0]);
  return {
    l: before[1] + (after[1] - before[1]) * ratio,
    m: before[2] + (after[2] - before[2]) * ratio,
    s: before[3] + (after[3] - before[3]) * ratio
  };
}

function calcValueAtZ(l, m, s, z) {
  if (Math.abs(l) < 1e-12) return m * Math.exp(s * z);
  const base = 1 + l * s * z;
  return base > 0 ? m * Math.pow(base, 1 / l) : NaN;
}

// 两套 4–18 岁参照均使用原始 LMS Z，不做 |Z|>3 调整。
function zLms(value, l, m, s) {
  if (!(value > 0) || !(m > 0) || !(s > 0) || !Number.isFinite(l)) return null;
  const z = Math.abs(l) < 1e-7
    ? Math.log(value / m) / s
    : (Math.pow(value / m, l) - 1) / (l * s);
  return Number.isFinite(z) ? z : null;
}

function erf(value) {
  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * absolute);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-absolute * absolute);
  return sign * y;
}

function percentileText(z) {
  if (z === null || z === undefined || !Number.isFinite(z)) return '';
  const percentile = 100 * 0.5 * (1 + erf(z / Math.SQRT2));
  if (percentile < 0.1) return '<P0.1';
  if (percentile > 99.9) return '>P99.9';
  return `P${percentile.toFixed(1)}`;
}

function rowsFor(standard, sex, metric) {
  return dataset[standard] && dataset[standard][sex] && dataset[standard][sex][metric]
    ? dataset[standard][sex][metric]
    : null;
}

function rangeFor(standard, metric) {
  return RANGES[standard] && RANGES[standard][metric] ? RANGES[standard][metric] : null;
}

function assess(standard, sex, metric, month, value) {
  const rows = rowsFor(standard, sex, metric);
  const lms = lookupLMS(rows, month);
  if (!lms) return null;
  const z = zLms(value, lms.l, lms.m, lms.s);
  if (z === null) return null;
  return { value, z, percentile: percentileText(z), lms };
}

function referenceCurves(standard, sex, metric) {
  const rows = rowsFor(standard, sex, metric);
  const range = rangeFor(standard, metric);
  if (!rows || !range) return [];
  const points = rows.filter(row => row[0] >= range[0] && row[0] <= range[1]);
  return Z_LINES.map(z => ({
    z,
    points: points.map(row => ({ month: row[0], value: calcValueAtZ(row[1], row[2], row[3], z) }))
  }));
}

function classifyWeight(standard, sex, month, bmi, z) {
  // 保留历史2009表的原始判读用于旧网页对账；当前页面6–18岁完整BMI判读
  // 使用 growth-interpretation.bodyType 的 WS/T456—2014 / WS/T586—2018。
  if (bmi === null || bmi === undefined || !Number.isFinite(bmi)) return null;
  if (standard === 'cn') {
    const table = dataset.cnCutoffs && dataset.cnCutoffs[sex];
    if (!table) return null;
    const band = Math.floor((month / 12) * 2) / 2;
    let row = null;
    for (const candidate of table) {
      if (candidate[0] <= band + 1e-9) row = candidate;
      else break;
    }
    if (!row) return null;
    const [bandAge, overweight, obese] = row;
    const ageNote = month < 72 ? '；4–5 岁界值不属于 WS/T 586—2018 适用范围，仅作参考' : '';
    const basis = `${bandAge.toFixed(1)} 岁组界值：超重 ${overweight}、肥胖 ${obese} kg/m²${ageNote}`;
    if (bmi >= obese) return { label: '肥胖', token: 'high', basis };
    if (bmi >= overweight) return { label: '超重', token: 'attention', basis };
    return { label: '未达超重界值', token: 'muted', basis: `${basis}；尚未评价消瘦，不代表体型正常` };
  }
  if (z === null || z === undefined || !Number.isFinite(z)) return null;
  // WHO 的超重/肥胖判定口径本身按年龄分段：48–60 月龄取 0–5 岁标准（+2SD/+3SD），
  // 61 月龄起取 2007 年 5–19 岁参照（+1SD/+2SD）；消瘦侧两段一致，不随年龄切换。
  const under5 = month <= 60;
  const obeseAt = under5 ? 3 : 2;
  const overweightAt = under5 ? 2 : 1;
  const basis = under5
    ? 'WHO 0–5 岁参照：BMI-for-age Z > +2SD 超重、> +3SD 肥胖、< −2SD 消瘦、< −3SD 重度消瘦'
    : 'WHO 5–19 岁参照：BMI-for-age Z > +1SD 超重、> +2SD 肥胖、< −2SD 消瘦、< −3SD 重度消瘦';
  if (z > obeseAt) return { label: '肥胖', token: 'high', basis };
  if (z > overweightAt) return { label: '超重', token: 'attention', basis };
  if (z < -3) return { label: '重度消瘦', token: 'high', basis };
  if (z < -2) return { label: '消瘦', token: 'attention', basis };
  return { label: '在正常范围', token: 'normal', basis };
}

function readNumber(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function assessAll(input) {
  const standard = input.standard;
  const sex = input.sex;
  const years = readNumber(input.ageYears);
  const months = input.ageMonths === '' || input.ageMonths === undefined || input.ageMonths === null
    ? 0
    : readNumber(input.ageMonths);
  const height = readNumber(input.height);
  const weight = readNumber(input.weight);
  if (standard !== 'cn' && standard !== 'who') throw new Error('请选择中国或 WHO 参照');
  if (sex !== 'M' && sex !== 'F') throw new Error('请选择男孩或女孩');
  if (years === null) throw new Error('请填写年龄');
  if (!Number.isInteger(years) || !Number.isInteger(months)) throw new Error('年龄请填整数：岁 4–18，月 0–11');
  if (months < 0 || months > 11) throw new Error('月龄请填 0–11 的整数');
  const month = years * 12 + months;
  if (month < MIN_MONTH || month > MAX_MONTH) throw new Error('本工具覆盖 4 岁 0 月至 18 岁 0 月');
  if (height === null || !(height >= 80 && height <= 220)) throw new Error('身高请填 80–220 cm 之间的数值');
  const weightValid = weight !== null && weight >= 8 && weight <= 200;
  const weightError = weight !== null && !weightValid ? '体重请填 8–200 kg 之间的数值' : '';
  if (weightError && !input.allowPartial) throw new Error(weightError);

  const bmi = weightValid ? weight / Math.pow(height / 100, 2) : null;
  const values = { hfa: height, wfa: weightValid ? weight : null, bfa: bmi };
  const results = {};
  for (const metric of ['hfa', 'wfa', 'bfa']) {
    const range = rangeFor(standard, metric);
    const rows = rowsFor(standard, sex, metric);
    if (values[metric] === null) {
      results[metric] = { state: weightError ? 'invalid-input' : 'missing-input', value: null, z: null, percentile: '', lms: null, message: weightError || '未输入体重，本项未计算' };
      continue;
    }
    if (month < range[0] || month > range[1]) {
      results[metric] = { state: 'out-of-range', from: range[0], to: range[1], value: values[metric], z: null, percentile: '', lms: null };
      continue;
    }
    const lms = lookupLMS(rows, month);
    const z = lms ? zLms(values[metric], lms.l, lms.m, lms.s) : null;
    results[metric] = z === null
      ? { state: 'invalid', value: values[metric], z: null, percentile: '', lms: null }
      : { state: 'ok', value: values[metric], z, percentile: percentileText(z), lms };
  }
  results.bfa.weightStatus = classifyWeight(standard, sex, month, bmi, results.bfa.z);
  return { standard, sex, ageYears: years, ageMonths: months, month, height, weight: weightValid ? weight : null, bmi, weightError, results };
}

export default {
  MIN_MONTH,
  MAX_MONTH,
  RANGES,
  Z_LINES,
  assess,
  assessAll,
  calcValueAtZ,
  classifyWeight,
  dataset,
  lookupLMS,
  percentileText,
  referenceCurves,
  rowsFor,
  zLms
};
