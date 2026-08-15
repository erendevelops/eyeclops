import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import AppShell from "./AppShell";

vi.mock("../api", () => ({
  api: {
    minimizeWindow: vi.fn(),
    closeWindow: vi.fn(),
  },
}));

describe("AppShell", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    void i18n.changeLanguage("en");
  });

  it("starts collapsed by default and persists the expanded state across remounts", async () => {
    await i18n.changeLanguage("en");
    const { unmount } = render(
      <MemoryRouter>
        <AppShell>content</AppShell>
      </MemoryRouter>,
    );
    // Collapsed by default: no text labels, just icons.
    expect(screen.queryByText("Home")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Expand sidebar"));
    expect(screen.getByText("Home")).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter>
        <AppShell>content</AppShell>
      </MemoryRouter>,
    );
    // Still expanded after remount, because it was persisted.
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

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
    // The content wrapper spans the full shell width/height - it isn't a
    // flex sibling squeezed by the sidebar's width.
    const content = screen.getByText("content");
    expect(content).toHaveClass("h-full", "w-full");
  });

  it("widens the content's left clearance when the sidebar expands, so labels don't overlap it", async () => {
    await i18n.changeLanguage("en");
    render(
      <MemoryRouter>
        <AppShell>content</AppShell>
      </MemoryRouter>,
    );
    const content = screen.getByText("content");
    expect(content).toHaveClass("pl-16");
    expect(content).not.toHaveClass("pl-48");

    fireEvent.click(screen.getByLabelText("Expand sidebar"));
    expect(content).toHaveClass("pl-48");
    expect(content).not.toHaveClass("pl-16");
  });
});
