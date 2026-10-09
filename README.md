# Link Collector

A privacy-focused Chrome extension for collecting, filtering, and exporting links from your open tabs. Everything runs locally in your browser; tab data is not sent to external servers.

## Install

Install Link Collector from the [Chrome Web Store](https://chromewebstore.google.com/detail/hnhaapmhbcghmldllheljgfdcdbmnmah).

Alternatively, get the latest signed Chrome package (`.crx`) from [GitHub Releases](https://github.com/ByteObsidian/Link-Collector/releases/latest).

Chrome may restrict installing extensions from outside the Chrome Web Store. If your browser allows it, open `chrome://extensions`, enable **Developer mode**, and install the downloaded package. To load the source for development, choose **Load unpacked** and select this project folder.

## Features

- Collect tabs from the current window or all open windows.
- Search tabs by title or URL, exclude the active tab, and hide duplicates.
- Exclude sites with comma-separated patterns, including wildcards such as `*.google.com/*`.
- Sort by tab order, window, title, or site, with window headers when grouping by window.
- Tick individual cards to copy only the tabs you choose.
- Copy or download links as plain URLs, title and URL, Markdown, HTML, CSV, or JSON.
- Close duplicate tabs in one click (active and pinned copies are kept).
- Edit links in Text Mode without filters overwriting your changes, and open a list of links as tabs, skipping ones already open.
- Copy links without opening the popup with `Alt+Shift+C` or **Copy tab links** in the toolbar icon's right-click menu.
- Dark mode, full keyboard access, and the `Alt+Shift+L` shortcut to open the popup.

## Privacy and permissions

The extension uses:

- `tabs` to read the URLs and titles of tabs you choose to collect, switch to, open, or close duplicates of.
- `storage` to save your preferences.
- `favicon` to show tab icons.
- `contextMenus` to add **Copy tab links** to the toolbar icon's right-click menu.
- `offscreen` to write to the clipboard when copying without the popup open.

Tab information and preferences stay on your device. The extension does not transmit them to an external service.

## Development

1. Clone or download this repository.
2. In Chrome, open `chrome://extensions` and enable **Developer mode**.
3. Select **Load unpacked** and choose the repository folder.

The extension manifest is [manifest.json](./manifest.json). Filtering, sorting, and formatting live in [lib/links.js](./lib/links.js), shared by the popup and the background worker ([background.js](./background.js)).

Store screenshots and promo tiles are generated from the real popup with `python tools/store-assets/build.py` (needs Chrome installed) and written to the git-ignored `store-assets/` folder.

Pushing a tag such as `v1.5` runs the [release workflow](./.github/workflows/release.yml), which checks the tag matches the manifest version, builds the Chrome Web Store zip, and attaches it to the GitHub release. The [publishing guide](./publishing_guide.md) covers Chrome Web Store and Edge Add-ons submission.

## Project links

- [Chrome Web Store](https://chromewebstore.google.com/detail/hnhaapmhbcghmldllheljgfdcdbmnmah)
- [Project site](https://byteobsidian.github.io/Link-Collector/)
- [Releases](https://github.com/ByteObsidian/Link-Collector/releases)
- [Source code](https://github.com/ByteObsidian/Link-Collector)

## License

This project is licensed under the [Apache License 2.0](./LICENSE).
