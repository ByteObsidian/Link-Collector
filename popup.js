document.addEventListener('DOMContentLoaded', async () => {
  const linkList = document.getElementById('link-list');
  const copyBtn = document.getElementById('copy-btn');
  const openBtn = document.getElementById('open-btn');
  const downloadBtn = document.getElementById('download-btn');
  const closeDuplicatesBtn = document.getElementById('close-duplicates-btn');
  const clearSelectionBtn = document.getElementById('clear-selection-btn');
  const searchInput = document.getElementById('search-input');
  const excludePatternInput = document.getElementById('exclude-pattern');
  const currentWindowCheckbox = document.getElementById('current-window-only');
  const includeActiveTabCheckbox = document.getElementById('include-active-tab');
  const dedupeCheckbox = document.getElementById('dedupe');
  const outputFormatSelect = document.getElementById('output-format');
  const sortModeSelect = document.getElementById('sort-mode');
  const emptyState = document.getElementById('empty-state');
  const editNotice = document.getElementById('edit-notice');
  const resetTextBtn = document.getElementById('reset-text-btn');

  // List View Format Elements
  const urlListText = document.getElementById('url-list-text');
  const formatUiBtn = document.getElementById('format-ui-btn');
  const formatTextBtn = document.getElementById('format-text-btn');
  const urlCountLabel = document.getElementById('url-count');

  // Line Numbers
  const lineNumbers = document.getElementById('line-numbers');
  const textModeContainer = document.getElementById('text-mode-container');

  // Ask for confirmation before opening more tabs than this at once
  const OPEN_CONFIRM_THRESHOLD = 10;

  // Store tab objects and state
  let allTabs = [];
  let currentWindowId = null;
  let listFormat = 'text'; // 'ui' or 'text'
  let textEdited = false; // true once the user types in the text box, so filters stop overwriting it
  const selectedTabIds = new Set();

  // Initialize
  const [tabs, currentWindow, storage] = await Promise.all([
    chrome.tabs.query({}),
    chrome.windows.getCurrent(),
    chrome.storage.local.get(['currentWindowOnly', 'includeActiveTab', 'excludePattern', 'dedupe', 'listFormat', 'outputFormat', 'sortMode'])
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
  if (storage.sortMode) {
    sortModeSelect.value = storage.sortMode;
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
  sortModeSelect.addEventListener('change', () => {
    chrome.storage.local.set({ sortMode: sortModeSelect.value });
    updateList();
  });

  // Format Switching (List vs Text)
  formatUiBtn.addEventListener('click', () => setListFormat('ui'));
  formatTextBtn.addEventListener('click', () => setListFormat('text'));

  clearSelectionBtn.addEventListener('click', () => {
    selectedTabIds.clear();
    updateList();
  });

  resetTextBtn.addEventListener('click', () => {
    setTextEdited(false);
    updateList();
  });

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
    editNotice.classList.toggle('hidden', isUi || !textEdited);
    updateList();
  }

  function setTextEdited(edited) {
    textEdited = edited;
    editNotice.classList.toggle('hidden', !edited || listFormat !== 'text');
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

  urlListText.addEventListener('input', () => {
    setTextEdited(true);
    updateLineNumbers();
  });

  function getVisibleTabs() {
    const filtered = LinkCollector.filterTabs(allTabs, {
      query: searchInput.value,
      excludePattern: excludePatternInput.value,
      currentWindowOnly: currentWindowCheckbox.checked,
      includeActiveTab: includeActiveTabCheckbox.checked,
      dedupe: dedupeCheckbox.checked,
      currentWindowId
    });
    return LinkCollector.sortTabs(filtered, sortModeSelect.value, currentWindowId);
  }

  // What Copy, Download and the text box use: the selected cards if any are ticked, otherwise every visible tab
  function getOutputTabs(visibleTabs = getVisibleTabs()) {
    const selected = visibleTabs.filter(tab => selectedTabIds.has(tab.id));
    return selected.length > 0 ? selected : visibleTabs;
  }

  // Duplicates are counted within the chosen window scope, ignoring search and exclude filters
  function getDuplicateTabs() {
    const scope = currentWindowCheckbox.checked ? allTabs.filter(t => t.windowId === currentWindowId) : allTabs;
    return LinkCollector.findDuplicateTabs(scope);
  }

  function updateList() {
    const visibleTabs = getVisibleTabs();
    const outputTabs = getOutputTabs(visibleTabs);
    const selectedCount = outputTabs === visibleTabs ? 0 : outputTabs.length;

    const count = visibleTabs.length;
    urlCountLabel.textContent = selectedCount > 0
      ? `${selectedCount} of ${count} selected`
      : `${count} ${count === 1 ? 'URL' : 'URLs'}`;
    clearSelectionBtn.classList.toggle('hidden', selectedCount === 0);
    copyBtn.textContent = selectedCount > 0 ? `Copy ${selectedCount}` : 'Copy';
    copyBtn.dataset.originalText = copyBtn.textContent;
    emptyState.classList.toggle('hidden', count > 0);

    const duplicateCount = getDuplicateTabs().length;
    closeDuplicatesBtn.classList.toggle('hidden', duplicateCount === 0);
    closeDuplicatesBtn.textContent = `Close ${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'}`;
    closeDuplicatesBtn.dataset.originalText = closeDuplicatesBtn.textContent;

    if (listFormat === 'text') {
      if (!textEdited) {
        urlListText.value = LinkCollector.formatTabs(outputTabs, outputFormatSelect.value);
        updateLineNumbers();
      }
    } else {
      renderListUi(visibleTabs);
    }
  }

  function renderListUi(tabsToRender) {
    linkList.innerHTML = '';

    // Label each window's group when sorting by window across several windows
    const showWindowHeaders = sortModeSelect.value === 'window' &&
      new Set(tabsToRender.map(t => t.windowId)).size > 1;
    let lastWindowId = null;
    let windowNumber = 0;

    tabsToRender.forEach((tab) => {
      if (showWindowHeaders && tab.windowId !== lastWindowId) {
        lastWindowId = tab.windowId;
        windowNumber++;
        const header = document.createElement('li');
        header.className = 'window-header';
        header.textContent = tab.windowId === currentWindowId ? 'This window' : `Window ${windowNumber}`;
        linkList.appendChild(header);
      }

      const li = document.createElement('li');
      li.className = 'link-item';
      li.classList.toggle('selected', selectedTabIds.has(tab.id));

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'link-select';
      checkbox.checked = selectedTabIds.has(tab.id);
      checkbox.setAttribute('aria-label', `Select ${tab.title || tab.url}`);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selectedTabIds.add(tab.id);
        } else {
          selectedTabIds.delete(tab.id);
        }
        updateList();
      });

      // A real button so the card can be reached with Tab and opened with Enter or Space
      const main = document.createElement('button');
      main.type = 'button';
      main.className = 'link-main';
      main.title = 'Switch to this tab';
      main.addEventListener('click', () => {
        chrome.tabs.update(tab.id, { active: true });
        chrome.windows.update(tab.windowId, { focused: true });
      });

      const img = document.createElement('img');
      img.className = 'link-favicon';
      img.src = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(tab.url)}&size=32`;
      img.alt = '';

      const content = document.createElement('span');
      content.className = 'link-content';

      const title = document.createElement('span');
      title.className = 'link-title';
      title.textContent = tab.title || tab.url;

      const urlSpan = document.createElement('span');
      urlSpan.className = 'link-url';
      urlSpan.textContent = tab.url;

      content.appendChild(title);
      content.appendChild(urlSpan);
      main.appendChild(img);
      main.appendChild(content);

      li.appendChild(checkbox);
      li.appendChild(main);
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

  // Two clicks within 2 seconds to confirm a bulk action
  function needsConfirm(btn, message) {
    if (btn.dataset.confirming === 'true') {
      btn.dataset.confirming = '';
      return false;
    }
    btn.dataset.confirming = 'true';
    flashButton(btn, message, 'warning');
    setTimeout(() => { btn.dataset.confirming = ''; }, 2000);
    return true;
  }

  // In text mode, use the textarea so manual edits are kept
  function getOutputText() {
    return listFormat === 'text'
      ? urlListText.value
      : LinkCollector.formatTabs(getOutputTabs(), outputFormatSelect.value);
  }

  copyBtn.addEventListener('click', async () => {
    const textToCopy = getOutputText();
    if (!textToCopy.trim()) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      flashButton(copyBtn, 'Copied!', 'success');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      flashButton(copyBtn, 'Copy failed', 'error');
    }
  });

  downloadBtn.addEventListener('click', () => {
    const text = getOutputText();
    if (!text.trim()) return;

    const format = outputFormatSelect.value;
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `link-collector-${date}.${LinkCollector.FILE_EXTENSIONS[format] || 'txt'}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });

  closeDuplicatesBtn.addEventListener('click', async () => {
    const duplicates = getDuplicateTabs();
    if (duplicates.length === 0) return;
    if (needsConfirm(closeDuplicatesBtn, `Close ${duplicates.length}?`)) return;

    await chrome.tabs.remove(duplicates.map(t => t.id));
    allTabs = await chrome.tabs.query({});
    for (const id of [...selectedTabIds]) {
      if (!allTabs.some(t => t.id === id)) selectedTabIds.delete(id);
    }
    updateList();
  });

  // Open every http(s) URL found in the text box, skipping ones that already have a tab
  openBtn.addEventListener('click', async () => {
    const urls = LinkCollector.extractUrls(urlListText.value);
    if (urls.length === 0) {
      flashButton(openBtn, 'No URLs', 'error');
      return;
    }

    const openUrls = new Set((await chrome.tabs.query({})).map(t => t.url));
    const newUrls = urls.filter(url => !openUrls.has(url));
    if (newUrls.length === 0) {
      flashButton(openBtn, 'All open', 'success');
      return;
    }

    if (newUrls.length > OPEN_CONFIRM_THRESHOLD && needsConfirm(openBtn, `Open ${newUrls.length}?`)) {
      return;
    }

    // Open in the background so the popup stays open until all tabs are created
    for (const url of newUrls) {
      await chrome.tabs.create({ url, active: false, windowId: currentWindowId });
    }
    const skipped = urls.length - newUrls.length;
    flashButton(openBtn, skipped > 0 ? `Opened ${newUrls.length}, skipped ${skipped}` : `Opened ${newUrls.length}`, 'success');
  });
});
