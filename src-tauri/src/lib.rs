mod background;
mod brightness;
mod commands;
mod config;
mod i18n;
mod overlay;
mod scheduler;
mod tray;
mod working_hours;

use brightness::BrightnessTipState;
use working_hours::OnDutyTracker;

use std::sync::Mutex;
use std::time::Duration;

use chrono::{Datelike, Local, Timelike};
use tauri::{Emitter, Manager, WindowEvent};
use tauri_plugin_notification::NotificationExt;

use commands::BreakInfo;
use config::{config_file_path, Config};
use scheduler::SchedulerState;

pub struct AppState {
    pub config: Mutex<Config>,
    pub scheduler: Mutex<SchedulerState>,
    pub current_break: Mutex<Option<BreakInfo>>,
    /// Seconds remaining in a break fired without the fullscreen overlay
    /// (notification-only mode). While `Some`, the scheduler holds off on
    /// counting toward the *next* break, so the 20-second countdown the
    /// notification promised actually elapses before the next interval
    /// starts - see `spawn_scheduler_loop`.
    pub break_countdown_secs: Mutex<Option<u64>>,
    pub brightness_tips: BrightnessTipState,
    pub on_duty_tracker: OnDutyTracker,
    pub current_on_duty: Mutex<bool>,
    pub config_path: std::path::PathBuf,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            let app_handle = app.handle().clone();

            let app_data_dir = app_handle
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");
            let config_path = config_file_path(&app_data_dir);
            let config = Config::load(&config_path);

            // The OS-level autostart registration can drift out of sync
            // with the saved config (e.g. reinstalling over an older
            // version wipes the Windows registry entry but not the config
            // file) - re-assert it on every launch rather than only when
            // the user flips the Settings toggle.
            if let Err(err) = commands::sync_launch_at_startup(&app_handle, config.launch_at_startup) {
                eprintln!("EyeClops: failed to sync launch-at-startup registration: {err}");
            }

            app.manage(AppState {
                config: Mutex::new(config),
                scheduler: Mutex::new(SchedulerState::new()),
                current_break: Mutex::new(None),
                break_countdown_secs: Mutex::new(None),
                brightness_tips: BrightnessTipState::new(),
                on_duty_tracker: OnDutyTracker::new(),
                current_on_duty: Mutex::new(true),
                config_path,
            });

            tray::build_or_update_tray(&app_handle)?;

            // Hide-to-tray instead of quitting when the settings window is closed.
            if let Some(main_window) = app.get_webview_window("main") {
                let main_window_clone = main_window.clone();
                main_window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = main_window_clone.hide();
                    }
                });
            }

            spawn_scheduler_loop(app_handle.clone());
            spawn_brightness_tip_loop(app_handle);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::save_config,
            commands::set_active_profile,
            commands::toggle_pause_cmd,
            commands::get_paused,
            commands::get_timer_status,
            background::get_background_image,
            commands::get_active_break_info,
            commands::skip_break,
            commands::snooze_break,
            commands::set_launch_at_startup,
            commands::open_display_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Ticks once a second: advances the active profile's break timer (paused
/// while paused/off-duty - it keeps running regardless of AFK time), and
/// fires the break overlay when it elapses.
fn spawn_scheduler_loop(app_handle: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(1));
        loop {
            interval.tick().await;

            let state = app_handle.state::<AppState>();

            // A notification-only break is currently counting down: hold
            // off on the regular scheduler tick entirely so the next
            // interval doesn't start accumulating until this 20-second
            // countdown actually finishes.
            let countdown_active = {
                let mut countdown = state.break_countdown_secs.lock().unwrap();
                match *countdown {
                    Some(remaining) if remaining > 1 => {
                        *countdown = Some(remaining - 1);
                        true
                    }
                    Some(_) => {
                        *countdown = None;
                        *state.current_break.lock().unwrap() = None;
                        false
                    }
                    None => false,
                }
            };
            if countdown_active {
                continue;
            }

            let (interval_secs, working_hours) = {
                let config = state.config.lock().unwrap();
                (
                    config.active_profile().map(|p| p.interval_secs()),
                    config.working_hours.clone(),
                )
            };
            let Some(interval_secs) = interval_secs else {
                continue;
            };

            let now = Local::now();
            let weekday_index = now.weekday().num_days_from_monday() as usize;
            let on_duty = working_hours::is_on_duty(
                now.hour(),
                now.minute(),
                weekday_index,
                &working_hours,
            );
            *state.current_on_duty.lock().unwrap() = on_duty;
            working_hours::check_and_notify_transition(
                &app_handle,
                working_hours.enabled,
                on_duty,
            );

            let fired = state
                .scheduler
                .lock()
                .unwrap()
                .tick(interval_secs, on_duty);
            if !fired {
                continue;
            }

            let (break_info, overlay_enabled) = {
                let config = state.config.lock().unwrap();
                (
                    config.active_profile().map(|profile| BreakInfo {
                        break_sec: profile.break_sec,
                        message_key: profile.message_key.clone(),
                        custom_message: profile.custom_message.clone(),
                    }),
                    config.fullscreen_overlay_enabled,
                )
            };
            let Some(break_info) = break_info else {
                continue;
            };

            // Either way, hold off on counting toward the *next* break
            // until this one's break_sec has actually elapsed - whether
            // that's the overlay's visible countdown or the notification's
            // implied one. See the countdown_active block above.
            *state.current_break.lock().unwrap() = Some(break_info.clone());
            *state.break_countdown_secs.lock().unwrap() = Some(break_info.break_sec as u64);

            if overlay_enabled {
                overlay::show_break_overlays(&app_handle);
                let _ = app_handle.emit("break:show", break_info);
            } else {
                notify_break_without_overlay(&app_handle, &break_info);
            }
        }
    });
}

/// When the fullscreen overlay is disabled, a break still "happens" - the
/// user just gets an OS notification instead of a blocking full-screen
/// window, and the 20-second break isn't otherwise tracked or enforced
/// (nothing in the app blocks the user during it either way).
fn notify_break_without_overlay(app_handle: &tauri::AppHandle, break_info: &BreakInfo) {
    let language = app_handle
        .state::<AppState>()
        .config
        .lock()
        .unwrap()
        .language
        .clone();
    let body = break_info
        .custom_message
        .clone()
        .unwrap_or_else(|| i18n::break_default_message(&language).to_string());
    let _ = app_handle
        .notification()
        .builder()
        .title("EyeClops")
        .body(body)
        .show();
}

/// Ticks once a minute: checks whether it's time for a brightness/color-temp
/// tip notification.
fn spawn_brightness_tip_loop(app_handle: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(60));
        loop {
            interval.tick().await;
            brightness::check_and_notify(&app_handle);
        }
    });
}
