// 自动生成：scripts/sync-miniprogram.mjs；来源 1.5.1 骨龄圆点修订。请勿手改。

// 完整月龄沿用既有口径：测量日尚未到出生日期中的日时减一个月。
function todayISO(date = new Date()) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return '';
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysInMonth(year, month) {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function parseDate(value, precision) {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  const pattern = precision === 'month' ? /^(\d{4})-(\d{2})$/ : /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = raw.match(pattern);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = precision === 'month' ? 1 : Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day, raw };
}

function dateISO(date) {
  return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

function completedMonths(birth, measurement) {
  return (measurement.year - birth.year) * 12 + measurement.month - birth.month - (measurement.day < birth.day ? 1 : 0);
}

function ageLabel(months) {
  const years = Math.floor(months / 12);
  return years ? `${years} 岁 ${months % 12} 个月` : `${months} 个月`;
}

function evaluateAge(input = {}) {
  const precision = input.birthPrecision;
  const empty = {
    state: 'missing-input', message: '', completedMonths: null, minMonths: null, maxMonths: null,
    precision: precision === 'month' || precision === 'day' ? precision : null,
    estimatedBirthDate: null, label: '', rangeLabel: ''
  };
  const fail = (message, state = 'invalid-input') => ({ ...empty, state, message });
  const missing = value => value === null || value === undefined || (typeof value === 'string' && !value.trim());
  if (missing(input.birthDate)) return fail('请选择出生年月；知道完整日期时可补填日。', 'missing-input');
  if (missing(input.measurementDate)) return fail('请选择本次测量日期。', 'missing-input');
  if (precision !== 'month' && precision !== 'day') return fail('请选择出生年月或完整出生日期。');
  const birth = parseDate(input.birthDate, precision);
  if (!birth) return fail(precision === 'month' ? '出生年月无效，请按 YYYY-MM 填写真实年月。' : '出生日期无效，请核对年月日。');
  const measurement = parseDate(input.measurementDate, 'day');
  if (!measurement) return fail('测量日期无效，请核对年月日。');
  const today = parseDate(input.today === undefined ? todayISO() : input.today instanceof Date ? todayISO(input.today) : input.today, 'day');
  if (!today) return fail('当前日期无效，暂不能核对日期先后。');
  if (measurement.raw > today.raw) return fail('测量日期不能晚于今天。');
  if (dateISO(birth) > measurement.raw) return fail('出生日期不能晚于测量日期，请核对本次测量时间。');

  if (precision === 'day') {
    const months = completedMonths(birth, measurement);
    return { ...empty, state: 'ready', completedMonths: months, minMonths: months, maxMonths: months, label: ageLabel(months), rangeLabel: `${months} 月龄` };
  }

  const sameMonth = birth.year === measurement.year && birth.month === measurement.month;
  const lastDay = sameMonth ? measurement.day : daysInMonth(birth.year, birth.month);
  const latestBirth = { ...birth, day: lastDay };
  const estimate = { ...birth, day: Math.floor((lastDay + 1) / 2) };
  const minMonths = completedMonths(latestBirth, measurement);
  const maxMonths = completedMonths(birth, measurement);
  const months = completedMonths(estimate, measurement);
  return {
    ...empty, state: 'ready', message: '按出生年月估算；如年龄范围跨越适用或分档界线，请补填出生日期中的日。',
    completedMonths: months, minMonths, maxMonths, estimatedBirthDate: dateISO(estimate),
    label: `约 ${ageLabel(months)}（按出生年月估算）`,
    rangeLabel: minMonths === maxMonths ? `完整月龄为 ${minMonths} 个月，具体日龄未提供` : `可能为 ${minMonths}–${maxMonths} 月龄`
  };
}

function isValidDate(value) { return Boolean(parseDate(value, 'day')); }
export default { evaluateAge, todayISO, isValidDate };
