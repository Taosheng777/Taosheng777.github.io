/* 心理测评引擎 v1.9.0
   一份数据 + 一套计分 + 一个渲染器，驱动 /mind/ 下全部量表页面。
   PHQ-9 与 GAD-7 的题目、计分与分级沿用 v1.3.0 已核对版本，本次未改动。
   所有作答只存在当前页面内存，不写入任何浏览器存储。 */

import { CONNERS_NORMS } from './conners-norms.js';

/* 第 1 档原写「好几天」。英文原档是 Several days，本意「有那么几天」，是最轻的一档
   有症状选项；中文「好几天」带「天数不算少」的强调，作答者因此退回「完全不会」，
   会把分数系统性压低（多位试填者反馈「怎么没有偶尔这个选项」）。v1.9.0 起改为
   「有几天（偶尔）」，分值、计分、切点与分档一律未动。 */
const FREQ_0_3 = Object.freeze([
  { value: 0, label: '完全不会' },
  { value: 1, label: '有几天（偶尔）' },
  { value: 2, label: '一半以上的日子' },
  { value: 3, label: '几乎每天' },
]);

const ZUNG_1_4 = Object.freeze([
  { value: 1, label: '没有或很少时间' },
  { value: 2, label: '小部分时间' },
  { value: 3, label: '相当多时间' },
  { value: 4, label: '绝大部分或全部时间' },
]);

/* 第 2 档原写「不少」。英文原档是 Quite a bit，「不少」作程度词太弱，家长分不清
   它与「很多」的界线，中间两档会塌成一档。v1.9.0 起改为「比较多」，分值不变。 */
const SNAP_0_3 = Object.freeze([
  { value: 0, label: '完全没有' },
  { value: 1, label: '有一点' },
  { value: 2, label: '比较多' },
  { value: 3, label: '很多' },
]);

const CONNERS_0_3 = Object.freeze([
  { value: 0, label: '无' },
  { value: 1, label: '稍有' },
  { value: 2, label: '相当多' },
  { value: 3, label: '很多' },
]);

const PSC_0_2 = Object.freeze([
  { value: 0, label: '从不' },
  { value: 1, label: '有时' },
  { value: 2, label: '经常' },
]);

const ASQ_OPTIONS = Object.freeze([
  { value: 0, label: '否' },
  { value: 1, label: '是' },
  { value: 2, label: '不愿回答' },
]);

const PHQ_ITEMS = Object.freeze([
  '做事时提不起劲或没有兴趣',
  '感到心情低落、沮丧或绝望',
  '入睡困难、睡不安稳或睡得过多',
  '感觉疲倦或没有活力',
  '食欲不振或吃太多',
  '觉得自己很糟——或觉得自己很失败，或让自己或家人失望',
  '对事物专注有困难，例如阅读报纸或看电视时',
  '动作或说话速度缓慢到别人已经察觉？或正好相反——您烦躁或坐立不安，动来动去的情况比平常更严重',
  '有不如死掉或用某种方式伤害自己的念头',
]);

const GAD_ITEMS = Object.freeze([
  '感觉紧张、焦虑或急切',
  '不能够停止或控制担忧',
  '对各种各样的事情担忧过多',
  '很难放松下来',
  '由于不安而无法静坐',
  '变得容易烦恼或急躁',
  '感到似乎将有可怕的事情发生而害怕',
]);

const QUICK_BANDS = Object.freeze([
  { max: 2, label: '未达到常用筛查分界', token: 'minimal', guidance: '本次未达到常用的进一步评估分界。快速筛查题目很少，只反映最突出的两条症状；如果你仍明显不适，请不要只看这个分数。' },
  { max: 6, label: '达到常用筛查分界', token: 'moderate', guidance: '本次达到常用的进一步评估分界，建议接着完成完整量表，或直接联系精神科、心理科等合格专业人员。' },
]);

const SAFETY_12356 = '请尽快联系精神科、心理科专业人员，或拨打全国统一心理援助热线 12356。如果你担心自己会立即采取行动，请不要独处，马上告诉身边可信任的人，并拨打 120 或 110，或直接前往急诊。';

const SCALES = Object.freeze({
  phq9: {
    code: 'PHQ-9',
    title: '抑郁症状自评',
    route: '/mind/phq-9/',
    group: 'self',
    kind: '本人自评',
    subtitle: '9 题 · 最近两周',
    minutes: 2,
    timeframe: '最近两周',
    instruction: '在过去两周里，您有多少时候受到以下问题的困扰？',
    lead: '请根据最近两周的真实感受作答。',
    audience: '建议 12 岁及以上、能独立理解题意并由本人作答。12–17 岁结果应由监护人与专业人员结合年龄解释。',
    audienceLead: '建议 12 岁及以上、能独立理解题目的人群，由本人作答。',
    audienceNotes: [
      '12–17 岁已有研究支持使用 PHQ-9，但本页分级沿用成人常用切点，结果应由监护人与专业人员结合年龄解释。12 岁以下建议使用儿童专用评估工具。',
    ],
    cardHint: '9 题，回顾最近两周的兴趣、情绪、睡眠、精力等情况，并生成分数与症状分级。',
    agePill: '建议 12 岁及以上本人作答',
    maxScore: 27,
    positiveAt: 10,
    scoring: 'sum',
    options: FREQ_0_3,
    items: PHQ_ITEMS,
    bands: [
      { max: 4, label: '无或极轻微抑郁症状', token: 'minimal', guidance: '这次报告的抑郁相关症状很少或很轻。若你仍明显痛苦或日常生活受到影响，请不要只看分数。' },
      { max: 9, label: '轻度抑郁症状', token: 'mild', guidance: '存在轻度抑郁症状。可以留意症状是否持续，以及它们对睡眠、学习、工作或人际的影响。' },
      { max: 14, label: '中度抑郁症状', token: 'moderate', guidance: '症状已达到常用的进一步评估阈值，建议联系精神科、心理科或其他合格专业人员做完整评估。' },
      { max: 19, label: '中重度抑郁症状', token: 'high', guidance: '症状较明显，建议尽快安排专业评估。量表分数本身不能确定诊断或治疗方案。' },
      { max: 27, label: '重度抑郁症状', token: 'high', guidance: '症状较重，建议尽快寻求精神科、心理科或其他合格专业人员的评估与支持。' },
    ],
    safety: {
      itemIndex: 8,
      title: '请现在把这项感受告诉一个可信任的人',
      body: [
        '你在第 9 题提到最近出现过“不如死掉”或伤害自己的念头。无论总分高低，这一项都值得认真对待，也不需要独自承受。',
        SAFETY_12356,
      ],
    },
    sources: [
      'PHQ-9 由 Robert L. Spitzer、Janet B.W. Williams、Kurt Kroenke 等编制，属公有领域。本站使用原门诊演示工具已核对的大陆临床流通简体措辞。',
      '原始成人验证：<a href="https://pubmed.ncbi.nlm.nih.gov/11556941/" rel="external noreferrer">Kroenke 等，2001</a>；12–18 岁青少年样本验证：<a href="https://pubmed.ncbi.nlm.nih.gov/37738682/" rel="external noreferrer">Fonseca-Pedrero 等，2023</a>。青少年研究支持量表使用，不表示成人常用切点适合所有未成年人。',
    ],
  },

  gad7: {
    code: 'GAD-7',
    title: '焦虑症状自评',
    route: '/mind/gad-7/',
    group: 'self',
    kind: '本人自评',
    subtitle: '7 题 · 最近两周',
    minutes: 2,
    timeframe: '最近两周',
    instruction: '在过去两周里，您有多少时候受到以下问题的困扰？',
    lead: '请根据最近两周的真实感受作答。',
    audience: '建议 12 岁及以上、能独立理解题意并由本人作答。12–17 岁结果应由监护人与专业人员结合年龄解释。',
    audienceLead: '建议 12 岁及以上、能独立理解题目的人群，由本人作答。',
    audienceNotes: [
      '12–17 岁已有研究支持使用 GAD-7，但本页分级沿用成人常用切点，结果应由监护人与专业人员结合年龄解释。',
    ],
    cardHint: '7 题，回顾最近两周的紧张、担忧、放松困难等情况，并生成分数与症状分级。',
    agePill: '建议 12 岁及以上本人作答',
    maxScore: 21,
    positiveAt: 10,
    scoring: 'sum',
    options: FREQ_0_3,
    items: GAD_ITEMS,
    bands: [
      { max: 4, label: '无或极轻微焦虑症状', token: 'minimal', guidance: '这次报告的焦虑相关症状很少或很轻。若你仍明显痛苦或日常生活受到影响，请不要只看分数。' },
      { max: 9, label: '轻度焦虑症状', token: 'mild', guidance: '存在轻度焦虑症状。可以留意担忧、紧张或睡眠问题是否持续，以及是否影响日常生活。' },
      { max: 14, label: '中度焦虑症状', token: 'moderate', guidance: '症状已达到常用的进一步评估阈值，建议联系精神科、心理科或其他合格专业人员做完整评估。' },
      { max: 21, label: '重度焦虑症状', token: 'high', guidance: '症状较明显，建议尽快安排专业评估。量表分数本身不能确定诊断或治疗方案。' },
    ],
    sources: [
      'GAD-7 由 Robert L. Spitzer、Kurt Kroenke、Janet B.W. Williams 等编制，属公有领域。本站使用原门诊演示工具已核对的大陆临床流通简体措辞。',
      '原始验证：<a href="https://pubmed.ncbi.nlm.nih.gov/16717171/" rel="external noreferrer">Spitzer 等，2006</a>。',
    ],
  },

  phq2: {
    code: 'PHQ-2',
    title: '抑郁快速筛查',
    route: '/mind/phq-2/',
    group: 'self',
    kind: '本人自评',
    subtitle: '2 题 · 最近两周',
    minutes: 1,
    timeframe: '最近两周',
    instruction: '在过去两周里，您有多少时候受到以下问题的困扰？',
    lead: 'PHQ-9 的前两题，用于最快速的初筛。达到分界时建议接着做完整的 PHQ-9。',
    audience: '建议 12 岁及以上、能独立理解题意并由本人作答。',
    audienceLead: '这是 PHQ-9 的前两题，只用于最初步的筛查。',
    audienceNotes: [
      '常用分界为 3 分。达到分界不等于有抑郁障碍，只说明值得接着做完整的 PHQ-9 或找专业人员评估。',
      '未达到分界也不能排除问题：两道题覆盖不了完整的症状范围。',
    ],
    cardHint: '2 题，30 秒完成的最简初筛。达到分界会建议你接着做完整的 PHQ-9。',
    agePill: '建议 12 岁及以上本人作答',
    maxScore: 6,
    positiveAt: 3,
    scoring: 'sum',
    options: FREQ_0_3,
    items: PHQ_ITEMS.slice(0, 2),
    bands: QUICK_BANDS,
    followUp: { code: 'PHQ-9', route: '/mind/phq-9/' },
    sources: [
      'PHQ-2 取自 PHQ-9 的前两题，属公有领域。原始验证：<a href="https://pubmed.ncbi.nlm.nih.gov/14583691/" rel="external noreferrer">Kroenke 等，2003</a>。',
      '题目措辞与本站 PHQ-9 完全一致，来自同一份已核对的大陆临床流通简体版本。',
    ],
  },

  gad2: {
    code: 'GAD-2',
    title: '焦虑快速筛查',
    route: '/mind/gad-2/',
    group: 'self',
    kind: '本人自评',
    subtitle: '2 题 · 最近两周',
    minutes: 1,
    timeframe: '最近两周',
    instruction: '在过去两周里，您有多少时候受到以下问题的困扰？',
    lead: 'GAD-7 的前两题，用于最快速的初筛。达到分界时建议接着做完整的 GAD-7。',
    audience: '建议 12 岁及以上、能独立理解题意并由本人作答。',
    audienceLead: '这是 GAD-7 的前两题，只用于最初步的筛查。',
    audienceNotes: [
      '常用分界为 3 分。达到分界不等于有焦虑障碍，只说明值得接着做完整的 GAD-7 或找专业人员评估。',
      '未达到分界也不能排除问题：两道题覆盖不了完整的症状范围。',
    ],
    cardHint: '2 题，30 秒完成的最简初筛。达到分界会建议你接着做完整的 GAD-7。',
    agePill: '建议 12 岁及以上本人作答',
    maxScore: 6,
    positiveAt: 3,
    scoring: 'sum',
    options: FREQ_0_3,
    items: GAD_ITEMS.slice(0, 2),
    bands: QUICK_BANDS,
    followUp: { code: 'GAD-7', route: '/mind/gad-7/' },
    sources: [
      'GAD-2 取自 GAD-7 的前两题，属公有领域。原始验证：<a href="https://pubmed.ncbi.nlm.nih.gov/17339617/" rel="external noreferrer">Kroenke 等，2007</a>。',
      '题目措辞与本站 GAD-7 完全一致，来自同一份已核对的大陆临床流通简体版本。',
    ],
  },

  asq: {
    code: 'ASQ',
    title: '自杀风险快速筛查',
    route: '/mind/asq/',
    group: 'self',
    kind: '本人作答',
    subtitle: '4 项筛查 + 1 项当前状态',
    minutes: 1,
    timeframe: '过去几周',
    instruction: '请如实回答下面几个问题。这几题很直接，但正是因为直接才有用。',
    lead: '美国国立精神卫生研究院（NIMH）的 ASQ 工具包量表。前四项任一为“是”或“不愿回答”时，才会出现第 5 项。',
    audience: '适用于 10 岁及以上；本页由本人作答。这不是诊断工具，是用来决定“现在要不要立刻找人”的筛查。',
    audienceLead: '这份筛查会直接问到自杀相关的想法。',
    audienceNotes: [
      '直接询问自杀想法不会诱发自杀行为，这一点已有研究支持；回避提问才更危险。',
      '本页不记录、不上传你的任何回答。若你现在就有伤害自己的打算，请不要独处，直接拨打 12356，或拨 120 / 110。',
    ],
    cardHint: '4 题直接询问自杀相关想法，触发阳性时出现第 5 题并给出当场处置建议。',
    agePill: '建议 10 岁及以上本人作答',
    maxScore: 4,
    scoring: 'asq',
    options: ASQ_OPTIONS,
    conditionalLast: true,
    items: [
      '在过去几周，您是否希望自己死了？',
      '在过去几周，您是否觉得如果自己死了，对您或家人都会更好？',
      '在过去几周，您是否一直有自杀的想法？',
      '您是否尝试过自杀？',
      '您现在是否有自杀的想法？',
    ],
    sources: [
      'ASQ（Ask Suicide-Screening Questions）由美国国立精神卫生研究院（NIMH）开发，工具包公开免费使用。中文题目采用 NIMH 官方中文版五项结构。',
      '原始验证：<a href="https://pubmed.ncbi.nlm.nih.gov/23027429/" rel="external noreferrer">Horowitz 等，2012</a>。第 5 项只在前四项出现阳性时才需要回答。',
    ],
  },

  sas: {
    code: 'SAS',
    title: '焦虑自评量表',
    route: '/mind/sas/',
    group: 'self',
    kind: '本人自评',
    subtitle: '20 题 · 最近一周',
    minutes: 4,
    timeframe: '最近一周',
    instruction: '请根据您最近一星期的实际感觉，选择最符合的一项。请不要漏评任何一个项目。',
    lead: 'Zung 焦虑自评量表。20 题，按最近一周的实际感觉作答，出粗分与标准分。',
    audience: '成人自评量表，无儿童常模。建议 16 岁及以上本人作答；更小年龄请改用儿童青少年专用量表。',
    audienceLead: '这是成人量表，原版适用对象是成年人；建议 16 岁及以上本人作答。',
    audienceNotes: [
      'SAS 由 Zung 于 1971 年编制，没有儿童常模。本页分级沿用国内成人常用切点，16 岁以下的结果不具备参照意义。',
      '第 5、9、13、17、19 题是正性描述，按反向计分处理，页面已自动完成，你只需按实际感觉作答。',
    ],
    cardHint: '20 题成人焦虑自评，含 5 道反向计分题，出粗分、标准分与分级。',
    agePill: '建议 16 岁及以上本人作答',
    maxScore: 100,
    positiveAt: 50,
    scoring: 'zung',
    options: ZUNG_1_4,
    reversed: [5, 9, 13, 17, 19],
    rawMax: 80,
    items: [
      '我觉得比平常容易紧张和着急',
      '我无缘无故地感到害怕',
      '我容易心里烦乱或觉得惊恐',
      '我觉得我可能将要发疯',
      '我觉得一切都很好，也不会发生什么不幸',
      '我手脚发抖打颤',
      '我因为头痛、颈痛和背痛而苦恼',
      '我感觉容易衰弱和疲乏',
      '我觉得心平气和，并且容易安静坐着',
      '我觉得心跳得很快',
      '我因为一阵阵头晕而苦恼',
      '我有晕倒发作，或觉得要晕倒似的',
      '我呼气吸气都感到很容易',
      '我手脚麻木和刺痛',
      '我因为胃痛和消化不良而苦恼',
      '我常常要小便',
      '我的手常常是干燥温暖的',
      '我脸红发热',
      '我容易入睡，并且一夜睡得很好',
      '我做恶梦',
    ],
    bands: [
      { max: 49.99, label: '无焦虑', token: 'minimal', guidance: '标准分未达到国内常用的 50 分分界。若你仍明显不适，请不要只看分数。' },
      { max: 59.99, label: '轻度焦虑', token: 'mild', guidance: '标准分落在 50–59 的轻度范围。可以留意症状是否持续，以及是否影响睡眠、工作和人际。' },
      { max: 69.99, label: '中度焦虑', token: 'moderate', guidance: '标准分落在 60–69 的中度范围，建议联系精神科、心理科或其他合格专业人员做完整评估。' },
      { max: 100, label: '重度焦虑', token: 'high', guidance: '标准分达到 70 分及以上，建议尽快安排专业评估。量表分数本身不能确定诊断或治疗方案。' },
    ],
    sources: [
      'SAS 由 W.W.K. Zung 于 1971 年编制。本页中文题目取自公开流通的国内版本，分级沿用国内成人常模常用切点（&lt;50 无 / 50–59 轻度 / 60–69 中度 / ≥70 重度）。',
      '计分：20 题粗分求和（第 5、9、13、17、19 题反向），标准分 = 粗分 × 1.25。<strong>题目措辞在不同流通译本间存在细微差异，临床使用请以本机构正版量表为准。</strong>',
    ],
  },

  sds: {
    code: 'SDS',
    title: '抑郁自评量表',
    route: '/mind/sds/',
    group: 'self',
    kind: '本人自评',
    subtitle: '20 题 · 最近一周',
    minutes: 4,
    timeframe: '最近一周',
    instruction: '请根据您最近一星期的实际情况如实回答，每题限选一个答案。',
    lead: 'Zung 抑郁自评量表。20 题，按最近一周的实际情况作答，出粗分与标准分。',
    audience: '成人自评量表，无儿童常模。建议 16 岁及以上本人作答；更小年龄请改用儿童青少年专用量表。',
    audienceLead: '这是成人量表，原版适用对象是成年人；建议 16 岁及以上本人作答。',
    audienceNotes: [
      'SDS 由 Zung 于 1965 年编制，没有儿童常模。本页分级沿用国内成人常用切点，16 岁以下的结果不具备参照意义。',
      '第 2、5、6、11、12、14、16、17、18、20 题是正性描述，按反向计分处理，页面已自动完成，你只需按实际情况作答。',
    ],
    cardHint: '20 题成人抑郁自评，含 10 道反向计分题，出粗分、标准分与分级。',
    agePill: '建议 16 岁及以上本人作答',
    maxScore: 100,
    positiveAt: 53,
    scoring: 'zung',
    options: ZUNG_1_4,
    reversed: [2, 5, 6, 11, 12, 14, 16, 17, 18, 20],
    rawMax: 80,
    items: [
      '我觉得闷闷不乐，情绪低沉',
      '我觉得一天之中早晨最好',
      '我一阵阵哭出来或觉得想哭',
      '我晚上睡眠不好',
      '我吃得跟平常一样多',
      '我与异性密切接触时和以往一样感到愉快',
      '我发觉我的体重在下降',
      '我有便秘的苦恼',
      '我心跳比平常快',
      '我无缘无故地感到疲乏',
      '我的头脑跟平常一样清楚',
      '我觉得经常做的事情并没有困难',
      '我觉得不安而平静不下来',
      '我对将来抱有希望',
      '我比平常容易生气激动',
      '我觉得作出决定是容易的',
      '我觉得自己是个有用的人，有人需要我',
      '我的生活过得很有意思',
      '我认为如果我死了，别人会生活得好些',
      '平常感兴趣的事我仍然照样感兴趣',
    ],
    bands: [
      { max: 52.99, label: '正常范围', token: 'minimal', guidance: '标准分未达到国内常用的 53 分分界。若你仍明显不适，请不要只看分数。' },
      { max: 62.99, label: '轻度抑郁', token: 'mild', guidance: '标准分落在 53–62 的轻度范围。可以留意症状是否持续，以及是否影响睡眠、工作和人际。' },
      { max: 72.99, label: '中度抑郁', token: 'moderate', guidance: '标准分落在 63–72 的中度范围，建议联系精神科、心理科或其他合格专业人员做完整评估。' },
      { max: 100, label: '重度抑郁', token: 'high', guidance: '标准分超过 72 分，建议尽快安排专业评估。量表分数本身不能确定诊断或治疗方案。' },
    ],
    safety: {
      itemIndex: 18,
      title: '第 19 题需要单独处理',
      body: [
        '你在第 19 题选择了非最低档。这一项涉及“别人没有我会更好”的无价值感，无论标准分高低都值得认真对待。',
        SAFETY_12356,
      ],
    },
    sources: [
      'SDS 由 W.W.K. Zung 于 1965 年编制。本页中文题目取自公开流通的国内版本，分级沿用国内成人常模常用切点（&lt;53 正常 / 53–62 轻度 / 63–72 中度 / &gt;72 重度）。',
      '计分：20 题粗分求和（第 2、5、6、11、12、14、16、17、18、20 题反向），标准分 = 粗分 × 1.25。<strong>题目措辞在不同流通译本间存在细微差异，临床使用请以本机构正版量表为准。</strong>',
    ],
  },

  snap26: {
    code: 'SNAP-IV',
    title: 'ADHD 与对立违抗行为评定',
    route: '/mind/snap-iv/',
    group: 'parent',
    kind: '家长评定',
    subtitle: '26 题 · 过去一周 · 由家长填写',
    minutes: 5,
    timeframe: '过去一周',
    instruction: '请选择最能表达在过去的一个星期中，您孩子状况的一项。',
    lead: 'ADHD 与对立违抗症状的家长评定量表。由家长或主要照顾者填写，输出三个题组的原始分与均分。',
    audience: '适用于 6–18 岁儿童青少年，由家长或主要照顾者评定，不是孩子本人作答。',
    audienceLead: '这份量表由家长或主要照顾者填写，不是孩子本人作答。',
    audienceNotes: [
      '适用于 6–18 岁儿童青少年。量表结果只是筛查线索，ADHD 的诊断需要结合多来源信息、发育史与专业评估。',
      '本页给出的是父母版切截点。教师版切截点不同，不能互换使用。',
    ],
    cardHint: '26 题家长评定，输出注意力、多动/冲动、对立违抗三个题组的原始分与均分。',
    agePill: '6–18 岁 · 家长填写',
    maxScore: 78,
    scoring: 'groups',
    options: SNAP_0_3,
    items: [
      '在做学校作业或其他的活动时，无法专注于细节的部分或出现粗心的错误',
      '很难持续专注于工作或游戏活动',
      '看起来好像没有听到别人对他（她）说话的内容',
      '没有办法遵循指示，也无法完成学校作业或家事',
      '很难组织规划工作及活动',
      '逃避，或表达不愿意，或很难从事需要持续性动脑的工作',
      '会弄丢作业或活动所必需的东西',
      '很容易受外在刺激影响而分心',
      '在日常生活中忘东忘西',
      '在座位上玩弄手脚或不好好坐着',
      '在教室或其他必须持续坐着的场合，会任意离开座位',
      '在不适当的场合，乱跑或爬高爬低',
      '很难安静地玩或参与休闲活动',
      '总是一直在动或是像装了马达似的动个不停',
      '话很多',
      '在问题还没问完前就急着回答',
      '在游戏中或团体活动中，无法排队或等待轮流',
      '打断或干扰别人',
      '发脾气',
      '与大人争论',
      '主动地反抗或拒绝大人的要求与规定',
      '故意地做一些事去干扰别人',
      '因自己犯的错误或不适当行为而怪罪别人',
      '易怒的或很容易被别人激怒',
      '生气的和（或）怨恨的',
      '在努力中容易泄气（灰心丧气）',
    ],
    groups: [
      { label: '注意力不集中', items: [1, 2, 3, 4, 5, 6, 7, 8, 9], cutoff: 1.78 },
      { label: '多动 / 冲动', items: [10, 11, 12, 13, 14, 15, 16, 17, 18], cutoff: 1.44 },
      { label: 'ADHD 合计', items: Array.from({ length: 18 }, (_, i) => i + 1), cutoff: 1.67 },
      { label: '对立违抗', items: [19, 20, 21, 22, 23, 24, 25, 26], cutoff: 1.44 },
    ],
    groupNote: '各题组按「均分 = 题组总分 ÷ 题数」计算。切截点取父母版常用参考值，达到切截点表示该方向值得进一步评估，不等于诊断。',
    sources: [
      'SNAP-IV 由 Swanson、Nolan 与 Pelham 编制，量表与评分规则公开免费用于非商业用途。本页 26 项结构与中文措辞取自公开流通的父母版。',
      '父母版切截点参考：刘昱志等（2006）台湾精神医学 20(4):290-304 的 95 百分位，以及 Bussing 等（2008）Assessment 15(3):317-328。<strong>第 26 题在不同译本中有「在努力中容易泄气」与「恶意的或有报复心的」两种译法，临床使用请以本机构正版量表为准。</strong>',
    ],
  },

  psc17: {
    code: 'PSC-17',
    title: '儿科症状检查表',
    route: '/mind/psc-17/',
    group: 'parent',
    kind: '家长评定',
    subtitle: '17 题 · 由家长填写',
    minutes: 3,
    timeframe: '对孩子的总体观察',
    instruction: '请根据您对孩子行为的观察，选择最能描述您孩子的一项。',
    lead: '儿童心理社会功能的家长评定筛查表。输出总分与内化、注意、外化三个分量表。',
    audience: '适用于 6–17 岁儿童青少年，由家长或主要照顾者评定。',
    audienceLead: '这份量表由家长或主要照顾者填写。',
    audienceNotes: [
      '适用于 6–17 岁。这是一份广谱筛查表，用于发现值得进一步了解的方向，不针对任何单一诊断。',
      '总分或任一分量表达到切截点，都建议就该方向做进一步专业评估。',
    ],
    cardHint: '17 题家长评定，广谱筛查儿童情绪与行为问题，出总分与三个分量表。',
    agePill: '6–17 岁 · 家长填写',
    maxScore: 34,
    scoring: 'groups',
    options: PSC_0_2,
    items: [
      '坐立不安，无法安静坐好',
      '感到悲伤、不快乐',
      '做白日梦太多',
      '不愿意与人分享',
      '不理解别人的感受',
      '感到绝望',
      '无法集中注意力',
      '和其他孩子打架',
      '对自己评价很低',
      '把自己的问题怪罪到别人身上',
      '似乎比以前不快乐（乐趣减少）',
      '不听从规则',
      '像被马达驱动一样停不下来',
      '嘲弄或取笑其他人',
      '很担心很多事情',
      '拿不属于自己的东西',
      '容易分心',
    ],
    groups: [
      { label: '总分', items: Array.from({ length: 17 }, (_, i) => i + 1), cutoff: 15, mode: 'sum' },
      { label: '内化问题', items: [2, 6, 9, 11, 15], cutoff: 5, mode: 'sum' },
      { label: '注意问题', items: [1, 3, 7, 13, 17], cutoff: 7, mode: 'sum' },
      { label: '外化问题', items: [4, 5, 8, 10, 12, 14, 16], cutoff: 7, mode: 'sum' },
    ],
    groupNote: '各项按题组总分计算（不取均分）。总分 ≥ 15 为阳性；任一分量表达到自己的切截点，也建议就该方向进一步评估。',
    sources: [
      'PSC 由 Jellinek 与 Murphy 编制（©1988，Massachusetts General Hospital），PSC-17 由 Gardner 与 Kelleher 于 1999 年编制，官方允许临床免费使用。',
      '切截点参考：<a href="https://pubmed.ncbi.nlm.nih.gov/17450052/" rel="external noreferrer">Gardner 等，2007</a>（JAACAP 46(5):611-618）。中文题目为参考译本，<strong>临床使用请以本机构正版量表为准</strong>。',
    ],
  },

  connersPsq: {
    code: 'Conners PSQ',
    title: '父母症状问卷',
    route: '/mind/conners-psq/',
    group: 'parent',
    kind: '家长评定',
    subtitle: '48 题 · 由家长填写',
    minutes: 8,
    timeframe: '平时或一贯表现',
    instruction: '以下是一些有关您孩子平时或一贯表现情况的描述，请选择最符合您孩子情况的一项。',
    lead: '48 题家长评定问卷，输出六个因子的原始分与均分，含多动指数。',
    audience: '适用于 3–16 岁儿童，由父亲或母亲填写。',
    audienceLead: '这份问卷由父亲或母亲填写，评的是孩子平时或一贯的表现。',
    audienceNotes: [
      '适用于 3–16 岁儿童。问卷输出六个因子的均分，其中「多动指数」最常用于 ADHD 初筛。',
      '本页<strong>会问孩子的年龄和性别</strong>，只用于按中国城市常模换算 T 分数；两项都可以不填，不填就只出均分。它们和答案一样只在本页内存中参与计算，不上传、不写入浏览器存储，刷新即清空。',
      '常模来自范娟等 2005 年的 14 城市 3576 例样本，只覆盖 4–17 岁；<strong>T 分数是相对同龄同性别城市儿童的位置，不是诊断</strong>。',
    ],
    cardHint: '48 题家长评定，输出六因子均分；填了年龄和性别还会按中国城市常模换算 T 分数。',
    agePill: '3–16 岁 · 家长填写',
    maxScore: 144,
    scoring: 'groups',
    norms: 'conners',
    context: {
      ageRange: CONNERS_NORMS.ageRange,
      legend: '换算 T 分数（可不填）',
      hint: '填孩子的周岁年龄和性别，六个因子会按同年龄同性别的中国城市常模换算成 T 分数。不填就只出均分。这两项只在本页内存中参与计算，不上传、不保存。',
      ageLabel: '年龄（周岁）',
      outOfRangeNote: '常模只覆盖 4–17 岁（原作者剔除了样本过少的 3 岁与 18 岁），超出这个范围不换算 T 分数，只出均分。'
    },
    options: CONNERS_0_3,
    items: [
      '某种小动作（咬指甲、吸手指、拉头发、拉衣服上的布毛）',
      '对大人粗鲁无礼',
      '在交朋友或保持友谊上存在问题',
      '易兴奋，易冲动',
      '爱指手画脚',
      '吸吮或咬嚼（拇指、衣服、毯子）',
      '容易或经常哭叫',
      '脾气很大',
      '白日梦',
      '学习困难',
      '扭动不安',
      '惧怕（新环境、陌生人、陌生地方、上学）',
      '坐立不安、经常“忙碌”',
      '破坏性',
      '撒谎或捏造情节',
      '怕羞',
      '造成的麻烦比同龄孩子多',
      '说话与同龄儿童不同（像婴儿说话、口吃、别人不易听懂）',
      '抵赖错误或归罪他人',
      '好争吵',
      '撅嘴和生气',
      '偷窃',
      '不服从或勉强服从',
      '忧虑比别人多（忧虑孤独、疾病、死亡）',
      '做事有始无终',
      '感情易受伤害',
      '欺凌别人',
      '不能停止重复性活动',
      '残忍',
      '稚气或不成熟（自己会的事要别人帮忙，纠缠依赖别人，常需要别人鼓励、支持）',
      '容易分心或注意力不集中',
      '头痛',
      '情绪变化迅速剧烈',
      '不喜欢或不遵从纪律或约束',
      '经常打架',
      '与兄弟姐妹不能很好相处',
      '在努力中容易泄气',
      '妨碍其他儿童',
      '基本上是一个不愉快的小孩',
      '有饮食问题（食欲不佳、进食中常跑开）',
      '胃痛',
      '有睡眠问题（不能入睡、早醒或夜间起床）',
      '其他疼痛',
      '呕吐或恶心',
      '感到在家庭圈子中被欺骗',
      '自夸或吹牛',
      '让自己受别人欺骗',
      '有大便问题（腹泻、排便不规则、便秘）',
    ],
    groups: [
      { label: '品行问题', items: [2, 8, 14, 19, 20, 21, 22, 23, 27, 33, 34, 39] },
      { label: '学习问题', items: [10, 25, 31, 37] },
      { label: '心身障碍', items: [32, 41, 43, 44, 48] },
      { label: '冲动-多动', items: [4, 5, 11, 13] },
      { label: '焦虑', items: [12, 16, 24, 47] },
      { label: '多动指数', items: [4, 7, 11, 13, 14, 25, 31, 33, 37, 38], cutoff: 1.5 },
    ],
    groupNote: '各因子按「均分 = 因子总分 ÷ 条目数」计算。填了年龄和性别时，按同年龄同性别的中国城市常模换算 T 分数，T ≥ 70（约等于均值 + 2SD）标记为偏高；多动指数另按原始量表建议的 ≥ 1.5 标记。两者都是筛查线索，不是诊断阈值。',
    sources: [
      'Conners 父母症状问卷（PSQ）为 Conners 1978 年修订版，中文版由徐韬园等引入，中国城市常模由苏林雁等（2001）与范娟等（2005）建立。本页题目取自公开流通的中文版。',
      'T 分数常模取自<strong>范娟, 杜亚松, 王立伟《Conners 父母用症状问卷的中国城市常模和信度研究》，上海精神医学 2005, 17(6): 321-323</strong> 的表 2（全国 14 城市 3576 例，2000 年调查），按整岁 4–17 岁 × 性别 × 六因子的均分与标准差换算：<code>T = 50 + 10 × (X − μ) / σ</code>。原作者已剔除样本过少的 3 岁（n=3）与 18 岁（n=10），本站对这两个年龄不换算、不外推。<strong>常模数值已与知网官方存档的期刊原文逐格核对一致</strong>（2026-09-03；表 2 的 168 个数值点与 28 个样本量、表 1 全部数值零分歧）。',
      '核对经三轮相互独立的识别：两份来源不同的期刊扫描件各一轮，加一轮在知网官方存档上的复读，三轮结论一致。该刊 2005 年这一期没有文字版电子稿，官方存档本身就是扫描件。需要说明的是，这个结论是「与期刊原文一致」，不等于「数值必然正确」——若期刊印刷本身有误，任何识别都会照样复现；写入正式报告或用于研究前，建议仍自行看一眼原表。',
      '常用判读：T ≥ 70 相当于同龄同性别常模的均值加 2 个标准差，本站按此标记；多动指数另按原始量表建议的 ≥ 1.5 标记。两者都是筛查线索，不是诊断阈值。有正版报告 T 分数时，可用 <a href="/mind/conners-t/">Conners T 分数换算</a>查百分位。',
      '<strong>题目措辞在不同译本间存在差异（徐韬园早期译本与现行流通版），临床使用请以本机构正版量表为准。</strong>',
    ],
  },
});

/* ---------- 计分 ---------- */

function validateAnswers(scale, answers) {
  if (!Array.isArray(answers) || answers.length !== scale.items.length) {
    throw new Error(`${scale.code} 需要 ${scale.items.length} 个完整答案`);
  }
  const allowed = new Set(scale.options.map(option => option.value));
  const values = [...allowed];
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (scale.scoring === 'asq') {
    if (answers.slice(0, 4).some(value => !allowed.has(value))) throw new Error('ASQ 前 4 题都需要回答');
    const positive = answers.slice(0, 4).some(value => value !== 0);
    if (positive && !allowed.has(answers[4])) throw new Error('前四项出现阳性时必须回答第 5 题');
    if (!positive && answers[4] !== -1 && !allowed.has(answers[4])) throw new Error('第 5 题答案无效');
    return;
  }
  if (answers.some(value => !Number.isInteger(value) || !allowed.has(value))) {
    throw new Error(`每个答案都必须是 ${min} 到 ${max} 的整数`);
  }
}

function bandFor(scale, total) {
  return scale.bands ? scale.bands.find(item => total <= item.max) : undefined;
}

function thresholdText(positive) {
  return positive ? '达到常用的进一步评估阈值' : '未达到常用的进一步评估阈值';
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
    details: [],
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
      { label: '标准分', value: `${total.toFixed(2)}（粗分 × 1.25）` },
    ],
  };
}

/** T ≥ 70 约等于同龄同性别常模的均值 + 2SD，是 Conners 常用的偏高标记线。 */
const T_SCORE_ELEVATED = 70;

/**
 * 取常模。只在量表声明了 norms、且上下文给全年龄与性别、且年龄落在常模覆盖区间时才返回。
 * 覆盖区间外一律返回 null——不外推、不退回总体常模。
 */
function lookupNorms(scale, context) {
  if (scale.norms !== 'conners' || !context) return null;
  const { ageYears, sex } = context;
  if (sex !== 'M' && sex !== 'F') return null;
  if (!Number.isInteger(ageYears)) return null;
  const [min, max] = CONNERS_NORMS.ageRange;
  if (ageYears < min || ageYears > max) return null;
  const table = CONNERS_NORMS.norms[sex]?.[ageYears];
  return table ? { table, sampleSize: CONNERS_NORMS.sampleSizes[sex][ageYears] } : null;
}

function scoreGroups(scale, answers, context) {
  const total = answers.reduce((sum, value) => sum + value, 0);
  const normEntry = lookupNorms(scale, context);
  let anyFlagged = false;
  const details = scale.groups.map((group, groupIndex) => {
    const sum = group.items.reduce((acc, number) => acc + answers[number - 1], 0);
    const mean = sum / group.items.length;
    const useSum = group.mode === 'sum';
    const compared = useSum ? sum : mean;
    let flagged = group.cutoff !== undefined && compared >= group.cutoff;
    const shown = useSum
      ? `${sum} / ${group.items.length * scale.options[scale.options.length - 1].value}`
      : `均分 ${mean.toFixed(2)}（总分 ${sum} / ${group.items.length} 题）`;
    const cutoffText = group.cutoff === undefined
      ? ''
      : ` · 切截点 ${group.cutoff} · ${flagged ? '已达到' : '未达到'}`;

    let tScoreText = '';
    const norm = normEntry?.table[groupIndex];
    if (norm) {
      const [mu, sigma] = norm;
      const tScore = 50 + 10 * ((mean - mu) / sigma);
      if (tScore >= T_SCORE_ELEVATED) flagged = true;
      tScoreText = ` · T ${tScore.toFixed(1)}（${formatPercentileFromT(tScore)}）`;
    }

    if (flagged) anyFlagged = true;
    return { label: group.label, value: `${shown}${tScoreText}${cutoffText}`, flagged };
  });
  const positive = scale.positiveAt !== undefined ? total >= scale.positiveAt : anyFlagged;
  return {
    total,
    totalText: String(total),
    maxScore: scale.maxScore,
    normsApplied: Boolean(normEntry),
    normsNote: scale.norms !== 'conners'
      ? ''
      : normEntry
        ? `T 分数按 ${context.ageYears} 岁${context.sex === 'M' ? '男' : '女'}童常模换算（该组样本 ${normEntry.sampleSize} 人）。`
        : '未换算 T 分数：需要填写年龄与性别，且年龄落在常模覆盖的 4–17 岁。',
    band: {
      label: anyFlagged ? '有题组达到常用切截点' : '各题组均未达到常用切截点',
      token: anyFlagged ? 'moderate' : 'minimal',
      guidance: anyFlagged
        ? '有题组达到常用切截点。这是筛查线索，不是诊断；建议带着这份结果找儿科、儿童精神科或发育行为专业人员进一步评估。'
        : '本次各题组都没有达到常用切截点。筛查结果正常不排除问题，如果你在日常中仍有担心，请直接找专业人员当面评估。',
    },
    positive,
    positiveText: anyFlagged ? '建议就达到切截点的方向进一步评估' : '本次未触发任何切截点',
    safetyFlag: false,
    details,
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
        SAFETY_12356,
      ]
      : [
        '前四项中出现了“是”或“不愿回答”。无论后面怎么答，这一部分都值得由专业人员完成一次简短的安全评估。',
        SAFETY_12356,
      ],
    details: [{ label: '前四项阳性条目数', value: `${total} / 4` }],
  };
}

function scoreScale(scaleKey, answers, context) {
  const scale = SCALES[scaleKey];
  if (!scale) throw new Error(`未知量表：${scaleKey}`);
  validateAnswers(scale, answers);
  if (scale.scoring === 'sum') return scoreSum(scale, answers);
  if (scale.scoring === 'zung') return scoreZung(scale, answers);
  if (scale.scoring === 'groups') return scoreGroups(scale, answers, context);
  if (scale.scoring === 'asq') return scoreAsq(scale, answers);
  throw new Error(`未知计分方式：${scale.scoring}`);
}

/* ---------- 正态换算：T 分数 ↔ 百分位 ---------- */

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

function convertTScore(input) {
  const tScore = Number(input);
  if (!Number.isFinite(tScore) || tScore < 20 || tScore > 100) throw new Error('T 分数请输入 20–100 之间的数值');
  const z = (tScore - 50) / 10;
  const percentile = 100 * 0.5 * (1 + erf(z / Math.SQRT2));
  return { tScore, z, percentile, percentileText: `P${percentile.toFixed(1)}` };
}

/* ---------- 渲染 ---------- */

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
}

function questionMarkup(scale) {
  return scale.items.map((item, questionIndex) => {
    const options = scale.options.map(option => {
      const id = `question-${questionIndex}-option-${option.value}`;
      return `
        <label class="response-option" for="${id}">
          <input id="${id}" name="question-${questionIndex}" type="radio" value="${option.value}">
          <span>${escapeHtml(option.label)}</span>
        </label>`;
    }).join('');
    const conditional = scale.conditionalLast && questionIndex === scale.items.length - 1;
    return `
      <fieldset class="question-card${conditional ? ' conditional' : ''}" id="question-${questionIndex}"${conditional ? ' hidden' : ''}>
        <legend><span>第 ${questionIndex + 1} 题</span>${escapeHtml(item)}</legend>
        <div class="response-grid">${options}</div>
      </fieldset>`;
  }).join('');
}

function activeIndexes(scale, form) {
  const count = scale.items.length;
  if (!scale.conditionalLast) return Array.from({ length: count }, (_, index) => index);
  const firstFour = Array.from({ length: count - 1 }, (_, index) => index);
  const triggered = firstFour.some(index => {
    const checked = form.querySelector(`input[name="question-${index}"]:checked`);
    return checked && Number(checked.value) !== 0;
  });
  return triggered ? Array.from({ length: count }, (_, index) => index) : firstFour;
}

/**
 * 读取「换算 T 分数」那一小块的年龄与性别。两项都可以不填；
 * 值只从 DOM 读一次交给计分函数，不写入任何存储。
 */
function readContext(scale) {
  if (!scale.context) return undefined;
  const ageInput = document.querySelector('#contextAge');
  const sexButton = document.querySelector('.context-sex[aria-pressed="true"]');
  if (!ageInput) return undefined;
  const raw = ageInput.value.trim();
  const ageYears = raw === '' ? null : Number(raw);
  return {
    ageYears: Number.isInteger(ageYears) ? ageYears : null,
    sex: sexButton ? sexButton.dataset.sex : null
  };
}

function initContextControls(scale) {
  if (!scale.context) return;
  const buttons = [...document.querySelectorAll('.context-sex')];
  buttons.forEach(button => button.addEventListener('click', () => {
    const alreadyOn = button.getAttribute('aria-pressed') === 'true';
    buttons.forEach(other => other.setAttribute('aria-pressed', String(!alreadyOn && other === button)));
  }));

  const ageInput = document.querySelector('#contextAge');
  const ageHint = document.querySelector('#contextAgeHint');
  if (!ageInput || !ageHint) return;
  const [min, max] = scale.context.ageRange;
  ageInput.addEventListener('input', () => {
    const raw = ageInput.value.trim();
    if (raw === '') {
      ageHint.textContent = '';
      return;
    }
    const value = Number(raw);
    ageHint.textContent = Number.isInteger(value) && value >= min && value <= max
      ? ''
      : scale.context.outOfRangeNote;
  });
}

function initAssessment() {
  const page = document.querySelector('[data-mental-health-scale]');
  if (!page) return;

  const scaleKey = page.dataset.mentalHealthScale;
  const scale = SCALES[scaleKey];
  if (!scale) return;

  const form = document.querySelector('#assessmentForm');
  const questionnaire = document.querySelector('#questionnaire');
  const report = document.querySelector('#report');
  const questionList = document.querySelector('#questionList');
  const submitButton = document.querySelector('#generateReport');
  const progressText = document.querySelector('#progressText');
  const progressBar = document.querySelector('#progressBar');
  const completionHint = document.querySelector('#completionHint');
  const reportTitle = document.querySelector('#reportTitle');

  questionList.innerHTML = questionMarkup(scale);

  function syncConditional() {
    if (!scale.conditionalLast) return;
    const active = activeIndexes(scale, form);
    const lastIndex = scale.items.length - 1;
    const lastCard = document.querySelector(`#question-${lastIndex}`);
    const show = active.includes(lastIndex);
    lastCard.hidden = !show;
    if (!show) {
      lastCard.querySelectorAll('input[type="radio"]').forEach(input => { input.checked = false; });
    }
  }

  function updateProgress() {
    syncConditional();
    const active = activeIndexes(scale, form);
    const answered = active.filter(index => form.querySelector(`input[name="question-${index}"]:checked`)).length;
    const total = active.length;
    const complete = answered === total;
    submitButton.disabled = !complete;
    progressText.textContent = `已完成 ${answered} / ${total} 题`;
    progressBar.style.width = `${(answered / total) * 100}%`;
    completionHint.textContent = complete ? '已全部作答，可以生成报告。' : `还差 ${total - answered} 题。`;
  }

  updateProgress();
  initContextControls(scale);
  form.addEventListener('change', updateProgress);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const active = activeIndexes(scale, form);
    const missing = active.find(index => !form.querySelector(`input[name="question-${index}"]:checked`));
    if (missing !== undefined) {
      completionHint.textContent = '请完成所有题目后再生成报告。';
      document.querySelector(`#question-${missing}`)?.scrollIntoView({ block: 'center' });
      return;
    }
    const answers = scale.items.map((_, index) => {
      const checked = form.querySelector(`input[name="question-${index}"]:checked`);
      return checked ? Number(checked.value) : -1;
    });

    const result = scoreScale(scaleKey, answers, readContext(scale));
    const scoreLabel = document.querySelector('#scoreLabel');
    if (scoreLabel) scoreLabel.textContent = scale.scoring === 'zung' ? '标准分' : scale.scoring === 'asq' ? '阳性条目数' : '总分';
    document.querySelector('#scoreValue').textContent = `${result.totalText} / ${result.maxScore}`;
    document.querySelector('#severityLabel').textContent = result.band.label;
    document.querySelector('#reportGuidance').textContent = result.band.guidance || '';
    document.querySelector('#thresholdLabel').textContent = result.positiveText;
    document.querySelector('#resultCard').dataset.level = result.band.token;

    const safetyCard = document.querySelector('#safetyCard');
    if (safetyCard) {
      safetyCard.hidden = !result.safetyFlag;
      if (result.safetyFlag && (result.safetyTitle || result.safetyBody)) {
        const title = result.safetyTitle || scale.safety?.title;
        const body = result.safetyBody || scale.safety?.body || [];
        safetyCard.innerHTML = `<h3>${escapeHtml(title)}</h3>${body.map(text => `<p>${text}</p>`).join('')}`;
      }
    }

    const normsNote = document.querySelector('#normsNote');
    if (normsNote) {
      normsNote.hidden = !result.normsNote;
      normsNote.textContent = result.normsNote || '';
      normsNote.dataset.applied = String(Boolean(result.normsApplied));
    }

    const detailBox = document.querySelector('#resultDetails');
    if (detailBox) {
      detailBox.hidden = !result.details.length;
      detailBox.innerHTML = result.details
        .map(detail => `<div class="detail-row${detail.flagged ? ' flagged' : ''}"><span>${escapeHtml(detail.label)}</span><span>${escapeHtml(detail.value)}</span></div>`)
        .join('');
    }

    const answerReview = document.querySelector('#answerReview');
    answerReview.innerHTML = scale.items.map((item, index) => {
      if (!active.includes(index)) return '';
      const option = scale.options.find(candidate => candidate.value === answers[index]);
      return `<li><span><strong>${index + 1}.</strong> ${escapeHtml(item)}</span><span>${escapeHtml(option ? option.label : '')}</span></li>`;
    }).join('');

    questionnaire.hidden = true;
    report.hidden = false;
    document.body.classList.add('report-visible');
    reportTitle.focus();
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });

  document.querySelector('#restartAssessment').addEventListener('click', () => {
    form.reset();
    const ageInput = document.querySelector('#contextAge');
    if (ageInput) {
      ageInput.value = '';
      document.querySelector('#contextAgeHint').textContent = '';
      document.querySelectorAll('.context-sex').forEach(button => button.setAttribute('aria-pressed', 'false'));
    }
    report.hidden = true;
    questionnaire.hidden = false;
    document.body.classList.remove('report-visible');
    updateProgress();
    document.querySelector('#question-0 input').focus();
    window.scrollTo({ top: 0, behavior: 'auto' });
  });

  document.querySelector('#printReport').addEventListener('click', () => window.print());

  const audienceDialog = document.querySelector('#audienceDialog');
  if (audienceDialog && typeof audienceDialog.showModal === 'function') {
    audienceDialog.addEventListener('close', () => document.querySelector('#question-0 input')?.focus(), { once: true });
    audienceDialog.showModal();
  }
}

function initCalculator() {
  const page = document.querySelector('[data-conners-calculator]');
  if (!page) return;
  const input = document.querySelector('#tScoreInput');
  const output = document.querySelector('#tScoreOutput');
  const error = document.querySelector('#tScoreError');

  function convert() {
    try {
      const result = convertTScore(input.value);
      error.hidden = true;
      output.hidden = false;
      document.querySelector('#tScoreValue').textContent = `${result.percentileText}`;
      document.querySelector('#tScoreDetail').textContent =
        `T = ${result.tScore}，相当于 Z = ${result.z.toFixed(2)}；在正态分布下约有 ${result.percentile.toFixed(1)}% 的同组儿童得分低于此值。`;
    } catch (caught) {
      output.hidden = true;
      error.hidden = false;
      error.textContent = caught.message;
    }
  }

  document.querySelector('#tScoreConvert').addEventListener('click', convert);
  input.addEventListener('keydown', event => { if (event.key === 'Enter') convert(); });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initAssessment();
    initCalculator();
  });
}

export { SCALES, scoreScale, convertTScore };
