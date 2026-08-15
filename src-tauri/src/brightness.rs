//! Time-of-day brightness/color-temp tip notifications: once a day, at a
//! configured time, suggest enabling Night Light / Night Shift.
//!
//! No direct display/hardware control here (too OS- and monitor-dependent)
//! — just a nudge, plus a deep link to the OS's native settings
//! (`open_display_settings` command).

use std::collections::HashSet;
use std::sync::Mutex;

use chrono::{Local, NaiveDate, Timelike};
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::AppState;

/// Fallback time for the "sunset" schedule value — a fixed evening hour
/// rather than a real sunset calculation (no geolocation in v1).
/// Contributions adding a real sunset calculation are welcome.
const DEFAULT_EVENING_HOUR: u32 = 20;

pub struct BrightnessTipState {
    notified_today: Mutex<HashSet<(NaiveDate, String)>>,
}

impl BrightnessTipState {
    pub fn new() -> Self {
        Self {
            notified_today: Mutex::new(HashSet::new()),
        }
    }
}

impl Default for BrightnessTipState {
    fn default() -> Self {
        Self::new()
    }
}

/// Parse a schedule string ("sunset" or a comma-separated "HH:MM" list)
/// into (hour, minute, label) triples, the label used to de-duplicate
/// notifications for the day.
fn scheduled_times(schedule: &str) -> Vec<(u32, u32, String)> {
    if schedule.trim() == "sunset" {
        return vec![(DEFAULT_EVENING_HOUR, 0, "sunset".to_string())];
    }
    schedule
        .split(',')
        .filter_map(|part| {
            let part = part.trim();
            let (h, m) = part.split_once(':')?;
            let hour: u32 = h.parse().ok()?;
            let minute: u32 = m.parse().ok()?;
            Some((hour, minute, part.to_string()))
        })
        .collect()
}

/// Called roughly once a minute; fires at most one notification per
/// scheduled time per day.
pub fn check_and_notify(app: &AppHandle) {
    let state = app.state::<AppState>();
    let config = state.config.lock().unwrap().clone();
    if !config.brightness_tips.enabled {
        return;
    }

    let now = Local::now();
    let today = now.date_naive();
    let current = (now.hour(), now.minute());

    for (hour, minute, label) in scheduled_times(&config.brightness_tips.schedule) {
        if (hour, minute) != current {
            continue;
        }

        let key = (today, label);
        let should_notify = {
            let mut notified = state.brightness_tips.notified_today.lock().unwrap();
            notified.insert(key)
        };
        if !should_notify {
            continue;
        }

        let _ = app
            .notification()
            .builder()
            .title("EyeClops")
            .body("It's evening - consider enabling Night Light / a blue-light filter.")
            .show();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sunset_schedule_resolves_to_default_evening_hour() {
        let times = scheduled_times("sunset");
        assert_eq!(times, vec![(DEFAULT_EVENING_HOUR, 0, "sunset".to_string())]);
    }

    #[test]
    fn parses_comma_separated_fixed_times() {
        let times = scheduled_times("07:30, 21:00");
        assert_eq!(
            times,
            vec![(7, 30, "07:30".to_string()), (21, 0, "21:00".to_string())]
        );
    }

    #[test]
    fn ignores_malformed_entries() {
        let times = scheduled_times("not-a-time, 09:15");
        assert_eq!(times, vec![(9, 15, "09:15".to_string())]);
    }
}
