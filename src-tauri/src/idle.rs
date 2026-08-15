//! Cross-platform "seconds since last user input" detection.
//!
//! Used by the scheduler to pause the break timer while the user is away
//! (screen locked, AFK) so breaks don't pile up or fire while nobody is
//! looking at the screen.

/// Returns how many seconds have elapsed since the last keyboard/mouse
/// input, system-wide.
#[cfg(target_os = "windows")]
pub fn idle_seconds() -> u64 {
    use windows::Win32::System::SystemInformation::GetTickCount;
    use windows::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};

    unsafe {
        let mut info = LASTINPUTINFO {
            cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
            dwTime: 0,
        };
        if GetLastInputInfo(&mut info).as_bool() {
            let tick_count = GetTickCount();
            return tick_count.saturating_sub(info.dwTime) as u64 / 1000;
        }
    }
    0
}

/// macOS/Linux idle detection isn't implemented yet — treat the user as
/// always active so the scheduler still works, just without auto-pause on
/// idle. Contributions adding CGEventSource (macOS) or XScreenSaverQueryInfo
/// (X11/Linux) support are welcome.
#[cfg(not(target_os = "windows"))]
pub fn idle_seconds() -> u64 {
    0
}
