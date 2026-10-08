document.addEventListener('DOMContentLoaded', async () => {
  const linkList = document.getElementById('link-list');
  const copyBtn = document.getElementById('copy-btn');
  const openBtn = document.getElementById('open-btn');
  const searchInput = document.getElementById('search-input');
  const excludePatternInput = document.getElementById('exclude-pattern');
  const currentWindowCheckbox = document.getElementById('current-window-only');
  const includeActiveTabCheckbox = document.getElementById('include-active-tab');
  const dedupeCheckbox = document.getElementById('dedupe');
  const outputFormatSelect = document.getElementById('output-format');
  const emptyState = document.getElementById('empty-state');

  // List View Format Elements
  const urlListText = document.getElementById('url-list-text');
  const formatUiBtn = document.getElementById('format-ui-btn');
  const formatTextBtn = document.getElementById('format-text-btn');
  const urlCountLabel = document.getElementById('url-count');

  // Line Numbers
  const lineNumbers = document.getElementById('line-numbers');
  const textModeContainer = document.getElementById('text-mode-container');

  // Browser pages that are never worth collecting
  const IGNORED_URL_PREFIXES = ['chrome://newtab', 'chrome://downloads', 'edge://newtab', 'about:blank'];

  // Ask for confirmation before opening more tabs than this at once
  const OPEN_CONFIRM_THRESHOLD = 10;

  // Store tab objects and state
  let allTabs = [];
  let currentWindowId = null;
  let listFormat = 'text'; // 'ui' or 'text'

  // Initialize
  const [tabs, currentWindow, storage] = await Promise.all([
    chrome.tabs.query({}),
    chrome.windows.getCurrent(),
    chrome.storage.local.get(['currentWindowOnly', 'includeActiveTab', 'excludePattern', 'dedupe', 'listFormat', 'outputFormat'])
  ]);
  allTabs = tabs;
  currentWindowId = currentWindow.id;

  // Restore saved preferences (current window defaults to on, everything else off)
  currentWindowCheckbox.checked = storage.currentWindowOnly !== false;
  includeActiveTabCheckbox.checked = !!storage.includeActiveTab;
  dedupeCheckbox.checked = !!storage.dedupe;
  excludePatternInput.value = storage.excludePattern || '';
  if (storage.outputFormat) {
    outputFormatSelect.value = storage.outputFormat;
  }
  setListFormat(storage.listFormat === 'ui' ? 'ui' : 'text');

  // Event Listeners
  searchInput.addEventListener('input', updateList);
  excludePatternInput.addEventListener('input', () => {
    chrome.storage.local.set({ excludePattern: excludePatternInput.value });
    updateList();
  });
  currentWindowCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ currentWindowOnly: currentWindowCheckbox.checked });
    updateList();
  });
  includeActiveTabCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ includeActiveTab: includeActiveTabCheckbox.checked });
    updateList();
  });
  dedupeCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ dedupe: dedupeCheckbox.checked });
    updateList();
  });
  outputFormatSelect.addEventListener('change', () => {
    chrome.storage.local.set({ outputFormat: outputFormatSelect.value });
    updateList();
  });

  // Format Switching (List vs Text)
  formatUiBtn.addEventListener('click', () => setListFormat('ui'));
  formatTextBtn.addEventListener('click', () => setListFormat('text'));

  // Ctrl/Cmd + Enter copies from anywhere in the popup
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      copyBtn.click();
    }
  });

  function setListFormat(format) {
    listFormat = format;
    chrome.storage.local.set({ listFormat: format });

    const isUi = format === 'ui';
    formatUiBtn.classList.toggle('active', isUi);
    formatTextBtn.classList.toggle('active', !isUi);
    linkList.classList.toggle('hidden', !isUi);
    textModeContainer.classList.toggle('hidden', isUi);
    // Opening URLs only makes sense for the editable text box
    openBtn.classList.toggle('hidden', isUi);
    updateList();
  }

  // Line Numbers Logic
  function updateLineNumbers() {
    const lineCount = urlListText.value.split('\n').length || 1;
    lineNumbers.textContent = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
  }

  // Sync scroll
  urlListText.addEventListener('scroll', () => {
    lineNumbers.scrollTop = urlListText.scrollTop;
  });

  urlListText.addEventListener('input', updateLineNumbers);

  function getExcludePatterns() {
    return excludePatternInput.value
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter(Boolean);
  }

  function getVisibleTabs() {
    const query = searchInput.value.trim().toLowerCase();
    const excludePatterns = getExcludePatterns();
    const onlyCurrentWindow = currentWindowCheckbox.checked;
    const includeActiveTab = includeActiveTabCheckbox.checked;
    const seenUrls = new Set();

    return allTabs.filter(tab => {
      const url = tab.url || '';
      const lowerUrl = url.toLowerCase();

      if (!url || IGNORED_URL_PREFIXES.some(prefix => lowerUrl.startsWith(prefix))) {
        return false;
      }

      if (excludePatterns.some(pattern => lowerUrl.includes(pattern))) {
        return false;
      }

      // Exclude current active tab unless included
      if (!includeActiveTab && tab.active && tab.windowId === currentWindowId) {
        return false;
      }

      if (onlyCurrentWindow && tab.windowId !== currentWindowId) {
        return false;
      }

      const matchesSearch = !query ||
        (tab.title || '').toLowerCase().includes(query) ||
        lowerUrl.includes(query);
      if (!matchesSearch) {
        return false;
      }

      if (dedupeCheckbox.checked) {
        if (seenUrls.has(url)) {
          return false;
        }
        seenUrls.add(url);
      }

      return true;
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeCsv(str) {
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }

  // Serialize tabs in the selected output format
  function formatTabs(tabsToFormat) {
    const title = tab => tab.title || tab.url;

    switch (outputFormatSelect.value) {
      case 'title-url':
        return tabsToFormat.map(t => `${title(t)}\n${t.url}`).join('\n\n');
      case 'markdown':
        return tabsToFormat.map(t => `- [${title(t).replace(/([\[\]])/g, '\\$1')}](${t.url})`).join('\n');
      case 'html':
        return tabsToFormat.map(t => `<a href="${escapeHtml(t.url)}">${escapeHtml(title(t))}</a>`).join('\n');
      case 'csv':
        return ['Title,URL', ...tabsToFormat.map(t => `${escapeCsv(title(t))},${escapeCsv(t.url)}`)].join('\n');
      case 'json':
        return JSON.stringify(tabsToFormat.map(t => ({ title: title(t), url: t.url })), null, 2);
      default:
        return tabsToFormat.map(t => t.url).join('\n');
    }
  }

  function updateList() {
    renderLinks(getVisibleTabs());
  }

  function renderLinks(tabsToRender) {
    const count = tabsToRender.length;
    urlCountLabel.textContent = `${count} ${count === 1 ? 'URL' : 'URLs'}`;
    emptyState.classList.toggle('hidden', count > 0);

    if (listFormat === 'text') {
      urlListText.value = formatTabs(tabsToRender);
      updateLineNumbers();
    } else {
      renderListUi(tabsToRender);
    }
  }

  function renderListUi(tabsToRender) {
    linkList.innerHTML = '';

    tabsToRender.forEach((tab) => {
      const li = document.createElement('li');
      li.className = 'link-item';
      li.title = 'Click to switch to this tab';

      li.addEventListener('click', () => {
        chrome.tabs.update(tab.id, { active: true });
        chrome.windows.update(tab.windowId, { focused: true });
      });

      const img = document.createElement('img');
      img.className = 'link-favicon';
      img.src = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(tab.url)}&size=32`;
      img.alt = '';

      const content = document.createElement('div');
      content.className = 'link-content';

      const title = document.createElement('div');
      title.className = 'link-title';
      title.textContent = tab.title || tab.url;

      const urlSpan = document.createElement('span');
      urlSpan.className = 'link-url';
      urlSpan.textContent = tab.url;

      content.appendChild(title);
      content.appendChild(urlSpan);

      li.appendChild(img);
      li.appendChild(content);
      linkList.appendChild(li);
    });
  }

  function flashButton(btn, text, className) {
    if (btn.dataset.originalText === undefined) {
      btn.dataset.originalText = btn.textContent;
    }
    clearTimeout(btn.flashTimer);
    btn.textContent = text;
    btn.classList.add(className);
    btn.flashTimer = setTimeout(() => {
      btn.textContent = btn.dataset.originalText;
      btn.classList.remove(className);
    }, 2000);
  }

  // Copy to clipboard functionality
  copyBtn.addEventListener('click', async () => {
    // In text mode, copy the textarea so manual edits are kept
    const textToCopy = listFormat === 'text' ? urlListText.value : formatTabs(getVisibleTabs());
    if (!textToCopy.trim()) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      flashButton(copyBtn, 'Copied!', 'success');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      flashButton(copyBtn, 'Copy failed', 'error');
    }
  });

  // Open every http(s) URL found in the text box (works with any output format or pasted text)
  let pendingOpenConfirm = false;
  openBtn.addEventListener('click', async () => {
    const urls = [...new Set(urlListText.value.match(/https?:\/\/[^\s"'<>)\]]+/g) || [])];
    if (urls.length === 0) {
      flashButton(openBtn, 'No URLs', 'error');
      return;
    }

    if (urls.length > OPEN_CONFIRM_THRESHOLD && !pendingOpenConfirm) {
      pendingOpenConfirm = true;
      flashButton(openBtn, `Open ${urls.length}?`, 'warning');
      setTimeout(() => { pendingOpenConfirm = false; }, 2000);
      return;
    }
    pendingOpenConfirm = false;

    // Open in the background so the popup stays open until all tabs are created
    for (const url of urls) {
      await chrome.tabs.create({ url, active: false, windowId: currentWindowId });
    }
    flashButton(openBtn, `Opened ${urls.length}`, 'success');
  });
});
