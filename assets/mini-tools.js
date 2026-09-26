import scales from './mini/scales.js';

export const CHILD_KEYS = ['dsrsc', 'scared', 'pas', 'sdq23', 'sdq417'];
export const RESPIRATORY_KEYS = ['cact', 'act'];
export const EXTRA_SCALES = Object.fromEntries([...CHILD_KEYS, ...RESPIRATORY_KEYS].map(key => {
  const source = scales.SCALES[key];
  const route = `${source.group === 'respiratory' ? '/respiratory/' : '/mind/'}${key}/`;
  // 上游数据中仍有已被当前项目决定取代的许可进度文字。仅修正网页展示说明，
  // 保留原题目、选项、计分和 C-ACT 计分辅助边界；不修改冻结来源。
  const display = key === 'cact' ? {
    notes: ['本页为配合正版原表使用的计分辅助：题目是主题标签，孩子部分的文字是档位说明，并非官方中文版问句。', ...source.notes.slice(1)],
    sources: source.sources.map((text, i) => i === 1 ? 'C-ACT Copyright © 2005 GSK. All Rights Reserved，由 Mapi Research Trust 发行。本页保留主题标签、档位与分值，念题与作答以正版原表为准。' : text)
  } : {};
  return [key, { ...source, ...display, route }];
}));

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
