//! Working-hours gating: whether EyeClops should currently be "on duty"
//! (breaks allowed to fire), based on a daily time window and enabled
//! weekdays — plus one-shot transition notifications when duty status
//! changes.

use crate::config::WorkingHours;

/// `weekday_index`: 0 = Monday .. 6 = Sunday, matching `WorkingHours.days`.
pub fn is_on_duty(hour: u32, minute: u32, weekday_index: usize, wh: &WorkingHours) -> bool {
    if !wh.enabled {
        return true;
    }
    if weekday_index >= 7 || !wh.days[weekday_index] {
        return false;
    }
    let (Some(start), Some(end)) = (parse_hhmm(&wh.start_time), parse_hhmm(&wh.end_time)) else {
        return true;
    };
    let current = (hour, minute);
    if start <= end {
        current >= start && current < end
    } else {
        // Overnight window, e.g. 22:00-06:00.
        current >= start || current < end
    }
}

fn parse_hhmm(s: &str) -> Option<(u32, u32)> {
    let (h, m) = s.trim().split_once(':')?;
    Some((h.parse().ok()?, m.parse().ok()?))
}

use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

/// Tracks the last known on-duty state so we can notify exactly once per
/// transition instead of on every tick.
pub struct OnDutyTracker {
    last_on_duty: Mutex<Option<bool>>,
}

impl OnDutyTracker {
    pub fn new() -> Self {
        Self {
            last_on_duty: Mutex::new(None),
        }
    }
}

impl Default for OnDutyTracker {
    fn default() -> Self {
        Self::new()
    }
}

/// Compares `on_duty` against the previously recorded state; fires an OS
/// notification (and rebuilds the tray, to refresh its tooltip) exactly
/// once when it changes, but never on the very first call (startup isn't
/// a "transition"). No-op when working hours are disabled.
pub fn check_and_notify_transition(app: &AppHandle, working_hours_enabled: bool, on_duty: bool) {
    let state = app.state::<crate::AppState>();
    let should_notify = {
        let mut last = state.on_duty_tracker.last_on_duty.lock().unwrap();
        let changed = matches!(*last, Some(prev) if prev != on_duty);
        *last = Some(on_duty);
        changed && working_hours_enabled
    };

    if !should_notify {
        return;
    }

    let body = if on_duty {
        "Back on duty."
    } else {
        "EyeClops is now off duty."
    };
    let _ = app
        .notification()
        .builder()
        .title("EyeClops")
        .body(body)
        .show();
    let _ = crate::tray::build_or_update_tray(app);
}

#[cfg(test)]
mod tests {
    use super::*;

    fn wh(enabled: bool, start: &str, end: &str, days: [bool; 7]) -> WorkingHours {
        WorkingHours {
            enabled,
            start_time: start.into(),
            end_time: end.into(),
            days,
        }
    }

    const ALL_DAYS: [bool; 7] = [true; 7];

    #[test]
    fn disabled_working_hours_is_always_on_duty() {
        let w = wh(false, "09:00", "18:00", [false; 7]);
        assert!(is_on_duty(3, 0, 0, &w));
    }

    #[test]
    fn inside_window_on_enabled_day_is_on_duty() {
        let w = wh(true, "09:00", "18:00", ALL_DAYS);
        assert!(is_on_duty(12, 0, 0, &w));
    }

    #[test]
    fn outside_window_on_enabled_day_is_off_duty() {
        let w = wh(true, "09:00", "18:00", ALL_DAYS);
        assert!(!is_on_duty(20, 0, 0, &w));
        assert!(!is_on_duty(8, 59, 0, &w));
    }

    #[test]
    fn disabled_day_is_off_duty_even_inside_window() {
        let mut days = ALL_DAYS;
        days[5] = false; // Saturday
        let w = wh(true, "09:00", "18:00", days);
        assert!(!is_on_duty(12, 0, 5, &w));
    }

    #[test]
    fn overnight_window_wraps_past_midnight() {
        let w = wh(true, "22:00", "06:00", ALL_DAYS);
        assert!(is_on_duty(23, 30, 0, &w));
        assert!(is_on_duty(2, 0, 0, &w));
        assert!(!is_on_duty(12, 0, 0, &w));
    }

    #[test]
    fn end_boundary_is_exclusive() {
        let w = wh(true, "09:00", "18:00", ALL_DAYS);
        assert!(is_on_duty(17, 59, 0, &w));
        assert!(!is_on_duty(18, 0, 0, &w));
    }
}
