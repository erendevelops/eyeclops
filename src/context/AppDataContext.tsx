import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import type { Config, Profile, TimerStatus, WorkingHours } from "../types";
import type { SupportedLanguage } from "../i18n";

interface AppDataContextValue {
  config: Config | null;
  paused: boolean;
  timerStatus: TimerStatus | null;
  togglePause: () => Promise<void>;
  updateProfile: (id: string, patch: Partial<Profile>) => Promise<void>;
  addProfile: () => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  setActiveProfile: (id: string) => Promise<void>;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  toggleBrightnessTips: (enabled: boolean) => Promise<void>;
  toggleLaunchAtStartup: (enabled: boolean) => Promise<void>;
  toggleFullscreenOverlay: (enabled: boolean) => Promise<void>;
  updateWorkingHours: (patch: Partial<WorkingHours>) => Promise<void>;
  toggleWorkingDay: (index: number) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function makeProfileId() {
  return `profile-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function emptyProfile(): Profile {
  return {
    id: makeProfileId(),
    name: "New profile",
    intervalMin: 20,
    breakSec: 20,
    messageKey: "break.default",
    customMessage: null,
  };
}

/** Loads config/paused/timer-status once and shares mutators across every
 * page, so each page only needs the slice of state it renders. */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [config, setConfig] = useState<Config | null>(null);
  const [paused, setPaused] = useState(false);
  const [timerStatus, setTimerStatus] = useState<TimerStatus | null>(null);

  useEffect(() => {
    api.getConfig().then(setConfig);
    api.getPaused().then(setPaused);
  }, []);

  // Poll the timer status once a second while the window is visible; stop
  // while hidden (hide-to-tray keeps the webview alive, so without this the
  // poll would otherwise run forever in the background).
  useEffect(() => {
    let cancelled = false;
    let id: ReturnType<typeof setInterval> | null = null;
    const poll = () => {
      api.getTimerStatus().then((status) => {
        if (!cancelled) setTimerStatus(status);
      });
    };
    const start = () => {
      if (id !== null) return;
      poll();
      id = setInterval(poll, 1000);
    };
    const stop = () => {
      if (id === null) return;
      clearInterval(id);
      id = null;
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };
    if (!document.hidden) {
      start();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function persist(next: Config) {
    setConfig(next);
    await api.saveConfig(next);
  }

  async function updateProfile(id: string, patch: Partial<Profile>) {
    if (!config) return;
    const profiles = config.profiles.map((p) =>
      p.id === id ? { ...p, ...patch } : p,
    );
    await persist({ ...config, profiles });
  }

  async function addProfile() {
    if (!config) return;
    const profile = emptyProfile();
    await persist({ ...config, profiles: [...config.profiles, profile] });
  }

  async function deleteProfile(id: string) {
    if (!config || config.profiles.length <= 1) return;
    const profiles = config.profiles.filter((p) => p.id !== id);
    const activeProfileId =
      config.activeProfileId === id ? profiles[0].id : config.activeProfileId;
    await persist({ ...config, profiles, activeProfileId });
    if (config.activeProfileId === id) {
      await api.setActiveProfile(profiles[0].id);
    }
  }

  async function setActiveProfile(id: string) {
    if (!config) return;
    await api.setActiveProfile(id);
    setConfig({ ...config, activeProfileId: id });
  }

  async function togglePause() {
    const next = await api.togglePause();
    setPaused(next);
  }

  async function setLanguage(lang: SupportedLanguage) {
    if (!config) return;
    await i18n.changeLanguage(lang);
    await persist({ ...config, language: lang });
  }

  async function toggleBrightnessTips(enabled: boolean) {
    if (!config) return;
    await persist({
      ...config,
      brightnessTips: { ...config.brightnessTips, enabled },
    });
  }

  async function toggleLaunchAtStartup(enabled: boolean) {
    if (!config) return;
    await api.setLaunchAtStartup(enabled);
    setConfig({ ...config, launchAtStartup: enabled });
  }

  async function toggleFullscreenOverlay(enabled: boolean) {
    if (!config) return;
    await persist({ ...config, fullscreenOverlayEnabled: enabled });
  }

  async function updateWorkingHours(patch: Partial<WorkingHours>) {
    if (!config) return;
    await persist({
      ...config,
      workingHours: { ...config.workingHours, ...patch },
    });
  }

  function toggleWorkingDay(index: number) {
    if (!config) return;
    const days = [...config.workingHours.days] as WorkingHours["days"];
    days[index] = !days[index];
    updateWorkingHours({ days });
  }

  const value: AppDataContextValue = {
    config,
    paused,
    timerStatus,
    togglePause,
    updateProfile,
    addProfile,
    deleteProfile,
    setActiveProfile,
    setLanguage,
    toggleBrightnessTips,
    toggleLaunchAtStartup,
    toggleFullscreenOverlay,
    updateWorkingHours,
    toggleWorkingDay,
  };

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return ctx;
}
