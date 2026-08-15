//! System tray icon and menu: Open Settings, Pause/Resume, Switch Profile,
//! Quit. The menu is rebuilt whenever config/pause-state changes so labels
//! and the profile list stay current.

use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, Wry,
};

use crate::commands::{pause_resume_label, set_active_profile_by_id, status_label};
use crate::AppState;

const TRAY_ID: &str = "main";
// Use the pre-resized 32x32 icon (properly downscaled by `tauri icon` at
// build time) rather than the raw ~600x600 source — embedding the huge
// source directly and letting the OS scale it down produced a garbled
// tray icon on Windows.
const TRAY_ICON_BYTES: &[u8] = include_bytes!("../icons/32x32.png");

fn tray_icon() -> tauri::Result<Image<'static>> {
    Image::from_bytes(TRAY_ICON_BYTES)
}

pub fn build_or_update_tray(app: &AppHandle) -> tauri::Result<()> {
    let menu = build_menu(app)?;
    let tooltip = status_label(app);

    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        tray.set_menu(Some(menu))?;
        let _ = tray.set_tooltip(Some(tooltip));
    } else {
        TrayIconBuilder::with_id(TRAY_ID)
            .menu(&menu)
            .show_menu_on_left_click(false)
            .tooltip(tooltip)
            .icon(tray_icon()?)
            .on_menu_event(on_menu_event)
            .on_tray_icon_event(on_tray_icon_event)
            .build(app)?;
    }
    Ok(())
}

fn build_menu(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let state = app.state::<AppState>();
    let config = state.config.lock().unwrap().clone();

    let open_settings =
        MenuItem::with_id(app, "open_settings", "Open Settings", true, None::<&str>)?;

    let pause_resume = MenuItem::with_id(
        app,
        "pause_resume",
        pause_resume_label(app),
        true,
        None::<&str>,
    )?;

    let profile_items: Vec<MenuItem<Wry>> = config
        .profiles
        .iter()
        .map(|profile| {
            let checked_marker = if profile.id == config.active_profile_id {
                "● "
            } else {
                "  "
            };
            MenuItem::with_id(
                app,
                format!("profile:{}", profile.id),
                format!("{checked_marker}{}", profile.name),
                true,
                None::<&str>,
            )
        })
        .collect::<tauri::Result<_>>()?;
    let profile_refs: Vec<&dyn tauri::menu::IsMenuItem<Wry>> = profile_items
        .iter()
        .map(|item| item as &dyn tauri::menu::IsMenuItem<Wry>)
        .collect();
    let switch_profile = Submenu::with_items(app, "Switch Profile", true, &profile_refs)?;

    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    Menu::with_items(
        app,
        &[
            &open_settings,
            &pause_resume,
            &switch_profile,
            &separator,
            &quit,
        ],
    )
}

/// Left-click on the tray icon opens the Home window (matching the usual
/// tray-app convention); right-click still shows the context menu, handled
/// natively by the OS since `show_menu_on_left_click` is false.
fn on_tray_icon_event(tray: &tauri::tray::TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
    } = event
    {
        crate::commands::show_main_window(tray.app_handle());
    }
}

fn on_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    let id = event.id().as_ref();
    if id == "open_settings" {
        crate::commands::show_main_window(app);
    } else if id == "pause_resume" {
        crate::commands::toggle_pause(app);
    } else if id == "quit" {
        app.exit(0);
    } else if let Some(profile_id) = id.strip_prefix("profile:") {
        set_active_profile_by_id(app, profile_id);
    }
}
