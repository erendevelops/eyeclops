import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { BreakInfo, Config, TimerStatus } from "./types";

const appWindow = getCurrentWindow();

export const api = {
  minimizeWindow: () => appWindow.minimize(),
  // Triggers the same Rust-side CloseRequested handler as clicking a
  // native close button would — it hides to tray instead of quitting.
  closeWindow: () => appWindow.close(),
  getConfig: () => invoke<Config>("get_config"),
  saveConfig: (config: Config) => invoke<void>("save_config", { config }),
  setActiveProfile: (profileId: string) =>
    invoke<void>("set_active_profile", { profileId }),
  togglePause: () => invoke<boolean>("toggle_pause_cmd"),
  getPaused: () => invoke<boolean>("get_paused"),
  getTimerStatus: () => invoke<TimerStatus>("get_timer_status"),
  getActiveBreakInfo: () => invoke<BreakInfo | null>("get_active_break_info"),
  skipBreak: () => invoke<void>("skip_break"),
  setLaunchAtStartup: (enabled: boolean) =>
    invoke<void>("set_launch_at_startup", { enabled }),
  openDisplaySettings: () => invoke<void>("open_display_settings"),
  getBackgroundImage: (screen: "home" | "overlay") =>
    invoke<string | null>("get_background_image", { screen }),
};
