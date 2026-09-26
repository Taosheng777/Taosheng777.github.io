// 自动生成：scripts/sync-miniprogram.mjs；来源 1.5.1 骨龄圆点修订。请勿手改。
import dependency0 from './growth-4-18.js';
import dependency1 from './bmi-thinness-data.js';
import dependency2 from './bmi-overweight-data.js';
// 只解释当前指标的位置，不推断病因、剩余生长量或成年结局。
const growth = dependency0;
const thinnessData = dependency1;
const overweightData = dependency2;
function position(z, metric) {
  if (!Number.isFinite(z)) return { label: '当前参照不可用', token: 'muted', basis: '' };
  const basis = `年龄别参照：Z ${z.toFixed(2)}；−2 至 +2 SD 为常见范围`;
  if (metric === 'hfa' || metric === 'lh') {
    if (z < -3) return { label: '身高明显偏矮', token: 'high', basis: `${basis}；低于 −3 SD，进入矮小筛查范围` };
    if (z < -2) return { label: '身高偏矮', token: 'attention', basis: `${basis}；低于 −2 SD，进入矮小筛查范围` };
    if (z > 3) return { label: '身高明显偏高', token: 'attention', basis };
    if (z > 2) return { label: '身高偏高', token: 'attention', basis };
    return { label: '身高在常见范围', token: 'normal', basis };
  }
  const noun = metric === 'hc' ? '头围' : metric === 'bfa' ? 'BMI' : '同龄体重';
  const suffix = noun === '同龄体重' ? '；年龄别体重不等同于消瘦或肥胖判定' : '';
  return { label: `${noun}${z < -2 ? '偏低' : z > 2 ? '偏高' : '在常见范围'}`, token: Math.abs(z) > 2 ? 'attention' : 'normal', basis: basis + suffix };
}

function weightForLength(z) {
  if (!Number.isFinite(z)) return { label: '未计算体型', token: 'muted', basis: '' };
  const basis = 'WHO 身长/身高别体重：低于 −2 SD 消瘦、低于 −3 SD 重度消瘦；高于 +2 SD 超重、高于 +3 SD 肥胖';
  if (z < -3) return { label: '重度消瘦范围', token: 'high', basis };
  if (z < -2) return { label: '消瘦范围', token: 'attention', basis };
  if (z > 3) return { label: '肥胖范围', token: 'high', basis };
  if (z > 2) return { label: '超重范围', token: 'attention', basis };
  return { label: '体型在常见范围', token: 'normal', basis };
}

function bodyType(standard, sex, month, bmi, z) {
  const base = growth.classifyWeight(standard, sex, month, bmi, z);
  if (!base || !Number.isFinite(bmi) || !(bmi > 0)) return { label: '体型暂不可用', token: 'muted', basis: '' };
  if (standard !== 'cn') return base;
  if (month < 72 || month > 216) return base.label === '超重' || base.label === '肥胖'
    ? { ...base, basis: `李辉等2009历史界值，仅作参考；${base.basis}` }
    : { label: '未达超重界值 · 尚未评价消瘦', token: 'muted', basis: base.basis };
  const upper = overweightData.rows[Math.floor((month - 72) / 6)];
  const overweight = sex === 'M' ? upper[1] : upper[3];
  const obese = sex === 'M' ? upper[2] : upper[4];
  const rounded = Math.round(bmi * 10) / 10;
  const upperBasis = `WS/T 586—2018 表1，${upper[0].toFixed(1)} 岁组；BMI 保留一位小数 ${rounded.toFixed(1)}，超重 ≥${overweight.toFixed(1)}，肥胖 ≥${obese.toFixed(1)} kg/m²。`;
  if (rounded >= obese) return { label: '肥胖', token: 'high', basis: upperBasis };
  if (rounded >= overweight) return { label: '超重', token: 'attention', basis: upperBasis };
  const { rows } = thinnessData;
  const row = rows[Math.min(23, Math.floor((month - 72) / 6))];
  const moderate = sex === 'M' ? row[1] : row[3];
  const mild = sex === 'M' ? row[2] : row[4];
  const basis = `WS/T 456—2014 表 B.1，${row[0].toFixed(1)} 岁组；BMI 保留一位小数 ${rounded.toFixed(1)}，中重度消瘦 ≤${moderate.toFixed(1)}，轻度消瘦至 ${mild.toFixed(1)} kg/m²。本项仅判断 BMI，不代表完整营养评价。`;
  if (rounded <= moderate) return { label: '中重度消瘦', token: 'high', basis };
  if (rounded <= mild) return { label: '轻度消瘦', token: 'attention', basis };
  return { label: 'BMI 在常见范围', token: 'normal', basis: `${basis} ${upperBasis} 未触及当前消瘦、超重或肥胖界值。` };
}
export default { position, weightForLength, bodyType };
