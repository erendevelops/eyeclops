//! Tauri commands exposed to the frontend, plus a few plain functions
//! shared with the tray menu handler so both call the same logic.

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

use crate::config::Config;
use crate::overlay;
use crate::tray;
use crate::AppState;

/// Snapshot of the break currently in progress, read by the overlay
/// window(s) once they mount (avoids racing a Tauri event against window
/// creation).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BreakInfo {
    pub break_sec: u32,
    pub message_key: String,
    pub custom_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimerStatus {
    pub elapsed_secs: u64,
    pub interval_secs: u64,
    pub paused: bool,
    pub on_duty: bool,
    /// Seconds left in an active notification-only break countdown, or
    /// `None` when no such break is in progress. See
    /// `AppState::break_countdown_secs`.
    pub break_remaining_secs: Option<u64>,
}

#[tauri::command]
pub fn get_timer_status(app: AppHandle) -> TimerStatus {
    let state = app.state::<AppState>();
    let interval_secs = state
        .config
        .lock()
        .unwrap()
        .active_profile()
        .map(|p| p.interval_secs())
        .unwrap_or(20 * 60);
    let scheduler = state.scheduler.lock().unwrap();
    let on_duty = *state.current_on_duty.lock().unwrap();
    let break_remaining_secs = *state.break_countdown_secs.lock().unwrap();
    TimerStatus {
        elapsed_secs: scheduler.elapsed_secs,
        interval_secs,
        paused: scheduler.paused,
        on_duty,
        break_remaining_secs,
    }
}

#[tauri::command]
pub fn get_config(app: AppHandle) -> Config {
    app.state::<AppState>().config.lock().unwrap().clone()
}

#[tauri::command]
pub fn save_config(app: AppHandle, config: Config) -> Result<(), String> {
    let state = app.state::<AppState>();
    {
        let mut guard = state.config.lock().unwrap();
        *guard = config;
        guard.save(&state.config_path).map_err(|e| e.to_string())?;
    }
    let _ = tray::build_or_update_tray(&app);
    Ok(())
}

#[tauri::command]
pub fn set_active_profile(app: AppHandle, profile_id: String) {
    set_active_profile_by_id(&app, &profile_id);
}

pub fn set_active_profile_by_id(app: &AppHandle, profile_id: &str) {
    let state = app.state::<AppState>();
    {
        let mut config = state.config.lock().unwrap();
        if config.profiles.iter().any(|p| p.id == profile_id) {
            config.active_profile_id = profile_id.to_string();
            let _ = config.save(&state.config_path);
        }
    }
    state.scheduler.lock().unwrap().reset();
    let _ = tray::build_or_update_tray(app);
}

#[tauri::command]
pub fn toggle_pause_cmd(app: AppHandle) -> bool {
    toggle_pause(&app)
}

#[tauri::command]
pub fn get_paused(app: AppHandle) -> bool {
    app.state::<AppState>().scheduler.lock().unwrap().paused
}

pub fn toggle_pause(app: &AppHandle) -> bool {
    let state = app.state::<AppState>();
    let paused = {
        let mut scheduler = state.scheduler.lock().unwrap();
        scheduler.paused = !scheduler.paused;
        scheduler.paused
    };
    let _ = tray::build_or_update_tray(app);
    paused
}

pub fn pause_resume_label(app: &AppHandle) -> &'static str {
    let state = app.state::<AppState>();
    if state.scheduler.lock().unwrap().paused {
        "Resume"
    } else {
        "Pause"
    }
}

pub fn status_label(app: &AppHandle) -> String {
    let state = app.state::<AppState>();
    if state.scheduler.lock().unwrap().paused {
        return "EyeClops - Paused".to_string();
    }
    if !*state.current_on_duty.lock().unwrap() {
        return "EyeClops - Off duty".to_string();
    }
    "EyeClops - Running".to_string()
}

#[tauri::command]
pub fn get_active_break_info(app: AppHandle) -> Option<BreakInfo> {
    app.state::<AppState>().current_break.lock().unwrap().clone()
}

#[tauri::command]
pub fn skip_break(app: AppHandle) {
    let state = app.state::<AppState>();
    *state.current_break.lock().unwrap() = None;
    *state.break_countdown_secs.lock().unwrap() = None;
    overlay::close_break_overlays(&app);
}

#[tauri::command]
pub fn snooze_break(app: AppHandle) {
    let state = app.state::<AppState>();
    let interval = state
        .config
        .lock()
        .unwrap()
        .active_profile()
        .map(|p| p.interval_secs())
        .unwrap_or(20 * 60);
    state.scheduler.lock().unwrap().snooze(interval, 5 * 60);
    *state.current_break.lock().unwrap() = None;
    *state.break_countdown_secs.lock().unwrap() = None;
    overlay::close_break_overlays(&app);
}

#[tauri::command]
pub fn set_launch_at_startup(app: AppHandle, enabled: bool) -> Result<(), String> {
    sync_launch_at_startup(&app, enabled).map_err(|e| e.to_string())?;

    let state = app.state::<AppState>();
    let mut config = state.config.lock().unwrap();
    config.launch_at_startup = enabled;
    config.save(&state.config_path).map_err(|e| e.to_string())
}

/// Asks the OS to (de)register EyeClops as a startup app, matching
/// `enabled`. Exposed separately from the command so `main()` can also
/// call it on every launch - the OS-level registration can drift out of
/// sync with `config.launch_at_startup` (e.g. reinstalling over an old
/// version wipes the registry entry but not the config file), so we
/// re-assert it each time instead of only acting when the user flips the
/// Settings toggle.
pub fn sync_launch_at_startup(
    app: &AppHandle,
    enabled: bool,
) -> Result<(), tauri_plugin_autostart::Error> {
    use tauri_plugin_autostart::ManagerExt;
    let autostart = app.autolaunch();
    if enabled {
        autostart.enable()
    } else {
        autostart.disable()
    }
}

/// Deep-link into the OS's native display/night-light settings, where
/// available. No-op (returns Ok) on platforms without a known deep link.
#[tauri::command]
pub fn open_display_settings(app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    let uri = "ms-settings:nightlight";
    #[cfg(target_os = "macos")]
    let uri = "x-apple.systempreferences:com.apple.preference.displays";
    #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
    let uri = "";

    if uri.is_empty() {
        return Ok(());
    }
    use tauri_plugin_opener::OpenerExt;
    app.opener()
        .open_url(uri, None::<&str>)
        .map_err(|e| e.to_string())
}

pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    } else {
        let _ = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
            .title("EyeClops")
            .inner_size(400.0, 720.0)
            .decorations(false)
            .build();
    }
}
