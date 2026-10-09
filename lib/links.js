// Shared tab filtering, sorting and formatting, used by the popup and the background worker
(function (root) {
  // Browser pages that are never worth collecting
  const IGNORED_URL_PREFIXES = ['chrome://newtab', 'chrome://downloads', 'edge://newtab', 'about:blank'];

  const FILE_EXTENSIONS = {
    url: 'txt',
    'title-url': 'txt',
    markdown: 'md',
    html: 'html',
    csv: 'csv',
    json: 'json'
  };

  // "mail, *.google.com/*" -> one matcher per comma-separated pattern.
  // Plain text matches anywhere in the URL; * matches any run of characters.
  function parseExcludePatterns(value) {
    return (value || '')
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter(Boolean)
      .map(pattern => {
        if (!pattern.includes('*')) {
          return url => url.includes(pattern);
        }
        const source = pattern.split('*').map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
        const regex = new RegExp(source);
        return url => regex.test(url);
      });
  }

  function filterTabs(tabs, options) {
    const query = (options.query || '').trim().toLowerCase();
    const excludeMatchers = parseExcludePatterns(options.excludePattern);
    const seenUrls = new Set();

    return tabs.filter(tab => {
      const url = tab.url || '';
      const lowerUrl = url.toLowerCase();

      if (!url || IGNORED_URL_PREFIXES.some(prefix => lowerUrl.startsWith(prefix))) {
        return false;
      }

      if (excludeMatchers.some(matches => matches(lowerUrl))) {
        return false;
      }

      // Exclude current active tab unless included
      if (!options.includeActiveTab && tab.active && tab.windowId === options.currentWindowId) {
        return false;
      }

      if (options.currentWindowOnly && tab.windowId !== options.currentWindowId) {
        return false;
      }

      const matchesSearch = !query ||
        (tab.title || '').toLowerCase().includes(query) ||
        lowerUrl.includes(query);
      if (!matchesSearch) {
        return false;
      }

      if (options.dedupe) {
        if (seenUrls.has(url)) {
          return false;
        }
        seenUrls.add(url);
      }

      return true;
    });
  }

  function hostname(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  // 'tab' keeps browser order, 'window' puts the current window first
  function sortTabs(tabs, mode, currentWindowId) {
    const sorted = [...tabs];
    const byTitle = (a, b) => (a.title || a.url).localeCompare(b.title || b.url, undefined, { sensitivity: 'base' });

    switch (mode) {
      case 'title':
        return sorted.sort(byTitle);
      case 'site':
        return sorted.sort((a, b) => hostname(a.url).localeCompare(hostname(b.url)) || byTitle(a, b));
      case 'window':
        return sorted.sort((a, b) =>
          (b.windowId === currentWindowId) - (a.windowId === currentWindowId) ||
          a.windowId - b.windowId ||
          a.index - b.index);
      default:
        return sorted;
    }
  }

  // Tabs whose URL already appears in an earlier tab. Keeps the active or pinned copy when there is one.
  function findDuplicateTabs(tabs) {
    const groups = new Map();
    for (const tab of tabs) {
      if (!tab.url) continue;
      if (!groups.has(tab.url)) groups.set(tab.url, []);
      groups.get(tab.url).push(tab);
    }

    const duplicates = [];
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      const keep = group.find(t => t.active) || group.find(t => t.pinned) || group[0];
      duplicates.push(...group.filter(t => t !== keep && !t.active && !t.pinned));
    }
    return duplicates;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeCsv(str) {
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }

  // Serialize tabs in the selected output format
  function formatTabs(tabs, format) {
    const title = tab => tab.title || tab.url;

    switch (format) {
      case 'title-url':
        return tabs.map(t => `${title(t)}\n${t.url}`).join('\n\n');
      case 'markdown':
        return tabs.map(t => `- [${title(t).replace(/([\[\]])/g, '\\$1')}](${t.url})`).join('\n');
      case 'html':
        return tabs.map(t => `<a href="${escapeHtml(t.url)}">${escapeHtml(title(t))}</a>`).join('\n');
      case 'csv':
        return ['Title,URL', ...tabs.map(t => `${escapeCsv(title(t))},${escapeCsv(t.url)}`)].join('\n');
      case 'json':
        return JSON.stringify(tabs.map(t => ({ title: title(t), url: t.url })), null, 2);
      default:
        return tabs.map(t => t.url).join('\n');
    }
  }

  // Every http(s) URL in a block of text, in order, without repeats
  function extractUrls(text) {
    return [...new Set(text.match(/https?:\/\/[^\s"'<>)\]]+/g) || [])];
  }

  root.LinkCollector = {
    FILE_EXTENSIONS,
    filterTabs,
    sortTabs,
    findDuplicateTabs,
    formatTabs,
    extractUrls
  };
})(typeof self !== 'undefined' ? self : this);
