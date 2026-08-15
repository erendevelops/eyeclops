# EyeClops

*(Türkçe için [README.tr.md](README.tr.md))*

A free, cross-platform desktop app for eye care, built around the **20-20-20 rule**:
every 20 minutes, look at something at least 6 meters away for 20 seconds.

EyeClops runs quietly in your system tray, reminds you to take eye breaks on
a schedule you control, and nudges you about screen brightness / color
temperature at the right times of day — all without collecting any data or
requiring an account.

## Features

- **20-20-20 break reminders** — a full-screen break overlay with a
  countdown and a Skip button. Can be switched off in Settings in favor of
  a plain OS notification instead, if you'd rather not have your screen
  taken over.
- **Custom break schedules** — define your own interval/duration profiles
  (e.g. "Work," "Gaming") on the Profiles page and switch between them
  from the tray.
- **Working hours** — optionally restrict breaks to a daily time window
  and specific weekdays; get a quiet notification when EyeClops goes
  on/off duty.
- **Brightness / color-temp tips** — time-of-day suggestions to enable
  your OS's Night Light / Night Shift.
- **Circular countdown timer** — the Home screen shows time remaining
  until your next break at a glance.
- **Custom background art** — optionally drop your own artwork in as the
  Home screen and break-overlay background (see below).
- **Tray-first** — lives in the system tray; clicking it opens straight to
  the Home screen. Optional launch-at-startup.
- **Private by default** — all settings stored locally in a JSON file; no
  accounts, no cloud, no telemetry.
- **English & Türkçe** — full UI localization, metric units only.

## Custom background images

EyeClops can show your own artwork behind the Home screen and the break
overlay. There's no in-app picker — just drop image files into the app's
local data folder and they're picked up automatically (no file present
means the normal dark theme, no error):

| Screen | Filename | Orientation |
|---|---|---|
| Home | `home-background.png` / `.jpg` / `.jpeg` / `.webp` | Portrait (the main window is portrait) |
| Break overlay | `overlay-background.png` / `.jpg` / `.jpeg` / `.webp` | Landscape (covers the full monitor) |

Folder location:

- Windows: `%APPDATA%\com.eyeclops.app\backgrounds\`
- macOS: `~/Library/Application Support/com.eyeclops.app/backgrounds/`
- Linux: `~/.local/share/com.eyeclops.app/backgrounds/`

## Tech stack

- [Tauri v2](https://tauri.app/) (Rust backend)
- React + TypeScript frontend
- Tailwind CSS v4
- `react-i18next` for localization

## Development

Prerequisites: [Node.js](https://nodejs.org/), [Rust](https://www.rust-lang.org/tools/install),
and the platform-specific Tauri prerequisites at
<https://tauri.app/start/prerequisites/>.

```bash
npm install
npm run tauri dev
```

Run tests:

```bash
npm test              # frontend (Vitest)
cd src-tauri && cargo test   # backend (Rust)
```

To produce a production build/installer:

```bash
npm run tauri build
```

## Recommended IDE setup

- [VS Code](https://code.visualstudio.com/) + [Tauri extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

EyeClops is **source-available**, not OSI-approved "open source." It's
licensed under the [PolyForm Shield License 1.0.0](LICENSE): you're welcome
to read, run, modify it for your own use, and contribute changes back via
pull request — but you may not publish your own modified copies or use the
code to build a competing product. See [LICENSE](LICENSE) for the full
terms, and [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute.
