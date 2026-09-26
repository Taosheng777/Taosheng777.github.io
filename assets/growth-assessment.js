import ageService from './mini/age.js';
import who from './mini/who.js';
import growth from './mini/growth-4-18.js';
import bone from './mini/bone-age.js';
import interpretation from './mini/growth-interpretation.js';

export function resolveAge(input) {
  if (!ageService.isValidDate(input.measurementDate) || input.measurementDate > ageService.todayISO()) throw new Error('请填写不晚于今天的有效测量日期。');
  let age;
  if (input.ageInputMode === 'manual') {
    const years = String(input.ageYears ?? '');
    const months = String(input.ageMonths ?? '');
    if (!/^\d+$/.test(years) || (months !== '' && !/^\d+$/.test(months)) || Number(months) > 11) throw new Error('年龄请填整数：岁 0–18，月 0–11；不足1岁请填0岁。');
    const total = Number(years) * 12 + Number(months || 0);
    age = { state: 'ready', completedMonths: total, minMonths: total, maxMonths: total, precision: 'manual', label: `${Number(years)} 岁 ${Number(months || 0)} 个月`, rangeLabel: '' };
  } else {
    age = ageService.evaluateAge(input);
    if (age.state !== 'ready') throw new Error(age.message);
  }
  if (age.minMonths < 0 || age.maxMonths > 216) throw new Error('本工具覆盖出生至18岁0个月，请核对年龄。');
  if (age.minMonths < 48 && age.maxMonths >= 48) throw new Error('出生年月的可能年龄跨过4岁参照切换点，请补填出生日后自动匹配。');
  return age;
}

const specs = {
  hfa: ['年龄别身高', 'cm', 1], wfa: ['年龄别体重', 'kg', 2], bfa: ['年龄别 BMI', 'kg/m²', 2],
  lh: ['年龄别身长 / 身高', 'cm', 1], w: ['年龄别体重', 'kg', 2], hc: ['年龄别头围', 'cm', 1], wfl: ['身长 / 身高别体重', 'kg', 2]
};
function card(metric, value, z, percentile, message = '') {
  const [name, unit, decimals] = specs[metric];
  if (!Number.isFinite(value) || !Number.isFinite(z)) return { metric, name, value: '未计算', label: message || '当前参照不可用', token: 'muted', basis: '', z: null, percentile: '—' };
  return { metric, name, value: `${value.toFixed(decimals)} ${unit}`, z, percentile,
    ...(metric === 'wfl' ? interpretation.weightForLength(z) : interpretation.position(z, metric)) };
}
function makeAssessment(input, age, month) {
  if (month < 48) {
    const result = who.assessAll({ sex: input.sex, ageMonths: month, lengthHeight: input.height, weight: input.weight, head: input.head, allowPartial: true });
    const cards = [card('lh', result.lengthHeight, result.lhazRaw, result.lengthPercentile),
      card('w', result.weight, result.wazRaw, result.weightPercentile, result.weightError || '未输入体重'),
      card('wfl', result.weight, result.whzRaw, result.whPercentile, result.weightError || '未输入体重，体型未计算'),
      card('hc', result.head, result.hczRaw, result.headPercentile, '可选项未填写')];
    return { result, cards, mode: 'who03', reference: 'WHO 生长标准 · 4岁以下' };
  }
  const result = growth.assessAll({ standard: 'cn', sex: input.sex, ageYears: Math.floor(month / 12), ageMonths: month % 12, height: input.height, weight: input.weight, allowPartial: true });
  const cards = ['hfa', 'wfa', 'bfa'].map(metric => {
    const item = result.results[metric];
    return card(metric, item.value, item.z, item.percentile, item.message);
  });
  if (result.bmi !== null) Object.assign(cards[2], interpretation.bodyType('cn', input.sex, month, result.bmi, result.results.bfa.z));
  result.boneAge = bone.assessBoneAge(result, input.boneAgeYears);
  if (result.boneAge && result.boneAge.state !== 'invalid' && age.minMonths !== age.maxMonths) {
    result.boneAge.differenceText = `骨龄与实际年龄之差约 ${((result.boneAge.month - age.maxMonths) / 12).toFixed(2)} 至 ${((result.boneAge.month - age.minMonths) / 12).toFixed(2)} 岁`;
  }
  return { result, cards, mode: 'growth418', reference: '中国生长参照 · 4–18岁' };
}

export function assessGrowth(input) {
  const age = resolveAge(input);
  const assessment = makeAssessment(input, age, age.completedMonths);
  if (age.minMonths !== age.maxMonths) {
    const edges = [age.minMonths, age.maxMonths].map(month => makeAssessment(input, age, month));
    assessment.cards.forEach((item, i) => {
      if (edges[0].cards[i].label !== edges[1].cards[i].label ||
          (assessment.mode === 'who03' && (i === 0 || i === 2) && edges[0].result.isLength !== edges[1].result.isLength)) {
        Object.assign(item, { label: '补填出生日后判读', token: 'muted', basis: '可能年龄的分档或适用范围不同，当前图与数值仅按出生年月估算。' });
      }
    });
  }
  return { ...assessment, age };
}
