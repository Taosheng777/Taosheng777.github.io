// 自动生成：scripts/sync-miniprogram.mjs；来源 1.5.1 骨龄圆点修订。请勿手改。
import dependency0 from './personality-data.js';
/* 原创离线解释层。展示分档是产品规则，不代表信度、效度或人格稳定性。
   不改变题目、反向计分或百分比；旧类型字段仅供兼容，不用于页面展示。 */
const { DIMENSIONS } = dependency0;
const REPORT_VERSION = '1.4.3-r2';
const BAND_LABELS = {
  near_midpoint: '两端接近', slight: '略有偏向', clear: '偏向较明显', strong: '偏向鲜明'
};
const NICKNAMES = {
  INTJ: '远景规划者', INTP: '原理探索者', ENTJ: '目标推动者', ENTP: '思辨探索者',
  INFJ: '意义探寻者', INFP: '理想创作者', ENFJ: '成长引导者', ENFP: '可能性发现者',
  ISTJ: '秩序践行者', ISFJ: '细心支持者', ESTJ: '事务组织者', ESFJ: '关系联结者',
  ISTP: '动手探索者', ISFP: '感受创作者', ESTP: '行动尝试者', ESFP: '体验分享者'
};
// 每行依次为：略有偏向、偏向较明显、偏向鲜明。键包含维度，两个 T 不混用。
const POLE_TEXT = {
  'mind.E': [
    '本次略偏向外向，但与内向一侧的差距不大。你可能在某些场合愿意主动交流，也可能需要独处恢复；这份结果不足以把你概括成“总是喜欢热闹的人”。',
    '本次偏向外向较明显。你可能更愿意通过交谈整理想法，安排活动时也更常考虑与人一起；这不等于社交能力更强。',
    '本次作答鲜明地偏向外向。主动交流和参与共同活动可能更符合你当下的习惯；遇到持续密集的互动时，仍可留意自己是否需要休息。'
  ],
  'mind.I': [
    '本次略偏向内向，差距不大。安静独处可能让你舒服，但熟悉的人或感兴趣的话题也可能让你愿意主动交流。',
    '本次偏向内向较明显。你可能更愿意先独自整理想法，再选择合适的人交流；这不说明你不善于沟通。',
    '本次作答鲜明地偏向内向。独处或小范围交流可能更符合你的节奏；需要协作时，可以主动说出自己希望如何参与。'
  ],
  'energy.N': [
    '本次略偏向直觉，仍可能依赖具体例子来理解问题。你可以观察自己何时喜欢想象可能性，何时更想知道眼前怎么做。',
    '本次偏向直觉较明显。你可能先关注联系、含义和后续可能性，再补充细节；这不等于创造力或理解力更高。',
    '本次作答鲜明地偏向直觉。抽象联系和未发生的可能性可能更吸引你的注意；落实想法时，核对事实和限制仍然有用。'
  ],
  'energy.S': [
    '本次略偏向实感，但并不排除你对抽象问题的兴趣。是否有清楚的例子、问题是否熟悉，可能影响你选择哪种理解方式。',
    '本次偏向实感较明显。你可能更愿意从可观察的事实和具体步骤入手；这不意味着缺少想象力。',
    '本次作答鲜明地偏向实感。明确实例和眼前细节可能更符合你的信息习惯；面对新问题时，也可以给尚未证实的设想留一点讨论空间。'
  ],
  'nature.T': [
    '本次略偏向思考，但与情感一侧差距不大。你可能在部分决定中先核对理由，同时仍在意关系和感受，不能据此说你不受情绪影响。',
    '本次偏向思考较明显。你可能更习惯先比较理由、规则和一致性，再讨论决定对人的影响；这不是智力或判断正确率的评分。',
    '本次作答鲜明地偏向思考。明确标准可能是你讨论决定时的重要起点；遇到分歧时，询问对方在意什么可以补足仅谈理由遗漏的信息。'
  ],
  'nature.F': [
    '本次略偏向情感，仍可能重视规则和逻辑。不同决定涉及的人与关系不同，你关注的依据也可能随情境变化。',
    '本次偏向情感较明显。你可能先考虑个人价值和决定对人的影响，再权衡规则；这不代表更善良，也不代表不理性。',
    '本次作答鲜明地偏向情感。关系与个人价值可能更常进入你的权衡；意见冲突时，明确事实和共同标准也有助于表达自己的考虑。'
  ],
  'tactics.J': [
    '本次略偏向判断，但仍可能喜欢保留变化空间。任务是否紧急、安排是否由自己决定，可能影响你想多早定下来。',
    '本次偏向判断较明显。你可能更喜欢提前安排和明确下一步；偏好计划并不能证明执行力或可靠性更高。',
    '本次作答鲜明地偏向判断。确定日程和尽早作出选择可能让你更自在；面对信息不足的任务，可以给计划留一个重新评估的时间点。'
  ],
  'tactics.P': [
    '本次略偏向展望，但不意味着你排斥计划。你可能在有选择余地时保留弹性，在重要期限前又希望安排明确。',
    '本次偏向展望较明显。你可能更喜欢边获取信息边调整安排；这不能用来判断你是否拖延或能否完成任务。',
    '本次作答鲜明地偏向展望。保留选项和临场调整可能更符合你的习惯；多人协作时，约定一个最晚决定时间有助于协调彼此节奏。'
  ],
  'identity.A': [
    '本次略偏向自信，两端差距不大。你对自己的看法可能在不同事情上并不相同，不能由这一分数推断承压能力。',
    '本次偏向自信较明显。你可能较少反复检查对自己的评价；这只是本次自我描述，不代表对每件事都有把握。',
    '本次作答鲜明地偏向自信。你可能更愿意接受当前的自己并继续行动；遇到新反馈时，仍可具体检查哪些地方值得调整。'
  ],
  'identity.T': [
    '本次略偏向起伏，但差距不大。你可能对某些反馈较在意，对另一些事情却很笃定；不能据此判断情绪或人格是否稳定。',
    '本次偏向起伏较明显。你可能更留意他人的反馈，也更常回看自己的表现；这不是焦虑程度或心理健康状况的测量。',
    '本次作答鲜明地偏向起伏。反复评估自己可能较符合你近期的体验；如果评估让你难以结束一件事，可以先约定一个具体的完成标准。'
  ]
};
const MIDPOINT_TEXT = {
  mind: '本次外向与内向两端接近，暂不作单侧概括。分数可能来自中立选择，也可能来自不同题目相互抵消；可回想交流与独处各在什么场合更适合自己。',
  energy: '本次直觉与实感两端接近，不能只用一侧描述你。可比较自己在学习新概念和处理熟悉事务时，是先看联系还是先找实例；中间分不证明两种能力都很强。',
  nature: '本次思考与情感两端接近，不能据此说你只依靠逻辑或只依靠感受。可回想一个近期决定，分别看看理由、个人价值和人际影响怎样进入权衡。',
  tactics: '本次判断与展望两端接近，暂不概括为固定的计划型或随性型。可以比较独自安排和多人协作时的偏好；中间分本身不说明执行力或适应能力。',
  identity: '本次自信与起伏两端接近，暂不作单侧状态概括。可留意不同事情上的自我评价有何差别；这个分数不能估计人格稳定性或心理健康状况。'
};

function displayBand(percent) {
  if (!Number.isFinite(percent) || percent < 50 || percent > 100) throw new Error('偏向换算值须在 50–100 之间');
  if (percent < 55) return 'near_midpoint';
  if (percent < 65) return 'slight';
  if (percent < 80) return 'clear';
  return 'strong';
}

const REPORT_UNITS = {};
for (const dimension of DIMENSIONS) {
  for (const band of Object.keys(BAND_LABELS)) {
    const poles = band === 'near_midpoint' ? [null] : [dimension.positive, dimension.negative];
    for (const pole of poles) {
      const id = `${dimension.key}.${pole || 'both'}.${band}.${REPORT_VERSION}`;
      REPORT_UNITS[id] = {
        id, version: REPORT_VERSION, dimensionKey: dimension.key,
        supportedDimensions: [dimension.key], condition: { band, pole },
        excludes: band === 'near_midpoint' ? ['single_pole_claim'] : ['near_midpoint', 'zero'],
        priority: 1,
        summary: pole ? POLE_TEXT[`${dimension.key}.${pole}`][['slight', 'clear', 'strong'].indexOf(band)] : MIDPOINT_TEXT[dimension.key]
      };
    }
  }
}

function interpretDimension(key, rawScore) {
  const dimension = DIMENSIONS.find(item => item.key === key);
  if (!dimension || !Number.isFinite(rawScore) || Math.abs(rawScore) > 36) throw new Error('无效维度或原始分');
  const positivePercentExact = (rawScore + 36) / 72 * 100;
  const dominantPercentExact = 50 + Math.abs(rawScore) / 72 * 100;
  const band = displayBand(dominantPercentExact);
  const pole = rawScore === 0 ? null : rawScore > 0 ? dimension.positive : dimension.negative;
  const near = band === 'near_midpoint';
  const interpretationId = `${key}.${near ? 'both' : pole}.${band}.${REPORT_VERSION}`;
  return {
    rawScore, positivePercentExact, dominantPercentExact, dominantPole: pole,
    displayBand: band, bandLabel: BAND_LABELS[band], balanced: near,
    displayLetter: near ? '↔' : pole,
    displayLabel: near ? `${dimension.positive}/${dimension.negative} 两端${rawScore === 0 ? '相当' : '接近'}` : rawScore > 0 ? dimension.positiveLabel : dimension.negativeLabel,
    interpretationId, report: REPORT_UNITS[interpretationId]
  };
}

const SHORT_PREFERENCES = {
  'mind.E': '通过交流整理想法', 'mind.I': '留出独处和思考的时间',
  'energy.N': '关注联系与新的可能性', 'energy.S': '从具体事实和实例入手',
  'nature.T': '先比较理由和规则', 'nature.F': '先考虑感受与对人的影响',
  'tactics.J': '提前安排并确定下一步', 'tactics.P': '给安排保留调整空间',
  'identity.A': '接受当前的自己并继续行动', 'identity.T': '留意反馈并回看自己的表现'
};

const SCENE_GROUPS = [
  { key: 'work', title: '工作与学习' },
  { key: 'relationships', title: '沟通与关系' },
  { key: 'growth', title: '自我成长' }
];
// 组合只有在所有参与维度均达到“偏向较明显”时启用；不从昵称反推能力。
const SCENE_RULES = [
  { key: 'work.np', group: 'work', requires: [['energy','N'],['tactics','P']], priority: 2,
    preference: '你可能喜欢先展开几个思路，再根据新信息调整方向。',
    cost: '当选择不断增加时，选定方案的时间也可能被推迟。',
    action: '先写下三个方案，再给自己一个选定时间；选好后只保留一个待验证的问题。' },
  { key: 'work.nj', group: 'work', requires: [['energy','N'],['tactics','J']], priority: 2,
    preference: '你可能喜欢先想清方向，再把想法排成一个计划。',
    cost: '信息还不齐全时，过早把计划定细可能增加后续修改的负担。',
    action: '把计划分为“已经确认”和“需要试一试”，先做一个小步骤再补全安排。' },
  { key: 'work.s', group: 'work', requires: [['energy','S']], priority: 1,
    preference: '学习或接手任务时，你可能更愿意先看到一个具体例子。',
    cost: '没有现成示例的新任务，可能让你一时不知从哪里开始。',
    action: '找一个最小实例亲手走一遍，再写出它能解决什么问题、在哪些条件下不适用。' },
  { key: 'relationships.ef', group: 'relationships', requires: [['mind','E'],['nature','F']], priority: 2,
    preference: '你可能愿意主动交谈，并在交流中关注对方的感受。',
    cost: '很快接话或表达关心，有时会让对方还没来得及说完。',
    action: '先问“你想让我听一听，还是一起想办法”，等对方说完再回应。' },
  { key: 'relationships.it', group: 'relationships', requires: [['mind','I'],['nature','T']], priority: 2,
    preference: '你可能更愿意先独自想清理由，再进入讨论。',
    cost: '对方需要即时回应时，沉默可能被误解为不愿交流。',
    action: '先告诉对方“我想整理一下，稍后回应”，再约定一个具体的交流时间。' },
  { key: 'growth.a', group: 'growth', requires: [['identity','A']], priority: 2,
    preference: '你可能较少反复纠结对自己的评价，更愿意继续尝试。',
    cost: '某些需要回顾的细节，可能在继续向前时被略过。',
    action: '做完一件事后，记下一个值得保留的做法和一个下次想调整的细节。' },
  { key: 'growth.t', group: 'growth', requires: [['identity','T']], priority: 2,
    preference: '你可能比较在意反馈，也常回看自己的表现。',
    cost: '反复评估一件已经结束的事，可能占用休息或下一步行动的时间。',
    action: '给复盘留十分钟，只选一项可以改的行动，时间到后先结束这次评估。' },
  { key: 'growth.j', group: 'growth', requires: [['tactics','J']], priority: 1,
    preference: '你可能更喜欢有安排、能看见下一步的成长方式。',
    cost: '临时变化较多时，原计划可能需要频繁调整。',
    action: '为这周只选一个小目标，同时写一个忙碌时也能完成的简化版本。' }
];
const SCENE_FALLBACKS = {
  work: ['工作和学习中，可以先观察什么方法更适合眼前的任务，不必固定使用同一种方式。', '同一种方法未必适合每一种任务，不必为了符合类型而强迫自己照做。', '选一项近期任务，分别试试先看实例和先列思路，观察哪一种更容易让你开始。'],
  relationships: ['沟通方式也受对象和场合影响，可以留意自己与熟人、陌生人交流时有什么不同。', '猜测对方需要什么，可能让双方的期待错开。', '下一次交流前，问清对方是想讨论方案、表达感受，还是先把事情说完整。'],
  growth: ['理解自己的评价习惯和行动节奏，可以从最近几件具体的事情开始。', '只用一个标签解释所有经历，可能忽略自己在不同场合的变化。', '回想一件最近满意和一件不满意的事，各写出一个影响体验的具体条件。']
};
function buildScenes(facets) {
  const byKey = Object.fromEntries(facets.map(f => [f.key, f]));
  return SCENE_GROUPS.map(group => {
    const rule = SCENE_RULES.filter(rule => rule.group === group.key && rule.requires.every(([key, pole]) =>
      byKey[key].dominantPole === pole && byKey[key].dominantPercentExact >= 65
    )).sort((a,b) => b.priority - a.priority)[0];
    const fallback = SCENE_FALLBACKS[group.key];
    return {
      id: `${rule ? rule.key : group.key + '.observe'}.${REPORT_VERSION}`,
      key: group.key, title: group.title, version: REPORT_VERSION,
      supportedDimensions: rule ? rule.requires.map(([key]) => key) : [],
      conditions: rule ? rule.requires.map(([key,pole]) => ({ key, pole, minPercent: 65 })) : [],
      exclusions: rule ? ['weak_supporting_dimension', 'opposite_pole'] : ['type_based_claim'],
      priority: rule ? rule.priority : 0,
      preference: rule ? rule.preference : fallback[0],
      cost: rule ? rule.cost : fallback[1], action: rule ? rule.action : fallback[2]
    };
  });
}
function plainSummary(facets) {
  const clear = facets.filter(f => f.dominantPercentExact >= 65).sort((a,b) => Math.abs(b.rawScore)-Math.abs(a.rawScore));
  const near = facets.filter(f => f.balanced);
  const slight = facets.filter(f => f.displayBand === 'slight');
  const parts = [];
  if (clear.length) parts.push('你更倾向于' + clear.slice(0,2).map(f => SHORT_PREFERENCES[`${f.key}.${f.dominantPole}`]).join('，也更愿意') + '。');
  else parts.push('这组答案里的偏向都比较温和，可以结合不同场合下的习惯来理解自己。');
  if (slight.length) {
    const f = slight[0];
    parts.push(`${f.title}略偏${f.displayLabel}，仍可能随具体情境采用另一种方式。`);
  }
  if (near.length) parts.push(`${near.map(f => f.title).join('、')}两侧接近，可以看看两端的描述分别在什么场合符合自己。`);
  else parts.push('可以用最近一次学习、交流或做决定的经历，看看哪些描述符合自己。');
  return parts.join('');
}

function buildReport(facets) {
  const main = facets.slice(0, 4);
  const nearCount = main.filter(facet => facet.balanced).length;
  const identity = facets[4];
  const markedType = main.map(facet => facet.rawScore === 0 ? `${DIMENSIONS.find(d => d.key === facet.key).positive}/${DIMENSIONS.find(d => d.key === facet.key).negative}` : facet.dominantPole).join(' · ');
  const letters = main.map(facet => facet.dominantPole).join('');
  const hasZero = main.some(facet => facet.rawScore === 0);
  const displayType = nearCount === 4 ? '本次尚未形成清晰的类型倾向'
    : hasZero ? `本次维度参考：${markedType}`
      : `${letters}${identity.rawScore === 0 ? '' : `-${identity.dominantPole}`}`;
  const nickname = !hasZero && nearCount < 2 ? NICKNAMES[letters] : '';
  const summary = plainSummary(facets);
  return {
    displayType, nickname, summary, scenes: buildScenes(facets), reportVersion: REPORT_VERSION,
    identityNote: identity.rawScore === 0 ? '自我状态 A/T 两端相当。' : '',
    midpointNote: '接近中点只表示本次净偏向较弱，不能据此估计人格或重测稳定性。',
    scoringNote: '百分比是原始分（−36 至 36）的线性换算：正极位置 = (原始分 + 36) ÷ 72 × 100；优势侧换算值 = 50 + |原始分| ÷ 72 × 100。它不是人群百分位、能力分数或人格概率。分档按未取整值：50–不足55 为两端接近，55–不足65 为略有偏向，65–不足80 为偏向较明显，80–100 为偏向鲜明。这是本项目的展示规则，尚无心理测量学验证。'
  };
}
export default { REPORT_VERSION, REPORT_UNITS, NICKNAMES, displayBand, interpretDimension, buildReport, SCENE_RULES, buildScenes };
