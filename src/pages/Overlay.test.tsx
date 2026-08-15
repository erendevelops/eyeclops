import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import Overlay from "./Overlay";
import type { BreakInfo } from "../types";

const breakInfo: BreakInfo = {
  breakSec: 20,
  messageKey: "break.default",
  customMessage: null,
};

vi.mock("../api", () => ({
  api: {
    getActiveBreakInfo: vi.fn(async () => breakInfo),
    skipBreak: vi.fn(async () => undefined),
    getBackgroundImage: vi.fn(async () => null),
  },
}));

describe("Overlay", () => {
  afterEach(() => {
    void i18n.changeLanguage("en");
  });

  it("shows the default break message and countdown in English", async () => {
    await i18n.changeLanguage("en");
    render(<Overlay />);
    expect(
      await screen.findByText("Look at something at least 6 meters away"),
    ).toBeInTheDocument();
    expect(await screen.findByText("20")).toBeInTheDocument();
  });

  it("shows the default break message in Turkish", async () => {
    await i18n.changeLanguage("tr");
    render(<Overlay />);
    expect(
      await screen.findByText("En az 6 metre uzaktaki bir şeye bakın"),
    ).toBeInTheDocument();
  });

  it("shows only the Skip button, no Snooze button", async () => {
    await i18n.changeLanguage("en");
    render(<Overlay />);
    expect(await screen.findByText("Skip")).toBeInTheDocument();
    expect(screen.queryByText(/snooze/i)).not.toBeInTheDocument();
  });

  it("renders a background image layer when one is configured", async () => {
    const { api } = await import("../api");
    (api.getBackgroundImage as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      "data:image/png;base64,AAAA",
    );
    await i18n.changeLanguage("en");
    const { container } = render(<Overlay />);
    const backgroundLayer = await screen.findByText("Skip").then(
      () => container.querySelector('[aria-hidden="true"]'),
    );
    expect(backgroundLayer).toHaveStyle({
      backgroundImage: "url(data:image/png;base64,AAAA)",
    });
  });

  it("renders no background layer when none is configured", async () => {
    await i18n.changeLanguage("en");
    const { container } = render(<Overlay />);
    await screen.findByText("Skip");
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
