import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "../i18n";
import Sidebar from "./Sidebar";

describe("Sidebar", () => {
  afterEach(() => {
    void i18n.changeLanguage("en");
  });

  it("renders all four nav items as icon-only, with title tooltips, in English", async () => {
    await i18n.changeLanguage("en");
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    expect(screen.getByTitle("Home")).toBeInTheDocument();
    expect(screen.getByTitle("Profiles")).toBeInTheDocument();
    expect(screen.getByTitle("Working Hours")).toBeInTheDocument();
    expect(screen.getByTitle("Settings")).toBeInTheDocument();
    // Icon-only: no visible text labels.
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("renders all four nav items as icon-only, with title tooltips, in Turkish", async () => {
    await i18n.changeLanguage("tr");
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    expect(screen.getByTitle("Ana Sayfa")).toBeInTheDocument();
    expect(screen.getByTitle("Profiller")).toBeInTheDocument();
    expect(screen.getByTitle("Çalışma Saatleri")).toBeInTheDocument();
    expect(screen.getByTitle("Ayarlar")).toBeInTheDocument();
  });
});
