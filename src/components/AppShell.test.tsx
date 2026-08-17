import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AppShell from "./AppShell";

vi.mock("../api", () => ({
  api: {
    minimizeWindow: vi.fn(),
    closeWindow: vi.fn(),
  },
}));

describe("AppShell", () => {
  it("renders no background layer when backgroundUrl is absent", () => {
    const { container } = render(
      <MemoryRouter>
        <AppShell>content</AppShell>
      </MemoryRouter>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it("renders the background image layer when backgroundUrl is set", () => {
    const { container } = render(
      <MemoryRouter>
        <AppShell backgroundUrl="data:image/png;base64,AAAA">content</AppShell>
      </MemoryRouter>,
    );
    const backgroundLayer = container.querySelector('[aria-hidden="true"]');
    expect(backgroundLayer).not.toBeNull();
    expect(backgroundLayer).toHaveStyle({
      backgroundImage: "url(data:image/png;base64,AAAA)",
    });
  });

  it("floats the title bar and sidebar as absolutely-positioned overlays, not layout siblings that would offset content", () => {
    const { container } = render(
      <MemoryRouter>
        <AppShell>content</AppShell>
      </MemoryRouter>,
    );
    const header = container.querySelector("header");
    const nav = container.querySelector("nav");
    expect(header).toHaveClass("absolute");
    expect(nav).toHaveClass("absolute");
    const content = screen.getByText("content");
    expect(content).toHaveClass("h-full", "w-full", "pl-16");
  });
});
