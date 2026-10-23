/* Apply the saved appearance before styles paint, then wire the header switch. */
(() => {
  'use strict';
  const html = document.documentElement;
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  const key = 'zitong-appearance';
  let saved;
  try { saved = localStorage.getItem(key); } catch (_) { /* Storage can be disabled. */ }
  let manual = saved === 'light' || saved === 'dark';
  function apply(theme) {
    html.dataset.theme = theme;
    const dark = theme === 'dark';
    const button = document.querySelector('.theme-toggle');
    if (button) {
      const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(dark));
      button.title = label;
      button.hidden = false;
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#151719' : '#ffffff';
  }
  apply(manual ? saved : preference.matches ? 'dark' : 'light');
  document.addEventListener('DOMContentLoaded', () => {
    apply(html.dataset.theme);
    const button = document.querySelector('.theme-toggle');
    if (button) button.addEventListener('click', () => {
      const theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
      manual = true;
      try { localStorage.setItem(key, theme); } catch (_) { /* Keep this visit usable. */ }
      apply(theme);
    });
  });
  preference.addEventListener('change', event => {
    if (!manual) apply(event.matches ? 'dark' : 'light');
  });
  window.addEventListener('storage', event => {
    if (event.key !== key) return;
    manual = event.newValue === 'light' || event.newValue === 'dark';
    apply(manual ? event.newValue : preference.matches ? 'dark' : 'light');
  });
})();
