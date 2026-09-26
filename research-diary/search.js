(function () {
  var input = document.querySelector('#note-search');
  var entries = Array.prototype.slice.call(document.querySelectorAll('[data-search]'));
  var status = document.querySelector('#search-status');
  if (!input || !entries.length || !status) return;

  function filter() {
    var query = input.value.trim().toLocaleLowerCase();
    var count = 0;
    entries.forEach(function (entry) {
      var matches = entry.dataset.search.toLocaleLowerCase().includes(query);
      entry.hidden = !matches;
      if (matches) count += 1;
    });
    status.textContent = count ? count + (count === 1 ? ' post' : ' posts') : 'No matching posts.';
  }

  input.value = new URLSearchParams(window.location.search).get('q') || '';
  input.addEventListener('input', filter);
  filter();
}());
