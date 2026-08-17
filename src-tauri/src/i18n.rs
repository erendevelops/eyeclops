//! Minimal string localization for OS notification bodies fired from Rust
//! (the rest of the UI is localized in the frontend via i18next). Only
//! "en" and "tr" are supported, matching `Config::language`; anything else
//! falls back to English.

pub fn break_default_message(language: &str) -> &'static str {
    if language == "tr" {
        "En az 6 metre uzaktaki bir şeye 20 saniye boyunca bakın."
    } else {
        "Look at something at least 6 meters away for 20 seconds."
    }
}

pub fn brightness_tip(language: &str) -> &'static str {
    if language == "tr" {
        "Akşam oldu - Gece Işığı / mavi ışık filtresini etkinleştirmeyi düşünün."
    } else {
        "It's evening - consider enabling Night Light / a blue-light filter."
    }
}

pub fn back_on_duty(language: &str) -> &'static str {
    if language == "tr" {
        "Tekrar görevde."
    } else {
        "Back on duty."
    }
}

pub fn now_off_duty(language: &str) -> &'static str {
    if language == "tr" {
        "EyeClops artık görev dışı."
    } else {
        "EyeClops is now off duty."
    }
}
