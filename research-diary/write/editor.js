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
    if (!activeToken) throw new Error('请先连接 GitHub。');
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
      throw new Error('无法连接 GitHub。请检查网络后重试。');
    }
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('令牌无效、已过期，或没有此仓库的 Contents 写入权限。');
      if (response.status === 409 || response.status === 422) throw new Error('保存冲突：同名文件已存在，或文章在其他地方被修改。请重新打开文章后再保存。');
      throw new Error('GitHub 返回 ' + response.status + '：' + (data.message || '请稍后重试。'));
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
    if (!match) throw new Error('这篇文章缺少 YAML 开头信息，请在仓库中检查文件。');
    var meta = window.jsyaml.load(match[1]) || {};
    if (typeof meta !== 'object' || Array.isArray(meta)) throw new Error('文章的 YAML 开头信息无法识别。');
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
    byId('preview-title').textContent = titleInput.value.trim() || '文章标题';
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
    if (!Array.isArray(files)) throw new Error('无法读取日记目录。');
    var selected = currentPath || '';
    select.replaceChildren(new Option('新文章', ''));
    files.filter(function (file) { return file.type === 'file' && /\.md$/i.test(file.name); })
      .sort(function (a, b) { return b.name.localeCompare(a.name); })
      .forEach(function (file) { select.add(new Option(file.name.replace(/\.md$/i, ''), file.path)); });
    select.value = selected;
    return files;
  }

  async function connect() {
    var candidate = tokenInput.value.trim();
    if (!candidate) { message('请先输入 GitHub 令牌。', 'error'); tokenInput.focus(); return; }
    setBusy(true);
    message('正在检查仓库权限…');
    try {
      await listPosts(candidate);
      token = candidate;
      tokenInput.value = '';
      tokenInput.hidden = true;
      connectButton.hidden = true;
      disconnectButton.hidden = false;
      connectionState.textContent = '已连接';
      connectionState.classList.add('connected');
      message('已连接。可以新建或打开文章。', 'success');
    } catch (error) {
      message(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function openPost(path) {
    if (!path) { resetForm(); return; }
    setBusy(true);
    message('正在打开文章…');
    try {
      var file = await request('/contents/' + safePath(path) + '?ref=' + branch);
      if (file.encoding !== 'base64' || !file.content) throw new Error('文章太大，无法在此编辑。');
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
      message('已打开 ' + file.name, 'success');
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
    if (!token) { message('请先连接 GitHub，再保存文章。', 'error'); tokenInput.focus(); return; }
    if (!titleInput.value.trim()) { message('请填写标题。', 'error'); titleInput.focus(); return; }
    if (!dateInput.value) { message('请选择日期。', 'error'); dateInput.focus(); return; }
    if (!bodyInput.value.trim()) { message('请写一点正文。', 'error'); bodyInput.focus(); return; }

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
    message('正在保存到 GitHub…');
    try {
      var result = await request('/contents/' + safePath(path), { method: 'PUT', body: details });
      currentPath = path;
      currentSha = result.content.sha;
      originalMeta = parseFile(content).meta;
      slugInput.value = slug;
      slugInput.readOnly = true;
      dirty = false;
      publishedLink.href = originalMeta.permalink || '/research-diary/' + path.split('/').pop().replace(/\.md$/i, '') + '/';
      publishedLink.textContent = '查看发布后的文章 ↗';
      publishedLink.hidden = false;
      message('已保存到 GitHub。网页通常会在片刻后更新。', 'success');
      try {
        await listPosts();
        select.value = currentPath;
      } catch (refreshError) {
        message('文章已保存，但列表暂时无法刷新。重新连接后即可打开。', 'success');
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
    if (format === 'heading') insertText('## ', '', '小标题');
    if (format === 'bold') insertText('**', '**', '加粗文字');
    if (format === 'italic') insertText('*', '*', '斜体文字');
    if (format === 'list') insertText('- ', '', '列表项');
    if (format === 'link') insertText('[', '](https://)', '链接文字');
    if (format === 'code') insertText('\n```\n', '\n```\n', '代码');
  }

  async function uploadImage(file) {
    if (!file) return;
    if (!token) { message('上传图片前请先连接 GitHub。', 'error'); return; }
    var extensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
    var extension = extensions[file.type];
    if (!extension || file.size > 5 * 1024 * 1024) { message('请选择不超过 5 MB 的 PNG、JPEG、WebP 或 GIF 图片。', 'error'); return; }
    var base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
    var imagePath = 'images/research-diary/' + Date.now().toString(36) + '-' + base + '.' + extension;
    setBusy(true);
    message('正在上传图片…');
    try {
      var bytes = new Uint8Array(await file.arrayBuffer());
      var binary = '';
      for (var start = 0; start < bytes.length; start += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(start, start + 8192));
      await request('/contents/' + safePath(imagePath), {
        method: 'PUT', body: { message: 'diary: add image ' + base, content: btoa(binary), branch: branch }
      });
      insertText('![', '](/' + imagePath + ')', base);
      message('图片已上传并插入正文。', 'success');
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
    connectionState.textContent = '未连接';
    connectionState.classList.remove('connected');
    message('已断开。当前编辑内容仍保留在页面中。');
  });
  byId('new-post').addEventListener('click', function () {
    if (!dirty || window.confirm('放弃当前尚未保存的修改？')) resetForm();
  });
  select.addEventListener('change', function () {
    var selectedPath = select.value;
    if (dirty && !window.confirm('放弃当前尚未保存的修改？')) { select.value = currentPath || ''; return; }
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
