(function () {
  var button = document.querySelector('.theme-toggle');
  if (!button) return;

  function currentTheme() {
    var selected = document.documentElement.dataset.theme;
    if (selected === 'light' || selected === 'dark') return selected;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function updateLabel() {
    button.setAttribute('aria-label', currentTheme() === 'dark' ? '切换到亮色主题' : '切换到暗色主题');
  }

  button.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('research-diary-theme', next); } catch (error) { /* Keep the choice for this page. */ }
    updateLabel();
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateLabel);
  updateLabel();
}());
