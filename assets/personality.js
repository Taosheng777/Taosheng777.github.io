/* 16 型人格测试 v1.9.0
   题库、计分与逐项解读移植自微信小程序 1.4.2（17-微信小程序，提交 8e96cd1）的
   services/personality-data.js 与 services/personality.js，逐字对齐：
   题干、反向题、题序、选项分值、维度映射与结果文字两边必须完全一致，
   由 tests/fixtures/personality-parity.json 的内容哈希与 45 组作答逐项钉住。

   题干、计分与解读文字均为本项目自行撰写，不取自任何第三方人格测试的题库或算法。
   维度配色不属于对齐范围：小程序用的是参考页面实测色，本站改用站点自有色板，
   由 assets/personality.css 按 data-dim 指定，这里不写死任何颜色。

   作答值为 -3 到 +3：-3 是最强的「认同」，+3 是最强的「不认同」，0 为中立。
   同意强度 agree = -value；reverse 题把同意计到维度的第二个字母上。
   每个维度 12 题，维度分值域 -36 到 36。

   所有作答只存在当前页面内存，不写入任何浏览器存储，刷新即清空。 */

const DIMENSIONS = Object.freeze([
  {
    key: 'mind',
    positive: 'E',
    negative: 'I',
    positiveLabel: '外向',
    negativeLabel: '内向',
    title: '精力来源',
    note: '偏向从外部互动中获得能量，还是从独处中恢复能量。',
  },
  {
    key: 'energy',
    positive: 'N',
    negative: 'S',
    positiveLabel: '直觉',
    negativeLabel: '实感',
    title: '信息偏好',
    note: '偏向关注可能性与联想，还是关注具体事实与细节。',
  },
  {
    key: 'nature',
    positive: 'T',
    negative: 'F',
    positiveLabel: '思考',
    negativeLabel: '情感',
    title: '决策依据',
    note: '偏向依据逻辑与客观标准，还是依据感受与人际影响。',
  },
  {
    key: 'tactics',
    positive: 'J',
    negative: 'P',
    positiveLabel: '判断',
    negativeLabel: '展望',
    title: '生活方式',
    note: '偏向提前计划与定论，还是保持弹性与开放。',
  },
  {
    key: 'identity',
    positive: 'A',
    negative: 'T',
    positiveLabel: '自信',
    negativeLabel: '起伏',
    title: '自我状态',
    note: '偏向对自己稳定满意，还是对自己敏感而要求更高。',
  },
]);

/* 每个维度 12 题，同意方向与反向各半，降低单向作答倾向。 */
const POOL = Object.freeze({
  mind: [
    ['在热闹的聚会上，你会主动去和不认识的人攀谈。', false],
    ['独处一整天之后，你反而觉得精力更充足。', true],
    ['你习惯先开口把想法说出来，再慢慢把它想清楚。', false],
    ['长时间和人打交道之后，你需要独自待一会儿才能缓过来。', true],
    ['你喜欢身边一直有人来人往的环境。', false],
    ['在陌生场合里，你更愿意等别人先来找你说话。', true],
    ['在小组讨论里，你通常是发言最多的那几个人之一。', false],
    ['比起人多的活动，你更享受两三个人的深聊。', true],
    ['接到临时的聚会邀约，你多半会答应。', false],
    ['把周末排满社交安排，对你来说是件累人的事。', true],
    ['认识新朋友对你来说是一件轻松的事。', false],
    ['你需要安静的环境才能把注意力真正集中起来。', true],
  ],
  energy: [
    ['你经常会想一些暂时没有实际用途的问题。', false],
    ['比起讨论各种可能，你更愿意谈具体怎么做。', true],
    ['看到一件作品，你会忍不住去琢磨它背后的意思。', false],
    ['你更相信亲眼见到的事实，而不是推演出来的结论。', true],
    ['你常常在脑子里设想还没有发生的场景。', false],
    ['学新东西时，你希望先拿到一套明确的步骤。', true],
    ['抽象的理论对你有吸引力。', false],
    ['你更擅长处理眼前的具体事务，而不是长远的构想。', true],
    ['你喜欢把看上去不相干的事情联系到一起想。', false],
    ['细节和数据比宏观的趋势更能说服你。', true],
    ['你常常对「本来还可以是什么样」感到好奇。', false],
    ['做判断时，你主要依据过去的实际经验。', true],
  ],
  nature: [
    ['争论一件事时，你更看重逻辑是否站得住。', false],
    ['别人难过时，你会先照顾他的情绪，再谈对错。', true],
    ['你能在不被情绪带走的情况下做出判断。', false],
    ['你很容易察觉到别人心情的变化。', true],
    ['给建议时，你倾向于直接说出问题在哪里。', false],
    ['做决定时，你会认真考虑这会让谁不好受。', true],
    ['你认为公平比让每个人都满意更重要。', false],
    ['看电影或读小说时，你常常被人物的处境打动。', true],
    ['讨论问题时，你不介意被人直接指出错误。', false],
    ['维持关系的和睦，比争出一个结果更值得。', true],
    ['你习惯先把事实分析清楚，再考虑感受。', false],
    ['你很在意自己说的话会不会伤到别人。', true],
  ],
  tactics: [
    ['你习惯提前把计划安排好。', false],
    ['临时改变安排不会让你不舒服。', true],
    ['你喜欢列清单，并且照着一件件完成。', false],
    ['你常常把事情拖到最后一刻才开始。', true],
    ['你的日常生活有比较固定的节奏。', false],
    ['比起定好的行程，你更喜欢走到哪算哪。', true],
    ['桌面和文件保持整齐，会让你更舒服。', false],
    ['你更愿意让选择一直开着，而不是早早定下来。', true],
    ['任务一旦接手，你会尽早把它做完。', false],
    ['你觉得规则有时候可以灵活处理。', true],
    ['出门前你会把要带的东西一一确认。', false],
    ['没有任何计划的一天，让你觉得轻松。', true],
  ],
  identity: [
    ['你对自己的能力有比较稳定的信心。', false],
    ['事情做完之后，你还会反复回想哪里没做好。', true],
    ['遇到压力时，你仍然能保持镇定。', false],
    ['你常常担心还没有发生的事情。', true],
    ['别人的评价很少动摇你的判断。', false],
    ['你对自己的要求高到常常不满意。', true],
    ['犯了错，你能比较快地翻过这一页。', false],
    ['你经常感到心里绷着一根弦。', true],
    ['你对目前的自己大体上是满意的。', false],
    ['在重要场合之前，你会紧张很久。', true],
    ['计划被打乱时，你不容易慌。', false],
    ['你常常拿自己和别人比较。', true],
  ],
});

/* 交错取题：五个维度轮流出一题，使同一页里的题目不集中在同一个维度。 */
function buildItems() {
  const order = DIMENSIONS.map(dimension => dimension.key);
  const items = [];
  for (let round = 0; round < 12; round += 1) {
    for (const key of order) {
      const [text, reverse] = POOL[key][round];
      items.push(Object.freeze({ id: `${key}-${round + 1}`, text, dimension: key, reverse }));
    }
  }
  return Object.freeze(items);
}

const ITEMS = buildItems();

/* 每组 10 题，60 题共 6 组。 */
const PAGE_SIZE = 10;

const OPTIONS = Object.freeze([
  { value: -3, step: 3, tone: 'agree', label: '我强烈认同' },
  { value: -2, step: 2, tone: 'agree', label: '我比较认同' },
  { value: -1, step: 1, tone: 'agree', label: '我同意' },
  { value: 0, step: 0, tone: 'neutral', label: '中立' },
  { value: 1, step: 1, tone: 'disagree', label: '我不太认同' },
  { value: 2, step: 2, tone: 'disagree', label: '我比较不认同' },
  { value: 3, step: 3, tone: 'disagree', label: '我强烈不认同' },
]);

/* 逐项解读：每个极各一段。identity 维度的第二极与 nature 的第一极都是字母 T，
   这里用 TURBULENT 区分，短句表 FACET_TEXT 同理。 */
const FACET_REPORTS = Object.freeze({
  E: {
    summary: '你更容易在人多、事情正在发生的场合里被充上电。',
    points: [
      '想法常常是边说边成形的，讨论比独自琢磨更能把事情推进一步。',
      '新环境和陌生人对你的消耗不大，起步通常比别人快。',
      '要留意的是，独处时间被挤掉太多时，先受影响的往往是判断力。',
    ],
  },
  I: {
    summary: '你的精力主要在安静和独处里回来。',
    points: [
      '想清楚再开口是常态，发言少不代表参与度低。',
      '两三个人的深聊，比人多的场合更让你觉得有收获。',
      '要留意的是，长期不表达会让别人低估你已经做过的思考。',
    ],
  },
  N: {
    summary: '你的注意力容易跑到「还可能是什么」上面。',
    points: [
      '擅长在看上去不相干的事情之间找到联系，点子来得比较快。',
      '对模式、隐喻和长期走向敏感，愿意为一个想法本身花时间。',
      '要留意的是，细节和落地步骤容易被跳过，收尾常常比开头难。',
    ],
  },
  S: {
    summary: '你更相信看得见、摸得着、验证过的东西。',
    points: [
      '处理具体事务时稳，细节和数据不容易从你手里漏掉。',
      '学新东西时希望先拿到明确步骤，按步骤走的效率很高。',
      '要留意的是，对没有先例的方案容易先否定，错过的机会不容易被看见。',
    ],
  },
  T: {
    summary: '做判断时，你先看逻辑和标准是否站得住。',
    points: [
      '能在情绪起伏中保持判断，压力下做的决定质量比较稳。',
      '给反馈直接，也不介意别人直接指出你的问题。',
      '要留意的是，「对」和「被接受」是两件事，忽略后者会让正确的结论推不动。',
    ],
  },
  F: {
    summary: '做判断时，你会把人和关系一起算进去。',
    points: [
      '对别人的情绪变化敏感，常常先于对方察觉气氛不对。',
      '决定之前会想清楚它落在谁身上、谁会不好受。',
      '要留意的是，为了不让人难受而回避结论，问题会被推迟而不是解决。',
    ],
  },
  J: {
    summary: '你偏好把事情定下来，然后按计划往前推。',
    points: [
      '提前规划、列清单、按顺序完成，对你来说是省力而不是负担。',
      '交付可靠，别人容易预期你的节奏。',
      '要留意的是，过早关掉选项会让你错过后来才出现的更好选择。',
    ],
  },
  P: {
    summary: '你偏好让事情开着，随情况调整。',
    points: [
      '计划被打乱时适应得快，临场处理的能力强。',
      '愿意同时留几个方向，不急着收口。',
      '要留意的是，长期不收口会让事情停在「还在考虑」，临近截止时压力集中爆发。',
    ],
  },
  A: {
    summary: '你对自己的状态大体是稳的。',
    points: [
      '别人的评价不容易动摇你的判断，犯错之后恢复得快。',
      '压力场合里情绪波动小，还能继续把事情做下去。',
      '要留意的是，对自己的问题不够敏感时，改进的动力会偏弱。',
    ],
  },
  TURBULENT: {
    summary: '你对自己比较敏感，要求也更高。',
    points: [
      '对做得不够好的地方察觉得早，改进的动力强。',
      '在意结果，准备通常比别人充分。',
      '要留意的是，反复回想和自我比较，会消耗掉本该用在下一件事上的精力。',
    ],
  },
});

const FACET_TEXT = Object.freeze({
  E: '从与人互动中获得能量',
  I: '从独处中恢复能量',
  N: '关注可能性与联想',
  S: '关注具体事实与细节',
  T: '依据逻辑与客观标准做决定',
  F: '依据感受与人际影响做决定',
  J: '习惯提前计划、早做定论',
  P: '保持弹性、随机应变',
  A: '对自己的状态比较笃定',
  TURBULENT: '对自己敏感、要求更高',
});

const MAX_PER_DIMENSION = 36;

/* ---------- 计分 ---------- */

/** identity 的第二极与 nature 的第一极都是字母 T，解读与短句按维度区分。 */
function facetKey(dimensionKey, letter) {
  return dimensionKey === 'identity' && letter === 'T' ? 'TURBULENT' : letter;
}

function isAnswered(value) {
  return Number.isInteger(value) && value >= -3 && value <= 3;
}

function validateAnswers(answers) {
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
  validateAnswers(answers);
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
      balanced: Math.abs(score) <= 3,
      report: FACET_REPORTS[facetKey(dimension.key, letter)],
    };
  });

  const letters = facets.slice(0, 4).map(facet => facet.letter).join('');
  const identity = facets[4];
  const code = `${letters}-${identity.letter}`;
  const summary = facets
    .map(facet => FACET_TEXT[facetKey(facet.key, facet.letter)])
    .join('，') + '。';

  return { code, letters, identityLetter: identity.letter, facets, summary };
}

/* ---------- 页面 ---------- */

const TOTAL = ITEMS.length;
const TOTAL_STEPS = Math.ceil(TOTAL / PAGE_SIZE);
/* 估算剩余时间：一道题按 10 秒计，60 题约 10 分钟。 */
const SECONDS_PER_ITEM = 10;

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
}

function optionMarkup(index, value) {
  return OPTIONS.map(option => {
    const id = `q${index}-o${option.value + 3}`;
    const checked = option.value === value ? ' checked' : '';
    return `<label class="quiz-option" for="${id}" data-tone="${option.tone}" data-step="${option.step}" title="${escapeHtml(option.label)}">
            <input id="${id}" type="radio" name="q${index}" value="${option.value}"${checked}>
            <span class="quiz-circle" aria-hidden="true"></span>
            <span class="quiz-option-text">${escapeHtml(option.label)}</span>
          </label>`;
  }).join('\n');
}

function questionMarkup(item, index, value) {
  return `<li class="quiz-item" id="q-${index}" data-state="${value === null ? 'pending' : 'done'}">
        <p class="quiz-number">第 ${String(index + 1).padStart(2, '0')} 题</p>
        <p class="quiz-statement">${escapeHtml(item.text)}</p>
        <fieldset class="quiz-scale">
          <legend class="visually-hidden">${escapeHtml(item.text)}</legend>
          <div class="quiz-options">
${optionMarkup(index, value)}
          </div>
          <div class="quiz-ends"><span class="quiz-end quiz-end-agree">认同</span><span class="quiz-end quiz-end-disagree">不认同</span></div>
        </fieldset>
      </li>`;
}

function facetAxisMarkup(facet) {
  /* 条形从中线画到标记点：方向表示偏向哪一极，长度表示偏得有多远。 */
  const left = Math.min(facet.axisLeft, 50);
  const width = Math.abs(50 - facet.axisLeft);
  return `<li class="facet" data-dim="${facet.key}">
        <div class="facet-head">
          <span class="facet-title">${escapeHtml(facet.title)}</span>
          <span class="facet-value">${facet.percent}% ${escapeHtml(facet.label)}</span>
        </div>
        <div class="facet-axis">
          <span class="facet-mid" aria-hidden="true"></span>
          <span class="facet-bar" style="left: ${left}%; width: ${width}%;" aria-hidden="true"></span>
          <span class="facet-marker" style="left: ${facet.axisLeft}%;" aria-hidden="true"></span>
        </div>
        <div class="facet-ends"><span>${escapeHtml(facet.leftLabel)}</span><span>${escapeHtml(facet.rightLabel)}</span></div>
      </li>`;
}

function facetReportMarkup(facet) {
  const balanced = facet.balanced
    ? `        <p class="facet-balanced">本次两侧接近，这一项的结果不稳定，换一天作答可能会翻过去。</p>\n`
    : '';
  return `<article class="facet-report" data-dim="${facet.key}">
        <div class="facet-report-head">
          <span class="facet-letter" aria-hidden="true">${escapeHtml(facet.letter)}</span>
          <div>
            <h4>${escapeHtml(facet.label)} ${facet.percent}%</h4>
            <p class="facet-report-sub">${escapeHtml(facet.title)} <span aria-hidden="true">·</span> ${escapeHtml(facet.leftLabel)} / ${escapeHtml(facet.rightLabel)}</p>
          </div>
        </div>
${balanced}        <p class="facet-report-summary">${escapeHtml(facet.report.summary)}</p>
        <ul class="facet-points">
${facet.report.points.map(point => `          <li>${escapeHtml(point)}</li>`).join('\n')}
        </ul>
      </article>`;
}

function initPersonality() {
  const page = document.querySelector('[data-personality]');
  if (!page) return;

  const quiz = document.querySelector('#quiz');
  const list = document.querySelector('#questionList');
  const result = document.querySelector('#result');
  const progressCount = document.querySelector('#progressCount');
  const progressTime = document.querySelector('#progressTime');
  const progressSegments = document.querySelector('#progressSegments');
  const stepLabel = document.querySelector('#stepLabel');
  const prevButton = document.querySelector('#prevStep');
  const nextButton = document.querySelector('#nextStep');
  const hint = document.querySelector('#stepHint');

  let answers = ITEMS.map(() => null);
  let step = 0;

  progressSegments.innerHTML = Array.from(
    { length: TOTAL_STEPS },
    () => '<span class="progress-seg"><span class="progress-seg-fill"></span></span>'
  ).join('');
  const segmentFills = [...progressSegments.querySelectorAll('.progress-seg-fill')];

  function answeredCount() {
    return answers.filter(value => value !== null).length;
  }

  function firstUnansweredOnStep() {
    const from = step * PAGE_SIZE;
    for (let index = from; index < Math.min(from + PAGE_SIZE, TOTAL); index += 1) {
      if (answers[index] === null) return index;
    }
    return -1;
  }

  function renderProgress() {
    const done = answeredCount();
    progressCount.textContent = `已作答 ${done} / ${TOTAL}`;
    const left = TOTAL - done;
    progressTime.textContent = left === 0
      ? '已全部作答'
      : `约还需 ${Math.ceil((left * SECONDS_PER_ITEM) / 60)} 分钟`;
    segmentFills.forEach((fill, index) => {
      const from = index * PAGE_SIZE;
      const filled = answers.slice(from, from + PAGE_SIZE).filter(value => value !== null).length;
      fill.style.width = `${Math.round((filled / PAGE_SIZE) * 100)}%`;
      fill.parentElement.dataset.current = String(index === step);
    });
    stepLabel.textContent = `第 ${step + 1} / ${TOTAL_STEPS} 部分`;
    prevButton.hidden = step === 0;
    nextButton.textContent = step === TOTAL_STEPS - 1 ? '查看结果' : '下一组题';
  }

  function renderStep() {
    const from = step * PAGE_SIZE;
    list.innerHTML = ITEMS.slice(from, from + PAGE_SIZE)
      .map((item, offset) => questionMarkup(item, from + offset, answers[from + offset]))
      .join('\n');
    hint.textContent = '';
    markActive();
    renderProgress();
  }

  function markActive() {
    const active = firstUnansweredOnStep();
    for (const node of list.querySelectorAll('.quiz-item')) {
      node.dataset.active = String(Number(node.id.replace('q-', '')) === active);
    }
  }

  function showResult() {
    const scored = scorePersonality(answers);
    document.querySelector('#resultCode').textContent = scored.code;
    document.querySelector('#resultSummary').textContent = scored.summary;
    document.querySelector('#resultAxes').innerHTML = scored.facets.map(facetAxisMarkup).join('\n');
    document.querySelector('#resultReports').innerHTML = scored.facets.map(facetReportMarkup).join('\n');
    quiz.hidden = true;
    result.hidden = false;
    document.querySelector('#resultTitle').focus();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  list.addEventListener('change', event => {
    const input = event.target;
    if (!input.matches('input[type="radio"]')) return;
    const index = Number(input.name.replace('q', ''));
    if (!Number.isInteger(index) || index < 0 || index >= TOTAL) return;
    answers[index] = Number(input.value);
    const item = document.querySelector(`#q-${index}`);
    if (item) item.dataset.state = 'done';
    hint.textContent = '';
    markActive();
    renderProgress();
  });

  nextButton.addEventListener('click', () => {
    const pending = firstUnansweredOnStep();
    if (pending >= 0) {
      const missing = answers.slice(step * PAGE_SIZE, step * PAGE_SIZE + PAGE_SIZE)
        .filter(value => value === null).length;
      hint.textContent = `这一组还差 ${missing} 题没有作答。`;
      const node = document.querySelector(`#q-${pending}`);
      if (node) {
        node.scrollIntoView({ block: 'center', behavior: 'smooth' });
        node.querySelector('input')?.focus({ preventScroll: true });
      }
      return;
    }
    if (step < TOTAL_STEPS - 1) {
      step += 1;
      renderStep();
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    showResult();
  });

  prevButton.addEventListener('click', () => {
    if (step === 0) return;
    step -= 1;
    renderStep();
    window.scrollTo({ top: 0, behavior: 'auto' });
  });

  document.querySelector('#restartQuiz').addEventListener('click', () => {
    answers = ITEMS.map(() => null);
    step = 0;
    result.hidden = true;
    quiz.hidden = false;
    renderStep();
    window.scrollTo({ top: 0, behavior: 'auto' });
  });

  document.querySelector('#printResult').addEventListener('click', () => window.print());

  renderStep();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initPersonality);
}

export { DIMENSIONS, ITEMS, PAGE_SIZE, OPTIONS, FACET_REPORTS, FACET_TEXT, MAX_PER_DIMENSION, facetKey, isAnswered, dimensionScores, toPercent, scorePersonality };
