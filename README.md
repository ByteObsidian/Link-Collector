# Link Collector

A privacy-focused Chrome extension for collecting, filtering, and exporting links from your open tabs. Everything runs locally in your browser; tab data is not sent to external servers.

## Download

Get the latest signed Chrome package (`.crx`) from [GitHub Releases](https://github.com/ByteObsidian/Link-Collector/releases/latest).

Chrome may restrict installing extensions from outside the Chrome Web Store. If your browser allows it, open `chrome://extensions`, enable **Developer mode**, and install the downloaded package. To load the source for development, choose **Load unpacked** and select this project folder.

## Features

- Collect tabs from the current window or all open windows.
- Search tabs by title or URL, exclude the active tab, filter URLs, and remove duplicates.
- Copy links as plain URLs, title and URL, Markdown, HTML, CSV, or JSON.
- Edit links in Text Mode and open a list of links as tabs.
- Dark mode and the `Alt+Shift+L` keyboard shortcut.

## Privacy and permissions

The extension uses:

- `tabs` to read the URLs and titles of tabs you choose to collect.
- `storage` to save your preferences.
- `favicon` to show tab icons.

Tab information and preferences stay on your device. The extension does not transmit them to an external service.

## Development

1. Clone or download this repository.
2. In Chrome, open `chrome://extensions` and enable **Developer mode**.
3. Select **Load unpacked** and choose the repository folder.

The extension manifest is [manifest.json](./manifest.json). The [publishing guide](./publishing_guide.md) covers Chrome Web Store assets and submission.

## Project links

- [Project site](https://github.com/ByteObsidian/Link-Collector)
- [Releases](https://github.com/ByteObsidian/Link-Collector/releases)
- [Source code](https://github.com/ByteObsidian/Link-Collector)

## License

This project is licensed under the [Apache License 2.0](./LICENSE).
