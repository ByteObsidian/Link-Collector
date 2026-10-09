"""Render the Chrome Web Store screenshots and promo tiles into store-assets/.

Usage: python tools/store-assets/build.py [path-to-chrome]

The real popup is loaded with a mocked chrome.* API (mock-chrome.js) and screenshotted by headless Chrome.
"""
import html
import os
import shutil
import subprocess
import sys
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
BUILD = os.path.join(HERE, ".build")
OUT = os.path.join(ROOT, "store-assets")

CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
]


def find_chrome():
    if len(sys.argv) > 1:
        return sys.argv[1]
    for path in CHROME_CANDIDATES:
        if os.path.exists(path):
            return path
    sys.exit("Chrome not found; pass its path as the first argument.")


CHROME = find_chrome()
shutil.rmtree(BUILD, ignore_errors=True)
os.makedirs(os.path.join(BUILD, "lib"))
os.makedirs(OUT, exist_ok=True)

for f in ["style.css", "popup.js", os.path.join("lib", "links.js")]:
    shutil.copy(os.path.join(ROOT, f), os.path.join(BUILD, f))
shutil.copy(os.path.join(ROOT, "icons", "icon128.png"), BUILD)
for f in ["mock-chrome.js", "mock-theme.css"]:
    shutil.copy(os.path.join(HERE, f), BUILD)

popup = open(os.path.join(ROOT, "popup.html"), encoding="utf-8").read()
popup = popup.replace('<link rel="stylesheet" href="style.css">',
                      '<link rel="stylesheet" href="style.css">\n  <link rel="stylesheet" href="mock-theme.css">\n'
                      '  <script src="mock-chrome.js"></script>')
open(os.path.join(BUILD, "popup-mock.html"), "w", encoding="utf-8").write(popup)

BASE_CSS = """
* { box-sizing: border-box; }
html, body { margin: 0; overflow: hidden; }
body { font-family: 'Segoe UI', system-ui, sans-serif; color: #fff;
  background: radial-gradient(circle at 78% 30%, rgba(56,140,255,.35), transparent 55%),
              radial-gradient(circle at 10% 100%, rgba(0,200,255,.18), transparent 50%),
              linear-gradient(135deg, #0a1a3f 0%, #0b1530 55%, #060c1f 100%); }
.brand { display: flex; align-items: center; gap: 14px; font-weight: 700; letter-spacing: -.01em; }
.brand img { border-radius: 22%; box-shadow: 0 6px 20px rgba(0,0,0,.35); }
.popup { position: absolute; border-radius: 14px; overflow: hidden; transform-origin: top left;
  box-shadow: 0 30px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08); }
.popup iframe { display: block; width: 380px; height: 580px; border: 0; }
h2 { margin: 0; font-weight: 800; letter-spacing: -.02em; line-height: 1.08; }
.sub { color: #b6c6e3; line-height: 1.5; }
ul.points { list-style: none; padding: 0; margin: 0; }
ul.points li { display: flex; gap: 12px; align-items: flex-start; color: #dbe6f7; margin-bottom: 14px; line-height: 1.4; }
ul.points li::before { content: '\\2713'; flex: none; width: 24px; height: 24px; border-radius: 50%; background: #3b82f6;
  color: #fff; font-size: 14px; font-weight: 700; display: grid; place-items: center; margin-top: 1px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { padding: 6px 12px; border-radius: 999px; background: rgba(96,165,250,.16); border: 1px solid rgba(96,165,250,.35);
  color: #cfe0ff; font-size: 14px; font-weight: 600; }
"""


def popup_frame(params, x, y, scale):
    q = urllib.parse.urlencode(params)
    return (f'<div class="popup" style="left:{x}px;top:{y}px;transform:scale({scale})">'
            f'<iframe src="popup-mock.html?{q}"></iframe></div>')


def page(name, w, h, body):
    path = os.path.join(BUILD, f"{name}.html")
    open(path, "w", encoding="utf-8").write(
        f"<!doctype html><html><head><meta charset='utf-8'><style>{BASE_CSS}"
        f"body{{width:{w}px;height:{h}px;position:relative}}</style></head><body>{body}</body></html>")
    out = os.path.join(OUT, f"{name}.png")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                    "--force-device-scale-factor=1", f"--window-size={w},{h}", "--virtual-time-budget=4000",
                    f"--screenshot={out}", "file:///" + path.replace("\\", "/")],
                   check=True, capture_output=True)
    print("wrote", os.path.relpath(out, ROOT))


def screenshot(name, headline, sub, points, params):
    pts = "".join(f"<li>{html.escape(p)}</li>" for p in points)
    body = f"""
    <div style="position:absolute;left:90px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center">
      <div class="brand" style="font-size:24px;margin-bottom:34px"><img src="icon128.png" width="48" height="48">Link Collector</div>
      <h2 style="font-size:54px;margin-bottom:20px">{headline}</h2>
      <p class="sub" style="font-size:21px;margin:0 0 32px">{sub}</p>
      <ul class="points" style="font-size:19px">{pts}</ul>
    </div>
    {popup_frame(params, 720, 23, 1.3)}"""
    page(name, 1280, 800, body)


screenshot("screenshot-1-cards", "Pick the tabs,<br>copy just those",
           "See every tab as a card, tick the ones you want and copy them in one click.",
           ["Group tabs by window, title or site", "Click a card to jump straight to that tab",
            "Fully keyboard accessible"],
           {"view": "ui", "allWindows": "1", "sort": "window", "select": "2,4,6"})
screenshot("screenshot-2-formats", "Copy or download<br>in any format",
           "Plain URLs, Title + URL, Markdown, HTML, CSV or JSON, ready to paste or save.",
           ["Download the list as a file in one click", "Copy without opening the popup: Alt+Shift+C",
            "Your edits are never overwritten"],
           {"view": "text", "format": "markdown", "copied": "1"})
screenshot("screenshot-3-filters", "Filter out<br>the noise",
           "Search by title or URL, exclude sites with wildcards, and close duplicate tabs.",
           ["Wildcard excludes like *.google.com/*", "Close duplicate tabs in one click",
            "chrome:// and new-tab pages skipped automatically"],
           {"view": "ui", "exclude": "mail, *.youtube.com/*", "dedupe": "1"})
screenshot("screenshot-4-dark", "Looks great<br>in dark mode",
           "Link Collector follows your system theme automatically.",
           ["Light and dark themes built in", "Open it anytime with Alt+Shift+L",
            "Runs locally, with no data sent anywhere"],
           {"view": "text", "format": "url", "dark": "1"})
paste = "\n".join(["https://developer.mozilla.org/en-US/docs/Web/CSS", "https://github.com/acme/web-app/issues",
                   "https://docs.python.org/3/tutorial/", "https://news.ycombinator.com/",
                   "https://css-tricks.com/almanac/", "https://developer.chrome.com/docs/extensions"])
screenshot("screenshot-5-open-all", "Paste a list,<br>open them all",
           "Drop any list of links into the text view and reopen them as tabs in one go.",
           ["Finds URLs in Markdown, HTML, CSV or plain text", "Skips links that are already open",
            "Asks before opening more than 10 at once"],
           {"view": "text", "paste": paste})

page("small-promo-440x280", 440, 280, """
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 36px">
    <div class="brand" style="font-size:34px;margin-bottom:14px"><img src="icon128.png" width="64" height="64">Link Collector</div>
    <p class="sub" style="font-size:18px;margin:0 0 18px;color:#dbe6f7">Collect, filter &amp; copy every tab link.</p>
    <div class="chips"><span class="chip">URLs</span><span class="chip">Markdown</span><span class="chip">CSV</span><span class="chip">JSON</span></div>
  </div>""")

page("marquee-promo-1400x560", 1400, 560, f"""
  <div style="position:absolute;left:90px;top:0;bottom:0;width:640px;display:flex;flex-direction:column;justify-content:center">
    <div class="brand" style="font-size:28px;margin-bottom:28px"><img src="icon128.png" width="56" height="56">Link Collector</div>
    <h2 style="font-size:58px;margin-bottom:20px">Every open tab.<br>One click to copy.</h2>
    <p class="sub" style="font-size:21px;margin:0 0 26px">Search, filter and export your tab links in the format you need.</p>
    <div class="chips"><span class="chip">URLs</span><span class="chip">Title + URL</span><span class="chip">Markdown</span><span class="chip">HTML</span><span class="chip">CSV</span><span class="chip">JSON</span></div>
  </div>
  {popup_frame({"view": "text", "format": "url", "dark": "1"}, 1020, 50, 0.86)}
  {popup_frame({"view": "ui"}, 800, 25, 0.86)}""")

shutil.copy(os.path.join(ROOT, "icons", "icon128.png"), os.path.join(OUT, "store-icon-128x128.png"))
print("wrote store-assets/store-icon-128x128.png")
