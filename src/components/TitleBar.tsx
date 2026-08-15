import { api } from "../api";

/** Slim custom title bar for the frameless main window: drag region plus
 * our own minimize/close buttons (the OS titlebar is disabled in
 * tauri.conf.json). Floats as a transparent overlay over the content -
 * see AppShell for why. Close triggers the same hide-to-tray behavior as
 * the OS close button would have, via the Rust-side CloseRequested
 * handler. */
export default function TitleBar() {
  return (
    <header
      data-tauri-drag-region
      className="absolute inset-x-0 top-0 flex h-9 shrink-0 select-none items-center justify-between bg-transparent px-3"
    >
      <span
        data-tauri-drag-region
        className="pointer-events-none text-sm font-semibold tracking-wide text-bronze"
      >
        EyeClops
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Minimize"
          className="flex h-6 w-6 items-center justify-center rounded text-ink/70 hover:bg-surface-50/60 hover:text-ink"
          onClick={() => api.minimizeWindow()}
        >
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none">
            <line
              x1="1"
              y1="8.5"
              x2="9"
              y2="8.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Close"
          className="flex h-6 w-6 items-center justify-center rounded text-ink/70 hover:bg-ember/80 hover:text-surface-50"
          onClick={() => api.closeWindow()}
        >
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none">
            <line
              x1="1"
              y1="1"
              x2="9"
              y2="9"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <line
              x1="9"
              y1="1"
              x2="1"
              y2="9"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
