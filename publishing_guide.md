# Publishing Guide for Link Collector

Follow these steps to upload your extension to the Chrome Web Store.

## Prerequisites
- A Google Account.
- A Developer Account on the Chrome Web Store (requires a one-time $5 fee).
- The extension ZIP. Pushing a version tag (for example `v1.5`) builds it and attaches it to the GitHub release; download it from there.
- Promotional images in the local `store-assets/` folder (kept out of the repository). Regenerate them with `python tools/store-assets/build.py`.

## Steps

1.  **Go to the Dashboard**: Visit the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2.  **Create New Item**: Click the **"New Item"** button.
3.  **Upload Zip**: Drag and drop your locally created extension ZIP or click to browse and select it. If you build it by hand, include `manifest.json`, `popup.html`, `popup.js`, `style.css`, `background.js`, `offscreen.html`, `offscreen.js`, the `lib/` folder, and the `icons/` folder (`icon16.png`, `icon48.png`, `icon128.png`). Do not include the `store-assets/` folder or publishing documentation in the extension package.
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
          > *   **Wildcard Excludes**: Patterns like `*.google.com/*` hide whole sites.
          > *   **Remove Duplicates**: Hide repeated URLs, or close duplicate tabs in one click.
          > *   **Sort & Group**: By tab order, window, title or site.
          >
          > 📋 **Copy or Download in Any Format**: Plain URLs, Title + URL, Markdown, HTML, CSV or JSON (Ctrl+Enter to copy). Tick cards to copy only the tabs you pick.
          >
          > ⚡ **Copy Without Opening the Popup**: Press Alt+Shift+C or right-click the toolbar icon.
          >
          > 🚀 **Open All**: Paste a list of links into Text Mode and open them as tabs, skipping ones already open.
          >
          > 🌙 **Dark Mode**, full keyboard access, and Alt+Shift+L to open the popup.
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
          > Needed to read the title and URL of each open tab so they can be listed, filtered and copied; to switch to a tab when the user clicks it in the list; to open the links the user pastes when they click "Open all"; and to close duplicate tabs when the user clicks "Close duplicates". Tab data is used only on the device and is never stored or transmitted.
        - **Permission justification, `favicon`**:
          > Used to show each tab's site icon in the list, loaded from the browser's own favicon cache. No requests are made to the websites.
        - **Permission justification, `storage`**:
          > Used to save the user's settings (current window only, include active tab, remove duplicates, exclude patterns, view, sort order and output format) in chrome.storage.local on the device. No tab data or personal data is stored.
        - **Permission justification, `contextMenus`**:
          > Adds a "Copy tab links" item to the toolbar icon's right-click menu so users can copy their tab links without opening the popup.
        - **Permission justification, `offscreen`**:
          > Service workers cannot access the clipboard, so an offscreen document with the CLIPBOARD reason writes the links to the clipboard when the user presses the copy shortcut or uses the menu item.
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
1.  Bump the version in `manifest.json` and commit.
2.  Tag and push: `git tag v1.5 && git push origin v1.5`. The release workflow builds `link-collector-v1.5.zip` and attaches it to the GitHub release (it fails if the tag and manifest version differ).
3.  Download the zip from the release, go to the item in the dashboard, and click **"Package"** > **"Upload new package"**.
4.  If permissions changed, update the justifications on the **Privacy** tab before submitting.

## Microsoft Edge Add-ons
The same zip works in Edge without changes.
1.  Register at the [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview) (free).
2.  Click **Create new extension** and upload the zip.
3.  Reuse the Chrome listing text, the images in `store-assets/`, and the privacy policy URL. Edge asks for the same permission justifications.
4.  Submit for certification; review usually takes a few business days.

## GitHub Pages and Releases
- The project site is published from `docs/` by the GitHub Actions workflow at `.github/workflows/pages.yml`.
- Download the signed Chrome package (`.crx`) from [GitHub Releases](https://github.com/ByteObsidian/Link-Collector/releases).
- Keep the local signing key (`link-collector-signing-key.pem`) private and backed up. Do not upload it; it is needed to keep the extension ID stable when packaging future CRX updates.
