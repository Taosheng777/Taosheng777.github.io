// 自动生成：scripts/sync-miniprogram.mjs；来源 1.5.1 骨龄圆点修订。请勿手改。

const METHOD_ID = 'luo-1998-reference';
const METHOD_NAME = 'Luo 回归参考法';
const SOURCE_VERSION = 'Luo 1998 · PMID 9773847';
// 这是本工具的防误填范围，不代表原研究已验证的身高适用域。
const INPUT_HEIGHT_RANGE = [100, 230];
const LIMITATIONS = [
  '这是成年家族目标的估计，不能视为遗传上限或保证达到的身高。',
  '模型来自 1998 年瑞典研究；对当代中国个体的预测误差未在本工具中验证，个体预测范围未提供。',
  '父母有影响身高的疾病、极端身高或明显年龄相关身高下降时，结果的适用性受限。'
];

function calculateTargetHeight(input = {}) {
  const base = {
    state: 'missing-input', estimateCm: null, displayCm: null, methodId: METHOD_ID,
    sourceVersion: SOURCE_VERSION, interval: null, limitations: [...LIMITATIONS], message: ''
  };
  const fail = (state, message) => ({ ...base, state, message });
  if (input.sex === undefined || input.sex === null || input.sex === '') return fail('missing-input', '请选择男或女。');
  if (input.sex !== 'M' && input.sex !== 'F') return fail('invalid-input', '性别选项无效，请重新选择。');
  const values = [];
  for (const [field, label] of [['fatherHeight', '父亲'], ['motherHeight', '母亲']]) {
    const value = input[field];
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) return fail('missing-input', `请填写${label}身高。`);
    if ((typeof value !== 'string' && typeof value !== 'number') || !/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(String(value).trim()) || !Number.isFinite(Number(value))) {
      return fail('invalid-input', `${label}身高请填写以 cm 为单位的有效数值。`);
    }
    const height = Number(value);
    if (height < INPUT_HEIGHT_RANGE[0] || height > INPUT_HEIGHT_RANGE[1]) {
      return fail('out-of-domain', `请核对${label}身高。本工具接受 ${INPUT_HEIGHT_RANGE[0]}–${INPUT_HEIGHT_RANGE[1]} cm，超出时不自动计算。`);
    }
    values.push(height);
  }
  const mean = (values[0] + values[1]) / 2;
  const estimateCm = input.sex === 'M' ? 45.99 + 0.78 * mean : 37.85 + 0.75 * mean;
  if (mean < 163) base.limitations.push('原研究在父母平均身高低于 163 cm 的组别可能低估约 2 cm；本工具保留原公式，不另加修正值。');
  return { ...base, state: 'ready', estimateCm, displayCm: estimateCm.toFixed(1) };
}

export default { calculateTargetHeight, METHOD_ID, METHOD_NAME, SOURCE_VERSION, INPUT_HEIGHT_RANGE };
