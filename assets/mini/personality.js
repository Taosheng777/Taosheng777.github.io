// 自动生成：scripts/sync-miniprogram.mjs；来源 1.5.1 骨龄圆点修订。请勿手改。
import dependency0 from './personality-data.js';
import dependency1 from './personality-report.js';
/* 16 型人格测试的计分。
   题库在 services/personality-data.js，当前解释层在 services/personality-report.js。

   作答值沿用参考页面的七级刻度：-3 是最强的「同意」，+3 是最强的「不认同」，0 为中立。
   同意强度 agree = -value；reverse 题把同意计到维度的第二个字母上。
   每个维度 12 题，维度分值域为 -36 到 36。 */
const { DIMENSIONS, ITEMS } = dependency0;
const { interpretDimension, buildReport } = dependency1;

const DIMENSION_BY_KEY = DIMENSIONS.reduce((all, dimension) => {
  all[dimension.key] = dimension;
  return all;
}, Object.create(null));

const MAX_PER_DIMENSION = 36;

/** identity 的第二极与 nature 的第一极都是字母 T，解读与短句按维度区分。 */
function facetKey(dimensionKey, letter) {
  return dimensionKey === 'identity' && letter === 'T' ? 'TURBULENT' : letter;
}

function isAnswered(value) {
  return Number.isInteger(value) && value >= -3 && value <= 3;
}

function validate(answers) {
  if (!Array.isArray(answers) || answers.length !== ITEMS.length) {
    throw new Error(`需要 ${ITEMS.length} 个完整答案`);
  }
  for (let index = 0; index < answers.length; index += 1) {
    if (!isAnswered(answers[index])) throw new Error(`第 ${index + 1} 题还没有作答`);
  }
}

/** 维度原始分：正数偏向第一个字母，负数偏向第二个字母。 */
function dimensionScores(answers) {
  const scores = {};
  for (const dimension of DIMENSIONS) scores[dimension.key] = 0;
  ITEMS.forEach((item, index) => {
    const agree = -answers[index];
    scores[item.dimension] += item.reverse ? -agree : agree;
  });
  return scores;
}

/** 把 -36..36 映射成第一个字母一侧的百分比，0 分对应 50%。 */
function toPercent(score) {
  return Math.round(((score + MAX_PER_DIMENSION) / (MAX_PER_DIMENSION * 2)) * 100);
}

function scorePersonality(answers) {
  validate(answers);
  const scores = dimensionScores(answers);
  const facets = DIMENSIONS.map(dimension => {
    const score = scores[dimension.key];
    const positivePercent = toPercent(score);
    const leansPositive = score >= 0;
    const letter = leansPositive ? dimension.positive : dimension.negative;
    return {
      key: dimension.key,
      title: dimension.title,
      note: dimension.note,
      color: dimension.color,
      onColor: dimension.onColor,
      score,
      letter,
      label: leansPositive ? dimension.positiveLabel : dimension.negativeLabel,
      /* 坐标轴固定：左端是第一个字母，右端是第二个字母。 */
      leftLabel: dimension.positiveLabel,
      rightLabel: dimension.negativeLabel,
      /* 标记点距左端的百分比：第一极越强，点越靠左。 */
      axisLeft: 100 - positivePercent,
      percent: leansPositive ? positivePercent : 100 - positivePercent,
      positivePercent,
      ...interpretDimension(dimension.key, score)
    };
  });

  const letters = facets.slice(0, 4).map(facet => facet.letter).join('');
  const identity = facets[4];
  const code = `${letters}-${identity.letter}`;
  // code / letters 保留旧兼容语义；页面只读取解释层的展示字段。
  return { code, letters, identityLetter: identity.letter, facets, ...buildReport(facets) };
}

export default {
  DIMENSIONS,
  DIMENSION_BY_KEY,
  MAX_PER_DIMENSION,
  isAnswered,
  facetKey,
  dimensionScores,
  toPercent,
  scorePersonality
};
