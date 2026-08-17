import type { ReactNode } from "react";
import TitleBar from "./TitleBar";
import Sidebar from "./Sidebar";

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
 * sidebar. */
export default function AppShell({ children, backgroundUrl }: AppShellProps) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-surface-50 text-ink">
      {backgroundUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
          aria-hidden="true"
        />
      )}
      <div className="h-full w-full overflow-y-auto pb-6 pl-16 pr-6 pt-12">
        {children}
      </div>
      <TitleBar />
      <Sidebar />
    </div>
  );
}
