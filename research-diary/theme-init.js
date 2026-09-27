try {
  var researchTheme = localStorage.getItem('research-diary-theme');
  if (researchTheme === 'light' || researchTheme === 'dark') document.documentElement.dataset.theme = researchTheme;
} catch (error) { /* Follow the system theme when storage is unavailable. */ }
