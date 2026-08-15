# Contributing to EyeClops

Thanks for your interest in EyeClops! Contributions via pull request are
welcome.

## Before you start

EyeClops is licensed under the [PolyForm Shield License 1.0.0](LICENSE),
not a standard OSI open-source license. In short:

- You're free to read, run, and modify the code for your own use, and to
  submit changes back to this repository.
- You may **not** publish or distribute your own modified copies of
  EyeClops, or use the code to build a competing product, without the
  maintainers' permission.
- By submitting a pull request, you agree that your contribution is
  licensed under the same terms and may be incorporated into the project.

If you want to do something with the code that isn't covered by the
license above (e.g. redistribute a fork), open an issue to discuss it
first.

## Getting set up

Prerequisites: [Node.js](https://nodejs.org/), [Rust](https://www.rust-lang.org/tools/install),
and the platform-specific Tauri prerequisites at
<https://tauri.app/start/prerequisites/>.

```bash
npm install
npm run tauri dev
```

## Coding conventions

- **Rust** (`src-tauri/`): run `cargo fmt` and `cargo clippy` before
  submitting. Keep modules focused (scheduler, tray, config, autostart,
  overlay windows are separate concerns).
- **TypeScript/React** (`src/`): components should be small and typed;
  avoid `any`. All user-facing strings go through `react-i18next` — no
  hardcoded English text in components, and no imperial units (metric
  only, e.g. meters, not feet).
- Run tests before submitting: `cargo test` (Rust) and `npm run test`
  (Vitest).

## Pull requests

1. Fork or branch, make focused changes with a clear description of the
   problem/feature.
2. Add or update tests where it makes sense.
3. Make sure `cargo test`, `npm run test`, and `npm run tauri build` all
   pass locally.
4. Open a PR describing what changed and why.

## Reporting bugs / suggesting features

Open a GitHub issue with steps to reproduce (for bugs) or a clear
description of the use case (for feature requests).
