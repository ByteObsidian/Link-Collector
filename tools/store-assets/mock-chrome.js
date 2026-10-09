// Fake chrome.* APIs so popup.js renders realistic sample data outside the extension
(() => {
  const p = new URLSearchParams(location.search);
  const TABS = [
    ['Array.prototype.map() - JavaScript | MDN', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map'],
    ['Pull requests · acme/web-app', 'https://github.com/acme/web-app/pulls'],
    ['How to debounce input events in JavaScript? - Stack Overflow', 'https://stackoverflow.com/questions/24004791/debounce-input'],
    ['Chrome Extensions: Manifest V3 overview', 'https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3'],
    ['Inbox (3) - Mail', 'https://mail.example.com/inbox'],
    ['CSS Grid Layout - A complete guide', 'https://css-tricks.com/snippets/css/complete-guide-grid/'],
    ['Pull requests · acme/web-app', 'https://github.com/acme/web-app/pulls'],
    ['Q4 Roadmap - Notes', 'https://notes.example.com/q4-roadmap'],
    ['Lo-fi beats to code to - Video', 'https://www.youtube.com/watch?v=jfKfPfyJRdk'],
    ['Hacker News', 'https://news.ycombinator.com/'],
    ['Python 3 documentation: asyncio', 'https://docs.python.org/3/library/asyncio.html'],
    ['Weekly sync agenda', 'https://docs.example.com/weekly-sync'],
  ].map(([title, url], i) => ({ id: i + 1, index: i, title, url, windowId: i < 9 ? 1 : 2, active: false }));
  TABS.push({ id: 99, index: 9, title: 'Link Collector', url: 'https://example.com/current', windowId: 1, active: true });

  window.chrome = {
    runtime: { id: 'mock' },
    tabs: { query: async () => TABS, create: async () => {}, update() {}, remove: async () => {} },
    windows: { getCurrent: async () => ({ id: 1 }), update() {} },
    storage: {
      local: {
        get: async () => ({
          currentWindowOnly: p.get('allWindows') !== '1',
          includeActiveTab: false,
          excludePattern: p.get('exclude') || '',
          dedupe: p.get('dedupe') === '1',
          listFormat: p.get('view') || 'text',
          outputFormat: p.get('format') || 'url',
          sortMode: p.get('sort') || 'tab',
        }),
        set: async () => {},
      },
    },
  };

  document.documentElement.classList.add(p.get('dark') === '1' ? 'force-dark' : 'force-light');

  // Keep "Copied!" / "Opened N" button states on screen instead of reverting after 2s
  const realSetTimeout = window.setTimeout;
  window.setTimeout = (fn, ms, ...args) => (ms === 2000 ? 0 : realSetTimeout(fn, ms, ...args));

  // Replace extension favicon URLs with colored letter badges
  const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#db2777', '#0891b2', '#ca8a04', '#dc2626'];
  const badge = (host) => {
    const name = host.replace(/^www\./, '');
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="7" fill="${COLORS[h % COLORS.length]}"/><text x="16" y="22" font-family="Segoe UI,Arial" font-size="18" font-weight="700" fill="#fff" text-anchor="middle">${name[0].toUpperCase()}</text></svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  };
  new MutationObserver(() => {
    document.querySelectorAll('img.link-favicon:not([data-mock])').forEach(img => {
      img.dataset.mock = '1';
      const pageUrl = new URL(img.src).searchParams.get('pageUrl');
      img.src = badge(new URL(pageUrl).hostname);
    });
  }).observe(document, { childList: true, subtree: true });

  window.addEventListener('load', () => setTimeout(() => {
    const search = p.get('search');
    const input = document.getElementById('search-input');
    if (search) { input.value = search; input.dispatchEvent(new Event('input')); }
    input.blur();
    if (p.get('paste')) {
      const ta = document.getElementById('url-list-text');
      ta.value = p.get('paste');
      ta.dispatchEvent(new Event('input'));
      document.getElementById('open-btn').click();
    }
    // ?select=1,3 ticks those cards (by tab id) in Cards view
    for (const id of (p.get('select') || '').split(',').filter(Boolean)) {
      const box = [...document.querySelectorAll('.link-select')][TABS.filter(t => !t.active).findIndex(t => String(t.id) === id)];
      if (box) { box.checked = true; box.dispatchEvent(new Event('change')); }
    }
    if (p.get('edited') === '1') document.getElementById('url-list-text').dispatchEvent(new Event('input'));
    if (p.get('copied') === '1') document.getElementById('copy-btn').click();
  }, 200));
  // Clipboard is unavailable on file:// in headless; pretend it worked
  navigator.clipboard.writeText = async () => {};
})();
