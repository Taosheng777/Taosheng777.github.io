const under12 = new Set(['dsrsc', 'scared', 'pas', 'sdq23', 'sdq417', 'asq', 'snap26', 'psc17', 'connersPsq']);
for (const button of document.querySelectorAll('[data-age-filter]')) {
  button.addEventListener('click', () => {
    const filtered = button.dataset.ageFilter === 'under12';
    for (const card of document.querySelectorAll('[data-scale-key]')) card.hidden = filtered && !under12.has(card.dataset.scaleKey);
    for (const item of document.querySelectorAll('[data-age-filter]')) item.setAttribute('aria-pressed', String(item === button));
  });
}
