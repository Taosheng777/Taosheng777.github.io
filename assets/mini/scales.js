// 自动生成：scripts/sync-miniprogram.mjs；来源 1.5.1 骨龄圆点修订。请勿手改。
import dependency0 from './scale-data.js';
import dependency1 from './conners-norms.js';
import dependency2 from './respiratory-data.js';
import dependency3 from './child-scale-data.js';
import dependency4 from './child-scales.js';
/* 量表计分引擎。
   新增分龄量表通过 child-scale-data / child-scales 独立接入；呼吸量表见 respiratory-data。
   既有十表的题目、选项、分档、题组、安全分支与来源说明来自 services/scale-data.js，
   该文件由 scripts/export-scales-miniprogram.mjs 从 reference/mind/ 的网页 v1.9.0
   冻结副本机械生成，本文件不重复定义任何题目内容。
   计分口径与网页逐字段一致，由 tests/fixtures/scale-parity.json 强制对账。
   唯一有意的差异：ASQ 在前四项均为“否”时，第 5 题必须归位为 -1，
   小程序这里比网页更严，防止风险分支被残留答案静默吞掉。 */
const SCALE_DATA = dependency0;
const CONNERS_NORMS = dependency1;
const RESPIRATORY_DATA = dependency2;
const CHILD_DATA = dependency3;
const { scoreChildScale } = dependency4;

const CONNERS_CALCULATOR = {
  code: 'Conners',
  title: 'Conners T 分数换算',
  subtitle: '输入正版报告中的 T 分数',
  group: 'tool',
  kind: '换算工具',
  agePill: '需要正版报告',
  cardHint: '把正版报告里的 T 分数换算成同组儿童中的百分位，不依赖任何常模。',
  mode: 'calculator'
};

const SCALES = Object.freeze(
  Object.assign({}, SCALE_DATA.scales, RESPIRATORY_DATA.scales, CHILD_DATA.scales, { conners: CONNERS_CALCULATOR })
);

/** 量表列表页的分组与顺序：门诊里第一步的判断是「手机递给谁」。 */
const SCALE_GROUPS = Object.freeze([
  { key: 'self', label: '本人自评', hint: '由受测者自己作答', keys: ['dsrsc', 'scared', 'phq9', 'gad7', 'phq2', 'gad2', 'asq', 'sas', 'sds'] },
  { key: 'parent', label: '家长评定', hint: '由家长或主要照顾者填写', keys: ['pas', 'sdq23', 'sdq417', 'snap26', 'psc17', 'connersPsq'] },
  { key: 'tool', label: '换算工具', hint: '把已有报告的分数换成百分位', keys: ['conners'] }
]);

const RESPIRATORY_GROUPS = RESPIRATORY_DATA.groups;

const FOOTNOTE = SCALE_DATA.footnote;

const T_SCORE_ELEVATED = 70;

function getScale(key) {
  return Object.prototype.hasOwnProperty.call(SCALES, key) ? SCALES[key] : undefined;
}

function optionsForItem(scale, index) {
  return scale.itemOptions ? scale.itemOptions[index] : scale.options;
}

function allowedValues(scale, index) {
  return new Set(optionsForItem(scale, index).map(option => option.value));
}

function validateAnswers(scale, answers) {
  if (!Array.isArray(answers) || answers.length !== scale.items.length) {
    throw new Error(`${scale.code} 需要 ${scale.items.length} 个完整答案`);
  }
  if (scale.scoring === 'asq') {
    const allowed = allowedValues(scale, 0);
    for (let index = 0; index < 4; index += 1) {
      if (!Number.isInteger(answers[index]) || !allowed.has(answers[index])) throw new Error('前 4 题都需要回答');
    }
    const positive = answers.slice(0, 4).some(value => value !== 0);
    if (positive && (!Number.isInteger(answers[4]) || !allowed.has(answers[4]))) throw new Error('阳性筛查需要回答第 5 题');
    if (!positive && answers[4] !== -1) throw new Error('前四项均为“否”时，第 5 题不应作答');
    return;
  }
  for (let index = 0; index < answers.length; index += 1) {
    const value = answers[index];
    const allowed = allowedValues(scale, index);
    if (Number.isInteger(value) && allowed.has(value)) continue;
    const values = [...allowed];
    throw new Error(`每个答案都必须是 ${Math.min(...values)} 到 ${Math.max(...values)} 的整数`);
  }
}

function bandFor(scale, total) {
  return scale.bands ? scale.bands.find(item => total <= item.max) : undefined;
}

function thresholdText(positive) {
  return positive ? '达到常用的进一步评估阈值' : '未达到常用的进一步评估阈值';
}

function erf(value) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-x * x);
  return sign * y;
}

function percentileFromT(tScore) {
  const z = (tScore - 50) / 10;
  return 100 * 0.5 * (1 + erf(z / Math.SQRT2));
}

function formatPercentileFromT(tScore) {
  const percentile = percentileFromT(tScore);
  if (percentile < 0.1) return '< P0.1';
  if (percentile > 99.9) return '> P99.9';
  return `P${percentile.toFixed(1)}`;
}

function scoreSum(scale, answers) {
  const total = answers.reduce((sum, value) => sum + value, 0);
  const positive = total >= scale.positiveAt;
  return {
    total,
    totalText: String(total),
    maxScore: scale.maxScore,
    band: bandFor(scale, total),
    positive,
    positiveText: thresholdText(positive),
    safetyFlag: Boolean(scale.safety) && answers[scale.safety.itemIndex] > 0,
    details: []
  };
}

function scoreZung(scale, answers) {
  const reversed = new Set(scale.reversed);
  const raw = answers.reduce((sum, value, index) => sum + (reversed.has(index + 1) ? 5 - value : value), 0);
  const total = raw * 1.25;
  const positive = total >= scale.positiveAt;
  return {
    total,
    totalText: total.toFixed(total % 1 === 0 ? 0 : 2),
    maxScore: scale.maxScore,
    band: bandFor(scale, total),
    positive,
    positiveText: thresholdText(positive),
    safetyFlag: Boolean(scale.safety) && answers[scale.safety.itemIndex] > scale.options[0].value,
    details: [
      { label: '粗分', value: `${raw} / ${scale.rawMax}` },
      { label: '标准分', value: `${total.toFixed(2)}（粗分 × 1.25）` }
    ]
  };
}

/** 只在量表声明了常模、上下文给全年龄与性别、且年龄落在覆盖区间时才返回；区间外不外推。 */
function lookupNorms(scale, context) {
  if (scale.norms !== 'conners' || !context) return null;
  const ageYears = context.ageYears;
  const sex = context.sex;
  if (sex !== 'M' && sex !== 'F') return null;
  if (!Number.isInteger(ageYears)) return null;
  const range = CONNERS_NORMS.ageRange;
  if (ageYears < range[0] || ageYears > range[1]) return null;
  const bySex = CONNERS_NORMS.norms[sex];
  const table = bySex ? bySex[ageYears] : undefined;
  return table ? { table, sampleSize: CONNERS_NORMS.sampleSizes[sex][ageYears] } : null;
}

function scoreGroups(scale, answers, context) {
  const total = answers.reduce((sum, value) => sum + value, 0);
  const normEntry = lookupNorms(scale, context);
  let anyFlagged = false;
  const rawFlaggedLabels = [];
  const topValue = scale.options[scale.options.length - 1].value;
  const details = scale.groups.map((group, groupIndex) => {
    const sum = group.items.reduce((acc, number) => acc + answers[number - 1], 0);
    const mean = sum / group.items.length;
    const useSum = group.mode === 'sum';
    const compared = useSum ? sum : mean;
    const rawFlagged = group.cutoff !== undefined && compared >= group.cutoff;
    let flagged = rawFlagged;
    if (rawFlagged) rawFlaggedLabels.push(group.label);
    const shown = useSum
      ? `${sum} / ${group.items.length * topValue}`
      : `均分 ${mean.toFixed(2)}（总分 ${sum} / ${group.items.length} 题）`;
    const cutoffText = group.cutoff === undefined
      ? ''
      : ` · 切截点 ${group.cutoff} · ${flagged ? '已达到' : '未达到'}`;

    let tScoreText = '';
    const norm = normEntry ? normEntry.table[groupIndex] : undefined;
    if (norm) {
      const mu = norm[0];
      const sigma = norm[1];
      const tScore = 50 + 10 * ((mean - mu) / sigma);
      if (tScore >= T_SCORE_ELEVATED) flagged = true;
      tScoreText = ` · T ${tScore.toFixed(1)}（${formatPercentileFromT(tScore)}）`;
    }

    if (flagged) anyFlagged = true;
    return { label: group.label, value: `${shown}${tScoreText}${cutoffText}`, flagged };
  });
  const interpretationComplete = scale.norms !== 'conners' || Boolean(normEntry);
  const positive = scale.positiveAt !== undefined ? total >= scale.positiveAt : anyFlagged;
  let band;
  let positiveText;
  if (!interpretationComplete) {
    const hasRawFlag = rawFlaggedLabels.length > 0;
    band = {
      label: hasRawFlag ? '部分题组达到切截点，常模判读未完成' : '未完成常模判读',
      token: hasRawFlag ? 'moderate' : 'mild',
      guidance: hasRawFlag
        ? `${rawFlaggedLabels.join('、')}达到自身切截点；其余因子没有原始切点，未换算 T 分数时不能判断是否偏高。`
        : '未填写有效年龄与性别，前五个因子只有均分、不能判断是否偏高；多动指数未达到自身切截点。'
    };
    positiveText = hasRawFlag
      ? `${rawFlaggedLabels.join('、')}达到切截点；其余因子未做常模判读`
      : '前五个因子未做常模判读；多动指数未达到切截点';
  } else {
    band = {
      label: anyFlagged ? '有题组达到常用切截点' : '各题组均未达到常用切截点',
      token: anyFlagged ? 'moderate' : 'minimal',
      guidance: anyFlagged
        ? '有题组达到常用切截点。这是筛查线索，不是诊断；建议带着这份结果找儿科、儿童精神科或发育行为专业人员进一步评估。'
        : '本次各题组都没有达到常用切截点。筛查结果正常不排除问题，如果你在日常中仍有担心，请直接找专业人员当面评估。'
    };
    positiveText = anyFlagged ? '建议就达到切截点的方向进一步评估' : '本次未触发任何切截点';
  }
  return {
    total,
    totalText: String(total),
    maxScore: scale.maxScore,
    normsApplied: Boolean(normEntry),
    interpretationComplete,
    normsNote: scale.norms !== 'conners'
      ? ''
      : normEntry
        ? `T 分数按 ${context.ageYears} 岁${context.sex === 'M' ? '男' : '女'}童常模换算（该组样本 ${normEntry.sampleSize} 人）。`
        : '未换算 T 分数：需要填写年龄与性别，且年龄落在常模覆盖的 4–17 岁。',
    band,
    positive,
    positiveText,
    safetyFlag: false,
    details
  };
}

function scoreAsq(scale, answers) {
  const firstFour = answers.slice(0, 4);
  const total = firstFour.filter(value => value !== 0).length;
  const positive = total > 0;
  const acute = positive && answers[4] === 1;
  return {
    total,
    totalText: String(total),
    maxScore: scale.maxScore,
    band: acute
      ? { label: '当前想法项为“是”', token: 'high', guidance: '第 5 题为“是”表示现在就存在自杀想法。请不要独处，立即联系身边可信任的人和专业人员。' }
      : positive
        ? { label: '前四项存在阳性或未回答', token: 'moderate', guidance: '前四项出现阳性，需要由专业人员完成一次简短的安全评估，不能就此结束。' }
        : { label: '前四项均为“否”', token: 'minimal', guidance: '本次未触发阳性条件。筛查为阴性不代表以后不会有；如果之后出现相关念头，请随时找人说。' },
    positive,
    acute,
    positiveText: acute ? '需要立即启动现场安全流程' : positive ? '需要进一步安全评估' : '本次未触发阳性条件',
    safetyFlag: positive,
    safetyTitle: acute ? '请立刻找人，不要独处' : '这一项需要有人陪你一起看',
    safetyBody: acute
      ? [
        '你在第 5 题选择了“是”，这表示现在就存在自杀想法。请立即告诉身边可信任的人，并确保你不是一个人待着。',
        '请尽快联系精神科、心理科专业人员，或拨打全国统一心理援助热线 12356。如果你担心自己会立即采取行动，请不要独处，马上告诉身边可信任的人，并拨打 120 或 110，或直接前往急诊。'
      ]
      : [
        '前四项中出现了“是”或“不愿回答”。无论后面怎么答，这一部分都值得由专业人员完成一次简短的安全评估。',
        '请尽快联系精神科、心理科专业人员，或拨打全国统一心理援助热线 12356。如果你担心自己会立即采取行动，请不要独处，马上告诉身边可信任的人，并拨打 120 或 110，或直接前往急诊。'
      ],
    details: [{ label: '前四项阳性条目数', value: `${total} / 4` }]
  };
}

/** 控制类量表：分数越高代表控制越好，阳性条件是“不高于”某条界线。 */
function scoreControl(scale, answers) {
  const total = answers.reduce((sum, value) => sum + value, 0);
  const positive = total <= scale.positiveAtMost;
  const details = (scale.groups || []).map(group => {
    const sum = group.items.reduce((acc, number) => acc + answers[number - 1], 0);
    // 选项按纸质原表的左右顺序排列，最后一个不一定是满分（C-ACT 家长题最右是 0 分），
    // 因此题组上限必须取每题选项的最大值，不能取末位。
    const top = group.items.reduce((acc, number) => {
      const values = optionsForItem(scale, number - 1).map(option => option.value);
      return acc + Math.max(...values);
    }, 0);
    return { label: group.label, value: `${sum} / ${top}`, flagged: false };
  });
  return {
    total,
    totalText: String(total),
    maxScore: scale.maxScore,
    minScore: scale.minScore,
    band: bandFor(scale, total),
    positive,
    positiveText: positive ? '未达到控制良好的常用界值' : '达到控制良好的常用界值',
    safetyFlag: false,
    details
  };
}

function scoreScale(scaleKey, answers, context) {
  const scale = getScale(scaleKey);
  if (!scale) throw new Error(`未知量表：${scaleKey}`);
  if (scale.mode === 'calculator') throw new Error(`${scale.code} 请使用 T 分数换算页`);
  validateAnswers(scale, answers);
  if (scale.scoring === 'child') return scoreChildScale(scale, answers, context);
  if (scale.scoring === 'sum') return scoreSum(scale, answers);
  if (scale.scoring === 'zung') return scoreZung(scale, answers);
  if (scale.scoring === 'groups') return scoreGroups(scale, answers, context);
  if (scale.scoring === 'asq') return scoreAsq(scale, answers);
  if (scale.scoring === 'control') return scoreControl(scale, answers);
  throw new Error(`未知计分方式：${scale.scoring}`);
}

function convertConnersTScore(input) {
  const tScore = Number(input);
  if (!Number.isFinite(tScore) || tScore < 20 || tScore > 100) throw new Error('T 分数请输入 20–100 的数值');
  return { tScore, percentile: formatPercentileFromT(tScore) };
}

export default {
  FOOTNOTE,
  RESPIRATORY_GROUPS,
  SCALES,
  SCALE_GROUPS,
  convertConnersTScore,
  getScale,
  optionsForItem,
  scoreScale
};
