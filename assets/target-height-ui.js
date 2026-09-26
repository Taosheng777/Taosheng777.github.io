import target from './mini/target-height.js';

export function initTargetHeight() {
  for (const section of document.querySelectorAll('[data-target-height]')) {
    if (section.dataset.initialized) continue;
    section.dataset.initialized = 'true';
    const form = section.querySelector('form');
    const output = section.querySelector('[data-target-result]');
    const error = section.querySelector('[data-target-error]');
    const clear = () => { output.hidden = true; output.replaceChildren(); error.textContent = ''; };
    form.addEventListener('input', clear);
    form.addEventListener('reset', clear);
    window.addEventListener('pagehide', () => form.reset());
    const growth = document.querySelector('#growthForm');
    if (section.hasAttribute('data-shared-sex')) {
      growth.addEventListener('change', event => { if (event.target.name === 'sex') clear(); });
      growth.addEventListener('reset', () => form.reset());
    }
    form.addEventListener('submit', event => {
      event.preventDefault(); clear();
      const sex = section.hasAttribute('data-shared-sex') ? growth.elements.sex.value : form.elements.targetSex.value;
      const result = target.calculateTargetHeight({ sex, fatherHeight: form.elements.fatherHeight.value, motherHeight: form.elements.motherHeight.value });
      if (result.state !== 'ready') { error.textContent = result.message; return; }
      const label = document.createElement('p'); label.textContent = '成年家族目标参考值';
      const value = document.createElement('p'); value.className = 'target-value'; value.textContent = `${result.displayCm} cm`;
      const list = document.createElement('ul');
      for (const limitation of result.limitations) { const li = document.createElement('li'); li.textContent = limitation; list.append(li); }
      output.append(label, value, list); output.hidden = false;
    });
  }
}
if (typeof document !== 'undefined') initTargetHeight();
