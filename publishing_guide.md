# Publishing Guide for Link Collector

Follow these steps to upload your extension to the Chrome Web Store.

## Prerequisites
- A Google Account.
- A Developer Account on the Chrome Web Store (requires a one-time $5 fee).
- A ZIP package of the extension files (create it locally before uploading; generated ZIPs are not stored in this repository).
- Promotional images in the local `store-assets/` folder (kept out of the repository; regenerate or copy them before submitting).

## Steps

1.  **Go to the Dashboard**: Visit the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2.  **Create New Item**: Click the **"New Item"** button.
3.  **Upload Zip**: Drag and drop your locally created extension ZIP or click to browse and select it. Include `manifest.json`, `popup.html`, `popup.js`, `style.css`, and the `icons/` folder (`icon16.png`, `icon48.png`, `icon128.png`). Do not include the `store-assets/` folder or publishing documentation in the extension package.
4.  **Fill in Details**:
    - **Store Listing**:
        - **Description**: 
          > **Link Collector: The Ultimate Tab Manager & URL Exporter**
          >
          > Effortlessly manage and export links from your open tabs. Link Collector is a lightweight, privacy-focused extension designed for researchers, developers, and power users who need to grab URLs quickly.
          >
          > **Key Features:**
          > 📝 **Two Powerful Views**:
          > *   **Classic List**: Visual cards with favicons and titles for easy browsing.
          > *   **Text Mode**: A clean, editable text area with line numbers — perfect for copying to spreadsheets, documents, or scripts.
          >
          > 🔍 **Smart Filtering**:
          > *   **Search**: Instantly filter tabs by title or URL.
          > *   **Scope Control**: Choose between collecting links from the "Current Window Only" or all open windows.
          > *   **Custom Exclusion**: Filter out unwanted URLs by pattern. Includes automatic filtering of chrome:// pages.
          > *   **Active Tab Toggle**: Automatically excludes the current tab (to keep your list clean) with an option to include it if needed.
          >
          > *   **Remove Duplicates**: Collapse tabs that point to the same URL.
          >
          > 📋 **One-Click Copy in Any Format**: Copy links as plain URLs, Title + URL, Markdown, HTML, CSV or JSON (Ctrl+Enter).
          >
          > 🚀 **Open All**: Paste a list of links into Text Mode and open them all as tabs.
          >
          > 🌙 **Dark Mode** and a keyboard shortcut (Alt+Shift+L) to open the popup.
          >
          > 🔒 **Privacy First**: Link Collector runs entirely on your device. No data is ever sent to external servers.
          >
          > Simplify your workflow today with Link Collector!
        - **Category**: Select "Productivity" or "Developer Tools".
        - **Language**: English.
    - **Graphic Assets**:
        All images are in the `store-assets/` folder:
        - **Icon** (128x128): `store-icon-128x128.png`
        - **Screenshots** (1280x800), in this order: `screenshot-1-cards.png` … `screenshot-5-open-all.png`
        - **Small promo tile** (440x280): `small-promo-440x280.png`
        - **Marquee promo tile** (1400x560): `marquee-promo-1400x560.png`
    - **Privacy Practices** (paste these into the **Privacy** tab):
        - **Single purpose description**:
          > Link Collector lists the titles and URLs of the user's open tabs so they can search, filter and copy them to the clipboard in formats such as plain URLs, Markdown, HTML, CSV or JSON.
        - **Permission justification, `tabs`**:
          > Needed to read the title and URL of each open tab so they can be listed, filtered and copied; to switch to a tab when the user clicks it in the list; and to open the links the user pastes when they click "Open all". Tab data is used only inside the popup and is never stored or transmitted.
        - **Permission justification, `favicon`**:
          > Used to show each tab's site icon in the list, loaded from the browser's own favicon cache. No requests are made to the websites.
        - **Permission justification, `storage`**:
          > Used to save the user's settings (current window only, include active tab, remove duplicates, exclude patterns, view and output format) in chrome.storage.local on the device. No tab data or personal data is stored.
        - **Remote code**: select **"No, I am not using remote code."** All JavaScript is included in the package.
        - **Data usage**: leave **every** data type unchecked. The extension reads tab titles and URLs only inside the popup on the user's device and never transmits them, so nothing is "collected" under the Web Store definition.
        - **Certifications**: tick all three:
            - I do not sell or transfer user data to third parties, outside of the approved use cases.
            - I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
            - I do not use or transfer user data to determine creditworthiness or for lending purposes.
        - **Privacy policy URL**: `https://byteobsidian.github.io/Link-Collector/privacy.html` (published from `docs/privacy.html`).
5.  **Submit for Review**: Once all sections are filled (checked with a green tint), click **"Submit for Review"**.

## Updates
For future updates:
1.  Bump the version in `manifest.json`.
2.  Create a new ZIP from only the extension files listed above.
3.  Go to the item in the dashboard.
4.  Click **"Package"** > **"Upload new package"**.

## GitHub Pages and Releases
- The project site is published from `docs/` by the GitHub Actions workflow at `.github/workflows/pages.yml`.
- Download the signed Chrome package (`.crx`) from [GitHub Releases](https://github.com/ByteObsidian/Link-Collector/releases).
- Keep the local signing key (`link-collector-signing-key.pem`) private and backed up. Do not upload it; it is needed to keep the extension ID stable when packaging future CRX updates.
