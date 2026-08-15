//! Break overlay windows: one frameless, always-on-top, borderless window
//! per connected monitor, shown when a break fires and closed on
//! countdown-end / Skip.

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

const OVERLAY_LABEL_PREFIX: &str = "overlay-";

/// Spawn one overlay window per connected monitor, each covering that
/// monitor's full bounds. Uses the existing "main" (settings) window just
/// to query the monitor list.
pub fn show_break_overlays(app: &AppHandle) {
    close_break_overlays(app);

    let Some(main_window) = app.get_webview_window("main") else {
        return;
    };
    let monitors = main_window.available_monitors().unwrap_or_default();
    let monitors = if monitors.is_empty() {
        main_window
            .current_monitor()
            .ok()
            .flatten()
            .into_iter()
            .collect()
    } else {
        monitors
    };

    for (idx, monitor) in monitors.iter().enumerate() {
        let label = format!("{OVERLAY_LABEL_PREFIX}{idx}");
        let position = monitor.position();
        let size = monitor.size();

        let builder = WebviewWindowBuilder::new(
            app,
            label,
            WebviewUrl::App("index.html#/overlay".into()),
        )
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .fullscreen(false)
        .visible(true)
        .focused(idx == 0)
        .inner_size(size.width as f64, size.height as f64)
        .position(position.x as f64, position.y as f64);

        if let Err(err) = builder.build() {
            eprintln!("EyeClops: failed to open break overlay window: {err}");
        }
    }
}

/// Close every open overlay window (called on countdown end, Skip, or
/// before opening a fresh set of overlays).
pub fn close_break_overlays(app: &AppHandle) {
    for (label, window) in app.webview_windows() {
        if label.starts_with(OVERLAY_LABEL_PREFIX) {
            let _ = window.close();
        }
    }
}
