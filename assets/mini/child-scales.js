// 自动生成：scripts/sync-miniprogram.mjs；来源 1.5.1 骨龄圆点修订。请勿手改。

// 新增分龄量表的纯计分函数；题目和规则由独立来源机械生成。
function scoreChildScale(scale, answers, context) {
  const age = context && context.ageYears;
  if (!Number.isInteger(age) || age < scale.ageRange[0] || age > scale.ageRange[1]) {
    throw new Error(`本表适用于 ${scale.ageRange[0]}–${scale.ageRange[1]} 岁，请填写范围内的整数年龄`);
  }
  const reversed = new Set(scale.reversed);
  const maximum = scale.options[scale.options.length - 1].value;
  const scoredItems = answers.map((value, index) => reversed.has(index + 1) ? maximum - value : value);
  const sums = scale.groups.map(group => group.items.reduce((sum, number) => sum + scoredItems[number - 1], 0));
  const isSdq = Boolean(scale.totalBands);
  const total = isSdq ? sums.slice(0, 4).reduce((a, b) => a + b, 0) : scoredItems.reduce((a, b) => a + b, 0);
  let positive = false;
  let label = '';
  let token = 'minimal';
  let positiveText = '';
  const bandLabels = ['接近参照均值', '略高', '较高', '很高'];
  const lowLabels = ['接近参照均值', '略低', '较低', '很低'];
  const details = scale.groups.map((group, index) => {
    const value = sums[index];
    let suffix = '';
    let flagged = false;
    if (group.bands) {
      const rank = group.bands.findIndex(limit => group.lowerIsConcern ? value >= limit : value <= limit);
      suffix = ` · ${(group.lowerIsConcern ? lowLabels : bandLabels)[rank]}`;
      flagged = rank >= 2;
    } else if (group.norm) {
      const threshold = Math.round((group.norm[0] + group.norm[1]) * 100) / 100;
      flagged = value >= threshold;
      suffix = flagged ? ' · 高于作者参考均值1个SD' : ' · 未达作者偏高参照';
    }
    return { label: group.label, value: `${value} / ${group.items.length * maximum}${suffix}`, rawScore: value, flagged };
  });
  if (isSdq) {
    const rank = scale.totalBands.findIndex(limit => total <= limit);
    positive = rank >= 2;
    token = ['minimal', 'mild', 'moderate', 'high'][rank];
    label = `困难总分${bandLabels[rank]}`;
    positiveText = positive ? '困难总分达到英国参照较高范围，建议进一步了解' : '请同时查看各分量表，低总分不排除具体困难';
  } else if (scale.totalNorm) {
    const threshold = Math.round((scale.totalNorm[0] + scale.totalNorm[1]) * 100) / 100;
    const totalFlag = total >= threshold;
    positive = totalFlag || details.some(item => item.flagged);
    label = totalFlag ? '总分达到作者偏高参照' : positive ? '部分分量表达到作者偏高参照' : '未达到作者偏高参照';
    token = positive ? 'moderate' : 'minimal';
    positiveText = '按作者社区样本均值加1个标准差作提示，不是诊断界线';
  } else {
    positive = total >= scale.positiveAt;
    label = positive ? '达到进一步评估界线' : '未达到进一步评估界线';
    token = positive ? 'moderate' : 'minimal';
    positiveText = `${scale.positiveAt}分为中文版本常用筛查界线；结果不能替代进一步评估`;
  }
  return {
    total, totalText: String(total), maxScore: scale.maxScore,
    positive, positiveText, interpretationComplete: true,
    band: { label, token, guidance: '结果反映本次填写。请结合持续时间、生活影响以及本人和家长的观察查看。' },
    safetyFlag: Boolean(scale.safety) && answers[scale.safety.itemIndex] > 0,
    normsNote: scale.normsNote, details
  };
}

export default { scoreChildScale };
