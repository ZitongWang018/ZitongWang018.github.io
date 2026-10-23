(function () {
  'use strict';
  var owner = 'ZitongWang018', repo = 'ZitongWang018.github.io', branch = 'master', collection = '_research_diary';
  var groups = [
    { name: 'Project', fields: [['experiments', 'Proposed Experiments & Motivation'], ['findings', 'Findings']] },
    { name: 'Learning', fields: [['theory', 'New Theory / Concept'], ['area', 'Area']] },
    { name: 'New', fields: [['posts', 'New Post / discussion'], ['others', 'Others']] }
  ];
  var token = null, currentPath = null, currentSha = null, originalMeta = {};
  var dirty = false, busy = false, entryDate = today(), lastDefaultTitle = '', draftTimer;
  var editors = {}, imageTarget = null, imageRange = null;
  var draftKey = 'research-diary-rich-draft-v1';
  var byId = function (id) { return document.getElementById(id); };
  var titleInput = byId('entry-title'), categoryInput = byId('entry-category');
  var select = byId('existing-posts'), tokenInput = byId('github-token');
  var saveButton = byId('save-entry'), publishedLink = byId('published-link');

  function today() {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    var values = {};
    parts.forEach(function (p) { values[p.type] = p.value; });
    return values.year + '-' + values.month + '-' + values.day;
  }
  function defaultTitle() { return entryDate + ' ' + (categoryInput.value === 'Week-Note' ? 'WeekNote' : 'DayNote'); }
  function message(text, kind) {
    byId('editor-status').textContent = text;
    byId('editor-status').className = 'editor-status' + (kind ? ' ' + kind : '');
  }
  function setBusy(value) {
    busy = value;
    saveButton.disabled = value;
    byId('note-fields').disabled = value;
    byId('connect-button').disabled = value;
    byId('disconnect-button').disabled = value;
    byId('new-post').disabled = value;
    select.disabled = value || !token;
    Object.values(editors).forEach(function (editor) { editor.contentEditable = value ? 'false' : 'true'; });
  }
  function clean(html) {
    return window.DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ul', 'ol', 'li', 'a', 'img', 'pre', 'code', 'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'sub', 'sup', 'section'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'colspan', 'rowspan', 'start', 'data-diary-field'],
      ALLOW_DATA_ATTR: false
    });
  }
  function escapeText(value) {
    var el = document.createElement('div'); el.textContent = value; return el.innerHTML;
  }
  function contentOf(editor) {
    var html = clean(editor.innerHTML).trim();
    var temp = document.createElement('div'); temp.innerHTML = html;
    return temp.textContent.trim() || temp.querySelector('img,hr,table') ? html : '';
  }
  function activeEditors() {
    return categoryInput.value === 'Week-Note' ? [editors.week] : Object.keys(editors).filter(function (key) { return key !== 'week'; }).map(function (key) { return editors[key]; });
  }
  function rememberDraft() {
    clearTimeout(draftTimer);
    var bodies = {};
    Object.keys(editors).forEach(function (key) { bodies[key] = contentOf(editors[key]); });
    try {
      localStorage.setItem(draftKey, JSON.stringify({ title: titleInput.value, category: categoryInput.value, date: entryDate, path: currentPath, sha: currentSha, meta: originalMeta, bodies: bodies, dirty: dirty }));
      byId('draft-state').textContent = dirty ? 'Draft saved on this device' : '';
    } catch (error) { byId('draft-state').textContent = 'Local draft unavailable — save before leaving'; }
  }
  function markChanged() {
    dirty = true; publishedLink.hidden = true;
    byId('draft-state').textContent = 'Unsaved changes';
    clearTimeout(draftTimer); draftTimer = setTimeout(rememberDraft, 300);
  }
  function updateMode() {
    var week = categoryInput.value === 'Week-Note';
    byId('day-editors').hidden = week;
    byId('week-editor').hidden = !week;
    if (!titleInput.value.trim() || titleInput.value === lastDefaultTitle) titleInput.value = defaultTitle();
    lastDefaultTitle = defaultTitle();
  }
  function currentRange(editor) {
    var selection = window.getSelection();
    if (selection.rangeCount && editor.contains(selection.anchorNode) && editor.contains(selection.focusNode)) return selection.getRangeAt(0).cloneRange();
    return null;
  }
  function restoreRange(editor, range) {
    editor.focus();
    var selection = window.getSelection();
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange(); range.selectNodeContents(editor); range.collapse(false);
    }
    selection.removeAllRanges(); selection.addRange(range);
  }
  function insertHtml(editor, html, range) {
    restoreRange(editor, range || currentRange(editor));
    document.execCommand('insertHTML', false, clean(html));
    markChanged();
  }
  function format(editor, kind) {
    var range = currentRange(editor);
    restoreRange(editor, range);
    if (kind === 'heading') document.execCommand('formatBlock', false, 'h2');
    if (kind === 'paragraph') document.execCommand('formatBlock', false, 'p');
    if (kind === 'bold' || kind === 'italic') document.execCommand(kind, false);
    if (kind === 'list') document.execCommand('insertUnorderedList');
    if (kind === 'code') {
      var text = window.getSelection().toString() || 'Code';
      insertHtml(editor, '<pre><code>' + escapeText(text) + '</code></pre><p><br></p>', range);
    }
    if (kind === 'link') {
      var url = window.prompt('Link URL', 'https://');
      if (!url) return;
      if (!/^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(url.trim())) { message('Use an https://, mailto:, or site-relative link.', 'error'); return; }
      restoreRange(editor, range);
      if (window.getSelection().isCollapsed) {
        var link = document.createElement('a'); link.href = url.trim(); link.textContent = url.trim(); insertHtml(editor, link.outerHTML, range);
      } else document.execCommand('createLink', false, url.trim());
    }
    if (kind === 'image') {
      imageTarget = editor; imageRange = range; byId('image-file').click(); return;
    }
    markChanged();
  }
  function makeEditor(key, label) {
    var card = document.createElement('section'); card.className = 'editor-card';
    if (key !== 'week') {
      var heading = document.createElement('h3'); heading.id = 'label-' + key; heading.textContent = label; card.appendChild(heading);
    }
    var toolbar = document.createElement('div'); toolbar.className = 'format-toolbar'; toolbar.setAttribute('role', 'toolbar'); toolbar.setAttribute('aria-label', label + ' formatting');
    var editor = document.createElement('div'); editor.className = 'rich-editor'; editor.id = 'body-' + key;
    editor.contentEditable = 'true'; editor.setAttribute('role', 'textbox'); editor.setAttribute('aria-multiline', 'true'); editor.setAttribute('aria-label', label);
    editor.dataset.placeholder = 'Start writing…'; editor.spellcheck = true;
    [['paragraph', 'Text', 'Paragraph'], ['heading', 'H2', 'Heading'], ['bold', 'B', 'Bold'], ['italic', 'I', 'Italic'], ['list', '• List', 'List'], ['link', 'Link', 'Link'], ['code', 'Code', 'Code block'], ['image', 'Image', 'Image']].forEach(function (item) {
      var button = document.createElement('button'); button.type = 'button'; button.dataset.format = item[0]; button.textContent = item[1]; button.title = item[2]; button.setAttribute('aria-label', item[2]);
      button.addEventListener('mousedown', function (event) { event.preventDefault(); });
      button.addEventListener('click', function () { format(editor, item[0]); }); toolbar.appendChild(button);
    });
    editor.addEventListener('input', markChanged);
    editor.addEventListener('paste', function (event) {
      event.preventDefault();
      var data = event.clipboardData;
      var image = Array.from(data.files).find(function (file) { return file.type.startsWith('image/'); });
      if (image) { imageTarget = editor; imageRange = currentRange(editor); uploadImage(image); return; }
      var html = data.getData('text/html'), text = data.getData('text/plain');
      var anchor = window.getSelection().anchorNode;
      var element = anchor && (anchor.nodeType === 1 ? anchor : anchor.parentElement);
      if (element && element.closest('pre,code')) document.execCommand('insertText', false, text);
      else insertHtml(editor, html || window.marked.parse(text, { gfm: true, breaks: true }));
      markChanged();
    });
    editor.addEventListener('drop', function (event) { event.preventDefault(); });
    editor.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); byId('entry-form').requestSubmit(); }
    });
    card.append(toolbar, editor); editors[key] = editor; return card;
  }
  function createEditors() {
    groups.forEach(function (group) {
      var section = document.createElement('section'); section.className = 'diary-group';
      var heading = document.createElement('h2'); heading.textContent = group.name;
      var grid = document.createElement('div'); grid.className = 'diary-grid';
      group.fields.forEach(function (field) { grid.appendChild(makeEditor(field[0], field[1])); });
      section.append(heading, grid); byId('day-editors').appendChild(section);
    });
    byId('week-editor').appendChild(makeEditor('week', 'Week-Note content'));
  }
  function safePath(path) { return path.split('/').map(encodeURIComponent).join('/'); }
  async function request(path, options, credential) {
    var activeToken = credential || token;
    if (!activeToken) throw new Error('Connect GitHub first.');
    var response;
    try {
      response = await fetch('https://api.github.com/repos/' + owner + '/' + repo + path, {
        method: options && options.method || 'GET',
        headers: { 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + activeToken, 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
        body: options && options.body ? JSON.stringify(options.body) : undefined,
        credentials: 'omit', cache: 'no-store'
      });
    } catch (error) { throw new Error('Could not reach GitHub. Your draft is still here.'); }
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('Check your token and repository access.');
      if (response.status === 409 || response.status === 422) throw new Error('Save conflict. Your draft is kept; copy your changes before reopening the latest note.');
      throw new Error('GitHub ' + response.status + ': ' + (data.message || 'Try again.'));
    }
    return data;
  }
  function decodeBase64(value) { return new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g, '')), function (c) { return c.charCodeAt(0); })); }
  function encodeBase64(value) {
    var bytes = new TextEncoder().encode(value), binary = '';
    for (var i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    return btoa(binary);
  }
  function parseFile(source) {
    var match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
    if (!match) throw new Error('Missing note front matter.');
    var meta = window.jsyaml.load(match[1]) || {};
    if (typeof meta !== 'object' || Array.isArray(meta)) throw new Error('Invalid note front matter.');
    return { meta: meta, body: source.slice(match[0].length).trim() };
  }
  function dayBody() {
    return '<div class="diary-day">\n' + groups.map(function (group) {
      return '<section class="diary-section"><h2>' + group.name + '</h2><div class="diary-section-grid">\n' + group.fields.map(function (field) {
        return '<section class="diary-content-card"><h3>' + field[1] + '</h3><div data-diary-field="' + field[0] + '">' + contentOf(editors[field[0]]) + '</div></section>';
      }).join('\n') + '\n</div></section>';
    }).join('\n') + '\n</div>';
  }
  function buildFile(path) {
    var meta = Object.assign({}, originalMeta, { layout: 'research-note', title: titleInput.value.trim() || defaultTitle(), date: entryDate, category: categoryInput.value, note_format: 'rich-v1' });
    if (!meta.permalink) meta.permalink = '/research-diary/' + path.split('/').pop().replace(/\.md$/i, '') + '/';
    ['summary', 'tags', 'reading_time'].forEach(function (key) { delete meta[key]; });
    var body = categoryInput.value === 'Week-Note' ? '<div class="diary-week">' + contentOf(editors.week) + '</div>' : dayBody();
    // Keep code and literal braces from being interpreted as Liquid by GitHub Pages.
    body = body.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
    return '---\n' + window.jsyaml.dump(meta, { lineWidth: -1, noRefs: true }).replace(/^date:.*$/m, 'date: ' + entryDate) + '---\n\n' + body + '\n';
  }
  function resetForm() {
    clearTimeout(draftTimer); currentPath = null; currentSha = null; originalMeta = {}; entryDate = today();
    titleInput.value = ''; categoryInput.value = 'Day-Note'; lastDefaultTitle = '';
    Object.values(editors).forEach(function (editor) { editor.innerHTML = ''; });
    select.value = ''; dirty = false; publishedLink.hidden = true; message(''); updateMode(); rememberDraft();
  }
  async function listPosts(credential) {
    var files = await request('/contents/' + collection + '?ref=' + branch, null, credential);
    if (!Array.isArray(files)) throw new Error('Could not load notes.');
    select.replaceChildren(new Option('Open a note…', ''));
    files.filter(function (file) { return file.type === 'file' && /\.md$/i.test(file.name); }).sort(function (a, b) { return b.name.localeCompare(a.name); }).forEach(function (file) { select.add(new Option(file.name.replace(/\.md$/i, ''), file.path)); });
    select.value = currentPath || '';
  }
  async function connect() {
    var candidate = tokenInput.value.trim();
    if (!candidate || busy) { if (!busy) message('Enter a GitHub token.', 'error'); return; }
    setBusy(true); message('Connecting…');
    try {
      await listPosts(candidate); token = candidate; tokenInput.value = ''; tokenInput.hidden = true;
      byId('connect-button').hidden = true; byId('disconnect-button').hidden = false;
      byId('connection-state').textContent = 'Connected'; byId('connection-state').classList.add('connected');
      byId('github-panel').open = false; message('Connected.', 'success');
    } catch (error) { message(error.message, 'error'); } finally { setBusy(false); }
  }
  async function openPost(path) {
    if (!path) { resetForm(); return; }
    setBusy(true); message('Opening…');
    try {
      var file = await request('/contents/' + safePath(path) + '?ref=' + branch);
      if (file.encoding !== 'base64' || !file.content) throw new Error('Note is too large to edit here.');
      var parsed = parseFile(decodeBase64(file.content));
      var temp = document.createElement('div');
      temp.innerHTML = clean(parsed.meta.note_format === 'rich-v1' ? parsed.body : window.marked.parse(parsed.body, { gfm: true, breaks: true }));
      var day = parsed.meta.note_format === 'rich-v1' && parsed.meta.category === 'Day-Note';
      if (day && !groups.every(function (group) { return group.fields.every(function (field) { return temp.querySelector('[data-diary-field="' + field[0] + '"]'); }); })) throw new Error('This Day-Note is missing sections; the current draft was not replaced.');
      currentPath = path; currentSha = file.sha; originalMeta = parsed.meta;
      entryDate = parsed.meta.date instanceof Date ? parsed.meta.date.toISOString().slice(0, 10) : String(parsed.meta.date || today()).slice(0, 10);
      titleInput.value = parsed.meta.title || ''; categoryInput.value = day ? 'Day-Note' : 'Week-Note';
      Object.keys(editors).forEach(function (key) {
        var source = day && temp.querySelector('[data-diary-field="' + key + '"]');
        editors[key].innerHTML = day ? (source ? clean(source.innerHTML) : '') : (key === 'week' ? clean((temp.querySelector('.diary-week') || temp).innerHTML) : '');
      });
      lastDefaultTitle = defaultTitle(); updateMode(); dirty = false; publishedLink.hidden = true; rememberDraft(); message('Opened.', 'success');
    } catch (error) { select.value = currentPath || ''; message(error.message, 'error'); } finally { setBusy(false); }
  }
  async function save(event) {
    event.preventDefault(); if (busy) return;
    if (!token) { byId('github-panel').open = true; tokenInput.focus(); message('Connect GitHub to save. Your local draft is kept.', 'error'); return; }
    if (!activeEditors().some(function (editor) { return contentOf(editor); })) { message('Add some text or an image.', 'error'); activeEditors()[0].focus(); return; }
    if (!titleInput.value.trim()) titleInput.value = defaultTitle();
    var path = currentPath || collection + '/' + entryDate + '-' + (categoryInput.value === 'Week-Note' ? 'weeknote' : 'daynote') + '.md';
    var content = buildFile(path);
    var details = { message: 'diary: ' + (currentPath ? 'update ' : 'add ') + titleInput.value.trim().replace(/\s+/g, ' ').slice(0, 80), content: encodeBase64(content), branch: branch };
    if (currentSha) details.sha = currentSha;
    rememberDraft(); setBusy(true); message('Saving…');
    try {
      var result = await request('/contents/' + safePath(path), { method: 'PUT', body: details });
      currentPath = path; currentSha = result.content.sha; originalMeta = parseFile(content).meta; dirty = false; rememberDraft();
      var permalink = originalMeta.permalink;
      publishedLink.href = typeof permalink === 'string' && /^\/research-diary\//.test(permalink) ? permalink : '/research-diary/';
      publishedLink.textContent = 'View note ↗'; publishedLink.hidden = false;
      message('Saved. The published page will update shortly.', 'success');
      try { await listPosts(); } catch (error) { message('Saved. Reconnect to refresh the note list.', 'success'); }
    } catch (error) { message(error.message, 'error'); } finally { setBusy(false); }
  }
  async function uploadImage(file) {
    if (!file || busy || !imageTarget) return;
    if (!token) { byId('github-panel').open = true; message('Connect GitHub to upload an image.', 'error'); return; }
    var extensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
    if (!extensions[file.type] || file.size > 5 * 1024 * 1024) { message('Use a PNG, JPEG, WebP, or GIF under 5 MB.', 'error'); return; }
    var target = imageTarget, range = imageRange;
    var name = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) || 'image';
    var path = 'images/research-diary/' + Date.now().toString(36) + '-' + name + '.' + extensions[file.type];
    setBusy(true); message('Uploading…');
    try {
      var bytes = new Uint8Array(await file.arrayBuffer()), binary = '';
      for (var i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
      await request('/contents/' + safePath(path), { method: 'PUT', body: { message: 'diary: add image ' + name, content: btoa(binary), branch: branch } });
      setBusy(false);
      insertHtml(target, '<img src="/' + path + '" alt="' + name + '"><p><br></p>', range); message('Image added. Save the note to publish it.', 'success');
    } catch (error) { message(error.message, 'error'); } finally { byId('image-file').value = ''; setBusy(false); }
  }
  if (!window.marked || !window.DOMPurify || !window.jsyaml) { message('The editor could not load. Please refresh.', 'error'); saveButton.disabled = true; return; }
  createEditors(); updateMode();
  try {
    var draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
    if (draft && draft.bodies && (draft.dirty || draft.path)) {
      titleInput.value = draft.title || ''; categoryInput.value = draft.category === 'Week-Note' ? 'Week-Note' : 'Day-Note'; entryDate = draft.date || today();
      currentPath = draft.path || null; currentSha = draft.sha || null; originalMeta = draft.meta || {};
      Object.keys(editors).forEach(function (key) { editors[key].innerHTML = clean(draft.bodies[key] || ''); });
      dirty = !!draft.dirty; lastDefaultTitle = defaultTitle(); updateMode();
      byId('draft-state').textContent = dirty ? 'Local draft restored' : 'Last note restored';
    }
  } catch (error) { /* The editor also works without browser storage. */ }
  titleInput.addEventListener('input', markChanged);
  categoryInput.addEventListener('change', function () { updateMode(); markChanged(); });
  byId('connect-button').addEventListener('click', connect);
  tokenInput.addEventListener('keydown', function (event) { if (event.key === 'Enter') { event.preventDefault(); connect(); } });
  byId('disconnect-button').addEventListener('click', function () {
    token = null; tokenInput.hidden = false; byId('connect-button').hidden = false; byId('disconnect-button').hidden = true;
    select.disabled = true; byId('connection-state').textContent = 'Disconnected'; byId('connection-state').classList.remove('connected'); message('Disconnected.');
  });
  byId('new-post').addEventListener('click', function () { if (!dirty || window.confirm('Discard this local draft and start a new note?')) resetForm(); });
  select.addEventListener('change', function () {
    if (dirty && !window.confirm('Discard this local draft and open another note?')) { select.value = currentPath || ''; return; }
    openPost(select.value);
  });
  byId('entry-form').addEventListener('submit', save);
  byId('image-file').addEventListener('change', function () { uploadImage(byId('image-file').files[0]); });
  window.addEventListener('pagehide', rememberDraft);
  window.addEventListener('beforeunload', function (event) { if (dirty) { rememberDraft(); event.preventDefault(); event.returnValue = ''; } });
}());
