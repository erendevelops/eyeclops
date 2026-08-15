//! Local JSON configuration: break schedule profiles, active profile,
//! launch-at-startup, brightness-tip settings and language. No database,
//! no cloud — everything lives in a single file in the OS app-data dir.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub interval_min: u32,
    pub break_sec: u32,
    /// i18n key for the built-in break message, e.g. "break.default".
    /// User-authored profiles may instead set `custom_message`.
    pub message_key: String,
    #[serde(default)]
    pub custom_message: Option<String>,
}

impl Profile {
    pub fn interval_secs(&self) -> u64 {
        self.interval_min as u64 * 60
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BrightnessTips {
    pub enabled: bool,
    /// "sunset" or a comma-separated list of "HH:MM" times.
    pub schedule: String,
}

impl Default for BrightnessTips {
    fn default() -> Self {
        Self {
            enabled: true,
            schedule: "sunset".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WorkingHours {
    pub enabled: bool,
    /// "HH:MM", 24h.
    pub start_time: String,
    /// "HH:MM", 24h.
    pub end_time: String,
    /// Monday first, Sunday last: [Mon, Tue, Wed, Thu, Fri, Sat, Sun].
    pub days: [bool; 7],
}

impl Default for WorkingHours {
    fn default() -> Self {
        Self {
            enabled: false,
            start_time: "09:00".into(),
            end_time: "18:00".into(),
            days: [true, true, true, true, true, false, false],
        }
    }
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub profiles: Vec<Profile>,
    pub active_profile_id: String,
    pub launch_at_startup: bool,
    pub brightness_tips: BrightnessTips,
    #[serde(default)]
    pub working_hours: WorkingHours,
    /// When true (the default), a break fires a fullscreen overlay. When
    /// false, it fires an OS notification instead and no overlay opens.
    #[serde(default = "default_true")]
    pub fullscreen_overlay_enabled: bool,
    /// "en" or "tr"
    pub language: String,
}

pub const DEFAULT_PROFILE_ID: &str = "default";

impl Default for Config {
    fn default() -> Self {
        let default_profile = Profile {
            id: DEFAULT_PROFILE_ID.into(),
            name: "Work".into(),
            interval_min: 20,
            break_sec: 20,
            message_key: "break.default".into(),
            custom_message: None,
        };
        Self {
            active_profile_id: default_profile.id.clone(),
            profiles: vec![default_profile],
            launch_at_startup: false,
            brightness_tips: BrightnessTips::default(),
            working_hours: WorkingHours::default(),
            fullscreen_overlay_enabled: true,
            language: "en".into(),
        }
    }
}

impl Config {
    pub fn load(path: &Path) -> Self {
        match fs::read_to_string(path) {
            Ok(contents) => serde_json::from_str(&contents).unwrap_or_default(),
            Err(_) => Self::default(),
        }
    }

    pub fn save(&self, path: &Path) -> std::io::Result<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_string_pretty(self)?;
        fs::write(path, json)
    }

    pub fn active_profile(&self) -> Option<&Profile> {
        self.profiles.iter().find(|p| p.id == self.active_profile_id)
    }
}

pub fn config_file_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("config.json")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_has_one_active_profile() {
        let config = Config::default();
        assert_eq!(config.profiles.len(), 1);
        assert!(config.active_profile().is_some());
        assert_eq!(config.active_profile().unwrap().interval_min, 20);
    }

    #[test]
    fn round_trips_through_json() {
        let config = Config::default();
        let json = serde_json::to_string(&config).unwrap();
        let parsed: Config = serde_json::from_str(&json).unwrap();
        assert_eq!(config, parsed);
    }

    #[test]
    fn load_falls_back_to_default_on_missing_file() {
        let path = std::env::temp_dir().join("eyeclops-test-nonexistent-config.json");
        let _ = fs::remove_file(&path);
        let config = Config::load(&path);
        assert_eq!(config, Config::default());
    }

    #[test]
    fn save_then_load_round_trips() {
        let path = std::env::temp_dir().join("eyeclops-test-config-roundtrip.json");
        let mut config = Config::default();
        config.language = "tr".into();
        config.save(&path).unwrap();
        let loaded = Config::load(&path);
        assert_eq!(loaded.language, "tr");
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn working_hours_default_is_disabled_mon_to_fri() {
        let wh = WorkingHours::default();
        assert!(!wh.enabled);
        assert_eq!(wh.start_time, "09:00");
        assert_eq!(wh.end_time, "18:00");
        assert_eq!(wh.days, [true, true, true, true, true, false, false]);
    }

    #[test]
    fn config_default_includes_working_hours() {
        let config = Config::default();
        assert!(!config.working_hours.enabled);
    }

    #[test]
    fn old_config_json_without_working_hours_still_loads() {
        let path = std::env::temp_dir().join("eyeclops-test-legacy-config.json");
        let legacy_json = r#"{
            "profiles": [{"id":"default","name":"Work","intervalMin":20,"breakSec":20,"messageKey":"break.default","customMessage":null}],
            "activeProfileId": "default",
            "launchAtStartup": false,
            "brightnessTips": {"enabled": true, "schedule": "sunset"},
            "language": "en"
        }"#;
        fs::write(&path, legacy_json).unwrap();
        let config = Config::load(&path);
        assert!(!config.working_hours.enabled);
        assert_eq!(config.working_hours.start_time, "09:00");
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn fullscreen_overlay_defaults_to_enabled() {
        let config = Config::default();
        assert!(config.fullscreen_overlay_enabled);
    }

    #[test]
    fn old_config_json_without_overlay_flag_still_loads_with_overlay_enabled() {
        let path = std::env::temp_dir().join("eyeclops-test-legacy-config-no-overlay-flag.json");
        let legacy_json = r#"{
            "profiles": [{"id":"default","name":"Work","intervalMin":20,"breakSec":20,"messageKey":"break.default","customMessage":null}],
            "activeProfileId": "default",
            "launchAtStartup": false,
            "brightnessTips": {"enabled": true, "schedule": "sunset"},
            "workingHours": {"enabled": false, "startTime": "09:00", "endTime": "18:00", "days": [true,true,true,true,true,false,false]},
            "language": "en"
        }"#;
        fs::write(&path, legacy_json).unwrap();
        let config = Config::load(&path);
        assert!(config.fullscreen_overlay_enabled);
        let _ = fs::remove_file(&path);
    }
}
