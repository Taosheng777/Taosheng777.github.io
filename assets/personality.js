/* 题库、算法与解释层机械同步自小程序1.5.1；网页保留自己的版式。 */
import data from './mini/personality-data.js';
import scoring from './mini/personality.js';
const { DIMENSIONS, ITEMS, PAGE_SIZE, FACET_REPORTS } = data;
const OPTIONS = data.OPTIONS.map(option => ({ ...option, step: Math.abs(option.value), tone: option.value < 0 ? 'agree' : option.value > 0 ? 'disagree' : 'neutral' }));
const { MAX_PER_DIMENSION, facetKey, isAnswered, dimensionScores, toPercent, scorePersonality } = scoring;

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
          <span class="facet-value">${facet.percent}% ${escapeHtml(facet.displayLabel)}</span>
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
  return `<article class="facet-report" data-dim="${facet.key}">
    <div class="facet-report-head"><span class="facet-letter" aria-hidden="true">${escapeHtml(facet.displayLetter)}</span><div><h4>${escapeHtml(facet.displayLabel)} · ${facet.percent}%</h4><p>${escapeHtml(facet.bandLabel)} · ${escapeHtml(facet.title)}</p></div></div>
    <p class="facet-report-summary">${escapeHtml(facet.report.summary)}</p>
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
    document.querySelector('#resultCode').textContent = scored.displayType;
    document.querySelector('#resultNickname').textContent = scored.nickname;
    document.querySelector('#resultScoringNote').textContent = scored.scoringNote;
    document.querySelector('#resultMidpointNote').textContent = scored.midpointNote;
    document.querySelector('#resultIdentityNote').textContent = scored.identityNote;
    document.querySelector('#resultScenes').innerHTML = scored.scenes.map(scene => `<details class="scene-report" open><summary>${escapeHtml(scene.title)}</summary><p>${escapeHtml(scene.preference)}</p><p><strong>可能的代价：</strong>${escapeHtml(scene.cost)}</p><p><strong>试一试：</strong>${escapeHtml(scene.action)}</p></details>`).join('');
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

  function resetQuiz() {
    answers = ITEMS.map(() => null);
    step = 0;
    result.hidden = true;
    quiz.hidden = false;
    for (const id of ['resultCode', 'resultSummary', 'resultAxes', 'resultReports', 'resultNickname', 'resultIdentityNote', 'resultScenes', 'resultScoringNote', 'resultMidpointNote']) document.getElementById(id).replaceChildren();
    renderStep();
  }
  document.querySelector('#restartQuiz').addEventListener('click', () => {
    resetQuiz();
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
  window.addEventListener('pagehide', resetQuiz);

  document.querySelector('#printResult').addEventListener('click', () => window.print());

  renderStep();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initPersonality);
}

export { DIMENSIONS, ITEMS, PAGE_SIZE, OPTIONS, FACET_REPORTS, MAX_PER_DIMENSION, facetKey, isAnswered, dimensionScores, toPercent, scorePersonality };
