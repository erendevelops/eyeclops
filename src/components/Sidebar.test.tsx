import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import Sidebar from "./Sidebar";

describe("Sidebar", () => {
  afterEach(() => {
    void i18n.changeLanguage("en");
  });

  it("renders all four nav items with labels when expanded, in English", async () => {
    await i18n.changeLanguage("en");
    render(
      <MemoryRouter>
        <Sidebar collapsed={false} onToggleCollapsed={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Profiles")).toBeInTheDocument();
    expect(screen.getByText("Working Hours")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders all four nav items with labels when expanded, in Turkish", async () => {
    await i18n.changeLanguage("tr");
    render(
      <MemoryRouter>
        <Sidebar collapsed={false} onToggleCollapsed={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Ana Sayfa")).toBeInTheDocument();
    expect(screen.getByText("Profiller")).toBeInTheDocument();
    expect(screen.getByText("Çalışma Saatleri")).toBeInTheDocument();
    expect(screen.getByText("Ayarlar")).toBeInTheDocument();
  });

  it("hides text labels when collapsed, keeping icons accessible via title", async () => {
    await i18n.changeLanguage("en");
    render(
      <MemoryRouter>
        <Sidebar collapsed={true} onToggleCollapsed={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.queryByText("Profiles")).not.toBeInTheDocument();
    // Falls back to the title attribute for the nav link when collapsed.
    expect(screen.getByTitle("Home")).toBeInTheDocument();
  });

  it("calls onToggleCollapsed when the toggle button is clicked", async () => {
    await i18n.changeLanguage("en");
    const onToggleCollapsed = vi.fn();
    render(
      <MemoryRouter>
        <Sidebar collapsed={false} onToggleCollapsed={onToggleCollapsed} />
      </MemoryRouter>,
    );
    screen.getByLabelText("Collapse sidebar").click();
    expect(onToggleCollapsed).toHaveBeenCalled();
  });
});
