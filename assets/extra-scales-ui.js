import scoring from './mini/scales.js';
import { EXTRA_SCALES, escapeHtml as esc } from './mini-tools.js';

const quiz = document.querySelector('[data-extra-scale]');
const key = quiz.dataset.extraScale;
const scale = EXTRA_SCALES[key];
const form = document.querySelector('#extraForm');
const report = document.querySelector('#extraReport');
const error = document.querySelector('#extraError');
const list = document.querySelector('#extraQuestions');
let answers = scale.items.map(() => -1);
function renderQuestions() {
  list.innerHTML = scale.items.map((text, i) => {
    const section = scale.sections?.find(s => s.from === i + 1);
    return `${section ? `<h2 class="question-section">${esc(section.title)}</h2><p>${esc(section.hint)}</p>` : ''}<fieldset class="extra-question" id="eq${i}"><legend>${i + 1}. ${esc(text)}</legend><div class="extra-options">${scoring.optionsForItem(scale, i).map(option => `<label><input type="radio" name="q${i}" value="${option.value}"${answers[i] === option.value ? ' checked' : ''}><span>${esc(option.label)}</span></label>`).join('')}</div></fieldset>`;
  }).join('');
}
function updateProgress() {
  document.querySelector('#extraProgress').textContent = `已完成 ${answers.filter(value => value >= 0).length} / ${answers.length} 题`;
}
form.addEventListener('change', event => {
  if (event.target.matches('input[type="radio"]')) answers[Number(event.target.name.slice(1))] = Number(event.target.value);
  updateProgress();
});
// 输入时撤销旧错误；不要等失焦的change才移除错误行，否则按钮会在按下与抬起间移位。
form.addEventListener('input', () => { error.textContent = ''; });
form.addEventListener('submit', event => {
  event.preventDefault(); error.textContent = '';
  const rawAge = document.querySelector('#extraAge')?.value ?? '';
  try {
    if (scale.ageRange && !/^\d+$/.test(rawAge)) throw new Error('请先填写适用范围内的整数年龄。');
    const scored = scoring.scoreScale(key, answers, scale.ageRange ? { ageYears: Number(rawAge) } : undefined);
    const score = document.querySelector('#extraScore'); score.dataset.level = scored.band.token;
    score.innerHTML = `<p>${esc(scale.scoreLabel || '总分')}</p><p class="result-score">${esc(scored.totalText)} / ${scored.maxScore}</p><h3>${esc(scored.band.label)}</h3><p>${esc(scored.positiveText)}</p><p>${esc(scored.band.guidance)}</p>`;
    document.querySelector('#extraDetails').innerHTML = scored.details.map(d => `<div class="detail-row${d.flagged ? ' flagged' : ''}"><strong>${esc(d.label)}</strong><span>${esc(d.value)}</span></div>`).join('');
    const safety = document.querySelector('#extraSafety'); safety.hidden = !scored.safetyFlag;
    safety.innerHTML = scored.safetyFlag ? `<h3>${esc(scale.safety.title)}</h3>${scale.safety.body.map(t => `<p>${esc(t)}</p>`).join('')}` : '';
    document.querySelector('#extraAnswers').innerHTML = scale.items.map((text, i) => `<li>${esc(text)}<strong> — ${esc(scoring.optionsForItem(scale, i).find(o => o.value === answers[i]).label)}</strong></li>`).join('');
    quiz.hidden = true; report.hidden = false; document.querySelector('#extraReportTitle').focus();
  } catch (e) {
    error.textContent = e.message;
    const missing = answers.indexOf(-1);
    if (missing >= 0) document.querySelector(`#eq${missing} input`)?.focus();
  }
});
document.querySelector('#extraEdit').addEventListener('click', () => { report.hidden = true; quiz.hidden = false; form.querySelector('input')?.focus(); });
function resetQuiz() {
  answers = scale.items.map(() => -1); form.reset(); renderQuestions(); updateProgress();
  report.hidden = true; quiz.hidden = false; error.textContent = '';
  for (const id of ['extraScore', 'extraDetails', 'extraSafety', 'extraAnswers']) document.getElementById(id).replaceChildren();
}
document.querySelector('#extraRestart').addEventListener('click', () => { resetQuiz(); form.querySelector('input')?.focus(); });
window.addEventListener('pagehide', resetQuiz);
document.querySelector('#extraPrint').addEventListener('click', () => window.print());
renderQuestions(); updateProgress();
