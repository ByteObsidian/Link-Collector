// Copy tab links without opening the popup, from a keyboard shortcut or the toolbar icon's menu
importScripts('lib/links.js');

const COPY_ACTION_ID = 'copy-all-links';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: COPY_ACTION_ID,
    title: 'Copy tab links',
    contexts: ['action']
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === COPY_ACTION_ID) {
    copyTabLinks();
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === COPY_ACTION_ID) {
    copyTabLinks();
  }
});

// Uses the same filters and format the user last chose in the popup (search is not saved, so it is ignored)
async function copyTabLinks() {
  const [tabs, currentWindow, prefs] = await Promise.all([
    chrome.tabs.query({}),
    chrome.windows.getLastFocused(),
    chrome.storage.local.get(['currentWindowOnly', 'includeActiveTab', 'excludePattern', 'dedupe', 'outputFormat', 'sortMode'])
  ]);

  const visibleTabs = LinkCollector.sortTabs(LinkCollector.filterTabs(tabs, {
    currentWindowId: currentWindow.id,
    currentWindowOnly: prefs.currentWindowOnly !== false,
    includeActiveTab: !!prefs.includeActiveTab,
    excludePattern: prefs.excludePattern,
    dedupe: !!prefs.dedupe
  }), prefs.sortMode, currentWindow.id);

  if (visibleTabs.length === 0) {
    showBadge('0', '#d97706');
    return;
  }

  try {
    await writeToClipboard(LinkCollector.formatTabs(visibleTabs, prefs.outputFormat || 'url'));
    showBadge(String(visibleTabs.length), '#16a34a');
  } catch (err) {
    console.error('Failed to copy links: ', err);
    showBadge('!', '#dc2626');
  }
}

// Service workers have no clipboard access, so the copy happens in an offscreen document
async function writeToClipboard(text) {
  const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (existing.length === 0) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['CLIPBOARD'],
      justification: 'Copy tab links to the clipboard'
    });
  }

  const response = await chrome.runtime.sendMessage({ target: 'offscreen', type: 'copy', text });
  if (!response?.ok) {
    throw new Error(response?.error || 'Clipboard write failed');
  }
}

function showBadge(text, color) {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2000);
}
