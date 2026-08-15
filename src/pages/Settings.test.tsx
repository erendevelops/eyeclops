import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import Settings from "./Settings";
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
    openDisplaySettings: vi.fn(async () => undefined),
  },
}));

const toggleFullscreenOverlay = vi.fn();

vi.mock("../context/AppDataContext", () => ({
  useAppData: () => ({
    config: baseConfig,
    setLanguage: vi.fn(),
    toggleBrightnessTips: vi.fn(),
    toggleLaunchAtStartup: vi.fn(),
    toggleFullscreenOverlay,
  }),
}));

describe("Settings", () => {
  afterEach(() => {
    void i18n.changeLanguage("en");
  });

  it("renders the English settings title and sections", async () => {
    await i18n.changeLanguage("en");
    render(<Settings />);
    expect(await screen.findByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Brightness / color-temp tips")).toBeInTheDocument();
    expect(screen.getByText("Startup")).toBeInTheDocument();
    expect(screen.getByText("Language")).toBeInTheDocument();
  });

  it("renders the Turkish settings title", async () => {
    await i18n.changeLanguage("tr");
    render(<Settings />);
    expect(await screen.findByText("Ayarlar")).toBeInTheDocument();
  });

  it("renders the fullscreen overlay toggle, checked by default, and calls toggleFullscreenOverlay", async () => {
    await i18n.changeLanguage("en");
    render(<Settings />);
    const checkbox = (await screen.findByText(
      "Show fullscreen break overlay",
    )).closest("label")!.querySelector("input")!;
    expect(checkbox).toBeChecked();
    checkbox.click();
    expect(toggleFullscreenOverlay).toHaveBeenCalledWith(false);
  });
});
