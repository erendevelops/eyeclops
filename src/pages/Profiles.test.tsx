import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import Profiles from "./Profiles";
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

const addProfile = vi.fn();

vi.mock("../context/AppDataContext", () => ({
  useAppData: () => ({
    config: baseConfig,
    updateProfile: vi.fn(),
    addProfile,
    deleteProfile: vi.fn(),
    setActiveProfile: vi.fn(),
  }),
}));

describe("Profiles", () => {
  afterEach(() => {
    void i18n.changeLanguage("en");
  });

  it("renders the profile list and title in English", async () => {
    await i18n.changeLanguage("en");
    render(<Profiles />);
    expect(await screen.findByText("Break schedules")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Work")).toBeInTheDocument();
  });

  it("renders the title in Turkish", async () => {
    await i18n.changeLanguage("tr");
    render(<Profiles />);
    expect(await screen.findByText("Mola programları")).toBeInTheDocument();
  });

  it("calls addProfile when Add profile is clicked", async () => {
    await i18n.changeLanguage("en");
    render(<Profiles />);
    screen.getByText("Add profile").click();
    expect(addProfile).toHaveBeenCalled();
  });
});
