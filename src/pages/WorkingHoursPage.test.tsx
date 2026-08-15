import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import WorkingHoursPage from "./WorkingHoursPage";
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

const toggleWorkingDay = vi.fn();

vi.mock("../context/AppDataContext", () => ({
  useAppData: () => ({
    config: baseConfig,
    updateWorkingHours: vi.fn(),
    toggleWorkingDay,
  }),
}));

describe("WorkingHoursPage", () => {
  afterEach(() => {
    void i18n.changeLanguage("en");
  });

  it("renders the title and day chips in English", async () => {
    await i18n.changeLanguage("en");
    render(<WorkingHoursPage />);
    expect(await screen.findByText("Working hours")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });

  it("renders the title in Turkish", async () => {
    await i18n.changeLanguage("tr");
    render(<WorkingHoursPage />);
    expect(await screen.findByText("Çalışma saatleri")).toBeInTheDocument();
  });

  it("marks enabled days as aria-pressed and calls toggleWorkingDay", async () => {
    await i18n.changeLanguage("en");
    render(<WorkingHoursPage />);
    const monday = screen.getByText("Mon");
    expect(monday).toHaveAttribute("aria-pressed", "true");
    const saturday = screen.getByText("Sat");
    expect(saturday).toHaveAttribute("aria-pressed", "false");
    saturday.click();
    expect(toggleWorkingDay).toHaveBeenCalledWith(5);
  });
});
