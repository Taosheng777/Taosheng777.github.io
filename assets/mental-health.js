const RESPONSE_OPTIONS = Object.freeze([
  { value: 0, label: '完全不会' },
  { value: 1, label: '好几天' },
  { value: 2, label: '一半以上的日子' },
  { value: 3, label: '几乎每天' },
]);

const SCALES = Object.freeze({
  phq9: {
    code: 'PHQ-9',
    title: '抑郁症状自评',
    maxScore: 27,
    positiveAt: 10,
    items: [
      '做事时提不起劲或没有兴趣',
      '感到心情低落、沮丧或绝望',
      '入睡困难、睡不安稳或睡得过多',
      '感觉疲倦或没有活力',
      '食欲不振或吃太多',
      '觉得自己很糟——或觉得自己很失败，或让自己或家人失望',
      '对事物专注有困难，例如阅读报纸或看电视时',
      '动作或说话速度缓慢到别人已经察觉？或正好相反——您烦躁或坐立不安，动来动去的情况比平常更严重',
      '有不如死掉或用某种方式伤害自己的念头',
    ],
    bands: [
      { max: 4, label: '无或极轻微抑郁症状', token: 'minimal', guidance: '这次报告的抑郁相关症状很少或很轻。若你仍明显痛苦或日常生活受到影响，请不要只看分数。' },
      { max: 9, label: '轻度抑郁症状', token: 'mild', guidance: '存在轻度抑郁症状。可以留意症状是否持续，以及它们对睡眠、学习、工作或人际的影响。' },
      { max: 14, label: '中度抑郁症状', token: 'moderate', guidance: '症状已达到常用的进一步评估阈值，建议联系精神科、心理科或其他合格专业人员做完整评估。' },
      { max: 19, label: '中重度抑郁症状', token: 'high', guidance: '症状较明显，建议尽快安排专业评估。量表分数本身不能确定诊断或治疗方案。' },
      { max: 27, label: '重度抑郁症状', token: 'high', guidance: '症状较重，建议尽快寻求精神科、心理科或其他合格专业人员的评估与支持。' },
    ],
  },
  gad7: {
    code: 'GAD-7',
    title: '焦虑症状自评',
    maxScore: 21,
    positiveAt: 10,
    items: [
      '感觉紧张、焦虑或急切',
      '不能够停止或控制担忧',
      '对各种各样的事情担忧过多',
      '很难放松下来',
      '由于不安而无法静坐',
      '变得容易烦恼或急躁',
      '感到似乎将有可怕的事情发生而害怕',
    ],
    bands: [
      { max: 4, label: '无或极轻微焦虑症状', token: 'minimal', guidance: '这次报告的焦虑相关症状很少或很轻。若你仍明显痛苦或日常生活受到影响，请不要只看分数。' },
      { max: 9, label: '轻度焦虑症状', token: 'mild', guidance: '存在轻度焦虑症状。可以留意担忧、紧张或睡眠问题是否持续，以及是否影响日常生活。' },
      { max: 14, label: '中度焦虑症状', token: 'moderate', guidance: '症状已达到常用的进一步评估阈值，建议联系精神科、心理科或其他合格专业人员做完整评估。' },
      { max: 21, label: '重度焦虑症状', token: 'high', guidance: '症状较明显，建议尽快安排专业评估。量表分数本身不能确定诊断或治疗方案。' },
    ],
  },
});

function scoreScale(scaleKey, answers) {
  const scale = SCALES[scaleKey];
  if (!scale) throw new Error(`未知量表：${scaleKey}`);
  if (!Array.isArray(answers) || answers.length !== scale.items.length) {
    throw new Error(`${scale.code} 需要 ${scale.items.length} 个完整答案`);
  }
  if (answers.some(value => !Number.isInteger(value) || value < 0 || value > 3)) {
    throw new Error('每个答案都必须是 0 到 3 的整数');
  }

  const total = answers.reduce((sum, value) => sum + value, 0);
  const band = scale.bands.find(item => total <= item.max);
  return {
    total,
    maxScore: scale.maxScore,
    band,
    positive: total >= scale.positiveAt,
    safetyFlag: scaleKey === 'phq9' && answers[8] > 0,
  };
}

function questionMarkup(scale) {
  return scale.items.map((item, questionIndex) => {
    const options = RESPONSE_OPTIONS.map(option => {
      const id = `question-${questionIndex}-option-${option.value}`;
      return `
        <label class="response-option" for="${id}">
          <input id="${id}" name="question-${questionIndex}" type="radio" value="${option.value}">
          <span>${option.label}</span>
        </label>`;
    }).join('');

    return `
      <fieldset class="question-card" id="question-${questionIndex}">
        <legend><span>第 ${questionIndex + 1} 题</span>${item}</legend>
        <div class="response-grid">${options}</div>
      </fieldset>`;
  }).join('');
}

function updateProgress(form, scale, submitButton, progressText, progressBar, completionHint) {
  const answered = form.querySelectorAll('input[type="radio"]:checked').length;
  const total = scale.items.length;
  const complete = answered === total;
  submitButton.disabled = !complete;
  progressText.textContent = `已完成 ${answered} / ${total} 题`;
  progressBar.style.width = `${(answered / total) * 100}%`;
  completionHint.textContent = complete ? '已全部作答，可以生成报告。' : `还差 ${total - answered} 题。`;
}

function renderAnswerReview(container, scale, answers) {
  container.innerHTML = scale.items.map((item, index) => `
    <li>
      <span><strong>${index + 1}.</strong> ${item}</span>
      <span>${RESPONSE_OPTIONS[answers[index]].label}</span>
    </li>`).join('');
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
  updateProgress(form, scale, submitButton, progressText, progressBar, completionHint);

  form.addEventListener('change', () => {
    updateProgress(form, scale, submitButton, progressText, progressBar, completionHint);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = new FormData(form);
    const rawAnswers = scale.items.map((_, index) => values.get(`question-${index}`));
    const missing = rawAnswers.findIndex(value => value === null);
    if (missing !== -1) {
      completionHint.textContent = '请完成所有题目后再生成报告。';
      document.querySelector(`#question-${missing}`)?.scrollIntoView({ block: 'center' });
      return;
    }
    const answers = rawAnswers.map(value => Number(value));

    const result = scoreScale(scaleKey, answers);
    document.querySelector('#scoreValue').textContent = `${result.total} / ${result.maxScore}`;
    document.querySelector('#severityLabel').textContent = result.band.label;
    document.querySelector('#reportGuidance').textContent = result.band.guidance;
    document.querySelector('#thresholdLabel').textContent = result.positive
      ? '达到常用的进一步评估阈值'
      : '未达到常用的进一步评估阈值';
    document.querySelector('#resultCard').dataset.level = result.band.token;
    document.querySelector('#safetyCard').hidden = !result.safetyFlag;
    renderAnswerReview(document.querySelector('#answerReview'), scale, answers);

    questionnaire.hidden = true;
    report.hidden = false;
    document.body.classList.add('report-visible');
    reportTitle.focus();
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });

  document.querySelector('#restartAssessment').addEventListener('click', () => {
    form.reset();
    report.hidden = true;
    questionnaire.hidden = false;
    document.body.classList.remove('report-visible');
    updateProgress(form, scale, submitButton, progressText, progressBar, completionHint);
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

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initAssessment);
}

export { RESPONSE_OPTIONS, SCALES, scoreScale };
