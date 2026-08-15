import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "../i18n";
import { AppDataProvider, useAppData } from "./AppDataContext";
import type { Config } from "../types";

const baseConfig: Config = {
  profiles: [
    {
      id: "default",
      name: "Work",
      intervalMin: 20,
      breakSec: 20,
      messageKey: "break.default",
      customMessage: null,
    },
  ],
  activeProfileId: "default",
  launchAtStartup: false,
  brightnessTips: { enabled: true, schedule: "sunset" },
  workingHours: {
    enabled: false,
    startTime: "09:00",
    endTime: "18:00",
    days: [true, true, true, true, true, false, false],
  },
  fullscreenOverlayEnabled: true,
  language: "en",
};

vi.mock("../api", () => ({
  api: {
    getConfig: vi.fn(async () => baseConfig),
    getPaused: vi.fn(async () => false),
    saveConfig: vi.fn(async () => undefined),
    setActiveProfile: vi.fn(async () => undefined),
    togglePause: vi.fn(async () => true),
    setLaunchAtStartup: vi.fn(async () => undefined),
    getTimerStatus: vi.fn(async () => ({
      elapsedSecs: 0,
      intervalSecs: 1200,
      paused: false,
      onDuty: true,
    })),
  },
}));

function Probe() {
  const { config, paused, togglePause } = useAppData();
  return (
    <div>
      <span>{config ? config.profiles[0].name : "loading"}</span>
      <span>{paused ? "paused" : "running"}</span>
      <button onClick={togglePause}>toggle</button>
    </div>
  );
}

describe("AppDataProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads config and paused state on mount", async () => {
    render(
      <AppDataProvider>
        <Probe />
      </AppDataProvider>,
    );
    expect(await screen.findByText("Work")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
  });

  it("togglePause updates the shared paused state", async () => {
    const { api } = await import("../api");
    render(
      <AppDataProvider>
        <Probe />
      </AppDataProvider>,
    );
    await screen.findByText("Work");
    await act(async () => {
      screen.getByText("toggle").click();
    });
    expect(api.togglePause).toHaveBeenCalled();
    expect(await screen.findByText("paused")).toBeInTheDocument();
  });

  it("stops polling timer status while the document is hidden and resumes when visible again", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const hiddenSpy = vi
      .spyOn(document, "hidden", "get")
      .mockReturnValue(false);

    try {
      const { api } = await import("../api");
      const getTimerStatus = api.getTimerStatus as ReturnType<typeof vi.fn>;
      getTimerStatus.mockClear();

      await act(async () => {
        render(
          <AppDataProvider>
            <Probe />
          </AppDataProvider>,
        );
      });
      await vi.waitFor(() => expect(getTimerStatus).toHaveBeenCalledTimes(1));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(getTimerStatus).toHaveBeenCalledTimes(4);

      await act(async () => {
        hiddenSpy.mockReturnValue(true);
        document.dispatchEvent(new Event("visibilitychange"));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      expect(getTimerStatus).toHaveBeenCalledTimes(4);

      await act(async () => {
        hiddenSpy.mockReturnValue(false);
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await vi.waitFor(() => expect(getTimerStatus).toHaveBeenCalledTimes(5));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(getTimerStatus).toHaveBeenCalledTimes(7);
    } finally {
      hiddenSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});
