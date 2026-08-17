//! Background images for the Home timer screen and the break overlay.
//! Every install ships with a default image for each, embedded directly in
//! the binary. A user can override either one by dropping their own image
//! into `<app-data>/backgrounds/` (no in-app picker yet - v1) - if present,
//! that file wins over the bundled default.

use std::path::{Path, PathBuf};

use base64::{engine::general_purpose::STANDARD, Engine as _};
use tauri::{AppHandle, Manager};

const CANDIDATE_EXTENSIONS: [&str; 4] = ["png", "jpg", "jpeg", "webp"];

const DEFAULT_HOME_BACKGROUND: &[u8] = include_bytes!("../assets/home-background.jpg");
const DEFAULT_OVERLAY_BACKGROUND: &[u8] = include_bytes!("../assets/overlay-background.jpg");

/// Which screen's background is being requested.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Screen {
    Home,
    Overlay,
}

impl Screen {
    fn file_stem(self) -> &'static str {
        match self {
            Screen::Home => "home-background",
            Screen::Overlay => "overlay-background",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "home" => Some(Screen::Home),
            "overlay" => Some(Screen::Overlay),
            _ => None,
        }
    }

    /// The bundled default (JPEG) shown when the user hasn't dropped their
    /// own override file into `<app-data>/backgrounds/`.
    fn default_bytes(self) -> &'static [u8] {
        match self {
            Screen::Home => DEFAULT_HOME_BACKGROUND,
            Screen::Overlay => DEFAULT_OVERLAY_BACKGROUND,
        }
    }
}

fn mime_for_extension(ext: &str) -> Option<&'static str> {
    match ext {
        "png" => Some("image/png"),
        "jpg" | "jpeg" => Some("image/jpeg"),
        "webp" => Some("image/webp"),
        _ => None,
    }
}

/// Finds the first existing `<stem>.<ext>` file for the given screen inside
/// `backgrounds_dir`, trying extensions in a fixed, documented order.
pub fn find_background_file(backgrounds_dir: &Path, screen: Screen) -> Option<PathBuf> {
    CANDIDATE_EXTENSIONS.iter().find_map(|ext| {
        let path = backgrounds_dir.join(format!("{}.{ext}", screen.file_stem()));
        path.is_file().then_some(path)
    })
}

fn encode_data_url(mime: &str, bytes: &[u8]) -> String {
    let encoded = STANDARD.encode(bytes);
    format!("data:{mime};base64,{encoded}")
}

/// Reads a background image file and encodes it as a `data:` URL the
/// frontend can drop straight into a CSS `background-image`.
fn read_as_data_url(path: &Path) -> Option<String> {
    let ext = path.extension()?.to_str()?.to_ascii_lowercase();
    let mime = mime_for_extension(&ext)?;
    let bytes = std::fs::read(path).ok()?;
    Some(encode_data_url(mime, &bytes))
}

/// The user's override file if one exists, otherwise the bundled default -
/// every screen always has *some* background.
fn resolve_background(backgrounds_dir: &Path, screen: Screen) -> String {
    find_background_file(backgrounds_dir, screen)
        .and_then(|path| read_as_data_url(&path))
        .unwrap_or_else(|| encode_data_url("image/jpeg", screen.default_bytes()))
}

#[tauri::command]
pub fn get_background_image(app: AppHandle, screen: String) -> Option<String> {
    let screen = Screen::parse(&screen)?;
    let app_data_dir = app.path().app_data_dir().ok()?;
    let backgrounds_dir = app_data_dir.join("backgrounds");
    Some(resolve_background(&backgrounds_dir, screen))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("eyeclops-test-backgrounds-{name}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn returns_none_when_no_file_present() {
        let dir = temp_dir("none");
        assert_eq!(find_background_file(&dir, Screen::Home), None);
    }

    #[test]
    fn finds_png_before_other_extensions() {
        let dir = temp_dir("multi");
        fs::write(dir.join("home-background.jpg"), b"jpg-bytes").unwrap();
        fs::write(dir.join("home-background.png"), b"png-bytes").unwrap();
        let found = find_background_file(&dir, Screen::Home).unwrap();
        assert_eq!(found.extension().unwrap(), "png");
    }

    #[test]
    fn distinguishes_home_and_overlay_files() {
        let dir = temp_dir("distinct");
        fs::write(dir.join("overlay-background.webp"), b"overlay-bytes").unwrap();
        assert_eq!(find_background_file(&dir, Screen::Home), None);
        let found = find_background_file(&dir, Screen::Overlay).unwrap();
        assert_eq!(found.file_name().unwrap(), "overlay-background.webp");
    }

    #[test]
    fn encodes_file_contents_as_a_data_url() {
        let dir = temp_dir("dataurl");
        let path = dir.join("home-background.png");
        fs::write(&path, b"fake-png-bytes").unwrap();
        let url = read_as_data_url(&path).unwrap();
        assert!(url.starts_with("data:image/png;base64,"));
    }

    #[test]
    fn parse_rejects_unknown_screen_names() {
        assert_eq!(Screen::parse("home"), Some(Screen::Home));
        assert_eq!(Screen::parse("overlay"), Some(Screen::Overlay));
        assert_eq!(Screen::parse("bogus"), None);
    }

    #[test]
    fn resolves_to_the_bundled_default_when_no_override_file_exists() {
        let dir = temp_dir("default-fallback");
        let url = resolve_background(&dir, Screen::Home);
        assert!(url.starts_with("data:image/jpeg;base64,"));
        // Must actually be the embedded default, not an empty/placeholder value.
        assert!(url.len() > 100);
    }

    #[test]
    fn resolves_to_the_user_override_file_when_present() {
        let dir = temp_dir("default-override");
        fs::write(dir.join("home-background.png"), b"custom-png-bytes").unwrap();
        let url = resolve_background(&dir, Screen::Home);
        assert_eq!(
            url,
            format!(
                "data:image/png;base64,{}",
                base64::engine::general_purpose::STANDARD.encode(b"custom-png-bytes")
            )
        );
    }

    #[test]
    fn home_and_overlay_defaults_are_distinct() {
        assert_ne!(Screen::Home.default_bytes(), Screen::Overlay.default_bytes());
    }
}
