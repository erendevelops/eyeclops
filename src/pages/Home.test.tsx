import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import Home from "./Home";
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

const togglePause = vi.fn();

vi.mock("../context/AppDataContext", () => ({
  useAppData: () => ({
    config: baseConfig,
    paused: false,
    timerStatus: {
      elapsedSecs: 30,
      intervalSecs: 1200,
      paused: false,
      onDuty: true,
      breakRemainingSecs: null,
    },
    togglePause,
  }),
}));

describe("Home", () => {
  afterEach(() => {
    void i18n.changeLanguage("en");
  });

  it("shows the active profile name and a Pause button in English", async () => {
    await i18n.changeLanguage("en");
    render(<Home />);
    expect(await screen.findByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Pause")).toBeInTheDocument();
  });

  it("shows the active profile name and a Duraklat button in Turkish", async () => {
    await i18n.changeLanguage("tr");
    render(<Home />);
    expect(await screen.findByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Duraklat")).toBeInTheDocument();
  });

  it("calls togglePause when the button is clicked", async () => {
    await i18n.changeLanguage("en");
    render(<Home />);
    screen.getByText("Pause").click();
    expect(togglePause).toHaveBeenCalled();
  });
});
