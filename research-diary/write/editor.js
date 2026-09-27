(function () {
  'use strict';

  var owner = 'ZitongWang018';
  var repo = 'ZitongWang018.github.io';
  var branch = 'master';
  var collection = '_research_diary';
  var token = null;
  var currentPath = null;
  var currentSha = null;
  var originalMeta = {};
  var dirty = false;
  var busy = false;

  var byId = function (id) { return document.getElementById(id); };
  var tokenInput = byId('github-token');
  var connectButton = byId('connect-button');
  var disconnectButton = byId('disconnect-button');
  var connectionState = byId('connection-state');
  var select = byId('existing-posts');
  var form = byId('entry-form');
  var titleInput = byId('entry-title');
  var dateInput = byId('entry-date');
  var slugInput = byId('entry-slug');
  var summaryInput = byId('entry-summary');
  var categoryInput = byId('entry-category');
  var tagsInput = byId('entry-tags');
  var readingTimeInput = byId('entry-reading-time');
  var bodyInput = byId('entry-body');
  var saveButton = byId('save-entry');
  var status = byId('editor-status');
  var publishedLink = byId('published-link');
  var imageInput = byId('image-file');

  function today() {
    var now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }

  function message(text, kind) {
    status.textContent = text;
    status.className = 'editor-status' + (kind ? ' ' + kind : '');
  }

  function setBusy(value) {
    busy = value;
    saveButton.disabled = value;
    connectButton.disabled = value;
    select.disabled = value || !token;
  }

  function safePath(path) {
    return path.split('/').map(encodeURIComponent).join('/');
  }

  async function request(path, options, credential) {
    var activeToken = credential || token;
    if (!activeToken) throw new Error('Connect GitHub first.');
    var response;
    try {
      response = await fetch('https://api.github.com/repos/' + owner + '/' + repo + path, {
        method: options && options.method ? options.method : 'GET',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': 'Bearer ' + activeToken,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: options && options.body ? JSON.stringify(options.body) : undefined,
        credentials: 'omit',
        cache: 'no-store'
      });
    } catch (error) {
      throw new Error('Could not reach GitHub.');
    }
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('Check your token and repository access.');
      if (response.status === 409 || response.status === 422) throw new Error('Save conflict. Reopen the post and try again.');
      throw new Error('GitHub ' + response.status + ': ' + (data.message || 'Try again.'));
    }
    return data;
  }

  function decodeBase64(base64) {
    var binary = atob(base64.replace(/\s/g, ''));
    var bytes = Uint8Array.from(binary, function (character) { return character.charCodeAt(0); });
    return new TextDecoder().decode(bytes);
  }

  function encodeBase64(text) {
    var bytes = new TextEncoder().encode(text);
    var binary = '';
    for (var start = 0; start < bytes.length; start += 8192) {
      binary += String.fromCharCode.apply(null, bytes.subarray(start, start + 8192));
    }
    return btoa(binary);
  }

  function slugify(value) {
    return value.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  }

  function dateValue(value) {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return value ? String(value).slice(0, 10) : today();
  }

  function parseFile(source) {
    var match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
    if (!match) throw new Error('Missing post front matter.');
    var meta = window.jsyaml.load(match[1]) || {};
    if (typeof meta !== 'object' || Array.isArray(meta)) throw new Error('Invalid post front matter.');
    return { meta: meta, body: source.slice(match[0].length).replace(/^\r?\n/, '') };
  }

  function buildFile(path) {
    var meta = Object.assign({}, originalMeta);
    meta.layout = 'research-note';
    meta.title = titleInput.value.trim();
    meta.date = dateInput.value;
    if (!currentPath && path && !meta.permalink) {
      meta.permalink = '/research-diary/' + path.split('/').pop().replace(/\.md$/i, '') + '/';
    }

    var summary = summaryInput.value.trim();
    var category = categoryInput.value.trim();
    var tags = tagsInput.value.split(',').map(function (item) { return item.trim(); }).filter(Boolean);
    var readingTime = Number(readingTimeInput.value);
    if (summary) meta.summary = summary; else delete meta.summary;
    if (category) meta.category = category; else delete meta.category;
    if (tags.length) meta.tags = tags; else delete meta.tags;
    if (readingTimeInput.value && Number.isInteger(readingTime) && readingTime > 0) meta.reading_time = readingTime; else delete meta.reading_time;

    var yaml = window.jsyaml.dump(meta, { lineWidth: -1, noRefs: true });
    yaml = yaml.replace(/^date:.*$/m, 'date: ' + dateInput.value);
    return '---\n' + yaml + '---\n\n' + bodyInput.value.trimEnd() + '\n';
  }

  function renderPreview() {
    byId('preview-title').textContent = titleInput.value.trim() || 'Untitled';
    byId('preview-meta').textContent = dateInput.value || '';
    if (!window.marked || !window.DOMPurify) return;
    var rawHtml = window.marked.parse(bodyInput.value || '', { gfm: true, breaks: true });
    byId('preview-body').innerHTML = window.DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
    byId('preview-body').querySelectorAll('a').forEach(function (link) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
  }

  function markChanged() {
    dirty = true;
    publishedLink.hidden = true;
    renderPreview();
  }

  function resetForm() {
    currentPath = null;
    currentSha = null;
    originalMeta = {};
    form.reset();
    dateInput.value = today();
    slugInput.readOnly = false;
    select.value = '';
    dirty = false;
    publishedLink.hidden = true;
    message('');
    renderPreview();
  }

  async function listPosts(credential) {
    var files = await request('/contents/' + collection + '?ref=' + branch, null, credential);
    if (!Array.isArray(files)) throw new Error('Could not load posts.');
    var selected = currentPath || '';
    select.replaceChildren(new Option('New post', ''));
    files.filter(function (file) { return file.type === 'file' && /\.md$/i.test(file.name); })
      .sort(function (a, b) { return b.name.localeCompare(a.name); })
      .forEach(function (file) { select.add(new Option(file.name.replace(/\.md$/i, ''), file.path)); });
    select.value = selected;
    return files;
  }

  async function connect() {
    var candidate = tokenInput.value.trim();
    if (!candidate) { message('Enter a GitHub token.', 'error'); tokenInput.focus(); return; }
    setBusy(true);
    message('Connecting…');
    try {
      await listPosts(candidate);
      token = candidate;
      tokenInput.value = '';
      tokenInput.hidden = true;
      connectButton.hidden = true;
      disconnectButton.hidden = false;
      connectionState.textContent = 'Connected';
      connectionState.classList.add('connected');
      message('Connected.', 'success');
    } catch (error) {
      message(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function openPost(path) {
    if (!path) { resetForm(); return; }
    setBusy(true);
    message('Opening…');
    try {
      var file = await request('/contents/' + safePath(path) + '?ref=' + branch);
      if (file.encoding !== 'base64' || !file.content) throw new Error('Post is too large to edit here.');
      var parsed = parseFile(decodeBase64(file.content));
      currentPath = path;
      currentSha = file.sha;
      originalMeta = parsed.meta;
      titleInput.value = parsed.meta.title || '';
      dateInput.value = dateValue(parsed.meta.date);
      slugInput.value = path.split('/').pop().replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/i, '');
      slugInput.readOnly = true;
      summaryInput.value = parsed.meta.summary || '';
      categoryInput.value = parsed.meta.category || '';
      tagsInput.value = Array.isArray(parsed.meta.tags) ? parsed.meta.tags.join(', ') : (parsed.meta.tags || '');
      readingTimeInput.value = parsed.meta.reading_time || '';
      bodyInput.value = parsed.body.trimEnd();
      dirty = false;
      publishedLink.hidden = true;
      message('Opened ' + file.name, 'success');
      renderPreview();
    } catch (error) {
      select.value = currentPath || '';
      message(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    if (!token) { message('Connect GitHub first.', 'error'); tokenInput.focus(); return; }
    if (!titleInput.value.trim()) { message('Add a title.', 'error'); titleInput.focus(); return; }
    if (!dateInput.value) { message('Choose a date.', 'error'); dateInput.focus(); return; }
    if (!bodyInput.value.trim()) { message('Add some text.', 'error'); bodyInput.focus(); return; }

    var slug = slugify(slugInput.value || titleInput.value) || 'note-' + Date.now().toString(36);
    var path = currentPath || collection + '/' + dateInput.value + '-' + slug + '.md';
    var content = buildFile(path);
    var details = {
      message: 'diary: ' + (currentPath ? 'update ' : 'add ') + titleInput.value.trim().replace(/\s+/g, ' ').slice(0, 80),
      content: encodeBase64(content),
      branch: branch
    };
    if (currentSha) details.sha = currentSha;
    setBusy(true);
    message('Saving…');
    try {
      var result = await request('/contents/' + safePath(path), { method: 'PUT', body: details });
      currentPath = path;
      currentSha = result.content.sha;
      originalMeta = parseFile(content).meta;
      slugInput.value = slug;
      slugInput.readOnly = true;
      dirty = false;
      publishedLink.href = originalMeta.permalink || '/research-diary/' + path.split('/').pop().replace(/\.md$/i, '') + '/';
      publishedLink.textContent = 'View post ↗';
      publishedLink.hidden = false;
      message('Saved.', 'success');
      try {
        await listPosts();
        select.value = currentPath;
      } catch (refreshError) {
        message('Saved. Refresh to update the post list.', 'success');
      }
    } catch (error) {
      message(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  function insertText(before, after, placeholder) {
    var start = bodyInput.selectionStart;
    var end = bodyInput.selectionEnd;
    var selected = bodyInput.value.slice(start, end) || placeholder || '';
    var value = before + selected + after;
    bodyInput.setRangeText(value, start, end, 'select');
    bodyInput.focus();
    markChanged();
  }

  function applyFormat(format) {
    if (format === 'heading') insertText('## ', '', 'Heading');
    if (format === 'bold') insertText('**', '**', 'Bold text');
    if (format === 'italic') insertText('*', '*', 'Italic text');
    if (format === 'list') insertText('- ', '', 'List item');
    if (format === 'link') insertText('[', '](https://)', 'Link text');
    if (format === 'code') insertText('\n```\n', '\n```\n', 'Code');
  }

  async function uploadImage(file) {
    if (!file) return;
    if (!token) { message('Connect GitHub first.', 'error'); return; }
    var extensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
    var extension = extensions[file.type];
    if (!extension || file.size > 5 * 1024 * 1024) { message('Use a PNG, JPEG, WebP, or GIF under 5 MB.', 'error'); return; }
    var base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
    var imagePath = 'images/research-diary/' + Date.now().toString(36) + '-' + base + '.' + extension;
    setBusy(true);
    message('Uploading…');
    try {
      var bytes = new Uint8Array(await file.arrayBuffer());
      var binary = '';
      for (var start = 0; start < bytes.length; start += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(start, start + 8192));
      await request('/contents/' + safePath(imagePath), {
        method: 'PUT', body: { message: 'diary: add image ' + base, content: btoa(binary), branch: branch }
      });
      insertText('![', '](/' + imagePath + ')', base);
      message('Image added.', 'success');
    } catch (error) {
      message(error.message, 'error');
    } finally {
      imageInput.value = '';
      setBusy(false);
    }
  }

  connectButton.addEventListener('click', connect);
  tokenInput.addEventListener('keydown', function (event) { if (event.key === 'Enter') connect(); });
  disconnectButton.addEventListener('click', function () {
    token = null;
    tokenInput.value = '';
    tokenInput.hidden = false;
    connectButton.hidden = false;
    disconnectButton.hidden = true;
    select.disabled = true;
    connectionState.textContent = 'Disconnected';
    connectionState.classList.remove('connected');
    message('Disconnected.');
  });
  byId('new-post').addEventListener('click', function () {
    if (!dirty || window.confirm('Discard unsaved changes?')) resetForm();
  });
  select.addEventListener('change', function () {
    var selectedPath = select.value;
    if (dirty && !window.confirm('Discard unsaved changes?')) { select.value = currentPath || ''; return; }
    openPost(selectedPath);
  });
  form.addEventListener('submit', save);
  form.addEventListener('input', markChanged);
  document.querySelectorAll('[data-format]').forEach(function (button) {
    button.addEventListener('click', function () { applyFormat(button.dataset.format); });
  });
  byId('upload-image').addEventListener('click', function () { imageInput.click(); });
  imageInput.addEventListener('change', function () { uploadImage(imageInput.files[0]); });
  window.addEventListener('beforeunload', function (event) {
    if (dirty) { event.preventDefault(); event.returnValue = ''; }
  });

  dateInput.value = today();
  renderPreview();
}());
