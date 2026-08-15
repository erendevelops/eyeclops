import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TitleBar from "./TitleBar";

vi.mock("../api", () => ({
  api: {
    minimizeWindow: vi.fn(),
    closeWindow: vi.fn(),
  },
}));

describe("TitleBar", () => {
  it("calls api.minimizeWindow when the minimize button is clicked", async () => {
    const { api } = await import("../api");
    render(<TitleBar />);
    screen.getByLabelText("Minimize").click();
    expect(api.minimizeWindow).toHaveBeenCalled();
  });

  it("calls api.closeWindow when the close button is clicked", async () => {
    const { api } = await import("../api");
    render(<TitleBar />);
    screen.getByLabelText("Close").click();
    expect(api.closeWindow).toHaveBeenCalled();
  });
});
