export interface Profile {
  id: string;
  name: string;
  intervalMin: number;
  breakSec: number;
  messageKey: string;
  customMessage: string | null;
}

export interface BrightnessTips {
  enabled: boolean;
  /** "sunset" or a comma-separated list of "HH:MM" times. */
  schedule: string;
}

export interface WorkingHours {
  enabled: boolean;
  /** "HH:MM", 24h. */
  startTime: string;
  /** "HH:MM", 24h. */
  endTime: string;
  /** Monday first, Sunday last: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]. */
  days: [boolean, boolean, boolean, boolean, boolean, boolean, boolean];
}

export interface TimerStatus {
  elapsedSecs: number;
  intervalSecs: number;
  paused: boolean;
  onDuty: boolean;
}

export interface Config {
  profiles: Profile[];
  activeProfileId: string;
  launchAtStartup: boolean;
  brightnessTips: BrightnessTips;
  workingHours: WorkingHours;
  /** When true (the default), a break shows the fullscreen overlay. When
   * false, a break fires an OS notification instead. */
  fullscreenOverlayEnabled: boolean;
  language: "en" | "tr";
}

export interface BreakInfo {
  breakSec: number;
  messageKey: string;
  customMessage: string | null;
}
