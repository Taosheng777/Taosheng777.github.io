export function normalizeSearch(value) {
  return String(value).normalize('NFKC').trim().toLocaleLowerCase();
}

export function matchesSearch(text, query) {
  const normalized = normalizeSearch(text);
  return normalizeSearch(query).split(/[\s，,、]+/).filter(Boolean).every(term => normalized.includes(term));
}

export async function copyToClipboard(text, environment = globalThis) {
  const { navigator, document, isSecureContext } = environment;
  try {
    if (navigator?.clipboard && isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  const previous = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;opacity:0;left:-9999px';
  document.body.appendChild(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, field.value.length);
  let copied = false;
  try { copied = document.execCommand('copy'); } catch {}
  field.remove();
  previous?.focus({ preventScroll: true });
  return copied;
}

export function initializeLibrary(document, environment = globalThis) {
  const cards = [...document.querySelectorAll('.prompt-card')];
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const search = document.getElementById('method-search');
  const toast = document.getElementById('toast');
  let category = 'all';
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    environment.clearTimeout(toastTimer);
    toastTimer = environment.setTimeout(() => toast.classList.remove('show'),1800);
  }

  function applyFilters() {
    let count = 0;
    for (const card of cards) {
      const matches = (category === 'all' || card.dataset.group === category) && matchesSearch(card.dataset.search,search.value);
      card.hidden = !matches;
      if (matches) count++;
    }
    filterButtons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.filter === category)));
    document.getElementById('filter-count').textContent = count === cards.length ? `显示全部 ${count} 条` : `找到 ${count} 条提示词`;
    document.getElementById('method-empty').hidden = count !== 0;
  }

  function resetFilters() {
    category = 'all';
    search.value = '';
    applyFilters();
  }

  function revealTarget(id) {
    const target = document.getElementById(id);
    const card = target?.classList.contains('prompt-card') ? target : target?.closest('.prompt-card');
    if (card?.hidden) resetFilters();
  }

  document.querySelector('.search-wrap').hidden = false;
  document.querySelector('.toolbar-bottom').hidden = false;
  search.addEventListener('input',applyFilters);
  filterButtons.forEach(button => button.addEventListener('click',() => {
    category = button.dataset.filter;
    applyFilters();
  }));
  document.getElementById('reset-methods').addEventListener('click',resetFilters);
  document.querySelectorAll('[data-target]').forEach(link => link.addEventListener('click',() => revealTarget(link.dataset.target)));
  environment.addEventListener('hashchange',() => revealTarget(environment.location.hash.slice(1)));
  revealTarget(environment.location.hash.slice(1));

  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click',async () => {
    const text = document.getElementById(`${button.dataset.copy}-text`)?.textContent;
    if (!text || !await copyToClipboard(text,environment)) {
      showToast('复制未完成，请直接选中下方正文复制');
      return;
    }
    const label = button.querySelector('.copy-label');
    const original = label.textContent;
    label.textContent = '已复制';
    button.disabled = true;
    showToast('完整提示词已复制，填入你的信息后发给 AI');
    environment.setTimeout(() => {label.textContent = original;button.disabled = false;},1200);
  }));
  return {applyFilters,resetFilters,revealTarget};
}

if (typeof document !== 'undefined') initializeLibrary(document);
