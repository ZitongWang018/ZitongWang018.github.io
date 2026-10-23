(function () {
  var button = document.querySelector('.theme-toggle');
  if (!button) return;

  function currentTheme() {
    var selected = document.documentElement.dataset.theme;
    if (selected === 'light' || selected === 'dark') return selected;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function updateLabel() {
    var mode = currentTheme();
    button.dataset.mode = mode;
    button.setAttribute('aria-label', mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    button.title = mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    var label = button.querySelector('.theme-label');
    if (label) label.textContent = mode === 'dark' ? 'Night' : 'Day';
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
