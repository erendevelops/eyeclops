//! Optional user-supplied background images for the Home timer screen and
//! the break overlay. No in-app picker (v1) — the user drops image files
//! into `<app-data>/backgrounds/` themselves; a missing file just means no
//! background (falls back to the plain dark theme).

use std::path::{Path, PathBuf};

use base64::{engine::general_purpose::STANDARD, Engine as _};
use tauri::{AppHandle, Manager};

const CANDIDATE_EXTENSIONS: [&str; 4] = ["png", "jpg", "jpeg", "webp"];

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

/// Reads a background image file and encodes it as a `data:` URL the
/// frontend can drop straight into a CSS `background-image`.
fn read_as_data_url(path: &Path) -> Option<String> {
    let ext = path.extension()?.to_str()?.to_ascii_lowercase();
    let mime = mime_for_extension(&ext)?;
    let bytes = std::fs::read(path).ok()?;
    let encoded = STANDARD.encode(bytes);
    Some(format!("data:{mime};base64,{encoded}"))
}

#[tauri::command]
pub fn get_background_image(app: AppHandle, screen: String) -> Option<String> {
    let screen = Screen::parse(&screen)?;
    let app_data_dir = app.path().app_data_dir().ok()?;
    let backgrounds_dir = app_data_dir.join("backgrounds");
    let path = find_background_file(&backgrounds_dir, screen)?;
    read_as_data_url(&path)
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
}
