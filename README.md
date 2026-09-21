# TickTick for Obsidian

Embeds the [TickTick](https://ticktick.com/) web app inside Obsidian, in a tab or in the right sidebar, so you have one less app to keep open.

It is a thin wrapper around a webview of `https://ticktick.com/webapp/`. It does not read, write or sync TickTick data, and it does not touch your notes or the TickTick API.

**How it differs from other TickTick plugins:** those talk to the TickTick API to sync tasks into your notes. This one does none of that. It shows the full TickTick web app in a panel, so you get TickTick's own interface and every feature it has, with no API tokens or setup.

**Desktop only.** The plugin uses Electron's `<webview>` tag, which does not exist on Obsidian mobile.

## Usage

- Click the checklist icon in the left ribbon, or run **Open TickTick** from the command palette, to open TickTick in a new tab.
- Run **Open TickTick in right sidebar** to dock it in the right sidebar.
- Opening it again reveals the existing view instead of creating a second one.
- You can drag the tab between the main area and the sidebars.

## Login

You log in once, inside the view, using TickTick's normal login page. The session is kept across restarts. The plugin stores no credentials.

Open **Settings → Community plugins → TickTick Panel** (gear icon) for **Account management**. It shows whether you are logged in. **Login** opens TickTick's sign-in page in a new tab; **Logout** clears the TickTick session and reloads any open TickTick view.

## Network use, privacy and disclosures

- The plugin loads `https://ticktick.com/webapp/` (and `https://ticktick.com/signin` when you click **Login**) in a webview. That is its whole purpose; without it there is nothing to show.
- You need a TickTick account. Some TickTick features may require a paid TickTick plan.
- **No data is collected by the plugin author, and there is no telemetry or analytics.** The plugin makes no network requests of its own and has no server. It does not read your notes or vault.
- **No credentials are stored by the plugin.** Your login lives in the webview's own browser session (`persist:ticktick`), handled by TickTick. The plugin only checks locally whether a TickTick login cookie exists (to show the Login/Logout button), and **Logout** clears that session.
- Everything you do inside the view is subject to [TickTick's own terms and privacy policy](https://ticktick.com/).
- This is an unofficial plugin and is not affiliated with or endorsed by TickTick.

## Build and install manually

```sh
npm install
npm run build
```

Copy `main.js`, `manifest.json` and `styles.css` into `<vault>/.obsidian/plugins/ticktick-panel/`, then enable **TickTick Panel** under Settings → Community plugins.

## License

[MIT](LICENSE)
