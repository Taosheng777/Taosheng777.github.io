// 自动生成：scripts/sync-miniprogram.mjs；来源 1.5.1 骨龄圆点修订。请勿手改。
import dependency0 from './growth-4-18.js';
// 单次骨龄投点复用年龄别身高参照，不将其解释为按骨龄分组的常模。
const growth = dependency0;

function assessBoneAge(measurement, input) {
  const raw = input === undefined || input === null ? '' : String(input).trim();
  if (!raw) return null;
  if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw) || !Number.isFinite(Number(raw) * 12) || Number(raw) <= 0) {
    return { state: 'invalid', message: '骨龄请填写大于 0 的小数岁，例如 8.5 表示 8 岁半。', reference: null };
  }
  const years = Number(raw);
  const month = years * 12;
  const range = growth.RANGES[measurement.standard].hfa;
  const inRange = month >= range[0] && month <= range[1];
  const reference = inRange ? growth.assess(measurement.standard, measurement.sex, 'hfa', month, measurement.height) : null;
  const differenceYears = (month - measurement.month) / 12;
  return {
    state: reference ? 'ok' : 'out-of-range',
    years,
    month,
    differenceYears,
    differenceText: Math.abs(differenceYears) < 1e-9
      ? '与实际年龄相同'
      : `较实际年龄${differenceYears > 0 ? '大' : '小'} ${Math.abs(differenceYears).toFixed(2)} 岁`,
    reference,
    message: reference ? '' : '骨龄超出本图 4–18 岁参照范围，暂不绘制骨龄点或外推参照值；实际年龄结果仍可查看。'
  };
}

export default { assessBoneAge };
