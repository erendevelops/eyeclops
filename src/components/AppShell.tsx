import { useEffect, useState, type ReactNode } from "react";
import TitleBar from "./TitleBar";
import Sidebar from "./Sidebar";

const SIDEBAR_COLLAPSED_KEY = "eyeclops.sidebarCollapsed";

function readStoredCollapsed(): boolean {
  try {
    // Collapsed by default - only expand if the user explicitly expanded
    // it before (and that choice was persisted).
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) !== "false";
  } catch {
    return true;
  }
}

interface AppShellProps {
  children: ReactNode;
  /** When set, this image fills the whole window behind everything else. */
  backgroundUrl?: string | null;
}

/** Frame around every page except the break overlay. The title bar and
 * sidebar are transparent floating overlays positioned on top of the
 * content rather than layout siblings that reserve space for themselves.
 * The content area still gets enough top/left padding to clear them (so
 * page headings don't render underneath the icon rail) - the Home page
 * opts out of that by positioning its own centered content with `fixed`,
 * so the timer stays centered on the true window regardless of the
 * sidebar's width. Sidebar collapse state is a pure UI preference,
 * persisted in localStorage rather than the app's config.json. */
export default function AppShell({ children, backgroundUrl }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      // localStorage unavailable (e.g. private mode) - collapse state just
      // won't persist across restarts, which is fine.
    }
  }, [collapsed]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-surface-50 text-ink">
      {backgroundUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
          aria-hidden="true"
        />
      )}
      <div
        className={`h-full w-full overflow-y-auto pb-6 pr-6 pt-12 transition-[padding-left] duration-150 ${
          collapsed ? "pl-16" : "pl-48"
        }`}
      >
        {children}
      </div>
      <TitleBar />
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
      />
    </div>
  );
}
